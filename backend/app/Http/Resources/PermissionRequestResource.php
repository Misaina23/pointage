<?php

namespace App\Http\Resources;

use App\Models\PermissionRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PermissionRequest
 */
class PermissionRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'permission_type_id' => $this->permission_type_id,
            'permission_date' => $this->permission_date?->toDateString(),
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'requested_days' => (float) $this->requested_days,
            'reason' => $this->reason,
            'attachment_path' => $this->attachment_path,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'permission_type' => $this->whenLoaded('permissionType', fn () => [
                'id' => $this->permissionType->id,
                'name' => $this->permissionType->name,
                'code' => $this->permissionType->code,
            ]),
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'employee_number' => $this->employee->employee_number,
                'full_name' => $this->employee->fullName(),
            ]),
            'approval' => $this->whenLoaded('approvalRequest', fn () => $this->approvalRequest === null ? null : [
                'id' => $this->approvalRequest->id,
                'status' => $this->approvalRequest->status,
                'current_step' => $this->approvalRequest->current_step,
                'workflow' => $this->approvalRequest->workflow?->name,
            ]),
        ];
    }
}
