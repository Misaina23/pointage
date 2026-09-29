<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            DirectionSeeder::class,
            HorlogeSeeder::class,
        ]);

        \App\Models\Personnel::factory(10)->create();

        // Create default admin user
        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@pointage.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        // Create super admin user
        \App\Models\User::firstOrCreate(
            ['email' => 'andrianisaina@gmail.com'],
            [
                'name' => 'andrianisaina',
                'password' => bcrypt('2311saina'),
                'email_verified_at' => now(),
            ]
        );
    }
}