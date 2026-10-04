<?php

namespace Tests\Feature;

use App\Models\AttendanceEvent;
use App\Models\Badge;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class EmployeePermanentDeletionTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_employee_without_history_and_its_linked_account_can_be_deleted_permanently(): void
    {
        $employee = $this->makeEmployee();
        $linkedUser = User::factory()->create();
        $employee->forceFill(['user_id' => $linkedUser->id])->save();
        $linkedUser->createToken('employee-delete-test');
        $token = $this->token('administrateur');

        $this->withToken($token)
            ->deleteJson('/api/v1/employees/'.$employee->id.'/permanent')
            ->assertNoContent();

        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);
        $this->assertDatabaseMissing('users', ['id' => $linkedUser->id]);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => $linkedUser->getMorphClass(),
            'tokenable_id' => $linkedUser->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'DELETE_EMPLOYEE',
            'subject_type' => Employee::class,
            'subject_id' => $employee->id,
        ]);
    }

    public function test_employee_with_a_badge_cannot_be_deleted_permanently(): void
    {
        $employee = $this->makeEmployee();
        Badge::query()->create([
            'employee_id' => $employee->id,
            'public_id' => (string) Str::uuid(),
            'badge_number' => 'BADGE-'.Str::upper(Str::random(8)),
            'status' => 'active',
            'issued_at' => now(),
        ]);
        $token = $this->token('administrateur');

        $this->withToken($token)
            ->deleteJson('/api/v1/employees/'.$employee->id.'/permanent')
            ->assertStatus(409)
            ->assertJsonPath('message', 'Suppression impossible : ce dossier ou son compte est lié à des données ou à un historique (pointages, badges, congés, permissions, absences, demandes, événements ou actions). Désactivez-le pour conserver ces données.');

        $this->assertDatabaseHas('employees', ['id' => $employee->id]);
        $this->assertDatabaseHas('badges', ['employee_id' => $employee->id]);
        $this->assertDatabaseMissing('audit_logs', [
            'action' => 'DELETE_EMPLOYEE',
            'subject_id' => $employee->id,
        ]);
    }

    public function test_employee_cannot_delete_the_account_used_for_the_current_request(): void
    {
        $employee = $this->makeEmployee();
        $user = $this->tokenFor('administrateur', $employee);
        $token = $user->createToken('self-delete-test')->plainTextToken;

        $this->withToken($token)
            ->deleteJson('/api/v1/employees/'.$employee->id.'/permanent')
            ->assertStatus(409);

        $this->assertDatabaseHas('employees', ['id' => $employee->id]);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_employee_account_with_scanner_history_cannot_be_deleted(): void
    {
        $employee = $this->makeEmployee();
        $linkedUser = User::factory()->create();
        $employee->forceFill(['user_id' => $linkedUser->id])->save();
        $scannedEmployee = $this->makeEmployee();
        $event = AttendanceEvent::query()->create([
            'employee_id' => $scannedEmployee->id,
            'scanned_by_user_id' => $linkedUser->id,
            'event_type' => 'entry',
            'occurred_at' => now(),
            'source' => 'security_scan',
        ]);
        $token = $this->token('administrateur');

        $this->withToken($token)
            ->deleteJson('/api/v1/employees/'.$employee->id.'/permanent')
            ->assertStatus(409);

        $this->assertDatabaseHas('attendance_events', [
            'id' => $event->id,
            'scanned_by_user_id' => $linkedUser->id,
        ]);
        $this->assertDatabaseHas('employees', ['id' => $employee->id]);
        $this->assertDatabaseHas('users', ['id' => $linkedUser->id]);
    }
}
