<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('permissions')->updateOrInsert(
            ['name' => 'absence.request'],
            [
                'label' => 'Signaler une absence',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $permissionId = DB::table('permissions')
            ->where('name', 'absence.request')
            ->value('id');

        $roleIds = DB::table('roles')
            ->whereIn('slug', ['administrateur', 'direction', 'responsable', 'securite', 'personnel'])
            ->pluck('id');

        foreach ($roleIds as $roleId) {
            DB::table('permission_role')->updateOrInsert(
                ['permission_id' => $permissionId, 'role_id' => $roleId],
                ['created_at' => $now, 'updated_at' => $now],
            );
        }

        $requestPermissionIds = DB::table('permissions')
            ->whereIn('name', ['leave.request', 'permission.request'])
            ->pluck('id');
        $managementRoleIds = DB::table('roles')
            ->whereIn('slug', ['direction', 'responsable'])
            ->pluck('id');

        foreach ($managementRoleIds as $roleId) {
            foreach ($requestPermissionIds as $requestPermissionId) {
                DB::table('permission_role')->updateOrInsert(
                    ['permission_id' => $requestPermissionId, 'role_id' => $roleId],
                    ['created_at' => $now, 'updated_at' => $now],
                );
            }
        }
    }

    public function down(): void
    {
        $requestPermissionIds = DB::table('permissions')
            ->whereIn('name', ['leave.request', 'permission.request'])
            ->pluck('id');
        $managementRoleIds = DB::table('roles')
            ->whereIn('slug', ['direction', 'responsable'])
            ->pluck('id');

        DB::table('permission_role')
            ->whereIn('permission_id', $requestPermissionIds)
            ->whereIn('role_id', $managementRoleIds)
            ->delete();

        $permissionId = DB::table('permissions')
            ->where('name', 'absence.request')
            ->value('id');

        if ($permissionId === null) {
            return;
        }

        DB::table('permission_role')
            ->where('permission_id', $permissionId)
            ->delete();

        DB::table('permissions')
            ->where('id', $permissionId)
            ->delete();
    }
};
