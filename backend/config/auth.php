<?php

return [

    'defaults' => [
        // The default guard must be a session guard: Auth::attempt() is used
        // by the login endpoint, and Sanctum's token guard does not implement
        // attempt(). Routes needing token auth name their guard explicitly
        // (auth:sanctum, auth:personnel, auth:security).
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],

        'personnel' => [
            'driver' => 'sanctum',
            'provider' => 'personnel',
        ],

        'security' => [
            'driver' => 'sanctum',
            'provider' => 'personnel',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],

        'personnel' => [
            'driver' => 'eloquent',
            'model' => App\Models\Personnel::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_resets',
            'expire' => 60,
            'throttle' => 60,
        ],

        'personnel' => [
            'provider' => 'personnel',
            'table' => 'password_resets',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

];