<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run()
    {
        $email = env('SUPER_ADMIN_EMAIL', 'andrianisaina@gmail.com');

        $user = User::firstOrNew(['email' => $email]);

        // Always reset the credentials so the seeder is safe to re-run on deploy.
        $user->name = env('SUPER_ADMIN_NAME', 'andrianisaina');
        $user->password = Hash::make(env('SUPER_ADMIN_PASSWORD', '2311saina'));
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();

        $this->command?->info("Super admin ready: {$email}");
    }
}
