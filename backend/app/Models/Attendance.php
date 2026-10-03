<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'employee_id', 'attendance_date', 'first_entry', 'last_exit', 'worked_minutes',
        'late_minutes', 'overtime_minutes', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'attendance_date' => 'immutable_date',
            'worked_minutes' => 'integer',
            'late_minutes' => 'integer',
            'overtime_minutes' => 'integer',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
