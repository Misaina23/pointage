<?php

use Laravel\Sanctum\Sanctum;

return [

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,localhost:5173,127.0.0.1:5173',
        Sanctum::currentApplicationUrlWithPort()
    ))),

    // Only session guards belong here. Including 'sanctum' makes
    // Sanctum\Guard::__invoke() call Auth::guard('sanctum')->user(),
    // which is itself, causing infinite recursion on every API request.
    // The 'personnel' and 'security' guards are token guards used through
    // the auth:personnel / auth:security middleware, not here.
    'guard' => ['web'],

    'expiration' => null,

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],

];