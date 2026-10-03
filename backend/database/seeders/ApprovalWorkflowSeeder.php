<?php

namespace Database\Seeders;

use App\Enums\RequestType;
use App\Models\ApprovalWorkflow;
use App\Models\Role;
use Illuminate\Database\Seeder;

class ApprovalWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $responsable = Role::query()->where('slug', 'responsable')->value('id');
        $direction = Role::query()->where('slug', 'direction')->value('id');
        $rh = Role::query()->where('slug', 'rh')->value('id');

        $definitions = [
            [
                'name' => 'Circuit congé standard',
                'request_type' => RequestType::Leave->value,
                'steps' => [
                    ['name' => 'Ressources humaines', 'role' => $rh],
                ],
            ],
            [
                'name' => 'Circuit congé avec validation direction',
                'request_type' => RequestType::Leave->value,
                'steps' => [
                    ['name' => 'Direction générale', 'role' => $direction],
                ],
            ],
            [
                'name' => 'Circuit permission',
                'request_type' => RequestType::Permission->value,
                'steps' => [
                    ['name' => 'Responsable', 'role' => $responsable],
                    ['name' => 'Ressources humaines', 'role' => $rh],
                ],
            ],
            [
                'name' => 'Circuit absence',
                'request_type' => RequestType::Absence->value,
                'steps' => [
                    ['name' => 'Responsable', 'role' => $responsable],
                    ['name' => 'Ressources humaines', 'role' => $rh],
                ],
            ],
        ];

        foreach ($definitions as $definition) {
            $workflow = ApprovalWorkflow::query()->updateOrCreate(
                ['name' => $definition['name'], 'request_type' => $definition['request_type']],
                ['is_active' => true],
            );

            $workflow->steps()->delete();

            foreach (array_values($definition['steps']) as $index => $step) {
                $workflow->steps()->create([
                    'step_order' => $index + 1,
                    'name' => $step['name'],
                    'approver_role_id' => $step['role'],
                    'is_required' => true,
                ]);
            }
        }
    }
}
