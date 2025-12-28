<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RendezVous extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'client_id',
        'prestation_id',
        'pack_id',
        'seance_numero',
        'date_heure',
        'duree',
        'statut',
        'assistante_id',
        'notes',
    ];

    protected $casts = [
        'date_heure' => 'datetime',
        'duree' => 'integer',
        'seance_numero' => 'integer',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function prestation()
    {
        return $this->belongsTo(Prestation::class);
    }

    public function pack()
    {
        return $this->belongsTo(Pack::class);
    }

    public function assistante()
    {
        return $this->belongsTo(User::class, 'assistante_id');
    }

    // AJOUTE CETTE RELATION!
    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'rendez_vous_id');
    }
}