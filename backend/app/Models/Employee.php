<?php

namespace App\Models;

use App\Enums\EmployeeStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = [
        'user_id', 'direction_id', 'department_id', 'position_title', 'manager_id',
        'employee_number', 'first_name', 'last_name', 'email', 'phone', 'hire_date',
        'photo_path', 'employment_type', 'status',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'status' => EmployeeStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    public function directReports(): HasMany
    {
        return $this->hasMany(self::class, 'manager_id');
    }

    public function badges(): HasMany
    {
        return $this->hasMany(Badge::class);
    }

    public function attendanceEvents(): HasMany
    {
        return $this->hasMany(AttendanceEvent::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function anomalies(): HasMany
    {
        return $this->hasMany(AttendanceAnomaly::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function permissionRequests(): HasMany
    {
        return $this->hasMany(PermissionRequest::class);
    }

    public function absenceRecords(): HasMany
    {
        return $this->hasMany(AbsenceRecord::class);
    }

    public function workSchedules(): HasMany
    {
        return $this->hasMany(EmployeeWorkSchedule::class);
    }

    public function planningEvents(): BelongsToMany
    {
        return $this->belongsToMany(PlanningEvent::class, 'meeting_participants')
            ->withPivot('attendance_status')
            ->withTimestamps();
    }

    public function fullName(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}
