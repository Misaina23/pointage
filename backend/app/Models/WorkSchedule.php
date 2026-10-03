<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkSchedule extends Model
{
    protected $fillable = ['name', 'schedule_type', 'late_tolerance_minutes', 'is_active'];

    protected function casts(): array
    {
        return ['late_tolerance_minutes' => 'integer', 'is_active' => 'boolean'];
    }

    public function days(): HasMany
    {
        return $this->hasMany(ScheduleDay::class);
    }

    public function employeeAssignments(): HasMany
    {
        return $this->hasMany(EmployeeWorkSchedule::class);
    }
}
