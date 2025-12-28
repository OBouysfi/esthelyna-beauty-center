<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $fillable = ['nom', 'actif', 'ordre'];

    protected $casts = [
        'actif' => 'boolean',
    ];
}