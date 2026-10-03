<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class RolePermissionManagementTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_administrator_can_update_its_permission_set(): void
    {
        $token = $this->token('administrateur');
        $permissions = Permission::query()
            ->where('name', '!=', 'attendance.scan')
            ->pluck('name')
            ->all();

        $this->withToken($token)
            ->patchJson('/api/v1/roles/administrateur/permissions', [
                'permissions' => $permissions,
            ])
            ->assertOk()
            ->assertJsonPath('data.slug', 'administrateur');

        $adminRole = Role::query()->where('slug', 'administrateur')->firstOrFail();

        $this->assertFalse($adminRole->permissions()->where('name', 'attendance.scan')->exists());
        $this->assertTrue($adminRole->permissions()->where('name', 'roles.manage')->exists());
    }

    public function test_administrator_can_update_permissions_for_each_role(): void
    {
        $token = $this->token('administrateur');
        $role = Role::query()->where('slug', 'responsable')->firstOrFail();

        $response = $this->withToken($token)
            ->patchJson('/api/v1/roles/responsable/permissions', [
                'permissions' => ['employees.view', 'absence.request'],
            ])
            ->assertOk()
            ->assertJsonPath('data.slug', 'responsable');

        $this->assertEqualsCanonicalizing(
            ['employees.view', 'absence.request'],
            $response->json('data.permissions'),
        );

        $this->assertEqualsCanonicalizing(
            ['employees.view', 'absence.request'],
            $role->fresh()->permissions()->pluck('name')->all(),
        );
    }

    public function test_administrator_cannot_remove_role_management_permission(): void
    {
        $token = $this->token('administrateur');

        $this->withToken($token)
            ->patchJson('/api/v1/roles/administrateur/permissions', [
                'permissions' => ['attendance.view'],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('permissions');

        $adminRole = Role::query()->where('slug', 'administrateur')->firstOrFail();
        $this->assertTrue($adminRole->permissions()->where('name', 'roles.manage')->exists());
    }

    public function test_only_administrators_with_role_management_permission_can_manage_roles(): void
    {
        $token = $this->token('responsable');

        $this->withToken($token)->getJson('/api/v1/roles')->assertForbidden();

        $this->withToken($token)
            ->patchJson('/api/v1/roles/responsable/permissions', [
                'permissions' => ['roles.manage'],
            ])
            ->assertForbidden();
    }

    public function test_role_seeder_preserves_permission_changes_for_every_role(): void
    {
        $this->seedRoles();
        $role = Role::query()->where('slug', 'responsable')->firstOrFail();
        $role->permissions()->sync(
            Permission::query()->where('name', 'absence.request')->pluck('id'),
        );

        $this->seedRoles();

        $this->assertEquals(
            ['absence.request'],
            $role->fresh()->permissions()->pluck('name')->all(),
        );
    }

    public function test_direction_and_responsables_can_create_each_kind_of_personal_request(): void
    {
        $this->seedRoles();

        foreach (['direction', 'responsable'] as $roleSlug) {
            $user = User::factory()->create();
            $user->roles()->attach(Role::query()->where('slug', $roleSlug)->firstOrFail());

            foreach (['leave.request', 'permission.request', 'absence.request'] as $permission) {
                $this->assertTrue(
                    Gate::forUser($user)->allows($permission),
                    "{$roleSlug} should have the {$permission} permission.",
                );
            }
        }

        $leaveOnlyUser = User::factory()->create();
        $leaveOnlyRole = Role::query()->where('slug', 'personnel')->firstOrFail();
        $leaveOnlyRole->permissions()->detach(
            Permission::query()
                ->whereIn('name', ['permission.request', 'absence.request'])
                ->pluck('id'),
        );
        $leaveOnlyUser->roles()->attach($leaveOnlyRole);

        $this->assertTrue(Gate::forUser($leaveOnlyUser)->allows('leave.request'));
        $this->assertFalse(Gate::forUser($leaveOnlyUser)->allows('absence.request'));
    }
}
