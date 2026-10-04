<?php

namespace Tests\Feature;

use App\Models\User;
use App\Providers\AppServiceProvider;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\DirectionSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use LogicException;
use Tests\TestCase;

class ProductionSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_and_default_admin_seeders_do_not_create_known_accounts_in_production(): void
    {
        $this->seed(RoleSeeder::class);
        $this->app['env'] = 'production';

        app(AdminUserSeeder::class)->run();
        app(DemoUserSeeder::class)->run();

        $this->assertDatabaseMissing('users', ['email' => 'admin@gmail.com']);
        $this->assertDatabaseMissing('users', ['email' => 'rh@gmail.com']);
        $this->assertDatabaseMissing('users', ['email' => 'direction@gmail.com']);
    }

    public function test_demo_accounts_are_available_in_local_environment_with_employee_profiles(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(DirectionSeeder::class);
        $this->seed(ReferenceDataSeeder::class);
        $this->app['env'] = 'local';

        app(AdminUserSeeder::class)->run();
        app(DemoUserSeeder::class)->run();

        $demoAccounts = [
            'admin@gmail.com' => 'administrateur',
            'rh@gmail.com' => 'rh',
            'direction@gmail.com' => 'direction',
            'securite@gmail.com' => 'securite',
            'responsable@gmail.com' => 'responsable',
            'personnel@gmail.com' => 'personnel',
        ];

        foreach ($demoAccounts as $email => $role) {
            $user = User::query()->where('email', $email)->firstOrFail();

            $this->assertTrue(Hash::check('123456', $user->password));
            $this->assertTrue($user->hasRole($role));
            $this->assertNotNull($user->employee);
        }

        $this->assertSame(
            User::query()->whereIn('email', array_keys($demoAccounts))->count(),
            6,
        );
        $this->assertSame(
            'responsable@gmail.com',
            User::query()->where('email', 'personnel@gmail.com')->firstOrFail()
                ->employee?->manager?->user?->email,
        );
    }

    public function test_demo_accounts_can_be_explicitly_enabled_in_production(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(DirectionSeeder::class);
        $this->seed(ReferenceDataSeeder::class);
        $this->app['env'] = 'production';
        config(['app.seed_demo_accounts' => true]);

        app(DemoUserSeeder::class)->run();

        $user = User::query()->where('email', 'admin@gmail.com')->firstOrFail();

        $this->assertTrue(Hash::check('123456', $user->password));
        $this->assertTrue($user->hasRole('administrateur'));
        $this->assertNotNull($user->employee);
    }

    public function test_application_refuses_to_boot_in_production_with_debug_enabled(): void
    {
        $this->app['env'] = 'production';
        config(['app.debug' => true]);

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('APP_DEBUG must be false in production.');

        (new AppServiceProvider($this->app))->boot();
    }
}
