<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Direction extends Model
{
    use HasFactory;

    protected $fillable = ["nom","description"];

    public function personnels()
    {
        return $this->hasMany(Personnel::class);
    }
}
