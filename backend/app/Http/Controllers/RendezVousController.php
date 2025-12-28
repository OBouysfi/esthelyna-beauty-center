<?php

namespace App\Http\Controllers;

use App\Models\RendezVous;
use App\Models\Client;
use App\Models\Prestation;
use App\Models\Pack;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RendezVousController extends Controller
{
    public function index(Request $request)
    {
        $query = RendezVous::with(['client', 'prestation', 'pack', 'assistante'])
            ->orderBy('date_heure', 'desc');

        // Filtres
        if ($request->has('date')) {
            $date = Carbon::parse($request->date);
            $query->whereDate('date_heure', $date);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $rendezVous = $query->paginate(20);

        return response()->json($rendezVous);
    }

    public function search(Request $request)
    {
        $query = $request->q;
        
        $clients = Client::where('nom', 'like', "%{$query}%")
            ->orWhere('prenom', 'like', "%{$query}%")
            ->orWhere('telephone', 'like', "%{$query}%")
            ->limit(10)
            ->get();

        return response()->json($clients);
    }

    public function calendar(Request $request)
    {
        $start = $request->start ?? Carbon::now()->startOfMonth();
        $end = $request->end ?? Carbon::now()->endOfMonth();

        $rendezVous = RendezVous::with(['client', 'prestation', 'pack'])
            ->whereBetween('date_heure', [$start, $end])
            ->get()
            ->map(function ($rdv) {
                return [
                    'id' => $rdv->id,
                    'title' => $rdv->client->nom_complet . ' - ' . ($rdv->prestation?->nom ?? $rdv->pack?->nom),
                    'start' => $rdv->date_heure,
                    'end' => Carbon::parse($rdv->date_heure)->addMinutes($rdv->duree),
                    'status' => $rdv->statut,
                    'client' => $rdv->client->nom_complet,
                    'service' => $rdv->prestation?->nom ?? $rdv->pack?->nom,
                    'phone' => $rdv->client->telephone,
                ];
            });

        return response()->json($rendezVous);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'prestation_id' => 'nullable|exists:prestations,id',
            'pack_id' => 'nullable|exists:packs,id',
            'seance_numero' => 'nullable|integer',
            'date_heure' => 'required|date',
            'duree' => 'required|integer',
            'notes' => 'nullable|string',
        ]);

        $validated['statut'] = 'Planifié';
        $validated['assistante_id'] = auth()->id();

        $rendezVous = RendezVous::create($validated);

        return response()->json([
            'message' => 'Rendez-vous créé avec succès',
            'rendez_vous' => $rendezVous->load(['client', 'prestation', 'pack'])
        ], 201);
    }

    public function update(Request $request, RendezVous $rendezVous)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'prestation_id' => 'nullable|exists:prestations,id',
            'pack_id' => 'nullable|exists:packs,id',
            'date_heure' => 'sometimes|date',
            'duree' => 'sometimes|integer',
            'statut' => 'sometimes|in:Planifié,Confirmé,Terminé,Annulé,NoShow',
            'notes' => 'nullable|string',
        ]);

        $rendezVous->update($validated);

        return response()->json([
            'message' => 'Rendez-vous mis à jour',
            'rendez_vous' => $rendezVous->load(['client', 'prestation', 'pack'])
        ]);
    }

    public function updateStatus(Request $request, RendezVous $rendezVous)
    {
        $validated = $request->validate([
            'statut' => 'required|in:Planifié,Confirmé,Terminé,Annulé,NoShow',
        ]);

        $rendezVous->update(['statut' => $validated['statut']]);

        return response()->json([
            'message' => 'Statut mis à jour',
            'rendez_vous' => $rendezVous
        ]);
    }

    public function destroy(RendezVous $rendezVous)
    {
        $rendezVous->delete();

        return response()->json([
            'message' => 'Rendez-vous supprimé'
        ]);
    }

    public function disponibilites(Request $request)
    {
        $date = $request->date;
        $duree = $request->duree ?? 60;

        if (!$date) {
            return response()->json([
                'message' => 'Date requise'
            ], 400);
        }

        try {
            $rdvDuJour = RendezVous::whereDate('date_heure', $date)
                ->whereNotIn('statut', ['Annulé'])
                ->get();

            $heures = [];
            for ($h = 9; $h < 19; $h++) {
                for ($m = 0; $m < 60; $m += 30) { // Créneaux de 30 min
                    $heure = sprintf('%02d:%02d', $h, $m);
                    $disponible = true;

                    foreach ($rdvDuJour as $rdv) {
                        $rdvHeure = date('H:i', strtotime($rdv->date_heure));
                        
                        // Vérifier le chevauchement
                        if ($heure === $rdvHeure) {
                            $disponible = false;
                            break;
                        }
                    }

                    $heures[] = [
                        'heure' => $heure,
                        'disponible' => $disponible
                    ];
                }
            }

            return response()->json($heures);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul des disponibilités',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}