<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    protected $fillable = ['name', 'device_code', 'location', 'status', 'last_seen_at'];

    protected function casts(): array
    {
        return ['last_seen_at' => 'immutable_datetime'];
    }

    public function attendanceEvents(): HasMany
    {
        return $this->hasMany(AttendanceEvent::class);
    }
}
