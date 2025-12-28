<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seance extends Model
{
    protected $fillable = [
        'client_pack_id',
        'rendez_vous_id',
        'prestation_id',
        'date_seance',
        'notes',
    ];

    protected $casts = [
        'date_seance' => 'date',
    ];

    public function clientPack()
    {
        return $this->belongsTo(ClientPack::class);
    }

    public function rendezVous()
    {
        return $this->belongsTo(RendezVous::class);
    }

    public function prestation()
    {
        return $this->belongsTo(Prestation::class);
    }
}