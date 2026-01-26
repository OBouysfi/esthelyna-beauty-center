<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
        'email',
        'adresse',
        'date_naissance',
        'notes',
    ];

    protected $casts = [
        'date_naissance' => 'date',
    ];

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function getNomCompletAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }
    public function clientPacks()
    {
        return $this->hasMany(ClientPack::class);
    }
}