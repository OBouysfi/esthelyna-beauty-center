<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use App\Models\Client;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index(Request $request)
    {
        $paiements = Paiement::with(['client', 'client_pack.pack', 'rendez_vous.pack'])
            ->orderBy('date_paiement', 'desc')
            ->get();

        return response()->json($paiements);
    }
   public function store(Request $request)
{
    $validated = $request->validate([
        'client_id' => 'required|exists:clients,id',
        'client_pack_id' => 'nullable|exists:client_packs,id',
        'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
        'montant' => 'required|numeric|min:0',
        'date_paiement' => 'required|date',
        'methode' => 'required|in:especes,carte,virement,cheque',
        'notes' => 'nullable|string',
    ]);

    $paiement = Paiement::create($validated);

    // ✅ Marquer automatiquement le RDV comme terminé
    if ($validated['rendez_vous_id']) {
        $rdv = RendezVous::find($validated['rendez_vous_id']);
        if ($rdv && $rdv->statut !== 'termine') {
            $rdv->update(['statut' => 'termine']);
        }
    }

    return response()->json([
        'message' => 'Paiement enregistré avec succès',
        'paiement' => $paiement->load(['client', 'client_pack.pack', 'rendez_vous'])
    ], 201);
}

    public function update(Request $request, Paiement $paiement)
    {
        $validated = $request->validate([
            'montant' => 'sometimes|numeric|min:0',
            'date_paiement' => 'sometimes|date',
            'methode' => 'sometimes|in:especes,carte,virement,cheque',
            'notes' => 'nullable|string',
        ]);

        $paiement->update($validated);

        return response()->json([
            'message' => 'Paiement mis à jour avec succès',
            'paiement' => $paiement->load(['client', 'client_pack.pack', 'rendez_vous'])
        ]);
    }

    public function destroy(Paiement $paiement)
    {
        $paiement->delete();

        return response()->json([
            'message' => 'Paiement supprimé avec succès'
        ]);
    }

    public function stats()
    {
        $totalRevenu = Paiement::sum('montant');
        $paiementsAujourdhui = Paiement::whereDate('date_paiement', today())->sum('montant');
        $paiementsMois = Paiement::whereMonth('date_paiement', now()->month)
            ->whereYear('date_paiement', now()->year)
            ->sum('montant');
        $nombrePaiements = Paiement::count();

        return response()->json([
            'total_revenu' => $totalRevenu,
            'paiements_aujourdhui' => $paiementsAujourdhui,
            'paiements_mois' => $paiementsMois,
            'nombre_paiements' => $nombrePaiements,
        ]);
    }
}