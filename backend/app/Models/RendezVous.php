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
        'client_pack_id',
        'prestation_id',       // ✅ Remis
        'pack_id',
        'numero_seance',
        'date_heure',
        'duree',
        'statut',
        'notes',
    ];

    protected $casts = [
        'date_heure' => 'datetime',
        'duree' => 'integer',
        'numero_seance' => 'integer',
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

    public function client_pack()
    {
        return $this->belongsTo(ClientPack::class);
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'rendez_vous_id');
    }
}