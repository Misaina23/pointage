<?php

namespace App\Http\Resources;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LeaveRequest
 */
class LeaveRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'leave_type_id' => $this->leave_type_id,
            'starts_on' => $this->starts_on?->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'requested_days' => (float) $this->requested_days,
            'reason' => $this->reason,
            'attachment_path' => $this->attachment_path,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'leave_type' => $this->whenLoaded('leaveType', fn () => [
                'id' => $this->leaveType->id,
                'name' => $this->leaveType->name,
                'code' => $this->leaveType->code,
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
                'history' => $this->approvalRequest->actions->map(fn ($action): array => [
                    'decision' => $action->decision,
                    'comment' => $action->comment,
                    'actor' => $action->actor?->name,
                    'acted_at' => $action->acted_at?->toIso8601String(),
                ]),
            ]),
        ];
    }
}
