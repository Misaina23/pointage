<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionId = DB::table('permissions')
            ->where('name', 'workflows.manage')
            ->value('id');

        if ($permissionId === null) {
            return;
        }

        DB::table('permission_role')->where('permission_id', $permissionId)->delete();
        DB::table('permissions')->where('id', $permissionId)->delete();
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->insertGetId([
            'name' => 'workflows.manage',
            'label' => 'Gérer les circuits de validation',
            'description' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $roles = DB::table('roles')->whereIn('slug', ['administrateur', 'rh'])->pluck('id');

        foreach ($roles as $roleId) {
            DB::table('permission_role')->insert([
                'permission_id' => $permissionId,
                'role_id' => $roleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
