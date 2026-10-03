<?php

namespace App\Services;

use App\Enums\Decision;
use App\Enums\NotificationType;
use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\ApprovalRequest;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaveService
{
    public function __construct(
        private readonly ScheduleService $schedules,
        private readonly ApprovalService $approvals,
        private readonly NotificationService $notifications,
    ) {}

    /**
     * Crée une demande de congé et démarre son circuit de validation.
     */
    /**
     * Crée une demande de congé et démarre son circuit de validation.
     *
     * @param  array{leave_type_id: int, starts_on: string, ends_on: string, reason: string, attachment_path?: string|null}  $data
     */
    public function create(Employee $employee, array $data): LeaveRequest
    {
        $startsOn = CarbonImmutable::parse($data['starts_on'])->startOfDay();
        $endsOn = CarbonImmutable::parse($data['ends_on'])->startOfDay();

        if ($endsOn->lessThan($startsOn)) {
            throw ValidationException::withMessages([
                'ends_on' => 'La date de fin doit être postérieure à la date de début.',
            ]);
        }

        $days = $this->schedules->countWorkingDays($startsOn, $endsOn);

        if ($days < 1) {
            throw ValidationException::withMessages([
                'ends_on' => 'La période sélectionnée ne contient aucun jour ouvré.',
            ]);
        }

        $this->ensureSufficientBalance($employee, (int) $startsOn->year, $days);

        return DB::transaction(function () use ($employee, $data, $startsOn, $endsOn, $days): LeaveRequest {
            $request = LeaveRequest::query()->create([
                'employee_id' => $employee->id,
                'leave_type_id' => $data['leave_type_id'],
                'starts_on' => $startsOn->toDateString(),
                'ends_on' => $endsOn->toDateString(),
                'requested_days' => $days,
                'reason' => $data['reason'],
                'attachment_path' => $data['attachment_path'] ?? null,
                'status' => RequestStatus::Pending->value,
                'submitted_at' => now(),
            ]);

            $approval = $this->approvals->start(RequestType::Leave, $request);

            if ($approval) {
                $this->notifyApprovers($approval, $employee);
            }

            return $request->load('leaveType');
        });
    }

    public function approve(ApprovalRequest $approval, User $actor, ?string $comment = null): ApprovalRequest
    {
        $request = $approval->requestable;
        $completed = $this->approvals->decide($approval, $actor, Decision::Approved, $comment);

        if ($completed->status === RequestStatus::Approved->value) {
            $this->consumeBalance($request);
            $this->notifications->notifyAboutRequest(
                $request,
                NotificationType::LeaveApproved,
                'Votre demande de congé a été approuvée.',
            );
        }

        return $completed;
    }

    public function reject(ApprovalRequest $approval, User $actor, ?string $comment = null): ApprovalRequest
    {
        $request = $approval->requestable;
        $completed = $this->approvals->decide($approval, $actor, Decision::Rejected, $comment);

        if ($completed->status === RequestStatus::Rejected->value) {
            $this->notifications->notifyAboutRequest(
                $request,
                NotificationType::LeaveRejected,
                'Votre demande de congé a été refusée.'.($comment !== null ? ' Motif : '.$comment : ''),
            );
        }

        return $completed;
    }

    public function annualBalanceFor(Employee $employee, int $year): LeaveBalance
    {
        $annualLeaveType = LeaveType::query()->where('code', 'annuel')->first();

        if (! $annualLeaveType) {
            throw ValidationException::withMessages([
                'leave_type_id' => 'Le type de congé annuel doit être configuré avant de gérer les soldes.',
            ]);
        }

        return LeaveBalance::query()->firstOrCreate(
            [
                'employee_id' => $employee->id,
                'leave_type_id' => $annualLeaveType->id,
                'year' => $year,
            ],
            [
                'allocated_days' => 60,
                'used_days' => 0,
            ],
        );
    }

    public function remainingDays(LeaveBalance $balance): float
    {
        return round((float) $balance->allocated_days - (float) $balance->used_days, 2);
    }

    public function consumeAnnualBalance(Employee $employee, int $year, float $days): void
    {
        if ($days <= 0) {
            return;
        }

        $balance = $this->annualBalanceFor($employee, $year);
        $balance->forceFill([
            'used_days' => round((float) $balance->used_days + $days, 2),
        ])->save();
    }

    private function ensureSufficientBalance(Employee $employee, int $year, int $days): void
    {
        $balance = $this->annualBalanceFor($employee, $year);
        $pendingDays = (float) LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', RequestStatus::Pending->value)
            ->whereYear('starts_on', $year)
            ->sum('requested_days');
        $availableDays = $this->remainingDays($balance) - $pendingDays;

        if ($availableDays < $days) {
            throw ValidationException::withMessages([
                'leave_type_id' => sprintf(
                    'Solde insuffisant : %.2f jour(s) disponible(s) pour %s.',
                    max(0, $availableDays),
                    (float) $days,
                ),
            ]);
        }
    }

    private function consumeBalance(LeaveRequest $request): void
    {
        $this->consumeAnnualBalance(
            $request->employee,
            (int) $request->starts_on->year,
            (float) $request->requested_days,
        );
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
            sprintf('Demande de congé à valider : %s %s', $employee->first_name, $employee->last_name),
            ['approval_request_id' => $approval->id, 'request_type' => RequestType::Leave->value],
        );
    }
}
