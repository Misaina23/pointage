<?php

use App\Http\Controllers\Api\V1\AbsenceRecordController;
use App\Http\Controllers\Api\V1\ApprovalRequestController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AttendanceScanController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BadgeController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeviceController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\PermissionRequestController;
use App\Http\Controllers\Api\V1\PlanningEventController;
use App\Http\Controllers\Api\V1\ReferenceDataController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\ScheduleController;
use App\Http\Controllers\Api\V1\SecurityAttendanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:api-login')
        ->name('auth.login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/user', [AuthController::class, 'user'])->name('user');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        Route::get('/reference-data', [ReferenceDataController::class, 'index'])->name('reference-data.index');
        Route::get('/me/leave-balances', [ReferenceDataController::class, 'myLeaveBalances'])->name('me.leave-balances');
        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::patch('/roles/{roleSlug}/permissions', [RoleController::class, 'updatePermissions'])
            ->name('roles.permissions.update');

        Route::get('/dashboard', [DashboardController::class, 'organization'])->name('dashboard.organization');
        Route::get('/dashboard/personal', [DashboardController::class, 'personal'])->name('dashboard.personal');
        Route::get('/dashboard/personal/attendance', [DashboardController::class, 'myAttendance'])->name('dashboard.personal-attendance');

        Route::apiResource('employees', EmployeeController::class);
        Route::get('/employees/{employee}/attendance', [AttendanceController::class, 'forEmployee'])->name('employees.attendance');

        Route::get('/directions', [OrganizationController::class, 'directions'])->name('directions.index');
        Route::post('/directions', [OrganizationController::class, 'storeDirection'])->name('directions.store');
        Route::patch('/directions/{direction}', [OrganizationController::class, 'updateDirection'])->name('directions.update');

        Route::get('/departments', [OrganizationController::class, 'departments'])->name('departments.index');
        Route::post('/departments', [OrganizationController::class, 'storeDepartment'])->name('departments.store');

        Route::get('/badges', [BadgeController::class, 'index'])->name('badges.index');
        Route::post('/badges', [BadgeController::class, 'store'])->name('badges.store');
        Route::post('/badges/{badge}/revoke', [BadgeController::class, 'revoke'])->name('badges.revoke');

        Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
        Route::post('/devices', [DeviceController::class, 'store'])->name('devices.store');
        Route::delete('/devices/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');

        Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');
        Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
        Route::patch('/schedules/{work_schedule}', [ScheduleController::class, 'update'])->name('schedules.update');
        Route::post('/schedules/assign', [ScheduleController::class, 'assign'])->name('schedules.assign');
        Route::get('/holidays', [ScheduleController::class, 'holidays'])->name('holidays.index');
        Route::post('/holidays', [ScheduleController::class, 'storeHoliday'])->name('holidays.store');

        Route::post('/attendance/scan', [AttendanceScanController::class, 'store'])
            ->middleware('can:attendance.scan')
            ->name('attendance.scan');
        Route::get('/attendance/scans', [SecurityAttendanceController::class, 'scans'])->name('attendance.scans');
        Route::post('/attendance/refresh/{employee}', [SecurityAttendanceController::class, 'refresh'])->name('attendance.refresh');
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/attendance/today', [AttendanceController::class, 'today'])->name('attendance.today');
        Route::get('/attendance/overview', [AttendanceController::class, 'overview'])->name('attendance.overview');
        Route::get('/attendance/availability', [AttendanceController::class, 'availability'])->name('attendance.availability');
        Route::get('/attendance/events', [AttendanceController::class, 'events'])->name('attendance.events');
        Route::post('/attendance/recompute', [AttendanceController::class, 'recompute'])->name('attendance.recompute');
        Route::get('/attendance/anomalies', [AttendanceController::class, 'anomalies'])->name('attendance.anomalies');

        Route::apiResource('leaves', LeaveRequestController::class)
            ->parameters(['leaves' => 'leave_request'])
            ->except(['update']);
        Route::apiResource('permissions', PermissionRequestController::class)
            ->parameters(['permissions' => 'permission_request'])
            ->except(['update']);
        Route::apiResource('absences', AbsenceRecordController::class)
            ->parameters(['absences' => 'absence_record'])
            ->except(['update']);

        Route::get('/approvals', [ApprovalRequestController::class, 'index'])->name('approvals.index');
        Route::post('/approvals/{approval_request}/decide', [ApprovalRequestController::class, 'decide'])->name('approvals.decide');
        Route::apiResource('planning', PlanningEventController::class)
            ->parameters(['planning' => 'planning_event']);

        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

        Route::get('/reports/daily', [ReportController::class, 'daily'])->name('reports.daily');
        Route::get('/reports/monthly', [ReportController::class, 'monthly'])->name('reports.monthly');
        Route::get('/reports/by-department', [ReportController::class, 'byDepartment'])->name('reports.by-department');

        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('/audit-logs/{audit_log}', [AuditLogController::class, 'show'])->name('audit-logs.show');
    });
});
