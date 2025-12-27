<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prestation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'description',
        'prix',
        'duree',
        'categorie',
        'actif',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'duree' => 'integer',
        'actif' => 'boolean',
    ];

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }

    public function packs()
    {
        return $this->belongsToMany(Pack::class, 'pack_prestations')
            ->withPivot('nombre_seances')
            ->withTimestamps();
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }
}