<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceEventResource;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\EmployeeResource;
use App\Models\Attendance;
use App\Models\AttendanceAnomaly;
use App\Models\AttendanceEvent;
use App\Models\Employee;
use App\Services\AttendanceService;
use App\Services\EmployeeAccessService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendance,
        private readonly EmployeeAccessService $employees,
    ) {}

    /**
     * Présences d'une journée, filtrables par département ou statut.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Attendance::class);

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));
        $this->authorizeHistoryDate($date);

        $attendances = Attendance::query()
            ->with([
                'employee.workSchedules' => fn ($query) => $query
                    ->whereDate('starts_on', '<=', $date->toDateString())
                    ->where(fn ($assignment) => $assignment
                        ->whereNull('ends_on')
                        ->orWhereDate('ends_on', '>=', $date->toDateString()))
                    ->orderByDesc('starts_on'),
                'employee.workSchedules.workSchedule.days',
            ])
            ->whereDate('attendance_date', $date->toDateString())
            ->whereHas(
                'employee',
                fn ($query) => $this->employees->limitToVisibleEmployees(
                    $query,
                    $request->user(),
                    includeSecurityTeam: true,
                ),
            )
            ->when($request->filled('department_id'), fn ($query) => $query
                ->whereHas('employee', fn ($scope) => $scope->where('department_id', $request->integer('department_id'))))
            ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderBy('employee_id')
            ->paginate(min(max($request->integer('per_page', 50), 1), 200));

        return AttendanceResource::collection($attendances);
    }

    /**
     * Pointages du jour : entrées, sorties et personnes présentes.
     */
    public function today(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Attendance::class);

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));
        $this->authorizeHistoryDate($date);

        $attendances = Attendance::query()
            ->with([
                'employee.workSchedules' => fn ($query) => $query
                    ->whereDate('starts_on', '<=', $date->toDateString())
                    ->where(fn ($assignment) => $assignment
                        ->whereNull('ends_on')
                        ->orWhereDate('ends_on', '>=', $date->toDateString()))
                    ->orderByDesc('starts_on'),
                'employee.workSchedules.workSchedule.days',
            ])
            ->whereDate('attendance_date', $date->toDateString())
            ->whereHas(
                'employee',
                fn ($query) => $this->employees->limitToVisibleEmployees(
                    $query,
                    $request->user(),
                    includeSecurityTeam: true,
                ),
            )
            ->get();

        $events = AttendanceEvent::query()
            ->with(['employee', 'badge', 'device'])
            ->whereBetween('occurred_at', [$date->startOfDay(), $date->endOfDay()])
            ->whereHas(
                'employee',
                fn ($query) => $this->employees->limitToVisibleEmployees(
                    $query,
                    $request->user(),
                    includeSecurityTeam: true,
                ),
            )
            ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
            ->orderByDesc('occurred_at')
            ->limit(100)
            ->get();

        return response()->json([
            'date' => $date->toDateString(),
            'summary' => [
                'entries' => $events->where('event_type', 'entry')->count(),
                'exits' => $events->where('event_type', 'exit')->count(),
                'present' => $attendances->whereIn('status', ['present', 'late', 'remote'])->count(),
                'late' => $attendances->where('status', 'late')->count(),
                'absent' => $attendances->where('status', 'absent')->count(),
                'on_leave' => $attendances->where('status', 'on_leave')->count(),
            ],
            'attendances' => AttendanceResource::collection($attendances),
            'events' => AttendanceEventResource::collection($events),
        ]);
    }

    /**
     * Journal des événements bruts.
     */
    public function events(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Attendance::class);

        $from = CarbonImmutable::parse($request->input('from', CarbonImmutable::now()->startOfDay()));
        $to = CarbonImmutable::parse($request->input('to', CarbonImmutable::now()->endOfDay()));
        $today = CarbonImmutable::now();

        if (! $from->isSameDay($today) || ! $to->isSameDay($today)) {
            $this->authorize('viewHistory', Attendance::class);
        }

        $events = AttendanceEvent::query()
            ->with(['employee', 'badge', 'device'])
            ->whereBetween('occurred_at', [$from, $to])
            ->whereHas(
                'employee',
                fn ($query) => $this->employees->limitToVisibleEmployees(
                    $query,
                    $request->user(),
                    includeSecurityTeam: true,
                ),
            )
            ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
            ->when($request->filled('device_code'), fn ($query) => $query
                ->whereHas('device', fn ($scope) => $scope->where('device_code', $request->string('device_code'))))
            ->when($request->filled('event_type'), fn ($query) => $query->where('event_type', $request->string('event_type')))
            ->orderByDesc('occurred_at')
            ->paginate(min(max($request->integer('per_page', 50), 1), 200));

        return AttendanceEventResource::collection($events);
    }

    /**
     * Recalcule les journées de présence d'un périmètre donné.
     */
    public function recompute(Request $request): JsonResponse
    {
        $this->authorize('recompute', Attendance::class);

        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $date = CarbonImmutable::parse($validated['date'] ?? CarbonImmutable::now()->toDateString());
        $this->authorizeHistoryDate($date);

        $employees = $this->employees->limitToVisibleEmployees(
            Employee::query(),
            $request->user(),
            includeSecurityTeam: true,
        )
            ->where('status', 'active')
            ->when(isset($validated['employee_id']), fn ($query) => $query->whereKey($validated['employee_id']))
            ->when(isset($validated['department_id']), fn ($query) => $query->where('department_id', $validated['department_id']))
            ->get();

        $attendances = $this->attendance->recomputeMany($employees, $date);

        return response()->json([
            'date' => $date->toDateString(),
            'processed' => $attendances->count(),
            'data' => AttendanceResource::collection($attendances),
        ]);
    }

    /**
     * Anomalies de pointage ouvertes.
     */
    public function anomalies(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Attendance::class);
        $this->authorize('viewHistory', Attendance::class);

        $anomalies = AttendanceAnomaly::query()
            ->with(['employee', 'resolver'])
            ->whereHas(
                'employee',
                fn ($query) => $this->employees->limitToVisibleEmployees(
                    $query,
                    $request->user(),
                    includeSecurityTeam: true,
                ),
            )
            ->where('status', $request->input('status', 'open'))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->orderByDesc('attendance_date')
            ->paginate(min(max($request->integer('per_page', 50), 1), 200));

        return response()->json([
            'data' => $anomalies->getCollection()->map(fn (AttendanceAnomaly $anomaly): array => [
                'id' => $anomaly->id,
                'employee' => [
                    'id' => $anomaly->employee?->id,
                    'employee_number' => $anomaly->employee?->employee_number,
                    'full_name' => $anomaly->employee?->fullName(),
                ],
                'attendance_date' => $anomaly->attendance_date?->toDateString(),
                'type' => $anomaly->type,
                'description' => $anomaly->description,
                'status' => $anomaly->status,
                'resolved_by' => $anomaly->resolver?->name,
                'resolved_at' => $anomaly->resolved_at?->toIso8601String(),
            ])->values(),
            'meta' => [
                'current_page' => $anomalies->currentPage(),
                'last_page' => $anomalies->lastPage(),
                'total' => $anomalies->total(),
            ],
        ]);
    }

    /**
     * Présence détaillée d'un employé.
     */
    public function forEmployee(Request $request, Employee $employee): JsonResponse
    {
        $this->authorize('view', new Attendance(['employee_id' => $employee->id]));

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));
        $this->authorizeHistoryDate($date);
        $attendance = $this->attendance->recompute($employee, $date);

        return response()->json([
            'employee' => (new EmployeeResource($employee->load(['direction', 'department'])))->resolve($request),
            'attendance' => (new AttendanceResource($attendance))->resolve($request),
            'events' => AttendanceEventResource::collection($this->attendance->eventsFor($employee, $date)),
        ]);
    }

    private function authorizeHistoryDate(CarbonImmutable $date): void
    {
        if (! $date->isSameDay(CarbonImmutable::now())) {
            $this->authorize('viewHistory', Attendance::class);
        }
    }
}
