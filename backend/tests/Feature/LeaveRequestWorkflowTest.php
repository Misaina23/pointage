<?php

namespace Tests\Feature;

use App\Enums\Decision;
use App\Models\ApprovalWorkflow;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Role;
use App\Services\AuditService;
use App\Services\RequestDecisionService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Mockery;
use RuntimeException;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class LeaveRequestWorkflowTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_personnel_submits_a_leave_request_and_it_enters_the_first_approval_step(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $token = $this->token('personnel', $employee);
        $leaveType = $this->leaveType();

        $response = $this->withToken($token)->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-16',
            'reason' => 'Congé annuel',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.requested_days', 5);

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('approval_requests', [
            'employee_id' => $employee->id,
            'current_step' => 1,
            'status' => 'pending',
        ]);
    }

    public function test_security_user_can_submit_a_personal_leave_request(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $token = $this->token('securite', $employee);
        $leaveType = $this->leaveType();

        $this->withToken($token)->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé personnel',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.employee.id', $employee->id);

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'pending',
        ]);
    }

    public function test_non_hr_leave_request_is_approved_directly_by_hr(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();

        $token = $this->token('personnel', $employee);
        $leaveId = $this->withToken($token)->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->json('data.id');

        $approvalId = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest->id;

        $this->withToken($this->token('responsable'))
            ->postJson("/api/v1/approvals/{$approvalId}/decide", [
                'decision' => 'approved',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('approval_request');

        $rhToken = $this->token('rh');
        $this->withToken($rhToken)->postJson("/api/v1/approvals/{$approvalId}/decide", [
            'decision' => 'approved',
        ])->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveId,
            'status' => 'approved',
        ]);
    }

    public function test_hr_leave_request_is_approved_by_direction(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();
        $leaveId = $this->withToken($this->token('rh', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé RH',
        ])->assertCreated()->json('data.id');

        $approval = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest;
        $this->assertSame(
            'direction',
            $approval->workflow->steps()->firstOrFail()->approverRole()->value('slug'),
        );

        $this->withToken($this->token('rh'))
            ->postJson("/api/v1/approvals/{$approval->id}/decide", ['decision' => 'approved'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('approval_request');

        $directionApprover = $this->makeEmployee();
        $this->withToken($this->token('direction', $directionApprover))
            ->postJson("/api/v1/approvals/{$approval->id}/decide", ['decision' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_request_owner_cannot_approve_their_own_leave_request(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $requester = $this->tokenFor('rh', $employee);
        $requester->roles()->attach(Role::query()->where('slug', 'direction')->firstOrFail());
        $token = $requester->createToken('test-terminal')->plainTextToken;
        $leaveType = $this->leaveType();

        $leaveId = $this->withToken($token)->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé personnel',
        ])->assertCreated()->json('data.id');
        $approval = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest;

        $this->withToken($token)
            ->postJson("/api/v1/approvals/{$approval->id}/decide", ['decision' => 'approved'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('approval_request');

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveId,
            'status' => 'pending',
        ]);
        $this->assertDatabaseCount('approval_actions', 0);
    }

    public function test_stale_approval_decision_cannot_apply_a_completed_request_twice(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();
        $leaveId = $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->assertCreated()->json('data.id');
        $approval = LeaveRequest::query()
            ->findOrFail($leaveId)
            ->approvalRequest()
            ->with(['employee', 'workflow', 'requestable'])
            ->firstOrFail();
        $staleApproval = clone $approval;
        $approver = $this->tokenFor('rh');
        $decisions = app(RequestDecisionService::class);

        $decisions->decide($approval, $approver, Decision::Approved);

        try {
            $decisions->decide($staleApproval, $approver, Decision::Approved);
            $this->fail('A stale decision must not be applied after the request is completed.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('approval_request', $exception->errors());
        }

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveId,
            'status' => 'approved',
        ]);
        $this->assertDatabaseCount('approval_actions', 1);
    }

    public function test_leave_approval_rolls_back_if_audit_recording_fails(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();
        $balance = LeaveBalance::query()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'allocated_days' => 30,
            'used_days' => 0,
        ]);
        $leaveId = $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->assertCreated()->json('data.id');
        $approvalId = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest->id;
        $notificationCount = $employee->user->notifications()->count();
        $audit = Mockery::mock(AuditService::class);
        $audit->shouldReceive('record')
            ->once()
            ->andThrow(new RuntimeException('Audit storage unavailable.'));
        $this->app->instance(AuditService::class, $audit);

        $this->withToken($this->token('rh'))
            ->postJson("/api/v1/approvals/{$approvalId}/decide", ['decision' => 'approved'])
            ->assertServerError();

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveId,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('approval_requests', [
            'id' => $approvalId,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('leave_balances', [
            'id' => $balance->id,
            'used_days' => 0,
        ]);
        $this->assertDatabaseCount('approval_actions', 0);
        $this->assertSame($notificationCount, $employee->user->fresh()->notifications()->count());
    }

    public function test_rejection_ends_the_workflow_and_notifies_the_employee(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();

        $token = $this->token('personnel', $employee);
        $leaveId = $this->withToken($token)->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->json('data.id');

        $approvalId = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest->id;

        $this->withToken($this->token('rh'))
            ->postJson("/api/v1/approvals/{$approvalId}/decide", [
                'decision' => 'rejected',
                'comment' => 'Période chargée',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('leave_requests', ['id' => $leaveId, 'status' => 'rejected']);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $employee->user->id]);
    }

    public function test_user_cannot_approve_outside_of_their_step(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();

        $leaveId = $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->json('data.id');

        $approvalId = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest->id;

        $this->withToken($this->token('responsable'))
            ->postJson("/api/v1/approvals/{$approvalId}/decide", ['decision' => 'approved'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('approval_request');
    }

    public function test_pending_approvals_are_listed_for_the_approver(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();

        $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->assertCreated();

        $this->withToken($this->token('rh'))
            ->getJson('/api/v1/approvals')
            ->assertOk()
            ->assertJsonPath('data.0.employee.id', $employee->id)
            ->assertJsonPath('data.0.current_step_detail.order', 1);
    }

    public function test_leave_request_is_refused_when_dates_are_inverted(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();

        $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-16',
            'ends_on' => '2026-10-12',
            'reason' => 'Congé annuel',
        ])->assertUnprocessable();
    }

    public function test_balance_is_consumed_only_once_the_request_is_fully_approved(): void
    {
        $this->seedWorkflows();
        $employee = $this->makeEmployee();
        $leaveType = $this->leaveType();

        LeaveBalance::query()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'year' => 2026,
            'allocated_days' => 30,
            'used_days' => 0,
        ]);

        $leaveId = $this->withToken($this->token('personnel', $employee))->postJson('/api/v1/leaves', [
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-13',
            'reason' => 'Congé annuel',
        ])->json('data.id');

        $approvalId = LeaveRequest::query()->findOrFail($leaveId)->approvalRequest->id;

        $this->withToken($this->token('rh'))
            ->postJson("/api/v1/approvals/{$approvalId}/decide", ['decision' => 'approved'])
            ->assertOk();

        $this->assertDatabaseHas('leave_balances', [
            'employee_id' => $employee->id,
            'used_days' => 2,
        ]);
    }

    private function seedWorkflows(): void
    {
        $this->seed(RoleSeeder::class);

        $workflow = ApprovalWorkflow::query()->create([
            'name' => 'Circuit congé test',
            'request_type' => 'leave',
            'is_active' => true,
        ]);

        $workflow->steps()->create([
            'step_order' => 1,
            'name' => 'RH',
            'approver_role_id' => Role::query()->where('slug', 'rh')->value('id'),
        ]);

        $rhWorkflow = ApprovalWorkflow::query()->create([
            'name' => 'Circuit congé RH test',
            'request_type' => 'leave',
            'is_active' => true,
        ]);
        $rhWorkflow->steps()->create([
            'step_order' => 1,
            'name' => 'Direction générale',
            'approver_role_id' => Role::query()->where('slug', 'direction')->value('id'),
        ]);
    }

    private function leaveType(): LeaveType
    {
        return LeaveType::query()->firstOrCreate(
            ['code' => 'annuel'],
            [
                'name' => 'Congé annuel',
                'is_paid' => true,
            ],
        );
    }
}
