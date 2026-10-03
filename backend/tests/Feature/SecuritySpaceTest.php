<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Direction;
use App\Models\Employee;
use App\Models\LeaveType;
use App\Models\Permission;
use App\Models\PermissionType;
use App\Models\Role;
use Carbon\CarbonImmutable;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class SecuritySpaceTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_security_user_sees_scans_of_the_day(): void
    {
        $employee = $this->makeEmployee();
        $this->scanFor($employee, 'entry', now());

        $response = $this->withToken($this->token('securite'))
            ->getJson('/api/v1/attendance/scans');

        $response->assertOk()
            ->assertJsonPath('data.0.employee.id', $employee->id)
            ->assertJsonPath('data.0.event_type', 'entry');
    }

    public function test_personnel_role_cannot_read_the_security_scan_journal(): void
    {
        $this->withToken($this->token('personnel'))
            ->getJson('/api/v1/attendance/scans')
            ->assertForbidden();
    }

    public function test_only_admin_and_rh_can_view_historical_attendance(): void
    {
        $date = now()->subDay()->toDateString();
        $from = "{$date}T00:00:00";
        $to = "{$date}T23:59:59";
        $employee = $this->makeEmployee();

        $this->withToken($this->token('securite'))
            ->getJson("/api/v1/attendance/today?date={$date}")
            ->assertForbidden();

        $this->withToken($this->token('securite'))
            ->getJson("/api/v1/attendance/events?from={$from}&to={$to}")
            ->assertForbidden();

        $this->withToken($this->token('securite'))
            ->getJson("/api/v1/attendance/scans?date={$date}")
            ->assertForbidden();

        $this->withToken($this->token('securite'))
            ->getJson("/api/v1/employees/{$employee->id}/attendance?date={$date}")
            ->assertForbidden();

        $this->withToken($this->token('securite'))
            ->getJson('/api/v1/attendance/anomalies')
            ->assertForbidden();

        foreach (['rh', 'administrateur'] as $role) {
            $this->withToken($this->token($role))
                ->getJson("/api/v1/attendance?date={$date}")
                ->assertOk();

            $this->withToken($this->token($role))
                ->getJson("/api/v1/attendance/events?from={$from}&to={$to}")
                ->assertOk();
        }
    }

    public function test_security_scan_recomputes_the_attendance_of_the_employee(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 08:00:00'));
        $employee = $this->makeEmployee();
        $schedule = $this->makeStandardSchedule();
        $employee->workSchedules()->create([
            'work_schedule_id' => $schedule->id,
            'starts_on' => now()->subMonth()->toDateString(),
        ]);

        $this->scanFor($employee, 'entry', now()->setTime(8, 0));
        $this->scanFor($employee, 'exit', now()->setTime(17, 0));

        $response = $this->withToken($this->token('securite'))
            ->postJson("/api/v1/attendance/refresh/{$employee->id}");

        $response->assertOk()
            ->assertJsonPath('data.status', 'present')
            ->assertJsonPath('data.late_minutes', 0);
    }

    public function test_refresh_requires_attendance_view_permission_as_well_as_scan_permission(): void
    {
        $employee = $this->makeEmployee();
        $this->seedRoles();
        $securityRole = Role::query()->where('slug', 'securite')->firstOrFail();
        $attendanceViewPermission = Permission::query()->where('name', 'attendance.view')->firstOrFail();
        $securityRole->permissions()->detach($attendanceViewPermission);
        $token = $this->token('securite');

        $this->withToken($token)
            ->postJson("/api/v1/attendance/refresh/{$employee->id}")
            ->assertForbidden();

        $this->assertDatabaseMissing('attendances', [
            'employee_id' => $employee->id,
            'attendance_date' => now()->toDateString(),
        ]);
    }

    public function test_personnel_dashboard_reports_today_status_and_shift(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 08:00:00'));
        $employee = $this->makeEmployee();
        $schedule = $this->makeStandardSchedule();
        $employee->workSchedules()->create([
            'work_schedule_id' => $schedule->id,
            'starts_on' => now()->subMonth()->toDateString(),
        ]);

        $this->scanFor($employee, 'entry', now()->setTime(8, 0));

        $this->withToken($this->token('personnel', $employee))
            ->getJson('/api/v1/dashboard/personal')
            ->assertOk()
            ->assertJsonPath('shift.starts_at', '08:00')
            ->assertJsonPath('shift.ends_at', '17:00')
            ->assertJsonPath('shift.late_tolerance_minutes', 10)
            ->assertJsonPath('today.first_entry', '08:00:00');
    }

    public function test_security_user_can_submit_leave_and_permission_requests(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $employee = $this->makeEmployee();
        $schedule = $this->makeStandardSchedule();
        $employee->workSchedules()->create([
            'work_schedule_id' => $schedule->id,
            'starts_on' => CarbonImmutable::now()->subMonth()->toDateString(),
        ]);
        $token = $this->token('securite', $employee);
        $leaveDate = CarbonImmutable::now()->next('Monday')->toDateString();
        $leaveType = LeaveType::query()->where('code', 'annuel')->firstOrFail();
        $permissionType = PermissionType::query()->where('code', 'personnelle')->firstOrFail();

        $this->withToken($token)
            ->postJson('/api/v1/leaves', [
                'leave_type_id' => $leaveType->id,
                'starts_on' => $leaveDate,
                'ends_on' => $leaveDate,
                'reason' => 'Demande de congé de test.',
            ])
            ->assertCreated();

        $this->withToken($token)
            ->postJson('/api/v1/permissions', [
                'permission_type_id' => $permissionType->id,
                'permission_date' => $leaveDate,
                'starts_at' => '09:00',
                'ends_at' => '10:00',
                'reason' => 'Demande de permission de test.',
            ])
            ->assertCreated();
    }

    public function test_employee_creation_requires_the_manage_permission(): void
    {
        $payload = [
            'employee_number' => 'EMP-9001',
            'first_name' => 'Marie',
            'last_name' => 'Rasoa',
            'status' => 'active',
            'direction_id' => Direction::query()->create([
                'name' => 'Direction test',
                'code' => 'DIR-EMPLOYEE-TEST',
            ])->id,
            'position_title' => 'Chef de service',
            'manager_id' => Employee::query()->create([
                'employee_number' => 'EMP-9001-MANAGER',
                'first_name' => 'Responsable',
                'last_name' => 'Test',
                'status' => 'active',
            ])->id,
        ];

        $this->withToken($this->token('personnel'))
            ->postJson('/api/v1/employees', $payload)
            ->assertForbidden();

        $this->withToken($this->token('rh'))
            ->postJson('/api/v1/employees', $payload)
            ->assertCreated()
            ->assertJsonPath('data.full_name', 'Marie Rasoa')
            ->assertJsonPath('data.position_title', 'Chef de service');

        $this->assertDatabaseHas('employees', [
            'employee_number' => 'EMP-9001',
            'position_title' => 'Chef de service',
        ]);
    }

    public function test_employee_photo_is_stored_and_returned_for_badge_generation(): void
    {
        Storage::fake('public');
        $direction = Direction::query()->create([
            'name' => 'Direction photo',
            'code' => 'DIR-PHOTO',
        ]);
        $manager = Employee::query()->create([
            'direction_id' => $direction->id,
            'employee_number' => 'EMP-PHOTO-MANAGER',
            'first_name' => 'Responsable',
            'last_name' => 'Photo',
            'status' => 'active',
        ]);

        $response = $this->withToken($this->token('rh'))
            ->post('/api/v1/employees', [
                'employee_number' => 'EMP-PHOTO-01',
                'first_name' => 'Marie',
                'last_name' => 'Rasoa',
                'status' => 'active',
                'direction_id' => $direction->id,
                'manager_id' => $manager->id,
                'photo' => UploadedFile::fake()->image('portrait.jpg'),
            ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.full_name', 'Marie Rasoa');

        $employee = Employee::query()->where('employee_number', 'EMP-PHOTO-01')->firstOrFail();

        $this->assertNotNull($employee->photo_path);
        Storage::disk('public')->assertExists($employee->photo_path);
        $response->assertJsonPath(
            'data.photo_url',
            Storage::disk('public')->url($employee->photo_path),
        );
    }

    private function scanFor(Employee $employee, string $type, \DateTimeInterface $at): void
    {
        $badge = Badge::query()->create([
            'employee_id' => $employee->id,
            'public_id' => (string) Str::uuid(),
            'badge_number' => 'BADGE-'.strtoupper(Str::random(8)),
            'issued_at' => now()->subMonth(),
        ]);

        $employee->attendanceEvents()->create([
            'badge_id' => $badge->id,
            'event_type' => $type,
            'occurred_at' => CarbonImmutable::parse($at),
            'source' => 'security_scan',
        ]);
    }
}
