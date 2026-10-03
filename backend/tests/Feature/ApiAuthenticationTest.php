<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class ApiAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_sign_in_and_access_their_profile_with_a_token(): void
    {
        $user = User::factory()->create([
            'email' => 'personnel@pointa.test',
            'password' => 'secret-password',
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'personnel@pointa.test',
            'password' => 'secret-password',
            'device_name' => 'telephone-securite',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.id', $user->id);

        $this->withToken($loginResponse->json('token'))
            ->getJson('/api/v1/user')
            ->assertOk()
            ->assertJsonPath('email', 'personnel@pointa.test');
    }

    public function test_profile_requires_authentication(): void
    {
        $this->getJson('/api/v1/user')->assertUnauthorized();
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->create([
            'email' => 'personnel@pointa.test',
            'password' => 'secret-password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'personnel@pointa.test',
            'password' => 'incorrect-password',
            'device_name' => 'telephone-securite',
        ])->assertUnauthorized()
            ->assertJsonPath('message', 'Identifiants incorrects.');
    }

    public function test_login_requires_all_credentials(): void
    {
        $this->postJson('/api/v1/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'device_name']);
    }

    public function test_user_can_revoke_their_current_token(): void
    {
        $user = User::factory()->create();
        $newToken = $user->createToken('telephone-securite');

        $this->withToken($newToken->plainTextToken)->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $newToken->accessToken->id,
        ]);

        Auth::forgetGuards();

        $this->withToken($newToken->plainTextToken)->getJson('/api/v1/user')->assertUnauthorized();
    }
}
