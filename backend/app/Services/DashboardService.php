<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\RequestStatus;
use App\Models\AbsenceRecord;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use App\Models\PlanningEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class DashboardService
{
    public function __construct(
        private readonly ReportService $reports,
        private readonly ApprovalService $approvals,
        private readonly AttendanceService $attendance,
    ) {}

    /**
     * Synthèse globale destinée aux écrans d'accueil.
     *
     * @return array<string, mixed>
     */
    public function organization(?int $departmentId = null): array
    {
        $date = CarbonImmutable::now();
        $summary = $this->reports->dailySummary($date, $departmentId);

        return [
            'date' => $summary['date'],
            'employees' => $summary['employees'],
            'present' => $summary['present'] + $summary['remote'],
            'late' => $summary['late'],
            'absent' => $summary['absent'],
            'on_leave' => $summary['on_leave'],
            'on_permission' => $summary['on_permission'],
            'hours_worked' => round($summary['worked_minutes'] / 60, 2),
            'overtime_hours' => round($summary['overtime_minutes'] / 60, 2),
            'pending_requests' => $this->pendingRequestCount($departmentId),
        ];
    }

    /**
     * Synthèse de l'espace personnel d'un employé.
     *
     * @return array<string, mixed>
     */
    public function personal(Employee $employee): array
    {
        $date = CarbonImmutable::now();
        $attendance = $this->attendance->recompute($employee, $date);

        $monthStart = $date->startOfMonth();

        $workedMinutes = (int) Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$monthStart->toDateString(), $date->toDateString()])
            ->sum('worked_minutes');

        return [
            'today' => [
                'first_entry' => $attendance->first_entry,
                'last_exit' => $attendance->last_exit,
                'status' => $attendance->status,
                'status_label' => AttendanceStatus::tryFrom($attendance->status)?->label(),
                'worked_minutes' => $attendance->worked_minutes,
                'late_minutes' => $attendance->late_minutes,
            ],
            'month' => [
                'worked_minutes' => $workedMinutes,
                'worked_hours' => round($workedMinutes / 60, 2),
                'late_count' => Attendance::query()
                    ->where('employee_id', $employee->id)
                    ->where('late_minutes', '>', 0)
                    ->whereBetween('attendance_date', [$monthStart->toDateString(), $date->toDateString()])
                    ->count(),
            ],
            'counts' => [
                'leaves' => $this->ownRequestCount($employee, LeaveRequest::class),
                'permissions' => $this->ownRequestCount($employee, PermissionRequest::class),
                'absences' => $this->ownRequestCount($employee, AbsenceRecord::class),
            ],
            'upcoming_planning' => $this->upcomingPlanning($employee),
        ];
    }

    /**
     * File d'attente des validations pour un acteur donné.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function pendingApprovals(User $actor): Collection
    {
        return $this->approvals->pendingApprovalsFor($actor)
            ->map(fn ($approval): array => [
                'approval_request_id' => $approval->id,
                'request_type' => $approval->requestable_type,
                'request_id' => $approval->requestable_id,
                'employee' => [
                    'id' => $approval->employee?->id,
                    'employee_number' => $approval->employee?->employee_number,
                    'name' => trim(($approval->employee?->first_name ?? '').' '.($approval->employee?->last_name ?? '')),
                ],
                'workflow' => $approval->workflow?->name,
                'step' => $approval->current_step,
                'submitted_at' => $approval->submitted_at?->toIso8601String(),
            ]);
    }

    private function pendingRequestCount(?int $departmentId): int
    {
        $scope = fn ($query) => $query
            ->where('status', RequestStatus::Pending->value)
            ->when($departmentId !== null, fn ($scoped) => $scoped
                ->whereHas('employee', fn ($inner) => $inner->where('department_id', $departmentId)));

        return LeaveRequest::query()->where($scope)->count()
            + PermissionRequest::query()->where($scope)->count()
            + AbsenceRecord::query()->where($scope)->count();
    }

    /**
     * @param  class-string<Model>  $model
     */
    private function ownRequestCount(Employee $employee, string $model): int
    {
        return $model::query()->where('employee_id', $employee->id)->count();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function upcomingPlanning(Employee $employee): Collection
    {
        $date = CarbonImmutable::now();

        return PlanningEvent::query()
            ->whereHas('participants', fn ($query) => $query->whereKey($employee->id))
            ->where('starts_at', '>=', $date->startOfDay())
            ->orderBy('starts_at')
            ->limit(5)
            ->get()
            ->map(fn (PlanningEvent $event): array => [
                'id' => $event->id,
                'title' => $event->title,
                'event_type' => $event->event_type,
                'starts_at' => $event->starts_at?->toIso8601String(),
                'location' => $event->location,
            ]);
    }
}
