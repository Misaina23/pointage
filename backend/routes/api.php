<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PersonnelController;
use App\Http\Controllers\Api\DirectionController;
use App\Http\Controllers\Api\HorlogeController;
use App\Http\Controllers\Api\PointageController;
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\BadgeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Personnel registration (public - for mobile app)
Route::post('/personnel/register', [PersonnelController::class, 'store']);

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);
    Route::get('/auth/verify-email', [AuthController::class, 'verifyEmailNotice'])->name('verification.notice');
    Route::get('/auth/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::post('/auth/email/verification-notification', [AuthController::class, 'sendEmailVerification'])->middleware('throttle:6,1')->name('verification.send');

    // Personnel (Admin/HR only)
    Route::apiResource('personnel', PersonnelController::class)->except(['create', 'edit']);

    // Directions
    Route::apiResource('directions', DirectionController::class)->except(['create', 'edit']);

    // Horloge
    Route::apiResource('horloge', HorlogeController::class)->only(['index', 'update']);

    // Pointage
    Route::get('/pointages', [PointageController::class, 'index']);
    Route::post('/pointages/pointer', [PointageController::class, 'pointer']);
    Route::post('/pointages/reset', [PointageController::class, 'resetPointage']);

    // Absences
    Route::apiResource('absences', AbsenceController::class)->except(['create', 'edit']);
    Route::put('/absences/{id}/status', [AbsenceController::class, 'updateStatus']);

    // Badge (QR Code)
    Route::get('/badge/{personnel}', [BadgeController::class, 'show']);
    Route::get('/badge/{personnel}/download', [BadgeController::class, 'download']);
});

// Mobile-specific routes (Personnel guard)
Route::middleware('auth:personnel')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/me/badge', [BadgeController::class, 'myBadge']);
    Route::post('/me/absences', [AbsenceController::class, 'store'])->name('personnel.absences.store');
    Route::get('/me/absences', [AbsenceController::class, 'myAbsences'])->name('personnel.absences.index');
});

// Mobile-specific routes (Security guard)
Route::middleware('auth:security')->group(function () {
    Route::post('/scan', [PointageController::class, 'scan']);
    Route::post('/absences', [AbsenceController::class, 'store'])->name('security.absences.store');
    Route::get('/absences', [AbsenceController::class, 'myAbsences'])->name('security.absences.index');
});
