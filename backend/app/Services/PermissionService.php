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
use App\Models\PermissionRequest;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PermissionService
{
    private const ANNUAL_PERMISSION_ALLOWANCE_DAYS = 2;

    public function __construct(
        private readonly ApprovalService $approvals,
        private readonly NotificationService $notifications,
        private readonly ScheduleService $schedules,
        private readonly LeaveService $leaves,
    ) {}

    /**
     * @param  array{permission_type_id: int, permission_date: string, starts_at: string, ends_at: string, reason: string, attachment_path?: string|null}  $data
     */
    public function create(Employee $employee, array $data): PermissionRequest
    {
        $startsAt = CarbonImmutable::parse($data['permission_date'].' '.$data['starts_at']);
        $endsAt = CarbonImmutable::parse($data['permission_date'].' '.$data['ends_at']);

        if ($endsAt->lessThanOrEqualTo($startsAt)) {
            throw ValidationException::withMessages([
                'ends_at' => 'L\'heure de retour doit être postérieure à l\'heure de départ.',
            ]);
        }

        $requestedDays = $this->schedules->permissionDays(
            $employee,
            CarbonImmutable::parse($data['permission_date']),
            $data['starts_at'],
            $data['ends_at'],
        );

        return DB::transaction(function () use (
            $employee,
            $data,
            $startsAt,
            $endsAt,
            $requestedDays,
        ): PermissionRequest {
            $this->ensurePermissionAllowance($employee, (int) $startsAt->year, $requestedDays);

            $request = PermissionRequest::query()->create([
                'employee_id' => $employee->id,
                'permission_type_id' => $data['permission_type_id'],
                'permission_date' => $data['permission_date'],
                'starts_at' => $startsAt->format('H:i:s'),
                'ends_at' => $endsAt->format('H:i:s'),
                'requested_days' => $requestedDays,
                'reason' => $data['reason'],
                'attachment_path' => $data['attachment_path'] ?? null,
                'status' => RequestStatus::Pending->value,
                'submitted_at' => now(),
            ]);

            $approval = $this->approvals->start(RequestType::Permission, $request);

            if ($approval) {
                $this->notifyApprovers($approval, $employee);
            }

            return $request->load('permissionType');
        });
    }

    public function approve(ApprovalRequest $approval, User $actor, ?string $comment = null): ApprovalRequest
    {
        $request = $approval->requestable;
        $completed = $this->approvals->decide($approval, $actor, Decision::Approved, $comment);

        if ($completed->status === RequestStatus::Approved->value) {
            $this->deductExceededPermissionDays($request);
            $this->notifications->notifyAboutRequest(
                $request,
                NotificationType::PermissionApproved,
                'Votre demande de permission a été approuvée.',
            );
        }

        return $completed;
    }

    private function ensurePermissionAllowance(Employee $employee, int $year, float $requestedDays): void
    {
        $balance = $this->leaves->annualBalanceFor($employee, $year);
        $balance = LeaveBalance::query()->whereKey($balance->id)->lockForUpdate()->firstOrFail();

        $approvedDays = (float) PermissionRequest::query()
            ->where('employee_id', $employee->id)
            ->whereYear('permission_date', $year)
            ->where('status', RequestStatus::Approved->value)
            ->sum('requested_days');
        $committedDays = (float) PermissionRequest::query()
            ->where('employee_id', $employee->id)
            ->whereYear('permission_date', $year)
            ->whereIn('status', [RequestStatus::Pending->value, RequestStatus::Approved->value])
            ->sum('requested_days');
        $pendingLeaveDays = (float) LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->whereYear('starts_on', $year)
            ->where('status', RequestStatus::Pending->value)
            ->sum('requested_days');

        $currentExcessDays = max(0, $approvedDays - self::ANNUAL_PERMISSION_ALLOWANCE_DAYS);
        $committedExcessDays = max(
            0,
            $committedDays + $requestedDays - self::ANNUAL_PERMISSION_ALLOWANCE_DAYS,
        );
        $additionalDays = $committedExcessDays - $currentExcessDays;
        $availableLeaveDays = $this->leaves->remainingDays($balance) - $pendingLeaveDays;

        if ($additionalDays > $availableLeaveDays) {
            throw ValidationException::withMessages([
                'permission_type_id' => sprintf(
                    'Le quota annuel de 2 jours est dépassé et le solde de congés est insuffisant : %.2f jour(s) disponible(s).',
                    max(0, $availableLeaveDays),
                ),
            ]);
        }
    }

    private function deductExceededPermissionDays(PermissionRequest $request): void
    {
        $approvedDaysBefore = (float) PermissionRequest::query()
            ->where('employee_id', $request->employee_id)
            ->whereYear('permission_date', $request->permission_date->year)
            ->where('status', RequestStatus::Approved->value)
            ->whereKeyNot($request->id)
            ->sum('requested_days');
        $approvedDaysAfter = $approvedDaysBefore + (float) $request->requested_days;
        $deductedDays = max(0, $approvedDaysAfter - self::ANNUAL_PERMISSION_ALLOWANCE_DAYS)
            - max(0, $approvedDaysBefore - self::ANNUAL_PERMISSION_ALLOWANCE_DAYS);

        $this->leaves->consumeAnnualBalance(
            $request->employee,
            (int) $request->permission_date->year,
            $deductedDays,
        );
    }

    public function reject(ApprovalRequest $approval, User $actor, ?string $comment = null): ApprovalRequest
    {
        $request = $approval->requestable;
        $completed = $this->approvals->decide($approval, $actor, Decision::Rejected, $comment);

        if ($completed->status === RequestStatus::Rejected->value) {
            $this->notifications->notifyAboutRequest(
                $request,
                NotificationType::PermissionRejected,
                'Votre demande de permission a été refusée.'.($comment !== null ? ' Motif : '.$comment : ''),
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
            sprintf('Demande de permission à valider : %s %s', $employee->first_name, $employee->last_name),
            ['approval_request_id' => $approval->id, 'request_type' => RequestType::Permission->value],
        );
    }
}
