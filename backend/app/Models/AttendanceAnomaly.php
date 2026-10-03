<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceAnomaly extends Model
{
    public const TYPE_MISSING_EXIT = 'missing_exit';

    public const TYPE_MISSING_ENTRY = 'missing_entry';

    public const TYPE_CONCURRENT_BADGE_USE = 'concurrent_badge_use';

    public const TYPE_DUPLICATE_SCAN = 'duplicate_scan';

    protected $fillable = [
        'employee_id', 'attendance_id', 'attendance_date', 'type', 'description',
        'status', 'resolved_by', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'attendance_date' => 'immutable_date',
            'resolved_at' => 'immutable_datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
