<?php

namespace Tests\Support;

use App\Models\Department;
use App\Models\Direction;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkSchedule;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

trait InteractsWithPointaData
{
    protected function seedRoles(): void
    {
        $this->seed(RoleSeeder::class);
    }

    /**
     * Le guard Sanctum est mémoïsé dans le conteneur : on le réinitialise pour que
     * chaque appel avec un jeton différent soit authentifié par le bon utilisateur.
     */
    protected function tokenFor(string $roleSlug, ?Employee $employee = null): User
    {
        $this->seedRoles();

        $user = User::factory()->create();
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $user->roles()->attach($role);

        if ($employee !== null) {
            $employee->forceFill(['user_id' => $user->id])->save();
        }

        Auth::forgetGuards();

        return $user;
    }

    protected function token(string $roleSlug, ?Employee $employee = null): string
    {
        return $this->tokenFor($roleSlug, $employee)->createToken('test-terminal')->plainTextToken;
    }

    protected function makeDepartment(): Department
    {
        if ($department = Department::query()->first()) {
            return $department;
        }

        $direction = Direction::query()->create([
            'name' => 'Direction test',
            'code' => 'DIR-'.Str::upper(Str::random(6)),
        ]);

        return Department::query()->create([
            'direction_id' => $direction->id,
            'name' => 'Département test',
            'code' => 'DEP-'.Str::upper(Str::random(6)),
        ]);
    }

    protected function makeEmployee(array $attributes = []): Employee
    {
        return Employee::query()->create([
            'department_id' => $this->makeDepartment()->id,
            'employee_number' => 'EMP-'.Str::upper(Str::random(8)),
            'first_name' => 'Jean',
            'last_name' => 'Rakoto',
            'status' => 'active',
            ...$attributes,
        ]);
    }

    protected function makeStandardSchedule(): WorkSchedule
    {
        $schedule = WorkSchedule::query()->create([
            'name' => 'Horaire test',
            'schedule_type' => 'fixed',
            'late_tolerance_minutes' => 10,
        ]);

        foreach (range(1, 5) as $dayOfWeek) {
            $schedule->days()->create([
                'day_of_week' => $dayOfWeek,
                'starts_at' => '08:00:00',
                'ends_at' => '17:00:00',
                'break_starts_at' => '12:00:00',
                'break_ends_at' => '13:00:00',
            ]);
        }

        return $schedule;
    }
}
