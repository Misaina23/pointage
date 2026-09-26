<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'exp://localhost:8081',
        'exp://127.0.0.1:8081',
        'https://pointage-frontend.vercel.app',
        'https://pointage-mesupres.vercel.app',
    ],

    'allowed_origins_patterns' => [
        '^exp://.*',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];