<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceEventResource;
use App\Models\Attendance;
use App\Models\AttendanceEvent;
use App\Models\Employee;
use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityAttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    /**
     * Journal de scan du terminal de sécurité, du plus récent au plus ancien.
     */
    public function scans(Request $request): JsonResponse
    {
        $this->authorize('scan', Attendance::class);

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));
        $this->authorizeHistoryDate($date);

        $scans = AttendanceEvent::query()
            ->with(['employee', 'badge', 'device', 'scannedBy'])
            ->whereBetween('occurred_at', [$date->startOfDay(), $date->endOfDay()])
            ->when($request->filled('device_code'), fn ($query) => $query
                ->whereHas('device', fn ($scope) => $scope->where('device_code', $request->string('device_code'))))
            ->orderByDesc('occurred_at')
            ->limit(min(max($request->integer('limit', 50), 1), 200))
            ->get();

        return response()->json([
            'date' => $date->toDateString(),
            'data' => AttendanceEventResource::collection($scans)->resolve($request),
        ]);
    }

    /**
     * Recalcule la journée d'un employé après un scan.
     */
    public function refresh(Request $request, Employee $employee): JsonResponse
    {
        $this->authorize('scan', Attendance::class);
        $this->authorize('view', new Attendance(['employee_id' => $employee->id]));

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));
        $this->authorizeHistoryDate($date);
        $attendance = $this->attendance->recompute($employee, $date);

        return response()->json([
            'data' => $attendance,
            'events' => AttendanceEventResource::collection(
                $this->attendance->eventsFor($employee, $date)->load('scannedBy'),
            )->resolve($request),
        ]);
    }

    private function authorizeHistoryDate(CarbonImmutable $date): void
    {
        if (! $date->isSameDay(CarbonImmutable::now())) {
            $this->authorize('viewHistory', Attendance::class);
        }
    }
}
