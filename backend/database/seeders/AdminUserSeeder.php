<?php

namespace Database\Seeders;

use App\Models\Device;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        Device::query()->updateOrCreate(
            ['device_code' => 'SEC-ENTRY-01'],
            ['name' => 'Terminal entrée principale', 'location' => 'Hall principal', 'status' => 'active'],
        );

        Device::query()->updateOrCreate(
            ['device_code' => 'SEC-EXIT-01'],
            ['name' => 'Terminal sortie principale', 'location' => 'Hall principal', 'status' => 'active'],
        );
    }
}
