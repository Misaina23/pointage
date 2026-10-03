<?php

namespace App\Services;

use App\Enums\Decision;
use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\AbsenceRecord;
use App\Models\ApprovalRequest;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RequestDecisionService
{
    public function __construct(
        private readonly ApprovalService $approvals,
        private readonly LeaveService $leaves,
        private readonly PermissionService $permissions,
        private readonly AbsenceService $absences,
        private readonly AuditService $audit,
    ) {}

    /**
     * Applique une décision de validation sur n'importe quel type de demande.
     */
    public function decide(ApprovalRequest $approval, User $actor, Decision $decision, ?string $comment = null): ApprovalRequest
    {
        return DB::transaction(function () use ($approval, $actor, $decision, $comment): ApprovalRequest {
            if (! $this->approvals->canAct($actor, $approval)) {
                throw ValidationException::withMessages([
                    'approval_request' => 'Vous n\'êtes pas autorisé à traiter cette demande à cette étape.',
                ]);
            }

            $type = $this->typeFor($approval);
            $request = $approval->requestable;

            $completed = match ([$type, $decision]) {
                [RequestType::Leave, Decision::Approved] => $this->leaves->approve($approval, $actor, $comment),
                [RequestType::Leave, Decision::Rejected] => $this->leaves->reject($approval, $actor, $comment),
                [RequestType::Permission, Decision::Approved] => $this->permissions->approve($approval, $actor, $comment),
                [RequestType::Permission, Decision::Rejected] => $this->permissions->reject($approval, $actor, $comment),
                [RequestType::Absence, Decision::Approved] => $this->absences->approve($approval, $actor, $comment),
                [RequestType::Absence, Decision::Rejected] => $this->absences->reject($approval, $actor, $comment),
                default => throw ValidationException::withMessages([
                    'approval_request' => 'Décision non prise en charge pour ce type de demande.',
                ]),
            };

            if ($completed->status !== RequestStatus::Pending->value && $request !== null) {
                $this->audit->record(
                    'APPROVE_'.strtoupper($type->name).($decision === Decision::Rejected ? '_REJECT' : ''),
                    $request,
                    ['status' => RequestStatus::Pending->value],
                    ['status' => $completed->status],
                );
            }

            return $completed;
        });
    }

    public function pendingFor(User $actor): Collection
    {
        return $this->approvals->pendingApprovalsFor($actor);
    }

    private function typeFor(ApprovalRequest $approval): RequestType
    {
        return match ($approval->requestable_type) {
            LeaveRequest::class => RequestType::Leave,
            PermissionRequest::class => RequestType::Permission,
            AbsenceRecord::class => RequestType::Absence,
            default => throw ValidationException::withMessages([
                'approval_request' => 'Type de demande inconnu.',
            ]),
        };
    }
}
