<?php

namespace App\Providers;

use App\Models\AbsenceRecord;
use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use App\Models\PlanningEvent;
use App\Models\User;
use App\Policies\AttendancePolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\PlanningEventPolicy;
use App\Policies\RequestPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use LogicException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') && config('app.debug')) {
            throw new LogicException('APP_DEBUG must be false in production.');
        }

        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(PlanningEvent::class, PlanningEventPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
        Gate::policy(LeaveRequest::class, RequestPolicy::class);
        Gate::policy(PermissionRequest::class, RequestPolicy::class);
        Gate::policy(AbsenceRecord::class, RequestPolicy::class);

        Gate::define('attendance.scan', fn (User $user): bool => $user->hasPermission('attendance.scan'));
        Gate::define('leave.request', fn (User $user): bool => $user->hasPermission('leave.request'));
        Gate::define('permission.request', fn (User $user): bool => $user->hasPermission('permission.request'));
        Gate::define('absence.request', fn (User $user): bool => $user->hasPermission('absence.request'));
        Gate::define('roles.manage', fn (User $user): bool => $user->hasPermission('roles.manage'));

        RateLimiter::for('api-login', function (Request $request): Limit {
            $email = $request->input('email');
            $identity = is_string($email) ? Str::transliterate(Str::lower($email)) : 'invalid';

            return Limit::perMinute(5)->by($identity.'|'.$request->ip());
        });
    }
}
