<?php

namespace Database\Seeders;

use App\Models\Direction;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $demoUsers = [
            [
                'email' => 'admin@gmail.com',
                'name' => 'Administrateur PointageMisaina',
                'first_name' => 'Administrateur',
                'last_name' => 'POINTA',
                'employee_number' => 'DEMO-ADMIN',
                'direction_code' => 'DSG',
                'roles' => ['administrateur'],
            ],
            [
                'email' => 'rh@gmail.com',
                'name' => 'Responsable RH',
                'first_name' => 'Responsable',
                'last_name' => 'RH',
                'employee_number' => 'DEMO-RH',
                'direction_code' => 'DRH',
                'roles' => ['rh'],
            ],
            [
                'email' => 'direction@gmail.com',
                'name' => 'Directeur',
                'first_name' => 'Directeur',
                'last_name' => 'POINTA',
                'employee_number' => 'DEMO-DIRECTION',
                'direction_code' => 'DSG',
                'roles' => ['direction'],
            ],
            [
                'email' => 'securite@gmail.com',
                'name' => 'Agent de sécurité',
                'first_name' => 'Agent',
                'last_name' => 'Sécurité',
                'employee_number' => 'DEMO-SECURITE',
                'direction_code' => 'DSG',
                'roles' => ['securite'],
            ],
            [
                'email' => 'responsable@gmail.com',
                'name' => 'Responsable d\'équipe',
                'first_name' => 'Responsable',
                'last_name' => 'Équipe',
                'employee_number' => 'DEMO-RESPONSABLE',
                'direction_code' => 'DSG',
                'roles' => ['responsable'],
            ],
            [
                'email' => 'personnel@gmail.com',
                'name' => 'Agent du personnel',
                'first_name' => 'Agent',
                'last_name' => 'Personnel',
                'employee_number' => 'DEMO-PERSONNEL',
                'direction_code' => 'DSG',
                'roles' => ['personnel'],
            ],
        ];

        $employees = [];

        foreach ($demoUsers as $demo) {
            $user = User::query()->updateOrCreate(
                ['email' => $demo['email']],
                [
                    'name' => $demo['name'],
                    'password' => Hash::make('123456'),
                    'email_verified_at' => now(),
                ],
            );

            $roleIds = Role::query()->whereIn('slug', $demo['roles'])->pluck('id');
            $user->roles()->sync($roleIds);

            $employee = Employee::query()->firstOrNew(['user_id' => $user->id]);

            if (! $employee->exists) {
                $employee = Employee::query()->firstOrNew([
                    'employee_number' => $demo['employee_number'],
                ]);
            }

            if (! $employee->exists) {
                $employee->employee_number = $demo['employee_number'];
            }

            $employee->fill([
                'user_id' => $user->id,
                'direction_id' => Direction::query()
                    ->where('code', $demo['direction_code'])
                    ->value('id'),
                'first_name' => $demo['first_name'],
                'last_name' => $demo['last_name'],
                'email' => $demo['email'],
                'status' => 'active',
            ])->save();
            $employees[$demo['roles'][0]] = $employee;

            $schedule = WorkSchedule::query()->where('name', 'Horaire standard')->first();

            if ($schedule !== null) {
                $employee->workSchedules()->updateOrCreate(
                    ['starts_on' => now()->startOfYear()->toDateString()],
                    [
                        'work_schedule_id' => $schedule->id,
                        'ends_on' => null,
                    ],
                );
            }
        }

        $employees['personnel']->forceFill([
            'manager_id' => $employees['responsable']->id,
        ])->save();

        foreach (['administrateur', 'rh', 'direction', 'securite', 'responsable'] as $role) {
            $employees[$role]->forceFill(['manager_id' => null])->save();
        }
    }
}
