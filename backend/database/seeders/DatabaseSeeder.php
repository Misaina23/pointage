<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DirectionSeeder::class,
            ReferenceDataSeeder::class,
            ApprovalWorkflowSeeder::class,
            AdminUserSeeder::class,
            DemoUserSeeder::class,
            DemoOperationalDataSeeder::class,
        ]);
    }
}
