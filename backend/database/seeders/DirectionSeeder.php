<?php

namespace Database\Seeders;

use App\Models\Direction;
use Illuminate\Database\Seeder;

class DirectionSeeder extends Seeder
{
    public function run(): void
    {
        $directions = [
            ['code' => 'DSG', 'name' => 'DSG', 'description' => 'Directeur Général'],
            ['code' => 'DAAF', 'name' => 'DAAF', 'description' => 'Direction Administration des Affaires Administratives'],
            ['code' => 'DAJ', 'name' => 'DAJ', 'description' => 'Direction des Affaires Juridiques'],
            ['code' => 'CNH', 'name' => 'CNH', 'description' => 'Centre National d’Habilitation'],
            ['code' => 'DSI', 'name' => 'DSI', 'description' => 'Département des Systèmes Informatiques'],
            ['code' => 'DBNE', 'name' => 'DBNE', 'description' => 'Direction des Bourses Nationales et Extérieures'],
            ['code' => 'DSSIP', 'name' => 'DSSIP', 'description' => 'Direction de la Statistique des Systèmes d’Information et de Planification'],
            ['code' => 'DGES', 'name' => 'DGES', 'description' => 'Direction Générale de l’Enseignement Supérieur'],
            ['code' => 'DRH', 'name' => 'DRH', 'description' => 'Direction des Ressources Humaines'],
        ];

        foreach ($directions as $direction) {
            Direction::query()->updateOrCreate(
                ['code' => $direction['code']],
                [
                    'name' => $direction['name'],
                    'description' => $direction['description'],
                    'is_active' => true,
                ],
            );
        }
    }
}
