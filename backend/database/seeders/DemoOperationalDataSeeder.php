<?php

namespace Database\Seeders;

use App\Models\AbsenceRecord;
use App\Models\AbsenceType;
use App\Models\AttendanceEvent;
use App\Models\AuditLog;
use App\Models\Badge;
use App\Models\Department;
use App\Models\Device;
use App\Models\Direction;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\PermissionRequest;
use App\Models\PermissionType;
use App\Models\PlanningEvent;
use App\Models\ScheduleDay;
use App\Models\User;
use App\Models\WorkSchedule;
use App\Services\AbsenceService;
use App\Services\ApprovalService;
use App\Services\AttendanceService;
use App\Services\LeaveService;
use App\Services\PermissionService;
use App\Services\ScheduleService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class DemoOperationalDataSeeder extends Seeder
{
    private const STAFF = [
        [
            'number' => 'DEMO-EMP-001',
            'first_name' => 'Tovo',
            'last_name' => 'Andriamihaja',
            'department' => 'DAAF-PATR',
            'position' => 'Gestionnaire du patrimoine',
            'employment_type' => 'titulaire',
            'status' => 'active',
            'hire_date' => '2019-04-15',
        ],
        [
            'number' => 'DEMO-EMP-002',
            'first_name' => 'Mialy',
            'last_name' => 'Raveloson',
            'department' => 'DAAF-FIN',
            'position' => 'Gestionnaire budgétaire',
            'employment_type' => 'contractuel',
            'status' => 'active',
            'hire_date' => '2021-02-08',
        ],
        [
            'number' => 'DEMO-EMP-003',
            'first_name' => 'Hanta',
            'last_name' => 'Razafindrakoto',
            'department' => 'DAJ-CONT',
            'position' => 'Juriste',
            'employment_type' => 'titulaire',
            'status' => 'active',
            'hire_date' => '2018-09-03',
        ],
        [
            'number' => 'DEMO-EMP-004',
            'first_name' => 'Fanja',
            'last_name' => 'Rasoanaivo',
            'department' => 'CNH-HAB',
            'position' => 'Chargée d’habilitation',
            'employment_type' => 'contractuel',
            'status' => 'active',
            'hire_date' => '2022-06-20',
        ],
        [
            'number' => 'DEMO-EMP-005',
            'first_name' => 'Hasina',
            'last_name' => 'Rakotoarisoa',
            'department' => 'DSI-APP',
            'position' => 'Développeur applicatif',
            'employment_type' => 'titulaire',
            'status' => 'active',
            'hire_date' => '2020-11-02',
        ],
        [
            'number' => 'DEMO-EMP-006',
            'first_name' => 'Lova',
            'last_name' => 'Ratsimba',
            'department' => 'DSI-INFRA',
            'position' => 'Administrateur systèmes',
            'employment_type' => 'contractuel',
            'status' => 'active',
            'hire_date' => '2023-01-16',
        ],
        [
            'number' => 'DEMO-EMP-007',
            'first_name' => 'Tahina',
            'last_name' => 'Andrianjafy',
            'department' => 'DBNE-BES',
            'position' => 'Gestionnaire des bourses',
            'employment_type' => 'titulaire',
            'status' => 'active',
            'hire_date' => '2017-05-22',
        ],
        [
            'number' => 'DEMO-EMP-008',
            'first_name' => 'Voahirana',
            'last_name' => 'Rakotomalala',
            'department' => 'DSSIP-STAT',
            'position' => 'Chargée d’études statistiques',
            'employment_type' => 'titulaire',
            'status' => 'active',
            'hire_date' => '2020-03-09',
        ],
        [
            'number' => 'DEMO-EMP-009',
            'first_name' => 'Fetra',
            'last_name' => 'Ramaroson',
            'department' => 'DGES-PED',
            'position' => 'Conseiller pédagogique',
            'employment_type' => 'contractuel',
            'status' => 'active',
            'hire_date' => '2022-08-01',
        ],
        [
            'number' => 'DEMO-EMP-010',
            'first_name' => 'Soa',
            'last_name' => 'Randrianarisoa',
            'department' => 'DRH-PERS',
            'position' => 'Gestionnaire du personnel',
            'employment_type' => 'titulaire',
            'status' => 'active',
            'hire_date' => '2016-10-17',
        ],
        [
            'number' => 'DEMO-EMP-011',
            'first_name' => 'Noro',
            'last_name' => 'Rajaonarivelo',
            'department' => 'DAAF-PATR',
            'position' => 'Agent de contrôle des accès',
            'employment_type' => 'journalier',
            'status' => 'active',
            'hire_date' => '2024-01-08',
        ],
        [
            'number' => 'DEMO-EMP-012',
            'first_name' => 'Bako',
            'last_name' => 'Razanamasy',
            'department' => 'DGES-PED',
            'position' => 'Assistant administratif',
            'employment_type' => 'stagiaire',
            'status' => 'inactive',
            'hire_date' => '2025-02-03',
        ],
    ];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $departments = $this->seedDepartments();
        $employees = $this->seedEmployees($departments);
        $this->seedSchedules($employees);
        $devices = $this->seedDevices();
        $badges = $this->seedBadges($employees);

        $this->seedAttendance($employees, $devices, $badges);
        $this->seedRequests($employees);
        $this->seedPlanning($employees);
        $this->seedHolidays();
        $this->seedNotifications();
        $this->seedAuditLogs($employees);
    }

    /**
     * @return array<string, Department>
     */
    private function seedDepartments(): array
    {
        $definitions = [
            ['code' => 'DAAF-PATR', 'direction' => 'DAAF', 'name' => 'Logistique et patrimoine', 'description' => 'Gestion des moyens généraux, du patrimoine et des accès.'],
            ['code' => 'DAAF-FIN', 'direction' => 'DAAF', 'name' => 'Affaires financières', 'description' => 'Préparation budgétaire et suivi des dépenses.'],
            ['code' => 'DAJ-CONT', 'direction' => 'DAJ', 'name' => 'Conseil et contentieux', 'description' => 'Conseil juridique et suivi des dossiers contentieux.'],
            ['code' => 'CNH-HAB', 'direction' => 'CNH', 'name' => 'Habilitation et accréditation', 'description' => 'Instruction des dossiers d’habilitation et d’accréditation.'],
            ['code' => 'DSI-APP', 'direction' => 'DSI', 'name' => 'Applications et données', 'description' => 'Conception et maintenance des applications métiers.'],
            ['code' => 'DSI-INFRA', 'direction' => 'DSI', 'name' => 'Infrastructures informatiques', 'description' => 'Administration des réseaux, serveurs et équipements.'],
            ['code' => 'DBNE-BES', 'direction' => 'DBNE', 'name' => 'Bourses et études', 'description' => 'Gestion des bourses nationales et des études extérieures.'],
            ['code' => 'DSSIP-STAT', 'direction' => 'DSSIP', 'name' => 'Statistiques et planification', 'description' => 'Production des statistiques et appui à la planification.'],
            ['code' => 'DGES-PED', 'direction' => 'DGES', 'name' => 'Pédagogie et établissements', 'description' => 'Suivi pédagogique et accompagnement des établissements.'],
            ['code' => 'DRH-PERS', 'direction' => 'DRH', 'name' => 'Administration du personnel', 'description' => 'Gestion administrative des dossiers du personnel.'],
        ];

        $departments = [];

        foreach ($definitions as $definition) {
            $directionId = Direction::query()->where('code', $definition['direction'])->value('id');

            if ($directionId === null) {
                throw new RuntimeException(sprintf('La direction %s doit être créée avant les départements de démonstration.', $definition['direction']));
            }

            $departments[$definition['code']] = Department::query()->updateOrCreate(
                ['code' => $definition['code']],
                [
                    'direction_id' => $directionId,
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'is_active' => true,
                ],
            );
        }

        return $departments;
    }

    /**
     * @param  array<string, Department>  $departments
     * @return array<string, Employee>
     */
    private function seedEmployees(array $departments): array
    {
        $direction = $this->demoEmployee('direction');
        $responsable = $this->demoEmployee('responsable');
        $rh = $this->demoEmployee('rh');

        $employees = [];
        $demoProfiles = [
            ['key' => 'administrateur', 'department' => null, 'direction' => 'DSG', 'position' => 'Administrateur de la plateforme', 'manager' => null, 'phone' => '+261 34 00 00 101', 'hire_date' => '2020-01-06'],
            ['key' => 'direction', 'department' => null, 'direction' => 'DSG', 'position' => 'Directeur général', 'manager' => null, 'phone' => '+261 34 00 00 102', 'hire_date' => '2017-03-13'],
            ['key' => 'rh', 'department' => 'DRH-PERS', 'direction' => null, 'position' => 'Directeur des ressources humaines', 'manager' => 'direction', 'phone' => '+261 34 00 00 103', 'hire_date' => '2018-06-04'],
            ['key' => 'responsable', 'department' => 'DAAF-PATR', 'direction' => null, 'position' => 'Responsable logistique et patrimoine', 'manager' => 'direction', 'phone' => '+261 34 00 00 104', 'hire_date' => '2019-07-01'],
            ['key' => 'securite', 'department' => 'DAAF-PATR', 'direction' => null, 'position' => 'Agent de sécurité', 'manager' => 'responsable', 'phone' => '+261 34 00 00 105', 'hire_date' => '2021-05-17'],
            ['key' => 'personnel', 'department' => 'DAAF-PATR', 'direction' => null, 'position' => 'Agent administratif', 'manager' => 'responsable', 'phone' => '+261 34 00 00 106', 'hire_date' => '2022-02-14'],
        ];
        $managers = [
            'direction' => $direction,
            'responsable' => $responsable,
            'rh' => $rh,
        ];

        foreach ($demoProfiles as $index => $profile) {
            $employee = $this->demoEmployee($profile['key']);
            $employee->forceFill([
                'direction_id' => $profile['direction'] === null
                    ? null
                    : Direction::query()->where('code', $profile['direction'])->value('id'),
                'department_id' => $profile['department'] === null
                    ? null
                    : $departments[$profile['department']]->id,
                'position_title' => $profile['position'],
                'manager_id' => $profile['manager'] === null ? null : $managers[$profile['manager']]->id,
                'phone' => $profile['phone'],
                'hire_date' => $profile['hire_date'],
                'employment_type' => $index === 4 ? 'contractuel' : 'titulaire',
                'status' => 'active',
            ])->save();
            $employees[$employee->employee_number] = $employee->refresh();
        }

        foreach (self::STAFF as $index => $staff) {
            $department = $departments[$staff['department']];
            $manager = match ($staff['department']) {
                'DRH-PERS' => $rh,
                'DAAF-PATR', 'DAAF-FIN' => $responsable,
                default => $direction,
            };
            $email = sprintf('agent%02d@example.test', $index + 1);
            $employee = Employee::query()->updateOrCreate(
                ['employee_number' => $staff['number']],
                [
                    'department_id' => $department->id,
                    'direction_id' => null,
                    'manager_id' => $manager->id,
                    'first_name' => $staff['first_name'],
                    'last_name' => $staff['last_name'],
                    'email' => $email,
                    'phone' => sprintf('+261 34 %02d %02d %03d', 10 + $index, 20 + $index, 300 + $index),
                    'hire_date' => $staff['hire_date'],
                    'employment_type' => $staff['employment_type'],
                    'position_title' => $staff['position'],
                    'status' => $staff['status'],
                ],
            );
            $employees[$employee->employee_number] = $employee;
        }

        foreach (array_values($employees) as $index => $employee) {
            $photoPath = sprintf('employees/demo/%s.svg', $employee->employee_number);
            $stored = Storage::disk('public')->put($photoPath, $this->avatarSvg($employee, $index));

            if (! $stored) {
                throw new RuntimeException(sprintf('Impossible de stocker l’avatar de %s.', $employee->employee_number));
            }

            $employee->forceFill(['photo_path' => $photoPath])->save();
        }

        return $employees;
    }

    /**
     * @param  array<string, Employee>  $employees
     */
    private function seedSchedules(array $employees): void
    {
        $standard = WorkSchedule::query()->where('name', 'Horaire standard')->firstOrFail();
        $security = WorkSchedule::query()->updateOrCreate(
            ['name' => 'Équipe sécurité - démonstration'],
            [
                'schedule_type' => 'fixed',
                'late_tolerance_minutes' => 5,
                'is_active' => true,
            ],
        );

        for ($day = 1; $day <= 7; $day++) {
            ScheduleDay::query()->updateOrCreate(
                ['work_schedule_id' => $security->id, 'day_of_week' => $day],
                [
                    'starts_at' => '06:00:00',
                    'ends_at' => '14:00:00',
                    'break_starts_at' => '10:00:00',
                    'break_ends_at' => '10:30:00',
                ],
            );
        }

        foreach ($employees as $employee) {
            $workSchedule = $employee->employee_number === 'DEMO-SECURITE' ? $security : $standard;
            $employee->workSchedules()->updateOrCreate(
                ['starts_on' => now()->startOfYear()->toDateString()],
                ['work_schedule_id' => $workSchedule->id, 'ends_on' => null],
            );
        }
    }

    /**
     * @return array<string, Device>
     */
    private function seedDevices(): array
    {
        $definitions = [
            ['device_code' => 'DEMO-ENTREE-01', 'name' => 'Contrôle entrée principale', 'location' => 'Entrée principale - Antananarivo'],
            ['device_code' => 'DEMO-SORTIE-01', 'name' => 'Contrôle sortie principale', 'location' => 'Sortie principale - Antananarivo'],
            ['device_code' => 'DEMO-ACCUEIL-01', 'name' => 'Poste de garde accueil', 'location' => 'Accueil administratif - Antananarivo'],
        ];
        $devices = [];

        foreach ($definitions as $definition) {
            $devices[$definition['device_code']] = Device::query()->updateOrCreate(
                ['device_code' => $definition['device_code']],
                [...$definition, 'status' => 'active', 'last_seen_at' => now()],
            );
        }

        return $devices;
    }

    /**
     * @param  array<string, Employee>  $employees
     * @return array<string, Badge>
     */
    private function seedBadges(array $employees): array
    {
        $badges = [];

        foreach (array_values($employees) as $index => $employee) {
            $badgeNumber = 'BDG-'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);
            $isActive = $employee->status->value === 'active';
            $badge = Badge::query()->updateOrCreate(
                ['badge_number' => $badgeNumber],
                [
                    'employee_id' => $employee->id,
                    'public_id' => $this->stableUuid('pointa-demo-badge:'.$employee->employee_number),
                    'status' => $isActive ? 'active' : 'revoked',
                    'issued_at' => now()->subMonths(6),
                    'revoked_at' => $isActive ? null : now()->subDay(),
                ],
            );
            $badges[$employee->employee_number] = $badge;
        }

        return $badges;
    }

    /**
     * @param  array<string, Employee>  $employees
     * @param  array<string, Device>  $devices
     * @param  array<string, Badge>  $badges
     */
    private function seedAttendance(array $employees, array $devices, array $badges): void
    {
        $attendance = app(AttendanceService::class);
        $scheduleService = app(ScheduleService::class);
        $today = CarbonImmutable::today();
        $dates = [];

        for ($daysAgo = 5; $daysAgo >= 1; $daysAgo--) {
            $dates[] = $today->subDays($daysAgo);
        }

        $dates[] = $today;

        foreach ($dates as $date) {
            foreach (array_values($employees) as $index => $employee) {
                if ($employee->status->value !== 'active') {
                    continue;
                }

                $shift = $scheduleService->resolveShift($employee, $date);

                if ($shift === null || ! $shift->hasHours()) {
                    continue;
                }

                $entryAt = $shift->expectedEntryAt()->addMinutes($index % 6);

                if ($date->isToday() && $entryAt->isAfter(CarbonImmutable::now())) {
                    continue;
                }

                $device = $employee->employee_number === 'DEMO-SECURITE'
                    ? $devices['DEMO-ACCUEIL-01']
                    : $devices['DEMO-ENTREE-01'];
                $badge = $badges[$employee->employee_number];

                $this->recordDemoEvent($employee, $badge, $device, $entryAt, 'entry', $index);

                if ($date->isToday() && $employee->employee_number === 'DEMO-SECURITE') {
                    continue;
                }

                $exitAt = $shift->expectedExitAt()->addMinutes($index % 9);

                if ($date->isToday() && $exitAt->isAfter(CarbonImmutable::now())) {
                    continue;
                }

                $exitDevice = $employee->employee_number === 'DEMO-SECURITE'
                    ? $devices['DEMO-ACCUEIL-01']
                    : $devices['DEMO-SORTIE-01'];
                $this->recordDemoEvent($employee, $badge, $exitDevice, $exitAt, 'exit', $index);
            }

            $scheduledEmployees = collect($employees)
                ->filter(fn (Employee $employee): bool => $employee->status->value === 'active')
                ->filter(fn (Employee $employee): bool => $scheduleService->resolveShift($employee, $date)?->hasHours() ?? false);
            $attendance->recomputeMany($scheduledEmployees, $date);
        }
    }

    private function recordDemoEvent(
        Employee $employee,
        Badge $badge,
        Device $device,
        CarbonImmutable $occurredAt,
        string $type,
        int $index,
    ): void {
        AttendanceEvent::query()->firstOrCreate(
            [
                'employee_id' => $employee->id,
                'occurred_at' => $occurredAt,
                'event_type' => $type,
            ],
            [
                'badge_id' => $badge->id,
                'device_id' => $device->id,
                'client_event_id' => (string) Str::uuid(),
                'source' => 'demo_seed',
                'latitude' => -18.8792 + ($index * 0.00001),
                'longitude' => 47.5079 + ($index * 0.00001),
                'metadata' => ['demo' => true, 'location' => 'Antananarivo'],
            ],
        );
    }

    /**
     * @param  array<string, Employee>  $employees
     */
    private function seedRequests(array $employees): void
    {
        $leaveService = app(LeaveService::class);
        $permissionService = app(PermissionService::class);
        $absenceService = app(AbsenceService::class);
        $approvalService = app(ApprovalService::class);
        $personnel = $employees['DEMO-PERSONNEL'];
        $staff = $employees['DEMO-EMP-001'];
        $annualLeave = LeaveType::query()->where('code', 'annuel')->firstOrFail();
        $permissionType = PermissionType::query()->where('code', 'professionnelle')->firstOrFail();
        $absenceType = AbsenceType::query()->where('code', 'maladie')->firstOrFail();
        $hrUser = $this->demoUser('rh');
        $managerUser = $this->demoUser('responsable');

        foreach ($employees as $employee) {
            LeaveBalance::query()->firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_type_id' => $annualLeave->id,
                    'year' => now()->year,
                ],
                ['allocated_days' => 60, 'used_days' => 0],
            );
        }

        $pastLeaveDate = $this->shiftDate($personnel, -1);
        $approvedLeaveReason = 'Démo : congé annuel approuvé';
        $approvedLeave = LeaveRequest::query()
            ->where('employee_id', $personnel->id)
            ->where('reason', $approvedLeaveReason)
            ->first();

        if ($approvedLeave === null) {
            $approvedLeave = $leaveService->create($personnel, [
                'leave_type_id' => $annualLeave->id,
                'starts_on' => $pastLeaveDate->toDateString(),
                'ends_on' => $pastLeaveDate->toDateString(),
                'reason' => $approvedLeaveReason,
            ]);
        }

        $approvedFlow = $approvedLeave->approvalRequest()->first();

        if ($approvedFlow === null) {
            throw new RuntimeException('Le circuit interne des congés doit être initialisé avant les données de démonstration.');
        }

        if ($approvedFlow->status === 'pending') {
            $leaveService->approve($approvedFlow, $hrUser, 'Dossier de démonstration complet.');
        }

        $pendingLeaveDate = $this->shiftDate($staff, 1);
        $pendingLeaveReason = 'Démo : demande de congé en attente';

        if (! LeaveRequest::query()->where('employee_id', $staff->id)->where('reason', $pendingLeaveReason)->exists()) {
            $leaveService->create($staff, [
                'leave_type_id' => $annualLeave->id,
                'starts_on' => $pendingLeaveDate->toDateString(),
                'ends_on' => $pendingLeaveDate->toDateString(),
                'reason' => $pendingLeaveReason,
            ]);
        }

        $permissionDate = $this->shiftDate($personnel, 2);
        $permissionReason = 'Démo : rendez-vous administratif';
        $permission = PermissionRequest::query()
            ->where('employee_id', $personnel->id)
            ->where('reason', $permissionReason)
            ->first();

        if ($permission === null) {
            $permission = $permissionService->create($personnel, [
                'permission_type_id' => $permissionType->id,
                'permission_date' => $permissionDate->toDateString(),
                'starts_at' => '10:00',
                'ends_at' => '12:00',
                'reason' => $permissionReason,
            ]);
        }

        $permissionApproval = $permission->approvalRequest()->first();

        if ($permissionApproval === null) {
            throw new RuntimeException('La demande de permission de démonstration ne possède aucun circuit interne.');
        }

        if ($permissionApproval->status === 'pending' && $permissionApproval->current_step === 1) {
            $permissionService->approve($permissionApproval, $managerUser, 'Accord du responsable direct.');
        }

        $absenceReason = 'Démo : justificatif médical transmis';
        $absence = AbsenceRecord::query()
            ->where('employee_id', $staff->id)
            ->where('reason', $absenceReason)
            ->first();

        if ($absence === null) {
            $absence = $absenceService->create($staff, [
                'absence_type_id' => $absenceType->id,
                'starts_on' => $this->shiftDate($staff, -2)->toDateString(),
                'ends_on' => $this->shiftDate($staff, -2)->toDateString(),
                'reason' => $absenceReason,
            ]);
        }

        $absenceApproval = $absence->approvalRequest()->first();

        if ($absenceApproval === null) {
            throw new RuntimeException('La déclaration d’absence de démonstration ne possède aucun circuit interne.');
        }

        if ($absenceApproval->status === 'pending' && $absenceApproval->current_step === 1) {
            $absenceService->approve($absenceApproval, $managerUser, 'Absence enregistrée par le responsable.');
        }
    }

    /**
     * @param  array<string, Employee>  $employees
     */
    private function seedPlanning(array $employees): void
    {
        $creator = $this->demoUser('direction');
        $staff = $employees['DEMO-EMP-005'];
        $event = PlanningEvent::query()->updateOrCreate(
            ['title' => 'Réunion de coordination des directions'],
            [
                'created_by' => $creator->id,
                'direction_id' => $staff->department->direction_id,
                'department_id' => $staff->department_id,
                'event_type' => 'meeting',
                'description' => 'Point de coordination sur les priorités et le calendrier de service.',
                'starts_at' => now()->addDays(2)->setTime(9, 0),
                'ends_at' => now()->addDays(2)->setTime(10, 30),
                'location' => 'Salle de conférence A - Antananarivo',
            ],
        );
        $creatorEmployee = $creator->employee;

        if ($creatorEmployee === null) {
            throw new RuntimeException('Le compte de direction de démonstration doit être lié à un employé.');
        }

        $event->participants()->sync([
            $creatorEmployee->id => ['attendance_status' => 'confirmed'],
            $staff->id => ['attendance_status' => 'invited'],
            $employees['DEMO-RH']->id => ['attendance_status' => 'confirmed'],
        ]);
    }

    private function seedHolidays(): void
    {
        $holidayDate = CarbonImmutable::now()->addMonth()->startOfMonth()->addDays(10);

        Holiday::query()->updateOrCreate(
            ['name' => 'Journée institutionnelle de démonstration', 'date' => $holidayDate->toDateString()],
            [
                'is_paid' => true,
                'description' => 'Journée de fermeture administrative utilisée pour les essais locaux.',
            ],
        );
    }

    private function seedNotifications(): void
    {
        foreach (['administrateur', 'rh', 'direction', 'securite', 'responsable', 'personnel'] as $role) {
            $user = $this->demoUser($role);

            foreach ([true, false] as $read) {
                $key = sprintf('pointa-demo-notification:%s:%s', $role, $read ? 'read' : 'unread');
                $id = $this->stableUuid($key);
                DatabaseNotification::query()->updateOrCreate(
                    ['id' => $id],
                    [
                        'type' => 'demo.notice',
                        'notifiable_type' => User::class,
                        'notifiable_id' => $user->id,
                        'data' => [
                            'title' => $read ? 'Bienvenue dans PointageMisaina' : 'Données de démonstration prêtes',
                            'message' => $read
                                ? 'Votre espace de démonstration contient des dossiers et historiques fictifs.'
                                : 'Les données d’essai sont limitées aux environnements locaux et de test.',
                            'demo_key' => $key,
                        ],
                        'read_at' => $read ? now()->subHour() : null,
                    ],
                );
            }
        }
    }

    /**
     * @param  array<string, Employee>  $employees
     */
    private function seedAuditLogs(array $employees): void
    {
        foreach (['administrateur', 'rh', 'direction', 'securite', 'responsable', 'personnel'] as $role) {
            $user = $this->demoUser($role);
            $key = 'POINTA-DEMO-SEED:'.$role;
            $log = AuditLog::query()->firstOrCreate(
                ['user_agent' => $key],
                [
                    'actor_user_id' => $user->id,
                    'action' => 'DEMO_DATA_LOADED',
                    'old_values' => ['source' => 'seed local'],
                    'new_values' => ['role' => $role, 'environment' => app()->environment()],
                    'ip_address' => '127.0.0.1',
                ],
            );

            if ($log->subject_id === null || $log->subject_type === null) {
                $log->subject()->associate($employees['DEMO-EMP-001']);
                $log->save();
            }
        }
    }

    private function demoEmployee(string $role): Employee
    {
        return Employee::query()
            ->where('user_id', $this->demoUser($role)->id)
            ->firstOrFail();
    }

    private function demoUser(string $role): User
    {
        $email = $role === 'administrateur' ? 'admin@gmail.com' : $role.'@gmail.com';

        return User::query()->where('email', $email)->firstOrFail();
    }

    private function shiftDate(Employee $employee, int $direction): CarbonImmutable
    {
        $scheduleService = app(ScheduleService::class);
        $date = CarbonImmutable::today();

        for ($offset = 1; $offset <= 40; $offset++) {
            $candidate = $direction > 0 ? $date->addDays($offset) : $date->subDays($offset);
            $shift = $scheduleService->resolveShift($employee, $candidate);

            if ($shift !== null && $shift->hasHours() && ! $scheduleService->isHoliday($candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException(sprintf('Aucun jour de travail disponible pour %s.', $employee->employee_number));
    }

    private function avatarSvg(Employee $employee, int $index): string
    {
        $backgrounds = ['#dcefe7', '#e7e4f7', '#f7e5d8', '#dceaf4', '#f4e1ea', '#e5edd6'];
        $shirts = ['#0b6e4f', '#4254a4', '#a45044', '#276c91', '#77517f', '#9a6c2c'];
        $initials = Str::upper(Str::substr($employee->first_name, 0, 1).Str::substr($employee->last_name, 0, 1));

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%s"/><path d="M19 120c3-27 18-42 41-42s38 15 41 42" fill="%s"/><path d="M36 44c0-17 10-29 25-29s25 12 25 29v10c0 18-11 31-25 31S36 72 36 54z" fill="#9b6448"/><path d="M35 48c-3-20 7-35 26-35 19 0 29 15 25 35l-5-9c-9 2-22 1-32-5-2 6-7 11-14 14z" fill="#30241f"/><text x="60" y="112" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="12" font-weight="700">%s</text></svg>',
            $backgrounds[$index % count($backgrounds)],
            $shirts[$index % count($shirts)],
            $initials,
        );
    }

    private function stableUuid(string $key): string
    {
        $hex = substr(hash('sha256', $key), 0, 32);
        $hex[12] = '5';
        $hex[16] = dechex((hexdec($hex[16]) & 0x3) | 0x8);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12),
        );
    }
}
