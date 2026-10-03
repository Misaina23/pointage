<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Holiday extends Model
{
    protected $fillable = ['name', 'date', 'is_paid', 'description'];

    protected function casts(): array
    {
        return [
            'date' => 'immutable_date',
            'is_paid' => 'boolean',
        ];
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'attendance_date', 'date');
    }
}
