<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\User;
use App\Services\EmployeeAccessService;

class AttendancePolicy
{
    public function __construct(private readonly EmployeeAccessService $employees) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('attendance.view');
    }

    public function viewHistory(User $user): bool
    {
        return $user->hasPermission('attendance.history');
    }

    public function view(User $user, Attendance $attendance): bool
    {
        $employee = Employee::query()->find($attendance->employee_id);

        return $employee !== null
            && $this->employees->canViewEmployee($user, $employee, includeSecurityTeam: true);
    }

    public function scan(User $user): bool
    {
        return $user->hasPermission('attendance.scan');
    }

    public function correct(User $user, Attendance $attendance): bool
    {
        return $user->hasPermission('attendance.view') && $user->hasPermission('employees.manage');
    }

    public function recompute(User $user): bool
    {
        return $user->hasPermission('attendance.view') && $user->hasPermission('employees.manage');
    }

    public function viewTeam(User $user, Employee $employee): bool
    {
        return $this->employees->canViewEmployee($user, $employee, includeSecurityTeam: true);
    }
}
