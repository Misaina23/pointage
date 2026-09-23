<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Horloge extends Model
{
    use HasFactory;
    
    // Déclarez les champs que vous pouvez remplir en masse
    protected $fillable = ['heure_arrivee', 'heure_depart'];
}
