<?php

namespace App\Policies;

use App\Models\AbsenceRecord;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use App\Models\User;
use App\Services\EmployeeAccessService;

class RequestPolicy
{
    public function __construct(private readonly EmployeeAccessService $employees) {}

    /**
     * Le personnel voit ses propres demandes ; les rôles de gestion voient le périmètre autorisé.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('employees.view')
            || $user->hasPermission('leave.request')
            || $user->hasPermission('permission.request')
            || $user->hasPermission('absence.request');
    }

    public function view(User $user, LeaveRequest|PermissionRequest|AbsenceRecord $request): bool
    {
        $employee = $request->employee ?? $request->employee()->first();

        return $employee instanceof Employee
            && $this->employees->canViewEmployee($user, $employee);
    }

    public function delete(User $user, LeaveRequest|PermissionRequest|AbsenceRecord $request): bool
    {
        return $this->isOwner($user, $request) && $request->status === 'pending';
    }

    protected function isOwner(User $user, LeaveRequest|PermissionRequest|AbsenceRecord $request): bool
    {
        $employee = $request->employee ?? $request->employee()->first();

        return $employee instanceof Employee && $user->employee?->id === $employee->id;
    }
}
