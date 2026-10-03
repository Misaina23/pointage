<?php

namespace App\Http\Resources;

use App\Models\AbsenceRecord;
use App\Models\ApprovalRequest;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApprovalRequest
 */
class ApprovalRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $requestable = $this->requestable;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'current_step' => $this->current_step,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'workflow' => $this->whenLoaded('workflow', fn () => [
                'id' => $this->workflow->id,
                'name' => $this->workflow->name,
            ]),
            'current_step_detail' => $this->whenLoaded('workflow', fn () => $this->currentStepDetail()),
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'employee_number' => $this->employee->employee_number,
                'full_name' => $this->employee->fullName(),
                'department' => $this->employee->department?->name,
            ]),
            'request' => $requestable === null ? null : [
                'type' => class_basename($requestable),
                'id' => $requestable->getKey(),
                'summary' => $this->summary($requestable),
            ],
            'history' => $this->whenLoaded('actions', fn () => $this->actions->map(fn ($action): array => [
                'decision' => $action->decision,
                'comment' => $action->comment,
                'step' => $action->approvalStep?->name,
                'actor' => $action->actor?->name,
                'acted_at' => $action->acted_at?->toIso8601String(),
            ])),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function currentStepDetail(): ?array
    {
        $step = $this->workflow?->steps->firstWhere('step_order', $this->current_step);

        return $step === null ? null : [
            'order' => $step->step_order,
            'name' => $step->name,
            'approver_role' => $step->approverRole?->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Model $requestable): array
    {
        return match (true) {
            $requestable instanceof LeaveRequest => [
                'starts_on' => $requestable->starts_on?->toDateString(),
                'ends_on' => $requestable->ends_on?->toDateString(),
                'days' => (float) $requestable->requested_days,
                'reason' => $requestable->reason,
            ],
            $requestable instanceof PermissionRequest => [
                'permission_date' => $requestable->permission_date?->toDateString(),
                'starts_at' => $requestable->starts_at,
                'ends_at' => $requestable->ends_at,
                'reason' => $requestable->reason,
            ],
            $requestable instanceof AbsenceRecord => [
                'starts_on' => $requestable->starts_on?->toDateString(),
                'ends_on' => $requestable->ends_on?->toDateString(),
                'reason' => $requestable->reason,
            ],
            default => [],
        };
    }
}
