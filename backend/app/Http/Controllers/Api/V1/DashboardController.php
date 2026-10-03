<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceEventResource;
use App\Http\Resources\AttendanceResource;
use App\Services\AttendanceService;
use App\Services\DashboardService;
use App\Services\ScheduleService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboards,
        private readonly ScheduleService $schedules,
        private readonly AttendanceService $attendance,
    ) {}

    /**
     * Synthèse de l'organisation selon le périmètre de l'utilisateur.
     */
    public function organization(Request $request): JsonResponse
    {
        $departmentId = $this->departmentIdFor($request);

        return response()->json($this->dashboards->organization($departmentId));
    }

    /**
     * Synthèse de l'espace personnel.
     */
    public function personal(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return response()->json(['message' => 'Aucun dossier employé associé à ce compte.'], 404);
        }

        $personal = $this->dashboards->personal($employee);
        $shift = $this->schedules->resolveShift($employee, CarbonImmutable::now());

        $personal['shift'] = $shift === null ? null : [
            'starts_at' => $shift->startsAt?->format('H:i'),
            'ends_at' => $shift->endsAt?->format('H:i'),
            'break_starts_at' => $shift->breakStartsAt?->format('H:i'),
            'break_ends_at' => $shift->breakEndsAt?->format('H:i'),
            'late_tolerance_minutes' => $shift->lateToleranceMinutes,
            'is_rest_day' => $shift->isRestDay,
        ];

        return response()->json($personal);
    }

    /**
     * Demandes en attente de validation pour l'utilisateur connecté.
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dashboards->pendingApprovals($request->user()),
        ]);
    }

    public function myAttendance(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return response()->json(['message' => 'Aucun dossier employé associé à ce compte.'], 404);
        }

        $date = CarbonImmutable::parse($request->input('date', CarbonImmutable::now()->toDateString()));
        $attendance = $this->attendance->recompute($employee, $date);

        return response()->json([
            'data' => (new AttendanceResource($attendance))->resolve($request),
            'events' => AttendanceEventResource::collection(
                $this->attendance->eventsFor($employee, $date)
            ),
        ]);
    }

    private function departmentIdFor(Request $request): ?int
    {
        $requested = $request->integer('department_id') ?: null;

        if ($requested === null) {
            return $request->user()->hasPermission('employees.manage') ? null : $request->user()->employee?->department_id;
        }

        return $request->user()->can('employees.view') ? $requested : null;
    }
}
