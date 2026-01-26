<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Paiement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id',
        'client_pack_id',
        'rendez_vous_id',
        'montant',
        'date_paiement',
        'methode',
        'notes',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function client_pack()
    {
        return $this->belongsTo(ClientPack::class);
    }

    public function rendez_vous()
    {
        return $this->belongsTo(RendezVous::class);
    }
}