<?php

namespace Tests\Feature;

use App\Models\AttendanceEvent;
use App\Models\Badge;
use App\Models\Device;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Services\AttendanceService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class AttendanceScanTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_security_scan_updates_presence_and_admin_can_see_the_event(): void
    {
        [$employee, $badge] = $this->createBadge();
        $schedule = $this->makeStandardSchedule();
        $employee->workSchedules()->create([
            'work_schedule_id' => $schedule->id,
            'starts_on' => '2026-10-05',
        ]);
        $securityToken = $this->createTokenForRole('securite');
        $adminToken = $this->createTokenForRole('administrateur');

        $response = $this->withToken($securityToken)->postJson('/api/v1/attendance/scan', [
            'badge_public_id' => $badge->public_id,
            'event_type' => 'entry',
            'client_event_id' => Str::uuid()->toString(),
            'occurred_at' => '2026-10-05T08:00:00+03:00',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->id,
            'attendance_date' => '2026-10-05',
            'first_entry' => '08:00:00',
            'status' => 'present',
        ]);

        Auth::forgetGuards();
        $this->withToken($adminToken)
            ->getJson('/api/v1/attendance/today?date=2026-10-05')
            ->assertOk()
            ->assertJsonPath('summary.present', 1)
            ->assertJsonPath('events.0.employee.id', $employee->id)
            ->assertJsonPath('events.0.event_type', 'entry');
    }

    public function test_security_user_can_record_an_entry_with_a_badge(): void
    {
        [$employee, $badge] = $this->createBadge();
        $device = Device::query()->create([
            'name' => 'Entrée principale',
            'device_code' => 'SEC-ENTRY-01',
        ]);
        $token = $this->createTokenForRole('securite');

        $response = $this->withToken($token)->postJson('/api/v1/attendance/scan', [
            'badge_public_id' => $badge->public_id,
            'event_type' => 'entry',
            'client_event_id' => Str::uuid()->toString(),
            'occurred_at' => now()->toIso8601String(),
            'device_code' => $device->device_code,
        ]);

        $response->assertCreated()
            ->assertJsonPath('duplicate', false)
            ->assertJsonPath('data.employee.id', $employee->id)
            ->assertJsonPath('data.event_type', 'entry')
            ->assertJsonPath('data.device_code', $device->device_code);

        $this->assertDatabaseHas('attendance_events', [
            'employee_id' => $employee->id,
            'badge_id' => $badge->id,
            'device_id' => $device->id,
            'event_type' => 'entry',
        ]);
    }

    public function test_security_user_can_record_an_entry_with_a_badge_number(): void
    {
        [$employee, $badge] = $this->createBadge();
        $token = $this->createTokenForRole('securite');
        $payload = [
            ...$this->scanPayload($badge),
            'badge_public_id' => $badge->badge_number,
        ];

        $response = $this->withToken($token)->postJson('/api/v1/attendance/scan', $payload);

        $response->assertCreated()
            ->assertJsonPath('duplicate', false)
            ->assertJsonPath('data.employee.id', $employee->id)
            ->assertJsonPath('data.badge_number', $badge->badge_number);

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $payload)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertDatabaseHas('attendance_events', [
            'employee_id' => $employee->id,
            'badge_id' => $badge->id,
            'event_type' => 'entry',
        ]);
        $this->assertDatabaseCount('attendance_events', 1);
    }

    public function test_exit_is_rejected_when_no_prior_entry_exists(): void
    {
        [, $badge] = $this->createBadge();
        $token = $this->createTokenForRole('securite');
        $payload = [
            ...$this->scanPayload($badge),
            'event_type' => 'exit',
        ];

        $response = $this->withToken($token)->postJson('/api/v1/attendance/scan', $payload);

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'Impossible d\'enregistrer une sortie sans entrée préalable.');
        $this->assertDatabaseCount('attendance_events', 0);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_scan_requires_authentication_and_scan_permission(): void
    {
        [$employee, $badge] = $this->createBadge();
        $payload = $this->scanPayload($badge);

        $this->postJson('/api/v1/attendance/scan', $payload)->assertUnauthorized();

        $token = $this->createTokenForRole('personnel');

        $this->withToken($token)->postJson('/api/v1/attendance/scan', $payload)->assertForbidden();
        $this->withToken($this->createTokenForRole('direction'))
            ->postJson('/api/v1/attendance/scan', $payload)
            ->assertForbidden();
        $this->assertDatabaseCount('attendance_events', 0);
    }

    public function test_unknown_or_revoked_badges_are_not_recorded(): void
    {
        [, $badge] = $this->createBadge();
        $badge->forceFill(['status' => 'revoked', 'revoked_at' => now()])->save();
        $token = $this->createTokenForRole('securite');

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $this->scanPayload($badge))
            ->assertNotFound();

        $this->assertDatabaseCount('attendance_events', 0);
    }

    public function test_inactive_employee_badge_is_rejected_without_recording_a_scan(): void
    {
        [$employee, $badge] = $this->createBadge();
        $employee->forceFill(['status' => 'inactive'])->save();
        $token = $this->createTokenForRole('securite');

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $this->scanPayload($badge))
            ->assertNotFound()
            ->assertJsonPath('message', 'Badge inconnu, inactif ou révoqué.');

        $this->assertDatabaseCount('attendance_events', 0);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_inactive_device_is_rejected_without_recording_a_scan(): void
    {
        [, $badge] = $this->createBadge();
        Device::query()->create([
            'name' => 'Terminal désactivé',
            'device_code' => 'SEC-INACTIVE-01',
            'status' => 'inactive',
        ]);
        $token = $this->createTokenForRole('securite');
        $payload = [
            ...$this->scanPayload($badge),
            'device_code' => 'SEC-INACTIVE-01',
        ];

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $payload)
            ->assertNotFound()
            ->assertJsonPath('message', 'Terminal inconnu ou inactif.');

        $this->assertDatabaseCount('attendance_events', 0);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_repeated_scan_is_idempotent_and_conflicting_reuse_is_rejected(): void
    {
        [, $badge] = $this->createBadge();
        $token = $this->createTokenForRole('securite');
        $payload = $this->scanPayload($badge);

        $this->withToken($token)->postJson('/api/v1/attendance/scan', $payload)->assertCreated();
        $this->assertDatabaseHas('attendance_events', [
            'client_event_id' => $payload['client_event_id'],
        ]);

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $payload)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $conflictingPayload = [...$payload, 'event_type' => 'exit'];
        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $conflictingPayload)
            ->assertConflict();

        $this->assertSame(1, AttendanceEvent::query()->count());
    }

    public function test_scan_and_attendance_recalculation_roll_back_together_on_failure(): void
    {
        [, $badge] = $this->createBadge();
        $token = $this->createTokenForRole('securite');
        $attendance = $this->createMock(AttendanceService::class);
        $attendance->expects($this->once())
            ->method('recompute')
            ->willThrowException(new RuntimeException('Attendance recalculation failed.'));
        $this->app->instance(AttendanceService::class, $attendance);

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', $this->scanPayload($badge))
            ->assertServerError();

        $this->assertDatabaseCount('attendance_events', 0);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_scan_request_requires_a_valid_event_type_and_idempotency_key(): void
    {
        $token = $this->createTokenForRole('securite');

        $this->withToken($token)
            ->postJson('/api/v1/attendance/scan', [
                'badge_public_id' => Str::uuid()->toString(),
                'event_type' => 'arrival',
                'occurred_at' => now()->toIso8601String(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['event_type', 'client_event_id']);
    }

    private function createBadge(): array
    {
        $employee = Employee::query()->create([
            'employee_number' => 'EMP-'.Str::upper(Str::random(8)),
            'first_name' => 'Jean',
            'last_name' => 'Rakoto',
            'status' => 'active',
        ]);

        $badge = Badge::query()->create([
            'employee_id' => $employee->id,
            'public_id' => Str::uuid()->toString(),
            'badge_number' => 'BADGE-'.Str::upper(Str::random(8)),
            'status' => 'active',
            'issued_at' => now()->subDay(),
        ]);

        return [$employee, $badge];
    }

    private function createTokenForRole(string $roleSlug): string
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $user->roles()->attach($role);

        Auth::forgetGuards();

        return $user->createToken('test-terminal')->plainTextToken;
    }

    private function scanPayload(Badge $badge): array
    {
        return [
            'badge_public_id' => $badge->public_id,
            'event_type' => 'entry',
            'client_event_id' => Str::uuid()->toString(),
            'occurred_at' => now()->toIso8601String(),
        ];
    }
}
