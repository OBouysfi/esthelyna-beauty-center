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
        'prestation_id',
        'pack_id',
        'montant_total',
        'montant_paye',
        'reste',
        'date_paiement',
        'methode_paiement',
        'statut',
        'notes',
    ];

    protected $casts = [
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'reste' => 'decimal:2',
        'date_paiement' => 'date',
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
}