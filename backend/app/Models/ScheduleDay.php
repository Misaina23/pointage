<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleDay extends Model
{
    protected $fillable = [
        'work_schedule_id', 'day_of_week', 'starts_at', 'ends_at', 'break_starts_at', 'break_ends_at',
    ];

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class);
    }
}
