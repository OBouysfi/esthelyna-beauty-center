<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientPack extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'pack_id',
        'date_achat',
        'date_expiration',
        'nombre_seances_total',
        'nombre_seances_consommees',
        'nombre_seances_restantes',
        'montant_total',
        'montant_paye',
        'statut',
    ];

    protected $casts = [
        'date_achat' => 'date',
        'date_expiration' => 'date',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function pack()
    {
        return $this->belongsTo(Pack::class);
    }

    public function seances()
    {
        return $this->hasMany(Seance::class);
    }

    public function paiement()
    {
        return $this->belongsTo(Paiement::class);
    }
}