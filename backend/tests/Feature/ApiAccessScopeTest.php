<?php

namespace Tests\Feature;

use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflow;
use App\Models\Attendance;
use App\Models\AttendanceEvent;
use App\Models\Department;
use App\Models\Direction;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Permission;
use App\Models\Role;
use App\Services\ApprovalService;
use Database\Seeders\ReferenceDataSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class ApiAccessScopeTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_personnel_attendance_reads_are_limited_to_their_own_records(): void
    {
        $this->seed(RoleSeeder::class);
        $employee = $this->makeEmployee();
        $otherEmployee = $this->makeEmployee();
        $this->createAttendanceAndEvent($employee);
        $this->createAttendanceAndEvent($otherEmployee);
        $token = $this->token('personnel', $employee);

        $this->withToken($token)
            ->getJson('/api/v1/attendance/today')
            ->assertOk()
            ->assertJsonCount(1, 'attendances')
            ->assertJsonPath('attendances.0.employee_id', $employee->id)
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.employee.id', $employee->id);

        $this->withToken($token)
            ->getJson('/api/v1/attendance/events')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.employee.id', $employee->id);

        $this->withToken($token)
            ->getJson('/api/v1/attendance?employee_id='.$otherEmployee->id)
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_security_scan_role_can_still_view_the_team_attendance_dashboard(): void
    {
        $this->seed(RoleSeeder::class);
        $employee = $this->makeEmployee();
        $otherEmployee = $this->makeEmployee();
        $this->createAttendanceAndEvent($employee);
        $this->createAttendanceAndEvent($otherEmployee);
        $token = $this->token('securite');

        $this->withToken($token)
            ->getJson('/api/v1/attendance/today')
            ->assertOk()
            ->assertJsonCount(2, 'attendances')
            ->assertJsonCount(2, 'events');
    }

    public function test_responsable_employee_and_request_reads_are_limited_to_direct_reports(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(ReferenceDataSeeder::class);
        $manager = $this->makeEmployee();
        $report = $this->makeEmployee(['manager_id' => $manager->id]);
        $unrelatedEmployee = $this->makeEmployee();
        $leaveType = LeaveType::query()->where('code', 'annuel')->firstOrFail();
        $reportRequest = $this->createLeaveRequest($report, $leaveType);
        $unrelatedRequest = $this->createLeaveRequest($unrelatedEmployee, $leaveType);
        $token = $this->token('responsable', $manager);

        $this->withToken($token)
            ->getJson('/api/v1/employees')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $manager->id])
            ->assertJsonFragment(['id' => $report->id])
            ->assertJsonMissing(['id' => $unrelatedEmployee->id]);

        $this->withToken($token)
            ->getJson('/api/v1/leaves')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.employee.id', $report->id);

        $this->withToken($token)
            ->getJson("/api/v1/leaves/{$unrelatedRequest->id}")
            ->assertForbidden();

        $this->withToken($token)
            ->getJson("/api/v1/leaves/{$reportRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.employee.id', $report->id);
    }

    public function test_direction_employee_reads_are_limited_to_their_direction(): void
    {
        $this->seed(RoleSeeder::class);
        $directionEmployee = $this->makeEmployee();
        $directionId = $directionEmployee->department->direction_id;
        $sameDirectionEmployee = $this->makeEmployee(['direction_id' => $directionId]);
        $otherDirection = Direction::query()->create([
            'name' => 'Autre direction',
            'code' => 'DIR-'.Str::upper(Str::random(6)),
        ]);
        $otherDepartment = Department::query()->create([
            'direction_id' => $otherDirection->id,
            'name' => 'Autre département',
            'code' => 'DEP-'.Str::upper(Str::random(6)),
        ]);
        $otherEmployee = $this->makeEmployee([
            'department_id' => $otherDepartment->id,
            'direction_id' => $otherDirection->id,
        ]);
        $token = $this->token('direction', $directionEmployee);

        $this->withToken($token)
            ->getJson('/api/v1/employees')
            ->assertOk()
            ->assertJsonFragment(['id' => $directionEmployee->id])
            ->assertJsonFragment(['id' => $sameDirectionEmployee->id])
            ->assertJsonMissing(['id' => $otherEmployee->id]);
    }

    public function test_direction_employee_management_is_limited_to_their_direction(): void
    {
        $this->seed(RoleSeeder::class);
        $directionEmployee = $this->makeEmployee();
        $directionId = $directionEmployee->department->direction_id;
        $sameDirectionEmployee = $this->makeEmployee(['direction_id' => $directionId]);
        $otherDirection = Direction::query()->create([
            'name' => 'Direction non autorisée',
            'code' => 'DIR-'.Str::upper(Str::random(6)),
        ]);
        $otherDepartment = Department::query()->create([
            'direction_id' => $otherDirection->id,
            'name' => 'Département non autorisé',
            'code' => 'DEP-'.Str::upper(Str::random(6)),
        ]);
        $otherEmployee = $this->makeEmployee([
            'department_id' => $otherDepartment->id,
            'direction_id' => $otherDirection->id,
        ]);
        $directionRole = Role::query()->where('slug', 'direction')->firstOrFail();
        $managePermission = Permission::query()->where('name', 'employees.manage')->firstOrFail();
        $directionRole->permissions()->attach($managePermission);
        $token = $this->token('direction', $directionEmployee);

        $this->withToken($token)
            ->patchJson('/api/v1/employees/'.$sameDirectionEmployee->id, [
                'employee_number' => $sameDirectionEmployee->employee_number,
                'first_name' => 'Prénom modifié',
                'last_name' => $sameDirectionEmployee->last_name,
                'status' => 'active',
                'department_id' => $sameDirectionEmployee->department_id,
            ])
            ->assertOk();

        $this->withToken($token)
            ->patchJson('/api/v1/employees/'.$otherEmployee->id, [
                'employee_number' => $otherEmployee->employee_number,
                'first_name' => 'Modification interdite',
                'last_name' => $otherEmployee->last_name,
                'status' => 'active',
                'department_id' => $otherEmployee->department_id,
                'direction_id' => $otherEmployee->direction_id,
            ])
            ->assertForbidden();

        $this->withToken($token)
            ->patchJson('/api/v1/employees/'.$sameDirectionEmployee->id, [
                'employee_number' => $sameDirectionEmployee->employee_number,
                'first_name' => 'Réaffectation interdite',
                'last_name' => $sameDirectionEmployee->last_name,
                'status' => 'active',
                'direction_id' => $otherDirection->id,
                'department_id' => null,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('direction_id');

        $this->withToken($token)
            ->postJson('/api/v1/employees', [
                'employee_number' => 'EMP-OTHER-DIRECTION',
                'first_name' => 'Nouvel',
                'last_name' => 'Employé',
                'status' => 'active',
                'direction_id' => $otherDirection->id,
                'is_top_level' => true,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('direction_id');

        $this->withToken($token)
            ->deleteJson('/api/v1/employees/'.$otherEmployee->id)
            ->assertForbidden();

        $this->assertDatabaseHas('employees', [
            'id' => $sameDirectionEmployee->id,
            'first_name' => 'Prénom modifié',
        ]);
        $this->assertDatabaseHas('employees', [
            'id' => $otherEmployee->id,
            'first_name' => 'Jean',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('employees', [
            'id' => $sameDirectionEmployee->id,
            'department_id' => $sameDirectionEmployee->department_id,
        ]);
    }

    public function test_responsable_cannot_assign_a_direct_report_outside_their_department(): void
    {
        $this->seed(RoleSeeder::class);
        $manager = $this->makeEmployee();
        $report = $this->makeEmployee([
            'department_id' => $manager->department_id,
            'direction_id' => null,
            'manager_id' => $manager->id,
        ]);
        $otherDepartment = Department::query()->create([
            'direction_id' => $manager->department->direction_id,
            'name' => 'Autre département de la direction',
            'code' => 'DEP-'.Str::upper(Str::random(6)),
        ]);
        $responsableRole = Role::query()->where('slug', 'responsable')->firstOrFail();
        $managePermission = Permission::query()->where('name', 'employees.manage')->firstOrFail();
        $responsableRole->permissions()->attach($managePermission);
        $token = $this->token('responsable', $manager);

        $this->withToken($token)
            ->patchJson('/api/v1/employees/'.$report->id, [
                'employee_number' => $report->employee_number,
                'first_name' => $report->first_name,
                'last_name' => $report->last_name,
                'status' => 'active',
                'department_id' => $otherDepartment->id,
                'manager_id' => $manager->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('department_id');

        $this->withToken($token)
            ->postJson('/api/v1/employees', [
                'employee_number' => 'EMP-OUTSIDE-TEAM',
                'first_name' => 'Nouvel',
                'last_name' => 'Employé',
                'status' => 'active',
                'department_id' => $otherDepartment->id,
                'manager_id' => $manager->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('department_id');

        $this->assertDatabaseHas('employees', [
            'id' => $report->id,
            'department_id' => $manager->department_id,
            'manager_id' => $manager->id,
        ]);
        $this->assertDatabaseMissing('employees', ['employee_number' => 'EMP-OUTSIDE-TEAM']);
    }

    public function test_responsable_cannot_decide_approval_for_an_unrelated_employee(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(ReferenceDataSeeder::class);
        $manager = $this->makeEmployee();
        $report = $this->makeEmployee(['manager_id' => $manager->id]);
        $unrelatedEmployee = $this->makeEmployee();
        $leaveType = LeaveType::query()->where('code', 'annuel')->firstOrFail();
        $leaveRequest = $this->createLeaveRequest($unrelatedEmployee, $leaveType);
        $workflow = ApprovalWorkflow::query()->create([
            'name' => 'Circuit responsable scope test',
            'request_type' => 'leave',
            'is_active' => true,
        ]);
        $workflow->steps()->create([
            'step_order' => 1,
            'name' => 'Responsable',
            'approver_role_id' => Role::query()->where('slug', 'responsable')->value('id'),
        ]);
        $approval = ApprovalRequest::query()->create([
            'approval_workflow_id' => $workflow->id,
            'employee_id' => $unrelatedEmployee->id,
            'requestable_type' => $leaveRequest->getMorphClass(),
            'requestable_id' => $leaveRequest->id,
            'current_step' => 1,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);
        $managerUser = $this->tokenFor('responsable', $manager);
        $this->tokenFor('responsable', $report);
        $outsiderToken = $this->token('responsable', $this->makeEmployee());

        $this->assertFalse(app(ApprovalService::class)->canAct($managerUser, $approval));
        $this->withToken($outsiderToken)
            ->postJson("/api/v1/approvals/{$approval->id}/decide", ['decision' => 'approved'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('approval_request');

        $this->assertDatabaseHas('approval_requests', [
            'id' => $approval->id,
            'status' => 'pending',
        ]);
    }

    public function test_responsable_cannot_approve_a_direct_report_outside_the_workflows_department(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(ReferenceDataSeeder::class);
        $manager = $this->makeEmployee();
        $managerDepartment = $manager->department;
        $otherDepartment = Department::query()->create([
            'direction_id' => $managerDepartment->direction_id,
            'name' => 'Département du rapport',
            'code' => 'DEP-'.Str::upper(Str::random(6)),
        ]);
        $report = $this->makeEmployee([
            'department_id' => $otherDepartment->id,
            'manager_id' => $manager->id,
        ]);
        $leaveType = LeaveType::query()->where('code', 'annuel')->firstOrFail();
        $leaveRequest = $this->createLeaveRequest($report, $leaveType);
        $workflow = ApprovalWorkflow::query()->create([
            'name' => 'Circuit département distinct test',
            'request_type' => 'leave',
            'department_id' => $otherDepartment->id,
            'is_active' => true,
        ]);
        $workflow->steps()->create([
            'step_order' => 1,
            'name' => 'Responsable',
            'approver_role_id' => Role::query()->where('slug', 'responsable')->value('id'),
        ]);
        $approval = ApprovalRequest::query()->create([
            'approval_workflow_id' => $workflow->id,
            'employee_id' => $report->id,
            'requestable_type' => $leaveRequest->getMorphClass(),
            'requestable_id' => $leaveRequest->id,
            'current_step' => 1,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);
        $managerUser = $this->tokenFor('responsable', $manager);

        $this->assertFalse(app(ApprovalService::class)->canAct($managerUser, $approval));
    }

    private function createAttendanceAndEvent(Employee $employee): void
    {
        Attendance::query()->create([
            'employee_id' => $employee->id,
            'attendance_date' => now()->toDateString(),
            'first_entry' => '08:00:00',
            'status' => 'present',
        ]);
        AttendanceEvent::query()->create([
            'employee_id' => $employee->id,
            'client_event_id' => Str::uuid()->toString(),
            'event_type' => 'entry',
            'occurred_at' => now(),
        ]);
    }

    private function createLeaveRequest(Employee $employee, LeaveType $leaveType): LeaveRequest
    {
        return LeaveRequest::query()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-12',
            'requested_days' => 1,
            'reason' => 'Demande de test',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);
    }
}
