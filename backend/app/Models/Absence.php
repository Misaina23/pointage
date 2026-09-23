<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    use HasFactory;

    protected $fillable = [
        'personnel_id', 'date_debut', 'date_fin', 'annee', 'lieu', 'motif', 'etat'
    ];

    public function personnel()
    {
        return $this->belongsTo(Personnel::class);
    }
}