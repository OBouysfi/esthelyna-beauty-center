<?php

namespace App\Http\Controllers;

use App\Models\ClientPack;
use App\Models\Seance;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ClientPackController extends Controller
{
    public function index(Request $request)
    {
        $query = ClientPack::with(['client', 'pack', 'seances.prestation', 'paiement']);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('statut') && $request->statut !== 'all') {
            $query->where('statut', $request->statut);
        }

        $clientPacks = $query->orderBy('created_at', 'desc')->get();

        return response()->json($clientPacks);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'pack_id' => 'required|exists:packs,id',
            'date_achat' => 'required|date',
            'montant_total' => 'required|numeric|min:0',
            'montant_paye' => 'required|numeric|min:0',
            'methode_paiement' => 'required|in:Espèces,Carte,Virement,Chèque',
        ]);

        $pack = \App\Models\Pack::findOrFail($validated['pack_id']);

        $dateExpiration = Carbon::parse($validated['date_achat'])
            ->addDays($pack->validite_jours);

        // Créer le paiement associé
        $paiement = \App\Models\Paiement::create([
            'client_id' => $validated['client_id'],
            'pack_id' => $validated['pack_id'],
            'montant_total' => $validated['montant_total'],
            'montant_paye' => $validated['montant_paye'],
            'reste' => $validated['montant_total'] - $validated['montant_paye'],
            'date_paiement' => $validated['date_achat'],
            'methode_paiement' => $validated['methode_paiement'],
            'statut' => ($validated['montant_total'] - $validated['montant_paye']) <= 0 ? 'Payé' : 'Partiel',
        ]);

        // Créer le client pack
        $clientPack = ClientPack::create([
            'client_id' => $validated['client_id'],
            'pack_id' => $validated['pack_id'],
            'paiement_id' => $paiement->id,
            'date_achat' => $validated['date_achat'],
            'date_expiration' => $dateExpiration,
            'nombre_seances_total' => $pack->nombre_seances_total,
            'nombre_seances_consommees' => 0,
            'nombre_seances_restantes' => $pack->nombre_seances_total,
            'montant_total' => $validated['montant_total'],
            'montant_paye' => $validated['montant_paye'],
            'statut' => 'En cours',
        ]);

        return response()->json([
            'message' => 'Pack attribué avec succès',
            'client_pack' => $clientPack->load(['client', 'pack', 'paiement'])
        ], 201);
    }

    public function consommerSeance(Request $request, ClientPack $clientPack)
    {
        $validated = $request->validate([
            'date_seance' => 'required|date',
            'prestation_id' => 'nullable|exists:prestations,id',
            'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
            'notes' => 'nullable|string',
        ]);

        if ($clientPack->nombre_seances_restantes <= 0) {
            return response()->json([
                'message' => 'Aucune séance restante'
            ], 422);
        }

        if ($clientPack->statut !== 'En cours') {
            return response()->json([
                'message' => 'Ce pack n\'est plus actif'
            ], 422);
        }

        // Créer la séance
        $seance = Seance::create([
            'client_pack_id' => $clientPack->id,
            'rendez_vous_id' => $validated['rendez_vous_id'] ?? null,
            'prestation_id' => $validated['prestation_id'] ?? null,
            'date_seance' => $validated['date_seance'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Mettre à jour le pack
        $clientPack->nombre_seances_consommees += 1;
        $clientPack->nombre_seances_restantes -= 1;

        if ($clientPack->nombre_seances_restantes <= 0) {
            $clientPack->statut = 'Terminé';
        }

        $clientPack->save();

        return response()->json([
            'message' => 'Séance consommée avec succès',
            'client_pack' => $clientPack->load(['client', 'pack', 'seances']),
            'seance' => $seance
        ]);
    }

    public function stats()
    {
        $total = ClientPack::count();
        $enCours = ClientPack::where('statut', 'En cours')->count();
        $termines = ClientPack::where('statut', 'Terminé')->count();
        $expires = ClientPack::where('statut', 'Expiré')->count();

        return response()->json([
            'total' => $total,
            'en_cours' => $enCours,
            'termines' => $termines,
            'expires' => $expires,
        ]);
    }

    public function deleteSeance($id)
    {
        try {
            DB::beginTransaction();
            
            $seance = \App\Models\Seance::findOrFail($id);
            $clientPackId = $seance->client_pack_id;
            
            // Supprimer la séance
            $seance->delete();
            
            // Recalculer le nombre de séances consommées et restantes
            $clientPack = ClientPack::findOrFail($clientPackId);
            $nbSeancesConsommees = \App\Models\Seance::where('client_pack_id', $clientPackId)->count();
            
            $clientPack->nombre_seances_consommees = $nbSeancesConsommees;
            $clientPack->nombre_seances_restantes = $clientPack->nombre_seances_total - $nbSeancesConsommees;
            
            // Mettre à jour le statut si nécessaire
            if ($clientPack->nombre_seances_restantes > 0 && $clientPack->statut === 'Terminé') {
                $clientPack->statut = 'En cours';
            }
            
            $clientPack->save();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Séance supprimée avec succès',
                'client_pack' => $clientPack->load('seances.prestation')
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateSeance(Request $request, $id)
    {
        try {
            $seance = \App\Models\Seance::findOrFail($id);
            
            $validated = $request->validate([
                'prestation_id' => 'nullable|exists:prestations,id',
                'date_seance' => 'required|date',
                'notes' => 'nullable|string'
            ]);
            
            $seance->update($validated);
            
            return response()->json([
                'message' => 'Séance modifiée avec succès',
                'seance' => $seance->load('prestation')
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la modification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}