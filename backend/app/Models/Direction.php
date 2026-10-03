<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Direction extends Model
{
    protected $fillable = ['name', 'code', 'description', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function scopeWithEmployeeCount(Builder $query): Builder
    {
        return $query->addSelect([
            'employees_count' => Employee::query()
                ->selectRaw('count(*)')
                ->where(function (Builder $employees): void {
                    $employees->whereColumn('employees.direction_id', 'directions.id')
                        ->orWhereHas('department', fn (Builder $departments) => $departments
                            ->whereColumn('departments.direction_id', 'directions.id'));
                }),
        ]);
    }
}
