<?php

namespace Tests\Feature;

use App\Models\ApprovalWorkflow;
use App\Models\Employee;
use App\Models\EmployeeWorkSchedule;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\PermissionRequest;
use App\Models\PermissionType;
use App\Models\Role;
use Database\Seeders\ReferenceDataSeeder;
use Database\Seeders\RoleSeeder;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class PermissionQuotaTest extends TestCase
{
    use InteractsWithPointaData;

    public function test_two_permission_days_are_free_and_excess_is_deducted_from_annual_leave(): void
    {
        $this->preparePermissionWorkflow();
        $employee = $this->makeEmployee();
        $this->assignStandardSchedule($employee->id);
        $leaveType = $this->annualLeaveType();

        foreach (['2026-10-12', '2026-10-13'] as $date) {
            $permission = $this->submitPermission($employee, $date);
            $this->approvePermission($permission);
        }

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'allocated_days' => 60,
            'used_days' => 0,
        ]);

        $thirdPermission = $this->submitPermission($employee, '2026-10-14');
        $this->assertSame(1.0, (float) $thirdPermission->requested_days);
        $this->approvePermission($thirdPermission);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'used_days' => 1,
        ]);
    }

    public function test_excess_permission_days_are_blocked_when_annual_leave_balance_is_insufficient(): void
    {
        $this->preparePermissionWorkflow();
        $employee = $this->makeEmployee();
        $this->assignStandardSchedule($employee->id);
        $leaveType = $this->annualLeaveType();
        LeaveBalance::query()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'allocated_days' => 60,
            'used_days' => 60,
        ]);

        foreach (['2026-10-12', '2026-10-13'] as $date) {
            $this->approvePermission($this->submitPermission($employee, $date));
        }

        $this->withToken($this->token('personnel', $employee))
            ->postJson('/api/v1/permissions', [
                'permission_type_id' => PermissionType::query()->value('id'),
                'permission_date' => '2026-10-14',
                'starts_at' => '08:00',
                'ends_at' => '17:00',
                'reason' => 'Permission supplémentaire',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('permission_type_id');
    }

    public function test_permission_hours_are_converted_to_fractional_workdays_before_using_the_allowance(): void
    {
        $this->preparePermissionWorkflow();
        $employee = $this->makeEmployee();
        $this->assignStandardSchedule($employee->id);

        $morningPermission = $this->submitPermission($employee, '2026-10-12', '08:00', '12:00');
        $this->assertSame(0.5, (float) $morningPermission->requested_days);
        $this->approvePermission($morningPermission);

        $afternoonPermission = $this->submitPermission($employee, '2026-10-13', '13:00', '17:00');
        $this->assertSame(0.5, (float) $afternoonPermission->requested_days);
        $this->approvePermission($afternoonPermission);

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'year' => 2026,
            'used_days' => 0,
        ]);
    }

    public function test_my_leave_balance_includes_sixty_days_and_the_permission_quota(): void
    {
        $this->preparePermissionWorkflow();
        $employee = $this->makeEmployee();
        $this->annualLeaveType();
        $token = $this->token('personnel', $employee);

        $this->withToken($token)
            ->getJson('/api/v1/me/leave-balances?year=2026')
            ->assertOk()
            ->assertJsonPath('data.0.allocated_days', 60)
            ->assertJsonPath('permission_allowance.allocated_days', 2)
            ->assertJsonPath('permission_allowance.remaining_days', 2);
    }

    private function preparePermissionWorkflow(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(ReferenceDataSeeder::class);

        $workflow = ApprovalWorkflow::query()->create([
            'name' => 'Circuit permission test',
            'request_type' => 'permission',
            'is_active' => true,
        ]);
        $workflow->steps()->create([
            'step_order' => 1,
            'name' => 'Ressources humaines',
            'approver_role_id' => Role::query()->where('slug', 'rh')->value('id'),
        ]);
    }

    private function annualLeaveType(): LeaveType
    {
        return LeaveType::query()->where('code', 'annuel')->firstOrFail();
    }

    private function assignStandardSchedule(int $employeeId): void
    {
        $schedule = $this->makeStandardSchedule();
        EmployeeWorkSchedule::query()->create([
            'employee_id' => $employeeId,
            'work_schedule_id' => $schedule->id,
            'starts_on' => '2026-01-01',
            'ends_on' => null,
        ]);
    }

    private function submitPermission(
        Employee $employee,
        string $date,
        string $startsAt = '08:00',
        string $endsAt = '17:00',
    ): PermissionRequest {
        $response = $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/permissions', [
            'permission_type_id' => PermissionType::query()->where('code', 'personnelle')->value('id'),
            'permission_date' => $date,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'reason' => 'Permission annuelle',
        ])->assertCreated();

        return PermissionRequest::query()->findOrFail($response->json('data.id'));
    }

    private function approvePermission(PermissionRequest $permission): void
    {
        $approval = $permission->approvalRequest()->firstOrFail();

        $this->withToken($this->token('rh'))
            ->postJson("/api/v1/approvals/{$approval->id}/decide", ['decision' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }
}
