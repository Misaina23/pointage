<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    public function test_vercel_frontend_can_send_bearer_authenticated_api_requests(): void
    {
        $origin = 'https://pointagemisaina.vercel.app';

        config()->set('cors.allowed_origins', [$origin]);

        $response = $this->call('OPTIONS', '/api/v1/auth/login', server: [
            'HTTP_ORIGIN' => $origin,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization,content-type',
        ]);

        $response->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', $origin)
            ->assertHeaderMissing('Access-Control-Allow-Credentials');
    }

    public function test_vercel_login_does_not_require_a_csrf_session_cookie(): void
    {
        $response = $this->withHeader('Origin', 'https://pointagemisaina.vercel.app')
            ->postJson('/api/v1/auth/login', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'device_name']);
    }
}
