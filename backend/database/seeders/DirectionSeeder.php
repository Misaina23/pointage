<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Direction;

class DirectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Direction::create(['nom' => 'DSG', 'description' => 'Directeur Général']);
        Direction::create(['nom' => 'DAAF', 'description' => 'Direction Administration des Affaires Administratives']);
        Direction::create(['nom' => 'DAJ', 'description' => 'Direction des Affaires Juridiques']);
        Direction::create(['nom' => 'CNH', 'description' => 'Centre National d’Habilitation']);
        Direction::create(['nom' => 'DSI', 'description' => 'Département des Systèmes Informatiques']);
        Direction::create(['nom' => 'DBNE', 'description' => 'Direction des Bourses Nationales et Extérieures']);
        Direction::create(['nom' => 'DSSIP', 'description' => 'Direction de la Statistique des Systèmes d’Information et de Planification']);
        Direction::create(['nom' => 'DGES', 'description' => 'Direction Générale de l’Enseignement Supérieur']);
    }
}
