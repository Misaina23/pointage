<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('roles.manage');

        return response()->json([
            'data' => [
                'roles' => Role::query()
                    ->with('permissions:id,name,label')
                    ->orderBy('slug')
                    ->get()
                    ->map(fn (Role $role): array => [
                        'id' => $role->id,
                        'slug' => $role->slug,
                        'name' => $role->name,
                        'description' => $role->description,
                        'permissions' => $role->permissions->pluck('name')->values(),
                    ]),
                'permissions' => Permission::query()
                    ->orderBy('name')
                    ->get(['name', 'label']),
            ],
        ]);
    }

    public function updatePermissions(Request $request, string $roleSlug): JsonResponse
    {
        $this->authorize('roles.manage');

        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();

        $validated = $request->validate([
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => [
                'required',
                'string',
                'distinct',
                Rule::exists('permissions', 'name'),
            ],
        ]);

        if ($role->slug === 'administrateur'
            && ! in_array('roles.manage', $validated['permissions'], true)) {
            return response()->json([
                'message' => 'La permission de gestion des rôles doit rester attribuée au rôle Administrateur.',
                'errors' => [
                    'permissions' => ['La permission roles.manage est obligatoire.'],
                ],
            ], 422);
        }

        DB::transaction(function () use ($role, $validated): void {
            $permissionIds = Permission::query()
                ->whereIn('name', $validated['permissions'])
                ->pluck('id');

            $role->permissions()->sync($permissionIds);
        });

        return response()->json([
            'data' => [
                'slug' => $role->slug,
                'permissions' => $role->permissions()->pluck('name')->values(),
            ],
        ]);
    }
}
