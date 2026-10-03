<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AbsenceType;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\PermissionType;
use App\Models\PermissionRequest;
use App\Enums\RequestStatus;
use App\Services\LeaveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferenceDataController extends Controller
{
    public function __construct(private readonly LeaveService $leaves) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'leave_types' => LeaveType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (LeaveType $type): array => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'code' => $type->code,
                    'requires_attachment' => $type->requires_attachment,
                    'is_paid' => $type->is_paid,
                ]),
            'permission_types' => PermissionType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (PermissionType $type): array => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'code' => $type->code,
                    'requires_attachment' => $type->requires_attachment,
                ]),
            'absence_types' => AbsenceType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (AbsenceType $type): array => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'code' => $type->code,
                    'requires_attachment' => $type->requires_attachment,
                ]),
        ]);
    }

    /**
     * Soldes de congés de l'utilisateur connecté.
     */
    public function myLeaveBalances(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return response()->json(['message' => 'Aucun dossier employé associé à ce compte.'], 404);
        }

        $year = (int) $request->input('year', now()->year);
        $this->leaves->annualBalanceFor($employee, $year);
        $permissionDays = (float) PermissionRequest::query()
            ->where('employee_id', $employee->id)
            ->whereYear('permission_date', $year)
            ->whereIn('status', [RequestStatus::Pending->value, RequestStatus::Approved->value])
            ->sum('requested_days');

        return response()->json([
            'data' => LeaveBalance::query()
                ->with('leaveType')
                ->where('employee_id', $employee->id)
                ->where('year', $year)
                ->get()
                ->map(fn (LeaveBalance $balance): array => [
                    'leave_type_id' => $balance->leave_type_id,
                    'leave_type' => $balance->leaveType?->name,
                    'allocated_days' => (float) $balance->allocated_days,
                    'used_days' => (float) $balance->used_days,
                    'remaining_days' => round((float) $balance->allocated_days - (float) $balance->used_days, 2),
                ]),
            'permission_allowance' => [
                'allocated_days' => 2,
                'used_days' => round($permissionDays, 2),
                'remaining_days' => round(max(0, 2 - $permissionDays), 2),
                'year' => $year,
            ],
        ]);
    }
}
