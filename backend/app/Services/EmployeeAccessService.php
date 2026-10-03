<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class EmployeeAccessService
{
    /**
     * Restricts an employee query to the actor's role-specific organizational scope.
     *
     * @param  Builder<Employee>  $employees
     * @return Builder<Employee>
     */
    public function limitToVisibleEmployees(
        Builder $employees,
        User $user,
        bool $includeSecurityTeam = false,
    ): Builder {
        if (
            $user->hasPermission('employees.view')
            && ($user->hasRole('administrateur') || $user->hasRole('rh'))
        ) {
            return $employees;
        }

        if (
            $includeSecurityTeam
            && $user->hasPermission('attendance.view')
            && $user->hasRole('securite')
        ) {
            return $employees;
        }

        $employee = $user->employee;

        if (! $employee) {
            return $employees->whereRaw('1 = 0');
        }

        $employees->where(function (Builder $scope) use ($employee, $user): void {
            $scope->whereKey($employee->id);

            if ($user->hasRole('direction') && $user->hasPermission('employees.view')) {
                $directionId = $employee->direction_id ?? $employee->department?->direction_id;

                if ($directionId !== null) {
                    $scope
                        ->orWhere('direction_id', $directionId)
                        ->orWhereHas(
                            'department',
                            fn (Builder $department) => $department->where('direction_id', $directionId),
                        );
                }
            }

            if ($user->hasRole('responsable') && $user->hasPermission('employees.view')) {
                $scope->orWhere('manager_id', $employee->id);
            }
        });

        return $employees;
    }

    /**
     * @param  Builder<Employee>  $employees
     */
    public function canViewEmployee(User $user, Employee $employee, bool $includeSecurityTeam = false): bool
    {
        return $this->limitToVisibleEmployees(
            Employee::query(),
            $user,
            $includeSecurityTeam,
        )->whereKey($employee->id)->exists();
    }

    public function canAssignEmployee(
        User $user,
        ?int $directionId,
        ?int $departmentId,
        ?int $managerId,
    ): bool {
        if (
            $user->hasPermission('employees.view')
            && ($user->hasRole('administrateur') || $user->hasRole('rh'))
        ) {
            return true;
        }

        $employee = $user->employee;

        if (! $employee || ! $user->hasPermission('employees.view')) {
            return false;
        }

        if ($user->hasRole('direction')) {
            $employeeDirectionId = $employee->direction_id ?? $employee->department?->direction_id;
            $assignedDirectionId = $directionId;

            if ($departmentId !== null) {
                $departmentDirectionId = Department::query()
                    ->whereKey($departmentId)
                    ->value('direction_id');

                if ($departmentDirectionId === null) {
                    return false;
                }

                if ($assignedDirectionId !== null && $assignedDirectionId !== (int) $departmentDirectionId) {
                    return false;
                }

                $assignedDirectionId = (int) $departmentDirectionId;
            }

            if ($employeeDirectionId === null || $assignedDirectionId !== (int) $employeeDirectionId) {
                return false;
            }

            if ($managerId !== null) {
                $manager = Employee::query()->find($managerId);

                return $manager !== null && $this->canViewEmployee($user, $manager);
            }

            return true;
        }

        if (! $user->hasRole('responsable') || $managerId !== $employee->id) {
            return false;
        }

        $managerDirectionId = $employee->direction_id ?? $employee->department?->direction_id;

        if ($managerDirectionId === null) {
            return false;
        }

        if ($directionId !== null && $directionId !== (int) $managerDirectionId) {
            return false;
        }

        if ($departmentId !== null) {
            $department = Department::query()->find($departmentId);

            if (
                $department === null
                || (int) $department->direction_id !== (int) $managerDirectionId
                || ($employee->department_id !== null && $department->id !== $employee->department_id)
            ) {
                return false;
            }
        }

        return $directionId !== null || $departmentId !== null;
    }

    /**
     * @param  Builder  $records  A model query with an employee relation.
     */
    public function limitRelatedToVisibleEmployees(
        Builder $records,
        User $user,
        bool $includeSecurityTeam = false,
    ): Builder {
        return $records->whereHas(
            'employee',
            fn (Builder $employees) => $this->limitToVisibleEmployees(
                $employees,
                $user,
                $includeSecurityTeam,
            ),
        );
    }
}
