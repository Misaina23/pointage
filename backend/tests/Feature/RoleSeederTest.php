<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_seeder_is_idempotent_and_security_remains_personnel(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(RoleSeeder::class);

        $this->assertDatabaseCount('roles', 6);
        $this->assertDatabaseCount('permissions', 18);
        $this->assertDatabaseMissing('permissions', ['name' => 'workflows.manage']);

        $securityRole = Role::query()->where('slug', 'securite')->firstOrFail();
        $personnelRole = Role::query()->where('slug', 'personnel')->firstOrFail();
        $directionRole = Role::query()->where('slug', 'direction')->firstOrFail();
        $rhRole = Role::query()->where('slug', 'rh')->firstOrFail();
        $adminRole = Role::query()->where('slug', 'administrateur')->firstOrFail();
        $responsableRole = Role::query()->where('slug', 'responsable')->firstOrFail();

        $this->assertTrue($securityRole->permissions()->where('name', 'attendance.scan')->exists());
        $this->assertFalse($directionRole->permissions()->where('name', 'attendance.scan')->exists());
        $this->assertTrue($securityRole->permissions()->where('name', 'leave.request')->exists());
        $this->assertTrue($securityRole->permissions()->where('name', 'permission.request')->exists());
        $this->assertTrue($securityRole->permissions()->where('name', 'absence.request')->exists());
        $this->assertFalse($securityRole->permissions()->where('name', 'employees.manage')->exists());
        $this->assertTrue($adminRole->permissions()->where('name', 'attendance.history')->exists());
        $this->assertTrue($rhRole->permissions()->where('name', 'attendance.history')->exists());
        $this->assertFalse($directionRole->permissions()->where('name', 'attendance.history')->exists());
        $this->assertFalse($securityRole->permissions()->where('name', 'attendance.history')->exists());
        foreach (['leave.request', 'permission.request', 'absence.request', 'leave.approve'] as $permission) {
            $this->assertTrue($directionRole->permissions()->where('name', $permission)->exists());
            $this->assertTrue($responsableRole->permissions()->where('name', $permission)->exists());
        }

        $user = User::factory()->create();
        $user->roles()->sync([$securityRole->id, $personnelRole->id]);

        $this->assertTrue($user->hasRole('securite'));
        $this->assertTrue($user->hasRole('personnel'));
    }

    public function test_role_seeder_preserves_administrator_permission_changes(): void
    {
        $this->seed(RoleSeeder::class);

        $adminRole = Role::query()->where('slug', 'administrateur')->firstOrFail();
        $attendancePermissionId = $adminRole->permissions()
            ->where('name', 'attendance.scan')
            ->value('permissions.id');
        $this->assertNotNull($attendancePermissionId);
        $adminRole->permissions()->detach($attendancePermissionId);

        $this->seed(RoleSeeder::class);

        $this->assertFalse($adminRole->permissions()->where('name', 'attendance.scan')->exists());
        $this->assertTrue($adminRole->permissions()->where('name', 'roles.manage')->exists());
    }
}
