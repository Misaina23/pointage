<?php

namespace App\Services;

use App\Enums\Decision;
use App\Enums\NotificationType;
use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\AbsenceRecord;
use App\Models\ApprovalRequest;
use App\Models\Employee;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AbsenceService
{
    public function __construct(
        private readonly ApprovalService $approvals,
        private readonly NotificationService $notifications,
    ) {}

    /**
     * @param  array{absence_type_id: int, starts_on: string, ends_on?: string|null, reason?: string|null, attachment_path?: string|null}  $data
     */
    public function create(Employee $employee, array $data): AbsenceRecord
    {
        $startsOn = CarbonImmutable::parse($data['starts_on'])->startOfDay();
        $endsOn = isset($data['ends_on']) && $data['ends_on'] !== null
            ? CarbonImmutable::parse($data['ends_on'])->startOfDay()
            : $startsOn;

        if ($endsOn->lessThan($startsOn)) {
            throw ValidationException::withMessages([
                'ends_on' => 'La date de fin doit être postérieure à la date de début.',
            ]);
        }

        return DB::transaction(function () use ($employee, $data, $startsOn, $endsOn): AbsenceRecord {
            $record = AbsenceRecord::query()->create([
                'employee_id' => $employee->id,
                'absence_type_id' => $data['absence_type_id'],
                'starts_on' => $startsOn->toDateString(),
                'ends_on' => $endsOn->toDateString(),
                'reason' => $data['reason'] ?? null,
                'attachment_path' => $data['attachment_path'] ?? null,
                'status' => RequestStatus::Pending->value,
            ]);

            $approval = $this->approvals->start(RequestType::Absence, $record);

            if ($approval) {
                $this->notifyApprovers($approval, $employee);
            }

            return $record->load('absenceType');
        });
    }

    public function approve(ApprovalRequest $approval, User $actor, ?string $comment = null): ApprovalRequest
    {
        $record = $approval->requestable;
        $completed = $this->approvals->decide($approval, $actor, Decision::Approved, $comment);

        if ($completed->status === RequestStatus::Approved->value) {
            $this->notifications->notifyAboutRequest(
                $record,
                NotificationType::AbsenceRecorded,
                'Votre absence a été enregistrée.',
            );
        }

        return $completed;
    }

    public function reject(ApprovalRequest $approval, User $actor, ?string $comment = null): ApprovalRequest
    {
        $record = $approval->requestable;
        $completed = $this->approvals->decide($approval, $actor, Decision::Rejected, $comment);

        if ($completed->status === RequestStatus::Rejected->value) {
            $this->notifications->notifyAboutRequest(
                $record,
                NotificationType::AbsenceDetected,
                'Votre déclaration d\'absence a été refusée.'.($comment !== null ? ' Motif : '.$comment : ''),
            );
        }

        return $completed;
    }

    private function notifyApprovers(ApprovalRequest $approval, Employee $employee): void
    {
        $step = $this->approvals->currentStep($approval);

        if (! $step) {
            return;
        }

        $this->notifications->notifyUsers(
            $this->approvals->approversFor($step, $employee),
            NotificationType::ApprovalRequired,
            sprintf('Déclaration d\'absence à valider : %s %s', $employee->first_name, $employee->last_name),
            ['approval_request_id' => $approval->id, 'request_type' => RequestType::Absence->value],
        );
    }
}
