<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionId = DB::table('permissions')
            ->where('name', 'leave.request')
            ->value('id');
        $roleId = DB::table('roles')
            ->where('slug', 'rh')
            ->value('id');

        if ($permissionId === null || $roleId === null) {
            return;
        }

        DB::table('permission_role')->updateOrInsert(
            ['permission_id' => $permissionId, 'role_id' => $roleId],
            ['created_at' => now(), 'updated_at' => now()],
        );
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')
            ->where('name', 'leave.request')
            ->value('id');
        $roleId = DB::table('roles')
            ->where('slug', 'rh')
            ->value('id');

        if ($permissionId === null || $roleId === null) {
            return;
        }

        DB::table('permission_role')
            ->where('permission_id', $permissionId)
            ->where('role_id', $roleId)
            ->delete();
    }
};
