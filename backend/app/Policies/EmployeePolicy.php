<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;
use App\Services\EmployeeAccessService;

class EmployeePolicy
{
    public function __construct(private readonly EmployeeAccessService $employees) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('employees.view');
    }

    public function view(User $user, Employee $employee): bool
    {
        return $this->employees->canViewEmployee($user, $employee);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('employees.manage');
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->hasPermission('employees.manage')
            && $this->employees->canViewEmployee($user, $employee);
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasPermission('employees.manage')
            && $this->employees->canViewEmployee($user, $employee);
    }

    public function reassign(User $user, Employee $employee): bool
    {
        return $user->hasPermission('employees.manage')
            && $this->employees->canViewEmployee($user, $employee);
    }

    private function isSelf(User $user, Employee $employee): bool
    {
        return $user->employee?->id === $employee->id;
    }
}
