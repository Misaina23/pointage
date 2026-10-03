<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AbsenceType extends Model
{
    protected $fillable = ['name', 'code', 'requires_attachment', 'is_active'];

    protected function casts(): array
    {
        return ['requires_attachment' => 'boolean', 'is_active' => 'boolean'];
    }

    public function records(): HasMany
    {
        return $this->hasMany(AbsenceRecord::class);
    }
}
