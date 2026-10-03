<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PlanningEvent extends Model
{
    protected $fillable = [
        'created_by', 'direction_id', 'department_id', 'event_type', 'title',
        'description', 'starts_at', 'ends_at', 'location',
    ];

    protected function casts(): array
    {
        return ['starts_at' => 'immutable_datetime', 'ends_at' => 'immutable_datetime'];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'meeting_participants')
            ->withPivot('attendance_status')
            ->withTimestamps();
    }
}
