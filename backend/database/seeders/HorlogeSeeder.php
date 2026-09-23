<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HorlogeSeeder extends Seeder
{
    public function run()
    {
        DB::table('horloges')->insert([
            [
                'heure_arrivee' => '08:00',
                'heure_depart' => '16:00',
                
            ],
        ]);
    }
}
