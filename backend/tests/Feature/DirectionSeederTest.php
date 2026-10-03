<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Direction;
use App\Models\Employee;
use Database\Seeders\DirectionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class DirectionSeederTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_direction_seeder_creates_the_provided_directions_idempotently(): void
    {
        $this->seed(DirectionSeeder::class);
        $this->seed(DirectionSeeder::class);

        $this->assertDatabaseCount('directions', 9);
        $this->assertDatabaseHas('directions', [
            'code' => 'DSG',
            'name' => 'DSG',
            'description' => 'Directeur Général',
        ]);
        $this->assertDatabaseHas('directions', [
            'code' => 'DRH',
            'name' => 'DRH',
            'description' => 'Direction des Ressources Humaines',
        ]);

        $this->assertSame(9, Direction::query()->where('is_active', true)->count());
    }

    public function test_direction_agent_count_includes_employees_assigned_through_departments(): void
    {
        $direction = Direction::query()->create([
            'name' => 'Direction test',
            'code' => 'DIR-TEST',
        ]);
        $department = Department::query()->create([
            'direction_id' => $direction->id,
            'name' => 'Département test',
            'code' => 'DEP-TEST',
        ]);
        $otherDirection = Direction::query()->create([
            'name' => 'Autre direction',
            'code' => 'DIR-OTHER',
        ]);

        Employee::query()->create([
            'department_id' => $department->id,
            'employee_number' => 'EMP-DEPT',
            'first_name' => 'Agent',
            'last_name' => 'Département',
            'status' => 'active',
        ]);
        Employee::query()->create([
            'direction_id' => $direction->id,
            'department_id' => $department->id,
            'employee_number' => 'EMP-BOTH',
            'first_name' => 'Agent',
            'last_name' => 'Deux liens',
            'status' => 'active',
        ]);
        Employee::query()->create([
            'direction_id' => $direction->id,
            'employee_number' => 'EMP-DIRECT',
            'first_name' => 'Agent',
            'last_name' => 'Direction',
            'status' => 'active',
        ]);
        Employee::query()->create([
            'direction_id' => $otherDirection->id,
            'employee_number' => 'EMP-OTHER',
            'first_name' => 'Agent',
            'last_name' => 'Autre',
            'status' => 'active',
        ]);

        $response = $this->withToken($this->token('administrateur'))
            ->getJson('/api/v1/directions')
            ->assertOk();
        $directionRow = collect($response->json('data'))->firstWhere('id', $direction->id);

        $this->assertIsArray($directionRow);
        $this->assertSame(3, $directionRow['employees_count']);
    }
}
