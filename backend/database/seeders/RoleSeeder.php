<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $permissionDefinitions = [
            'employees.view' => 'Consulter le personnel',
            'employees.manage' => 'Gérer le personnel',
            'organization.manage' => 'Gérer la structure organisationnelle',
            'attendance.view' => 'Consulter les présences',
            'attendance.history' => 'Consulter l’historique des présences',
            'attendance.scan' => 'Scanner les badges',
            'schedules.manage' => 'Gérer les horaires',
            'leave.manage' => 'Gérer les congés',
            'leave.approve' => 'Valider les congés',
            'leave.request' => 'Demander un congé',
            'permission.request' => 'Demander une permission',
            'absence.request' => 'Signaler une absence',
            'absences.manage' => 'Gérer les absences',
            'planning.view' => 'Consulter le planning',
            'planning.manage' => 'Gérer le planning',
            'reports.view' => 'Consulter les rapports',
            'roles.manage' => 'Gérer les rôles et permissions',
            'audit.view' => 'Consulter le journal d’audit',
        ];

        $permissions = [];
        foreach ($permissionDefinitions as $name => $label) {
            $permissions[$name] = Permission::query()->updateOrCreate(
                ['name' => $name],
                ['label' => $label],
            );
        }

        $roleDefinitions = [
            'administrateur' => [
                'name' => 'Administrateur',
                'description' => 'Administration complète de la plateforme.',
                'permissions' => array_keys($permissionDefinitions),
            ],
            'rh' => [
                'name' => 'Ressources humaines',
                'description' => 'Gestion du personnel, des présences et des demandes RH.',
                'permissions' => [
                    'employees.view', 'employees.manage', 'organization.manage', 'attendance.view',
                    'attendance.history',
                    'schedules.manage', 'leave.manage', 'leave.approve', 'leave.request', 'absences.manage',
                    'planning.view', 'planning.manage', 'reports.view',
                ],
            ],
            'direction' => [
                'name' => 'Direction',
                'description' => 'Supervision et validation dans le périmètre de direction.',
                'permissions' => [
                    'employees.view', 'attendance.view', 'leave.approve', 'planning.view', 'reports.view',
                    'leave.request', 'permission.request', 'absence.request',
                ],
            ],
            'responsable' => [
                'name' => 'Responsable',
                'description' => 'Suivi d’équipe et première étape de validation.',
                'permissions' => [
                    'employees.view', 'attendance.view', 'leave.approve', 'planning.view',
                    'leave.request', 'permission.request', 'absence.request',
                ],
            ],
            'securite' => [
                'name' => 'Sécurité',
                'description' => 'Contrôle des accès et consultation des présences.',
                'permissions' => [
                    'attendance.view', 'attendance.scan', 'planning.view', 'leave.request', 'permission.request',
                    'absence.request',
                ],
            ],
            'personnel' => [
                'name' => 'Personnel',
                'description' => 'Espace personnel et demandes de l’employé.',
                'permissions' => [
                    'attendance.view', 'leave.request', 'permission.request', 'absence.request', 'planning.view',
                ],
            ],
        ];

        foreach ($roleDefinitions as $slug => $definition) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $definition['name'], 'description' => $definition['description']],
            );

            if (! $role->wasRecentlyCreated && $role->permissions()->exists()) {
                continue;
            }

            $role->permissions()->sync(array_map(
                fn (string $permission): int => $permissions[$permission]->id,
                $definition['permissions'],
            ));
        }
    }
}
