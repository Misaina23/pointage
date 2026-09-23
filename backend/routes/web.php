<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'version' => '1.0.0',
        'status' => 'ok',
        'documentation' => url('/api/documentation'),
        'endpoints' => [
            'auth' => [
                'POST /api/auth/register' => 'Register new admin user',
                'POST /api/auth/login' => 'Login',
                'POST /api/auth/logout' => 'Logout',
                'GET /api/auth/user' => 'Get authenticated user',
                'PUT /api/auth/password' => 'Update password',
            ],
            'personnel' => [
                'GET /api/personnel' => 'List all personnel (paginated)',
                'POST /api/personnel' => 'Create new personnel',
                'GET /api/personnel/{id}' => 'Get personnel details',
                'PUT /api/personnel/{id}' => 'Update personnel',
                'DELETE /api/personnel/{id}' => 'Delete personnel',
                'POST /api/personnel/register' => 'Public personnel registration (mobile)',
            ],
            'directions' => [
                'GET /api/directions' => 'List all directions',
                'POST /api/directions' => 'Create direction',
                'GET /api/directions/{id}' => 'Get direction',
                'PUT /api/directions/{id}' => 'Update direction',
                'DELETE /api/directions/{id}' => 'Delete direction',
            ],
            'horloge' => [
                'GET /api/horloge' => 'List schedules',
                'PUT /api/horloge/{id}' => 'Update schedule',
            ],
            'pointages' => [
                'GET /api/pointages' => 'List today pointages',
                'POST /api/pointages/pointer' => 'Mobile self pointage (QR code)',
                'POST /api/pointages/reset' => 'Reset today pointages',
            ],
            'absences' => [
                'GET /api/absences' => 'List all absences',
                'POST /api/absences' => 'Create absence request',
                'GET /api/absences/{id}' => 'Get absence details',
                'PUT /api/absences/{id}/status' => 'Update absence status',
            ],
            'badge' => [
                'GET /api/badge/{personnel}' => 'Get QR code SVG',
                'GET /api/badge/{personnel}/download' => 'Download QR code PNG',
            ],
            'mobile' => [
                'GET /api/me' => 'Get current personnel profile',
                'GET /api/me/badge' => 'Get my badge QR code',
                'POST /api/me/absences' => 'Create my absence request',
                'GET /api/me/absences' => 'List my absences',
                'POST /api/scan' => 'Security scan QR for pointage',
            ],
        ],
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'timestamp' => now()->toISOString()]);
});