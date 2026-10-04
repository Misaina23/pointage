<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceEventResource;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\EmployeeResource;
use App\Models\AbsenceRecord;
use App\Models\Attendance;
use App\Models\AttendanceAnomaly;
use App\Models\AttendanceEvent;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use App\Services\AttendanceService;
use App\Services\EmployeeAccessService;
use App\Services\ScheduleService;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
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
            ->with(['employee', 'badge', 'device', 'scannedBy'])
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
     * Pointage consolidé avec horaires prévus, scans et motifs d'absence.
     */
    public function overview(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Attendance::class);

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);
        $date = CarbonImmutable::parse($validated['date'] ?? CarbonImmutable::now()->toDateString());
        $this->authorizeHistoryDate($date);
        $dateString = $date->toDateString();
        $timezone = config('app.timezone');

        $employees = $this->employees->limitToVisibleEmployees(
            Employee::query()->where('status', 'active'),
            $request->user(),
            includeSecurityTeam: true,
        )
            ->when(isset($validated['department_id']), fn ($query) => $query->where('department_id', $validated['department_id']))
            ->with([
                'workSchedules' => fn ($query) => $query
                    ->whereDate('starts_on', '<=', $dateString)
                    ->where(fn ($assignment) => $assignment
                        ->whereNull('ends_on')
                        ->orWhereDate('ends_on', '>=', $dateString))
                    ->orderByDesc('starts_on'),
                'workSchedules.workSchedule.days',
                'attendanceEvents' => fn ($query) => $query
                    ->with('scannedBy')
                    ->whereBetween('occurred_at', [$date->startOfDay(), $date->endOfDay()])
                    ->orderBy('occurred_at')
                    ->orderBy('id'),
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $employeeIds = $employees->modelKeys();
        $leaveRequests = LeaveRequest::query()
            ->with('leaveType')
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'approved')
            ->whereDate('starts_on', '<=', $dateString)
            ->whereDate('ends_on', '>=', $dateString)
            ->get()
            ->groupBy('employee_id');
        $permissionRequests = PermissionRequest::query()
            ->with('permissionType')
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'approved')
            ->whereDate('permission_date', $dateString)
            ->get()
            ->groupBy('employee_id');
        $absenceRecords = AbsenceRecord::query()
            ->with('absenceType')
            ->whereIn('employee_id', $employeeIds)
            ->whereIn('status', ['approved', 'pending'])
            ->whereDate('starts_on', '<=', $dateString)
            ->where(fn ($query) => $query
                ->whereNull('ends_on')
                ->orWhereDate('ends_on', '>=', $dateString))
            ->get()
            ->groupBy('employee_id');

        $isHoliday = app(ScheduleService::class)->isHoliday($date);
        $rows = $employees->map(function (Employee $employee) use (
            $date,
            $timezone,
            $leaveRequests,
            $permissionRequests,
            $absenceRecords,
            $isHoliday,
        ): array {
            $assignment = $employee->workSchedules->first();
            $schedule = $assignment?->workSchedule;
            $day = $schedule?->is_active
                ? $schedule->days->firstWhere('day_of_week', $date->isoWeekday())
                : null;
            $plannedEntry = $day?->starts_at === null ? null : substr($day->starts_at, 0, 5);
            $plannedExit = $day?->ends_at === null ? null : substr($day->ends_at, 0, 5);
            $entryEvent = $employee->attendanceEvents->firstWhere('event_type', 'entry');
            $exitEvent = $employee->attendanceEvents->where('event_type', 'exit')->last();
            $leave = $leaveRequests->get($employee->id)?->first();
            $permission = $permissionRequests->get($employee->id)?->first();
            $absence = $absenceRecords->get($employee->id)?->first();
            $status = 'absent';
            $statusLabel = 'Absent';
            $description = 'Aucun pointage, congé ou permission enregistré.';
            $category = 'absent';

            if ($leave !== null) {
                $status = 'leave';
                $statusLabel = 'En congé';
                $description = $leave->leaveType?->name ?? 'Congé approuvé';
                $category = 'leave';
            } elseif ($permission !== null) {
                $status = 'permission';
                $statusLabel = 'En permission';
                $description = $permission->permissionType?->name ?? 'Permission approuvée';
                $category = 'permission';
            } elseif ($absence !== null) {
                $status = 'absence';
                $statusLabel = 'Absence déclarée';
                $description = $absence->reason
                    ?: ($absence->absenceType?->name ?? 'Absence déclarée');
                $category = 'absence';
            } elseif ($isHoliday) {
                $status = 'holiday';
                $statusLabel = 'Jour férié';
                $description = 'Jour férié';
                $category = 'other';
            } elseif ($plannedEntry === null || $plannedExit === null) {
                $status = 'rest_day';
                $statusLabel = 'Repos / non planifié';
                $description = 'Aucun horaire de travail prévu.';
                $category = 'other';
            } elseif ($entryEvent !== null) {
                $expectedEntry = $date->setTimeFromTimeString($plannedEntry);
                $actualEntry = $entryEvent->occurred_at?->setTimezone($timezone);
                $tolerance = $schedule?->late_tolerance_minutes ?? 0;
                $isLate = $actualEntry !== null && $actualEntry->greaterThan($expectedEntry->addMinutes($tolerance));
                $status = $isLate ? 'late' : 'on_time';
                $statusLabel = $isLate ? 'En retard' : 'À l’heure';
                $description = $statusLabel;
                $category = 'attendance';
            } else {
                $now = CarbonImmutable::now($timezone);
                $deadline = $date->setTimeFromTimeString($plannedEntry)
                    ->addMinutes($schedule?->late_tolerance_minutes ?? 0);

                if ($date->isSameDay($now) && $now->lessThanOrEqualTo($deadline)) {
                    $status = 'not_started';
                    $statusLabel = 'Service non commencé';
                    $description = 'L’heure prévue du service n’est pas encore dépassée.';
                    $category = 'other';
                } else {
                    $category = 'absent';
                }
            }

            return [
                'employee' => [
                    'id' => $employee->id,
                    'employee_number' => $employee->employee_number,
                    'full_name' => $employee->fullName(),
                ],
                'actual_entry' => $entryEvent?->occurred_at?->setTimezone($timezone)->format('H:i'),
                'entry_scanned_by' => $entryEvent?->scannedBy?->name,
                'actual_exit' => $exitEvent?->occurred_at?->setTimezone($timezone)->format('H:i'),
                'exit_scanned_by' => $exitEvent?->scannedBy?->name,
                'status' => $status,
                'status_label' => $statusLabel,
                'category' => $category,
                'description' => $description,
                'starts_on' => $leave?->starts_on?->toDateString() ?? $absence?->starts_on?->toDateString() ?? $permission?->permission_date?->toDateString(),
                'ends_on' => $leave?->ends_on?->toDateString() ?? $absence?->ends_on?->toDateString() ?? $permission?->permission_date?->toDateString(),
                'permission_starts_at' => $permission?->starts_at,
                'permission_ends_at' => $permission?->ends_at,
            ];
        })->values();

        return response()->json([
            'date' => $dateString,
            'summary' => [
                'on_time' => $rows->where('status', 'on_time')->count(),
                'late' => $rows->where('status', 'late')->count(),
                'absent' => $rows->where('status', 'absent')->count(),
                'leave' => $rows->where('status', 'leave')->count(),
                'permission' => $rows->where('status', 'permission')->count(),
                'absence' => $rows->where('status', 'absence')->count(),
            ],
            'data' => $rows,
        ]);
    }

    /**
     * Congés, permissions, absences déclarées et absences détectées sur une période.
     */
    public function availability(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Attendance::class);

        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $from = CarbonImmutable::parse($validated['from'])->startOfDay();
        $to = CarbonImmutable::parse($validated['to'])->startOfDay();
        $this->authorizeHistoryDate($from);
        $this->authorizeHistoryDate($to);
        $fromString = $from->toDateString();
        $toString = $to->toDateString();
        $timezone = config('app.timezone');
        $now = CarbonImmutable::now($timezone);

        $employees = $this->employees->limitToVisibleEmployees(
            Employee::query()->where('status', 'active'),
            $request->user(),
            includeSecurityTeam: true,
        )
            ->with([
                'workSchedules' => fn ($query) => $query
                    ->whereDate('starts_on', '<=', $toString)
                    ->where(fn ($assignment) => $assignment
                        ->whereNull('ends_on')
                        ->orWhereDate('ends_on', '>=', $fromString))
                    ->orderByDesc('starts_on'),
                'workSchedules.workSchedule.days',
                'attendanceEvents' => fn ($query) => $query
                    ->with('scannedBy')
                    ->whereBetween('occurred_at', [$from, $to->endOfDay()])
                    ->orderBy('occurred_at')
                    ->orderBy('id'),
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $employeeIds = $employees->modelKeys();
        $leaveRequests = LeaveRequest::query()
            ->with(['employee', 'leaveType'])
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'approved')
            ->whereDate('starts_on', '<=', $toString)
            ->whereDate('ends_on', '>=', $fromString)
            ->get();
        $permissionRequests = PermissionRequest::query()
            ->with(['employee', 'permissionType'])
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'approved')
            ->whereBetween('permission_date', [$fromString, $toString])
            ->get();
        $absenceRecords = AbsenceRecord::query()
            ->with(['employee', 'absenceType'])
            ->whereIn('employee_id', $employeeIds)
            ->whereIn('status', ['approved', 'pending'])
            ->whereDate('starts_on', '<=', $toString)
            ->where(fn ($query) => $query
                ->whereNull('ends_on')
                ->orWhereDate('ends_on', '>=', $fromString))
            ->get();
        $scheduleService = app(ScheduleService::class);

        $rows = collect();
        foreach ($leaveRequests as $leave) {
            $rows->push([
                'id' => 'leave-'.$leave->id,
                'employee' => $this->availabilityEmployee($leave->employee),
                'category' => 'leave',
                'status_label' => 'Congé approuvé',
                'starts_on' => $leave->starts_on?->toDateString(),
                'ends_on' => $leave->ends_on?->toDateString(),
                'hours' => null,
                'description' => $leave->leaveType?->name ?? 'Congé approuvé',
            ]);
        }

        foreach ($permissionRequests as $permission) {
            $rows->push([
                'id' => 'permission-'.$permission->id,
                'employee' => $this->availabilityEmployee($permission->employee),
                'category' => 'permission',
                'status_label' => 'Permission accordée',
                'starts_on' => $permission->permission_date?->toDateString(),
                'ends_on' => $permission->permission_date?->toDateString(),
                'hours' => substr($permission->starts_at, 0, 5).' – '.substr($permission->ends_at, 0, 5),
                'description' => $permission->permissionType?->name ?? 'Permission accordée',
            ]);
        }

        foreach ($absenceRecords as $absence) {
            $rows->push([
                'id' => 'absence-'.$absence->id,
                'employee' => $this->availabilityEmployee($absence->employee),
                'category' => 'absence',
                'status_label' => $absence->status === 'approved' ? 'Absence approuvée' : 'Absence en attente',
                'starts_on' => $absence->starts_on?->toDateString(),
                'ends_on' => $absence->ends_on?->toDateString(),
                'hours' => null,
                'description' => $absence->reason ?: ($absence->absenceType?->name ?? 'Absence déclarée'),
            ]);
        }

        $leaveByEmployee = $leaveRequests->groupBy('employee_id');
        $permissionsByEmployeeDate = $permissionRequests->groupBy(
            fn (PermissionRequest $permission): string => $permission->employee_id.'|'.$permission->permission_date?->toDateString(),
        );
        $absencesByEmployee = $absenceRecords->groupBy('employee_id');

        foreach (CarbonPeriod::create($from, $to) as $periodDate) {
            $date = CarbonImmutable::instance($periodDate)->startOfDay();

            if ($date->greaterThan($now->startOfDay()) || $scheduleService->isHoliday($date)) {
                continue;
            }

            foreach ($employees as $employee) {
                if (
                    $leaveByEmployee->has($employee->id)
                    && $leaveByEmployee->get($employee->id)->contains(
                        fn (LeaveRequest $leave): bool => $leave->starts_on->lessThanOrEqualTo($date)
                            && $leave->ends_on->greaterThanOrEqualTo($date),
                    )
                ) {
                    continue;
                }

                if ($permissionsByEmployeeDate->has($employee->id.'|'.$date->toDateString())) {
                    continue;
                }

                if (
                    $absencesByEmployee->has($employee->id)
                    && $absencesByEmployee->get($employee->id)->contains(
                        fn (AbsenceRecord $absence): bool => $absence->starts_on->lessThanOrEqualTo($date)
                            && ($absence->ends_on === null || $absence->ends_on->greaterThanOrEqualTo($date)),
                    )
                ) {
                    continue;
                }

                $hasEntry = $employee->attendanceEvents->contains(
                    fn (AttendanceEvent $event): bool => $event->event_type === 'entry'
                        && $event->occurred_at?->setTimezone($timezone)->toDateString() === $date->toDateString(),
                );

                if ($hasEntry) {
                    continue;
                }

                $assignment = $employee->workSchedules->first(
                    fn ($item): bool => $item->starts_on->lessThanOrEqualTo($date)
                        && ($item->ends_on === null || $item->ends_on->greaterThanOrEqualTo($date)),
                );
                $schedule = $assignment?->workSchedule;
                $day = $schedule?->is_active
                    ? $schedule->days->firstWhere('day_of_week', $date->isoWeekday())
                    : null;

                if ($day?->starts_at === null) {
                    continue;
                }

                $expectedEntry = $date->setTimeFromTimeString($day->starts_at);
                $deadline = $expectedEntry->addMinutes($schedule->late_tolerance_minutes ?? 0);

                if ($date->isSameDay($now) && $now->lessThanOrEqualTo($deadline)) {
                    continue;
                }

                $rows->push([
                    'id' => 'absent-'.$employee->id.'-'.$date->toDateString(),
                    'employee' => $this->availabilityEmployee($employee),
                    'category' => 'absent',
                    'status_label' => 'Absent',
                    'starts_on' => $date->toDateString(),
                    'ends_on' => $date->toDateString(),
                    'hours' => null,
                    'description' => 'Aucun pointage d’entrée après l’heure prévue du service.',
                ]);
            }
        }

        $rows = $rows->sortBy([
            ['starts_on', 'asc'],
            ['employee.full_name', 'asc'],
        ])->values();

        return response()->json([
            'from' => $fromString,
            'to' => $toString,
            'summary' => [
                'leave' => $rows->where('category', 'leave')->count(),
                'permission' => $rows->where('category', 'permission')->count(),
                'absence' => $rows->where('category', 'absence')->count(),
                'absent' => $rows->where('category', 'absent')->count(),
            ],
            'data' => $rows,
        ]);
    }

    /**
     * @return array{id: int, employee_number: string, full_name: string}
     */
    private function availabilityEmployee(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'employee_number' => $employee->employee_number,
            'full_name' => $employee->fullName(),
        ];
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
            ->with(['employee', 'badge', 'device', 'scannedBy'])
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
            'events' => AttendanceEventResource::collection(
                $this->attendance->eventsFor($employee, $date)->load('scannedBy'),
            ),
        ]);
    }

    private function authorizeHistoryDate(CarbonImmutable $date): void
    {
        if (! $date->isSameDay(CarbonImmutable::now())) {
            $this->authorize('viewHistory', Attendance::class);
        }
    }
}
