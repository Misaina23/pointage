<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Personnel extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'direction_id',
        'service',
        'grade',
        'corp',
        'fonction',
        'IM',
        'email',
        'photo',
        'password',
        'qr_code',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function direction()
    {
        return $this->belongsTo(Direction::class);
    }

    public function pointages()
    {
        return $this->hasMany(Pointage::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function isSecurity(): bool
    {
        return $this->role === 'security';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }
}