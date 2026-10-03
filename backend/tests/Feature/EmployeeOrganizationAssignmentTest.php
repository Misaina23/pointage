<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Direction;
use App\Models\Employee;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class EmployeeOrganizationAssignmentTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_employee_can_be_assigned_to_a_direction_or_department_with_a_free_text_position(): void
    {
        $this->seed(RoleSeeder::class);
        $direction = Direction::query()->create([
            'name' => 'Direction test',
            'code' => 'DIR-TEST',
        ]);
        $department = Department::query()->create([
            'direction_id' => $direction->id,
            'name' => 'Département test',
            'code' => 'DEP-TEST',
        ]);
        $manager = Employee::query()->create([
            'direction_id' => $direction->id,
            'employee_number' => 'EMP-MANAGER-BASE',
            'first_name' => 'Responsable',
            'last_name' => 'Direct',
            'status' => 'active',
        ]);
        $token = $this->token('administrateur');
        $commonPayload = [
            'first_name' => 'Jean',
            'last_name' => 'Rakoto',
            'status' => 'active',
            'position_title' => 'Chef de département',
            'manager_id' => $manager->id,
        ];

        $this->withToken($token)
            ->postJson('/api/v1/employees', [
                ...$commonPayload,
                'employee_number' => 'EMP-DIRECTION',
                'direction_id' => $direction->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.direction.id', $direction->id)
            ->assertJsonPath('data.department', null)
            ->assertJsonPath('data.position_title', 'Chef de département');

        $this->withToken($token)
            ->postJson('/api/v1/employees', [
                ...$commonPayload,
                'employee_number' => 'EMP-DEPARTMENT',
                'department_id' => $department->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.direction', null)
            ->assertJsonPath('data.department.id', $department->id)
            ->assertJsonPath('data.position_title', 'Chef de département');

        $this->withToken($token)
            ->getJson('/api/v1/employees?direction_id='.$direction->id)
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->assertDatabaseHas('employees', [
            'employee_number' => 'EMP-DEPARTMENT',
            'direction_id' => null,
            'department_id' => $department->id,
            'position_title' => 'Chef de département',
        ]);
    }

    public function test_employee_cannot_be_assigned_to_both_a_direction_and_a_department(): void
    {
        $this->seed(RoleSeeder::class);
        $direction = Direction::query()->create([
            'name' => 'Direction test',
            'code' => 'DIR-TEST',
        ]);
        $department = Department::query()->create([
            'direction_id' => $direction->id,
            'name' => 'Département test',
            'code' => 'DEP-TEST',
        ]);
        $manager = Employee::query()->create([
            'direction_id' => $direction->id,
            'employee_number' => 'EMP-MANAGER-BOTH',
            'first_name' => 'Responsable',
            'last_name' => 'Test',
            'status' => 'active',
        ]);

        $this->withToken($this->token('administrateur'))
            ->postJson('/api/v1/employees', [
                'employee_number' => 'EMP-BOTH',
                'first_name' => 'Jean',
                'last_name' => 'Rakoto',
                'status' => 'active',
                'direction_id' => $direction->id,
                'department_id' => $department->id,
                'manager_id' => $manager->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('department_id');
    }

    public function test_employee_can_be_assigned_an_existing_direct_manager_and_cannot_manage_themselves(): void
    {
        $this->seed(RoleSeeder::class);
        $direction = Direction::query()->create([
            'name' => 'Direction test',
            'code' => 'DIR-TEST',
        ]);
        $manager = Employee::query()->create([
            'direction_id' => $direction->id,
            'employee_number' => 'EMP-MANAGER',
            'first_name' => 'Responsable',
            'last_name' => 'Direct',
            'status' => 'active',
        ]);
        $token = $this->token('administrateur');

        $created = $this->withToken($token)
            ->postJson('/api/v1/employees', [
                'employee_number' => 'EMP-REPORT',
                'first_name' => 'Agent',
                'last_name' => 'Equipe',
                'status' => 'active',
                'direction_id' => $direction->id,
                'manager_id' => $manager->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.manager.id', $manager->id)
            ->assertJsonPath('data.manager.full_name', 'Responsable Direct');

        $employeeId = $created->json('data.id');

        $this->withToken($token)
            ->patchJson('/api/v1/employees/'.$employeeId, [
                'employee_number' => 'EMP-REPORT',
                'first_name' => 'Agent',
                'last_name' => 'Equipe',
                'status' => 'active',
                'direction_id' => $direction->id,
                'manager_id' => $employeeId,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('manager_id');
    }

    public function test_employee_creation_requires_a_manager_or_an_explicit_top_level_selection(): void
    {
        $this->seed(RoleSeeder::class);
        $direction = Direction::query()->create([
            'name' => 'Direction test',
            'code' => 'DIR-TEST',
        ]);
        $token = $this->token('administrateur');
        $payload = [
            'employee_number' => 'EMP-NEEDS-MANAGER',
            'first_name' => 'Agent',
            'last_name' => 'Equipe',
            'status' => 'active',
            'direction_id' => $direction->id,
        ];

        $this->withToken($token)
            ->postJson('/api/v1/employees', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('manager_id');

        $this->withToken($token)
            ->postJson('/api/v1/employees', [
                ...$payload,
                'employee_number' => 'EMP-TOP-LEVEL',
                'is_top_level' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.manager', null);
    }
}
