<?php

namespace App\Models;

use App\Enums\BadgeStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Badge extends Model
{
    protected $fillable = ['employee_id', 'public_id', 'badge_number', 'status', 'issued_at', 'revoked_at'];

    protected function casts(): array
    {
        return [
            'status' => BadgeStatus::class,
            'issued_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendanceEvents(): HasMany
    {
        return $this->hasMany(AttendanceEvent::class);
    }
}
