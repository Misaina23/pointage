<?php

namespace Database\Seeders;

use App\Enums\ScheduleType;
use App\Models\AbsenceType;
use App\Models\LeaveType;
use App\Models\PermissionType;
use App\Models\WorkSchedule;
use Illuminate\Database\Seeder;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedLeaveTypes();
        $this->seedPermissionTypes();
        $this->seedAbsenceTypes();
        $this->seedWorkSchedules();
    }

    private function seedLeaveTypes(): void
    {
        $types = [
            ['name' => 'Congé annuel', 'code' => 'annuel', 'requires_attachment' => false, 'is_paid' => true],
            ['name' => 'Congé exceptionnel', 'code' => 'exceptionnel', 'requires_attachment' => false, 'is_paid' => true],
            ['name' => 'Congé maladie', 'code' => 'maladie', 'requires_attachment' => true, 'is_paid' => true],
            ['name' => 'Congé maternité', 'code' => 'maternite', 'requires_attachment' => true, 'is_paid' => true],
            ['name' => 'Congé paternité', 'code' => 'paternite', 'requires_attachment' => true, 'is_paid' => true],
            ['name' => 'Congé sans solde', 'code' => 'sans_solde', 'requires_attachment' => false, 'is_paid' => false],
        ];

        foreach ($types as $type) {
            LeaveType::query()->updateOrCreate(['code' => $type['code']], $type);
        }
    }

    private function seedPermissionTypes(): void
    {
        $types = [
            ['name' => 'Permission personnelle', 'code' => 'personnelle', 'requires_attachment' => false],
            ['name' => 'Permission professionnelle', 'code' => 'professionnelle', 'requires_attachment' => false],
            ['name' => 'Permission exceptionnelle', 'code' => 'exceptionnelle', 'requires_attachment' => true],
        ];

        foreach ($types as $type) {
            PermissionType::query()->updateOrCreate(['code' => $type['code']], $type);
        }
    }

    private function seedAbsenceTypes(): void
    {
        $types = [
            ['name' => 'Absence maladie', 'code' => 'maladie', 'requires_attachment' => true],
            ['name' => 'Absence familiale', 'code' => 'familiale', 'requires_attachment' => true],
            ['name' => 'Absence non justifiée', 'code' => 'non_justifiee', 'requires_attachment' => false],
        ];

        foreach ($types as $type) {
            AbsenceType::query()->updateOrCreate(['code' => $type['code']], $type);
        }
    }

    private function seedWorkSchedules(): void
    {
        $weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

        $standard = WorkSchedule::query()->updateOrCreate(
            ['name' => 'Horaire standard'],
            [
                'schedule_type' => ScheduleType::Fixed->value,
                'late_tolerance_minutes' => 10,
                'is_active' => true,
            ],
        );

        foreach ($weekdays as $index => $day) {
            $standard->days()->updateOrCreate(
                ['day_of_week' => $index + 1],
                [
                    'starts_at' => '08:00:00',
                    'ends_at' => '17:00:00',
                    'break_starts_at' => '12:00:00',
                    'break_ends_at' => '13:00:00',
                ],
            );
        }

        $shifts = [
            'Équipe matin' => ['06:00:00', '14:00:00', ScheduleType::MorningShift],
            'Équipe soir' => ['14:00:00', '22:00:00', ScheduleType::AfternoonShift],
            'Équipe nuit' => ['22:00:00', '06:00:00', ScheduleType::NightShift],
        ];

        foreach ($shifts as $name => [$start, $end, $type]) {
            $schedule = WorkSchedule::query()->updateOrCreate(
                ['name' => $name],
                [
                    'schedule_type' => $type->value,
                    'late_tolerance_minutes' => 10,
                    'is_active' => true,
                ],
            );

            foreach ($weekdays as $index => $day) {
                $schedule->days()->updateOrCreate(
                    ['day_of_week' => $index + 1],
                    [
                        'starts_at' => $start,
                        'ends_at' => $end,
                        'break_starts_at' => null,
                        'break_ends_at' => null,
                    ],
                );
            }
        }

        $weekend = WorkSchedule::query()->updateOrCreate(
            ['name' => 'Équipe week-end'],
            [
                'schedule_type' => ScheduleType::Weekend->value,
                'late_tolerance_minutes' => 15,
                'is_active' => true,
            ],
        );

        foreach (['Samedi' => 6, 'Dimanche' => 7] as $day => $index) {
            $weekend->days()->updateOrCreate(
                ['day_of_week' => $index],
                [
                    'starts_at' => '08:00:00',
                    'ends_at' => '17:00:00',
                    'break_starts_at' => '12:00:00',
                    'break_ends_at' => '13:00:00',
                ],
            );
        }
    }
}
