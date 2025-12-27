<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pack extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'description',
        'prix',
        'nombre_seances_total',
        'actif',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'nombre_seances_total' => 'integer',
        'actif' => 'boolean',
    ];

    public function prestations()
    {
        return $this->belongsToMany(Prestation::class, 'pack_prestations')
            ->withPivot('nombre_seances')
            ->withTimestamps();
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }
}