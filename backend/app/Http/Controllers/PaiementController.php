<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index(Request $request)
    {
        $query = Paiement::with(['client', 'prestation', 'pack'])
            ->orderBy('date_paiement', 'desc');

        // Filtres
        if ($request->has('statut') && $request->statut !== 'all') {
            $query->where('statut', $request->statut);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_paiement', [$request->date_debut, $request->date_fin]);
        }

        $paiements = $query->get();

        return response()->json($paiements);
    }

    public function search(Request $request)
    {
        $query = $request->q;
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }
        
        $clients = Client::where('nom', 'like', "%{$query}%")
            ->orWhere('prenom', 'like', "%{$query}%")
            ->orWhere('telephone', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->limit(10) // IMPORTANT: Max 10 résultats
            ->select('id', 'nom', 'prenom', 'telephone', 'email') 
            ->get();

        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'prestation_id' => 'nullable|exists:prestations,id',
            'pack_id' => 'nullable|exists:packs,id',
            'montant_total' => 'required|numeric|min:0',
            'montant_paye' => 'required|numeric|min:0',
            'date_paiement' => 'required|date',
            'methode_paiement' => 'required|in:Espèces,Carte,Virement,Chèque',
            'notes' => 'nullable|string',
        ]);

        // Calculer le reste et le statut
        $reste = $validated['montant_total'] - $validated['montant_paye'];
        
        if ($reste <= 0) {
            $statut = 'Payé';
            $reste = 0;
        } elseif ($validated['montant_paye'] > 0) {
            $statut = 'Partiel';
        } else {
            $statut = 'Impayé';
        }

        $validated['reste'] = $reste;
        $validated['statut'] = $statut;

        $paiement = Paiement::create($validated);

        return response()->json([
            'message' => 'Paiement enregistré avec succès',
            'paiement' => $paiement->load(['client', 'prestation', 'pack'])
        ], 201);
    }

    public function update(Request $request, Paiement $paiement)
    {
        $validated = $request->validate([
            'montant_paye' => 'sometimes|numeric|min:0',
            'date_paiement' => 'sometimes|date',
            'methode_paiement' => 'sometimes|in:Espèces,Carte,Virement,Chèque',
            'notes' => 'nullable|string',
        ]);

        // Recalculer si montant_paye change
        if (isset($validated['montant_paye'])) {
            $reste = $paiement->montant_total - $validated['montant_paye'];
            
            if ($reste <= 0) {
                $validated['statut'] = 'Payé';
                $validated['reste'] = 0;
            } elseif ($validated['montant_paye'] > 0) {
                $validated['statut'] = 'Partiel';
                $validated['reste'] = $reste;
            } else {
                $validated['statut'] = 'Impayé';
                $validated['reste'] = $reste;
            }
        }

        $paiement->update($validated);

        return response()->json([
            'message' => 'Paiement mis à jour',
            'paiement' => $paiement->load(['client', 'prestation', 'pack'])
        ]);
    }

    public function destroy(Paiement $paiement)
    {
        $paiement->delete();

        return response()->json([
            'message' => 'Paiement supprimé'
        ]);
    }

    public function stats()
    {
        $totalRevenu = Paiement::sum('montant_paye');
        $totalImpaye = Paiement::where('statut', '!=', 'Payé')->sum('reste');
        $paiementsAujourdhui = Paiement::whereDate('date_paiement', today())->sum('montant_paye');
        $paiementsMois = Paiement::whereMonth('date_paiement', now()->month)
            ->whereYear('date_paiement', now()->year)
            ->sum('montant_paye');

        return response()->json([
            'total_revenu' => $totalRevenu,
            'total_impaye' => $totalImpaye,
            'paiements_aujourdhui' => $paiementsAujourdhui,
            'paiements_mois' => $paiementsMois,
        ]);
    }

    public function ajouterPaiement(Request $request, Paiement $paiement)
    {
        $validated = $request->validate([
            'montant' => 'required|numeric|min:0',
            'methode' => 'required|in:Espèces,Carte,Virement,Chèque',
        ]);

        $nouveauMontantPaye = $paiement->montant_paye + $validated['montant'];
        $reste = $paiement->montant_total - $nouveauMontantPaye;

        if ($reste <= 0) {
            $statut = 'Payé';
            $reste = 0;
        } else {
            $statut = 'Partiel';
        }

        $paiement->update([
            'montant_paye' => $nouveauMontantPaye,
            'reste' => $reste,
            'statut' => $statut,
            'methode_paiement' => $validated['methode'],
        ]);

        return response()->json([
            'message' => 'Paiement ajouté avec succès',
            'paiement' => $paiement->load(['client', 'prestation', 'pack'])
        ]);
    }

    public function analytics(Request $request)
    {
        $periode = $request->periode ?? 'mois';
        
        $data = [];
        
        switch ($periode) {
            case 'mois':
                // Ce mois
                $data['montant'] = Paiement::whereYear('date_paiement', now()->year)
                    ->whereMonth('date_paiement', now()->month)
                    ->sum('montant_paye');
                $data['label'] = 'Ce Mois';
                break;
                
            case '3mois':
                // 3 derniers mois
                $dateDebut = now()->subMonths(3)->startOfDay();
                $data['montant'] = Paiement::where('date_paiement', '>=', $dateDebut)
                    ->sum('montant_paye');
                $data['label'] = '3 Derniers Mois';
                break;
                
            case '6mois':
                // 6 derniers mois
                $dateDebut = now()->subMonths(6)->startOfDay();
                $data['montant'] = Paiement::where('date_paiement', '>=', $dateDebut)
                    ->sum('montant_paye');
                $data['label'] = '6 Derniers Mois';
                break;
                
            case 'annee':
                // Cette année
                $data['montant'] = Paiement::whereYear('date_paiement', now()->year)
                    ->sum('montant_paye');
                $data['label'] = 'Année ' . now()->year;
                break;
                
            case 'annee_precedente':
                // Année précédente
                $data['montant'] = Paiement::whereYear('date_paiement', now()->year - 1)
                    ->sum('montant_paye');
                $data['label'] = 'Année ' . (now()->year - 1);
                break;
                
            case 'total':
                // Tout
                $data['montant'] = Paiement::sum('montant_paye');
                $data['label'] = 'Total (Historique)';
                break;
        }
        
        return response()->json([
            'periode_data' => $data,
        ]);
    }
}