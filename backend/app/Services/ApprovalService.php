<?php

namespace App\Services;

use App\Enums\Decision;
use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\ApprovalAction;
use App\Models\ApprovalRequest;
use App\Models\ApprovalStep;
use App\Models\ApprovalWorkflow;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApprovalService
{
    public function __construct(private readonly EmployeeAccessService $employees) {}

    /**
     * Sélectionne le circuit le plus spécifique pour l'employé : département, sinon direction, sinon global.
     */
    public function resolveWorkflow(RequestType $type, Employee $employee): ?ApprovalWorkflow
    {
        $workflows = ApprovalWorkflow::query()
            ->where('request_type', $type->value)
            ->where('is_active', true)
            ->where(function ($query) use ($employee): void {
                $query
                    ->where(fn ($scope) => $scope
                        ->where('department_id', $employee->department_id)
                        ->whereNotNull('department_id'))
                    ->orWhere(fn ($scope) => $scope
                        ->where('direction_id', $employee->direction_id)
                        ->whereNull('department_id')
                        ->whereNotNull('direction_id'))
                    ->orWhere(fn ($scope) => $scope
                        ->whereNull('department_id')
                        ->whereNull('direction_id'));
            })
            ->orderByRaw('CASE WHEN department_id IS NOT NULL THEN 2 WHEN direction_id IS NOT NULL THEN 1 ELSE 0 END DESC')
            ->with('steps')
            ->get();

        if ($type !== RequestType::Leave) {
            return $workflows->first();
        }

        $employeeIsRh = $employee->user?->hasRole('rh') && ! $employee->user?->hasRole('direction');
        $approverSlug = $employeeIsRh ? 'direction' : 'rh';
        $approverRoleId = Role::query()->where('slug', $approverSlug)->value('id');

        if ($approverRoleId === null) {
            return null;
        }

        return $workflows->first(function (ApprovalWorkflow $workflow) use ($approverRoleId): bool {
            $firstStep = $workflow->steps->firstWhere('is_required', true)
                ?? $workflow->steps->first();

            return $workflow->steps->count() === 1
                && $firstStep?->approver_role_id === $approverRoleId;
        });
    }

    /**
     * Démarre le circuit de validation d'une demande.
     */
    public function start(RequestType $type, Model $requestable): ?ApprovalRequest
    {
        $employee = $requestable->employee;
        $workflow = $this->resolveWorkflow($type, $employee);

        if (! $workflow) {
            return null;
        }

        return DB::transaction(function () use ($workflow, $employee, $requestable): ApprovalRequest {
            $approval = ApprovalRequest::query()->create([
                'approval_workflow_id' => $workflow->id,
                'employee_id' => $employee->id,
                'requestable_type' => $requestable->getMorphClass(),
                'requestable_id' => $requestable->getKey(),
                'current_step' => $this->firstRequiredStep($workflow),
                'status' => RequestStatus::Pending->value,
                'submitted_at' => now(),
            ]);

            return $approval;
        });
    }

    public function canAct(User $actor, ApprovalRequest $approval): bool
    {
        if ($approval->status !== RequestStatus::Pending->value) {
            return false;
        }

        if ($actor->employee?->id === $approval->employee_id) {
            return false;
        }

        $step = $this->currentStep($approval);

        if (! $step) {
            return false;
        }

        if ($step->approver_employee_id !== null) {
            return $actor->employee?->id === $step->approver_employee_id;
        }

        if ($step->approver_role_id === null) {
            return $actor->hasPermission('roles.manage');
        }

        return $actor->roles()->whereKey($step->approver_role_id)->exists()
            && $approval->employee !== null
            && $this->employees->canViewEmployee($actor, $approval->employee)
            && $this->matchesWorkflowScope($actor, $approval);
    }

    public function decide(ApprovalRequest $approval, User $actor, Decision $decision, ?string $comment = null): ApprovalRequest
    {
        return DB::transaction(function () use ($approval, $actor, $decision, $comment): ApprovalRequest {
            $approval = ApprovalRequest::query()
                ->whereKey($approval->id)
                ->lockForUpdate()
                ->with(['employee', 'workflow', 'requestable'])
                ->firstOrFail();

            if (! $this->canAct($actor, $approval) || $approval->requestable === null) {
                throw ValidationException::withMessages([
                    'approval_request' => 'Vous n\'êtes pas autorisé à traiter cette demande à cette étape.',
                ]);
            }

            $step = $this->currentStep($approval);

            ApprovalAction::query()->create([
                'approval_request_id' => $approval->id,
                'approval_step_id' => $step?->id,
                'actor_user_id' => $actor->id,
                'decision' => $decision->value,
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            $requestable = $approval->requestable;

            if ($decision === Decision::Rejected) {
                $requestable?->forceFill(['status' => RequestStatus::Rejected->value])->save();
                $approval->forceFill([
                    'status' => RequestStatus::Rejected->value,
                    'completed_at' => now(),
                ])->save();

                return $approval;
            }

            $nextStep = $this->nextStep($approval);

            if ($nextStep === null) {
                $requestable?->forceFill(['status' => RequestStatus::Approved->value])->save();
                $approval->forceFill([
                    'status' => RequestStatus::Approved->value,
                    'completed_at' => now(),
                ])->save();
            } else {
                $approval->forceFill(['current_step' => $nextStep->step_order])->save();
            }

            return $approval;
        });
    }

    public function currentStep(ApprovalRequest $approval): ?ApprovalStep
    {
        return ApprovalStep::query()
            ->where('approval_workflow_id', $approval->approval_workflow_id)
            ->where('step_order', $approval->current_step)
            ->first();
    }

    public function pendingApprovalsFor(User $actor): Collection
    {
        return ApprovalRequest::query()
            ->where('status', RequestStatus::Pending->value)
            ->with(['employee', 'workflow', 'requestable'])
            ->get()
            ->filter(fn (ApprovalRequest $approval): bool => $this->canAct($actor, $approval))
            ->values();
    }

    public function approversFor(ApprovalStep $step, ?Employee $requestEmployee = null): Collection
    {
        if ($step->approver_employee_id !== null) {
            $user = $step->approverEmployee?->user;

            return $user ? collect([$user]) : collect();
        }

        if ($step->approver_role_id === null) {
            return collect();
        }

        $approvers = User::query()
            ->whereHas('roles', fn ($query) => $query->whereKey($step->approver_role_id))
            ->get();

        if ($requestEmployee === null) {
            return $approvers;
        }

        return $approvers
            ->filter(fn (User $approver): bool => $this->employees->canViewEmployee($approver, $requestEmployee))
            ->values();
    }

    private function firstRequiredStep(ApprovalWorkflow $workflow): int
    {
        $step = $workflow->steps()->where('is_required', true)->orderBy('step_order')->first()
            ?? $workflow->steps()->orderBy('step_order')->first();

        return $step?->step_order ?? 1;
    }

    private function nextStep(ApprovalRequest $approval): ?ApprovalStep
    {
        return ApprovalStep::query()
            ->where('approval_workflow_id', $approval->approval_workflow_id)
            ->where('step_order', '>', $approval->current_step)
            ->orderBy('step_order')
            ->first();
    }

    private function matchesWorkflowScope(User $actor, ApprovalRequest $approval): bool
    {
        $workflow = $approval->workflow;

        if (! $workflow) {
            return false;
        }

        $requestEmployee = $approval->employee;

        if ($requestEmployee === null) {
            return false;
        }

        $requestDirectionId = $requestEmployee->direction_id
            ?? $requestEmployee->department?->direction_id;

        if (
            $workflow->department_id !== null
            && (int) $workflow->department_id !== (int) $requestEmployee->department_id
        ) {
            return false;
        }

        if (
            $workflow->direction_id !== null
            && (int) $workflow->direction_id !== (int) $requestDirectionId
        ) {
            return false;
        }

        if ($actor->hasRole('administrateur') || $actor->hasRole('rh')) {
            return true;
        }

        $approverEmployee = $actor->employee;

        if ($approverEmployee === null) {
            return false;
        }

        if ($workflow->department_id !== null) {
            $approverDirectionId = $approverEmployee->direction_id
                ?? $approverEmployee->department?->direction_id;

            if ($actor->hasRole('direction')) {
                return (int) $approverDirectionId === (int) $requestDirectionId;
            }

            return $actor->hasRole('responsable')
                && (int) $approverEmployee->department_id === (int) $workflow->department_id;
        }

        if ($workflow->direction_id !== null) {
            $approverDirectionId = $approverEmployee->direction_id
                ?? $approverEmployee->department?->direction_id;

            return (int) $approverDirectionId === (int) $workflow->direction_id;
        }

        return true;
    }
}
