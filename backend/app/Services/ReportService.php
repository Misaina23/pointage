<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Models\AbsenceRecord;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Synthèse d'une journée pour l'ensemble du périmètre.
     *
     * @return array<string, mixed>
     */
    public function dailySummary(CarbonImmutable $date, ?int $departmentId = null): array
    {
        $employees = $this->employees($departmentId)->count();

        $attendances = Attendance::query()
            ->with('employee')
            ->whereDate('attendance_date', $date->toDateString())
            ->when($departmentId !== null, fn ($query) => $query
                ->whereHas('employee', fn ($scope) => $scope->where('department_id', $departmentId)))
            ->get();

        return [
            'date' => $date->toDateString(),
            'department_id' => $departmentId,
            'employees' => $employees,
            'present' => $this->countStatus($attendances, AttendanceStatus::Present),
            'late' => $this->countStatus($attendances, AttendanceStatus::Late),
            'absent' => $this->countStatus($attendances, AttendanceStatus::Absent),
            'on_leave' => $this->countStatus($attendances, AttendanceStatus::OnLeave),
            'on_permission' => $this->countStatus($attendances, AttendanceStatus::OnPermission),
            'remote' => $this->countStatus($attendances, AttendanceStatus::Remote),
            'holidays' => $this->countStatus($attendances, AttendanceStatus::Holiday),
            'rest_days' => $this->countStatus($attendances, AttendanceStatus::RestDay),
            'worked_minutes' => (int) $attendances->sum('worked_minutes'),
            'late_minutes' => (int) $attendances->sum('late_minutes'),
            'overtime_minutes' => (int) $attendances->sum('overtime_minutes'),
            'leaves' => $this->countRequests(LeaveRequest::class, $date, $date, $departmentId),
            'permissions' => $this->countRequests(PermissionRequest::class, $date, $date, $departmentId),
            'absences' => $this->countRequests(AbsenceRecord::class, $date, $date, $departmentId),
        ];
    }

    /**
     * Synthèse mensuelle.
     *
     * @return array<string, mixed>
     */
    public function monthlySummary(CarbonImmutable $month, ?int $departmentId = null): array
    {
        $from = $month->startOfMonth();
        $to = $month->endOfMonth();

        $attendances = Attendance::query()
            ->when($departmentId !== null, fn ($query) => $query
                ->whereHas('employee', fn ($scope) => $scope->where('department_id', $departmentId)))
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->get();

        $lateRows = $attendances->where('late_minutes', '>', 0)->sortByDesc('late_minutes');
        $topLate = $lateRows
            ->take(10)
            ->map(fn (Attendance $attendance): array => $this->lateRow($attendance, $attendances))
            ->values();

        return [
            'month' => $from->format('Y-m'),
            'department_id' => $departmentId,
            'employees' => $this->employees($departmentId)->count(),
            'worked_minutes' => (int) $attendances->sum('worked_minutes'),
            'overtime_minutes' => (int) $attendances->sum('overtime_minutes'),
            'late_count' => $lateRows->count(),
            'late_minutes' => (int) $lateRows->sum('late_minutes'),
            'average_late_minutes' => $lateRows->count() === 0
                ? 0
                : (int) round($lateRows->avg('late_minutes')),
            'absence_count' => $attendances->where('status', AttendanceStatus::Absent->value)->count(),
            'leave_count' => $this->countRequests(LeaveRequest::class, $from, $to, $departmentId),
            'permission_count' => $this->countRequests(PermissionRequest::class, $from, $to, $departmentId),
            'absence_records' => $this->countRequests(AbsenceRecord::class, $from, $to, $departmentId),
            'top_late' => $topLate,
        ];
    }

    /**
     * Ligne factuelle de retard agrégé pour un employé.
     *
     * @param  Collection<int, Attendance>  $attendances
     * @return array<string, mixed>
     */
    private function lateRow(Attendance $attendance, Collection $attendances): array
    {
        $rows = $attendances
            ->where('employee_id', $attendance->employee_id)
            ->where('late_minutes', '>', 0);

        return [
            'employee_id' => $attendance->employee_id,
            'employee_number' => $attendance->employee?->employee_number,
            'name' => $attendance->employee?->fullName(),
            'late_count' => $rows->count(),
            'late_minutes' => (int) $rows->sum('late_minutes'),
        ];
    }

    /**
     * Retards agrégés par département.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function lateByDepartment(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return DB::table('attendances')
            ->join('employees', 'employees.id', '=', 'attendances.employee_id')
            ->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->whereBetween('attendances.attendance_date', [$from->toDateString(), $to->toDateString()])
            ->where('attendances.late_minutes', '>', 0)
            ->groupBy(DB::raw('COALESCE(departments.name, \'Non affecté\')'))
            ->select([
                DB::raw('COALESCE(departments.name, \'Non affecté\') as department'),
                DB::raw('COUNT(*) as occurrences'),
                DB::raw('SUM(attendances.late_minutes) as late_minutes'),
            ])
            ->orderByDesc('late_minutes')
            ->get()
            ->map(fn ($row): array => [
                'department' => (string) $row->department,
                'occurrences' => (int) $row->occurrences,
                'late_minutes' => (int) $row->late_minutes,
            ]);
    }

    /**
     * Absences agrégées par département.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function absencesByDepartment(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return DB::table('absence_records')
            ->join('employees', 'employees.id', '=', 'absence_records.employee_id')
            ->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->whereBetween('absence_records.starts_on', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw('COALESCE(departments.name, \'Non affecté\')'))
            ->select([
                DB::raw('COALESCE(departments.name, \'Non affecté\') as department'),
                DB::raw('COUNT(*) as records'),
            ])
            ->orderByDesc('records')
            ->get()
            ->map(fn ($row): array => [
                'department' => (string) $row->department,
                'records' => (int) $row->records,
            ]);
    }

    private function employees(?int $departmentId): Collection
    {
        return Employee::query()
            ->where('status', 'active')
            ->when($departmentId !== null, fn ($query) => $query->where('department_id', $departmentId))
            ->get();
    }

    private function countStatus(Collection $attendances, AttendanceStatus $status): int
    {
        return $attendances->where('status', $status->value)->count();
    }

    /**
     * @param  class-string<Model>  $model
     */
    private function countRequests(string $model, CarbonImmutable $from, CarbonImmutable $to, ?int $departmentId): int
    {
        $dateColumn = $model === PermissionRequest::class ? 'permission_date' : 'starts_on';

        return $model::query()
            ->whereIn('status', ['approved', 'pending'])
            ->whereDate($dateColumn, '<=', $to->toDateString())
            ->where(fn ($query) => $query
                ->whereDate($dateColumn, '>=', $from->toDateString())
                ->orWhereDate('ends_on', '>=', $from->toDateString()))
            ->when($departmentId !== null, fn ($query) => $query
                ->whereHas('employee', fn ($scope) => $scope->where('department_id', $departmentId)))
            ->count();
    }
}
