<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\RendezVous;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StatistiqueController extends Controller
{
    public function dashboard(Request $request)
    {
        $periode = $request->get('periode', 'mois');
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');

        [$start, $end] = $this->getDateRange($periode, $dateDebut, $dateFin);

        // Période précédente pour comparaison
        $duree = $start->diffInDays($end);
        $startPrecedent = $start->copy()->subDays($duree);
        $endPrecedent = $end->copy()->subDays($duree);

        // Revenus
        $revenusTotal = Paiement::whereBetween('date_paiement', [$start, $end])->sum('montant');
        $revenusPrecedent = Paiement::whereBetween('date_paiement', [$startPrecedent, $endPrecedent])->sum('montant');
        $evolutionRevenus = $revenusPrecedent > 0 ? round((($revenusTotal - $revenusPrecedent) / $revenusPrecedent) * 100, 1) : 0;

        // Clients
        $totalClients = Client::count();
        $nouveauxClients = Client::whereBetween('created_at', [$start, $end])->count();
        $nouveauxPrecedent = Client::whereBetween('created_at', [$startPrecedent, $endPrecedent])->count();
        $evolutionClients = $nouveauxPrecedent > 0 ? round((($nouveauxClients - $nouveauxPrecedent) / $nouveauxPrecedent) * 100, 1) : 0;
        
        $clientsActifs = Client::whereHas('rendezVous', function($q) use ($start, $end) {
            $q->whereBetween('date_heure', [$start, $end]);
        })->count();

        // Rendez-vous
        $totalRdv = RendezVous::whereBetween('date_heure', [$start, $end])->count();
        $rdvTermines = RendezVous::whereBetween('date_heure', [$start, $end])
            ->where('statut', 'termine')->count();
        $rdvAnnules = RendezVous::whereBetween('date_heure', [$start, $end])
            ->where('statut', 'annule')->count();
        $tauxAnnulation = $totalRdv > 0 ? round(($rdvAnnules / $totalRdv) * 100, 1) : 0;

        // Taux de conversion
        $rdvPayes = Paiement::whereBetween('date_paiement', [$start, $end])->count();
        $tauxConversion = $totalRdv > 0 ? round(($rdvPayes / $totalRdv) * 100, 1) : 0;

        // Graphique revenus
        $graphiqueRevenus = $this->getGraphiqueRevenus($start, $end, $periode);

        // Top 5 packs par revenu
        $topPrestations = Paiement::with('rendez_vous.pack')
            ->whereBetween('date_paiement', [$start, $end])
            ->get()
            ->groupBy(function($p) {
                return $p->rendez_vous?->pack?->nom ?? 'Autre';
            })
            ->map(function($group, $nom) {
                return [
                    'nom' => $nom,
                    'revenu' => $group->sum('montant')
                ];
            })
            ->sortByDesc('revenu')
            ->take(5)
            ->values();

        return response()->json([
            'periode' => [
                'type' => $periode,
                'label' => $this->getPeriodeLabel($periode, $start, $end),
                'debut' => $start->toDateString(),
                'fin' => $end->toDateString()
            ],
            'revenus' => [
                'total' => round($revenusTotal, 2),
                'evolution' => $evolutionRevenus,
                'en_hausse' => $evolutionRevenus >= 0
            ],
            'clients' => [
                'total' => $totalClients,
                'nouveaux' => $nouveauxClients,
                'actifs' => $clientsActifs,
                'evolution' => $evolutionClients,
                'en_hausse' => $evolutionClients >= 0
            ],
            'rendez_vous' => [
                'total' => $totalRdv,
                'termines' => $rdvTermines,
                'annules' => $rdvAnnules,
                'taux_annulation' => $tauxAnnulation
            ],
            'taux_conversion' => [
                'taux' => $tauxConversion,
                'rdv_payes' => $rdvPayes,
                'total_rdv' => $totalRdv
            ],
            'graphique_revenus' => $graphiqueRevenus,
            'top_prestations' => $topPrestations
        ]);
    }

    private function getDateRange($periode, $dateDebut, $dateFin)
    {
        $now = Carbon::now();

        switch ($periode) {
            case 'semaine':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];
            case 'mois':
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
            case 'trimestre':
                return [$now->copy()->startOfQuarter(), $now->copy()->endOfQuarter()];
            case 'annee':
                return [$now->copy()->startOfYear(), $now->copy()->endOfYear()];
            case 'personnalise':
                if ($dateDebut && $dateFin) {
                    return [Carbon::parse($dateDebut), Carbon::parse($dateFin)];
                }
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
            default:
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
        }
    }

    private function getPeriodeLabel($periode, $start, $end)
    {
        switch ($periode) {
            case 'semaine': return 'Cette semaine';
            case 'mois': return 'Ce mois';
            case 'trimestre': return 'Ce trimestre';
            case 'annee': return 'Cette année';
            case 'personnalise': return $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y');
            default: return 'Période';
        }
    }

    private function getGraphiqueRevenus($start, $end, $periode)
    {
        $labels = [];
        $data = [];

        if ($periode === 'semaine') {
            // Par jour
            for ($date = $start->copy(); $date <= $end; $date->addDay()) {
                $labels[] = $date->isoFormat('ddd');
                $data[] = Paiement::whereDate('date_paiement', $date)->sum('montant');
            }
        } elseif ($periode === 'mois') {
            // Par semaine
            for ($i = 0; $i < 4; $i++) {
                $weekStart = $start->copy()->addWeeks($i);
                $weekEnd = $weekStart->copy()->addWeek();
                $labels[] = 'Sem ' . ($i + 1);
                $data[] = Paiement::whereBetween('date_paiement', [$weekStart, $weekEnd])->sum('montant');
            }
        } else {
            // Par mois
            $currentMonth = $start->copy()->startOfMonth();
            while ($currentMonth <= $end) {
                $labels[] = $currentMonth->isoFormat('MMM');
                $monthEnd = $currentMonth->copy()->endOfMonth();
                $data[] = Paiement::whereBetween('date_paiement', [$currentMonth, $monthEnd])->sum('montant');
                $currentMonth->addMonth();
            }
        }

        return [
            'labels' => $labels,
            'data' => array_map(fn($m) => round($m, 2), $data)
        ];
    }

    public function export(Request $request)
    {
        $periode = $request->get('periode', 'mois');
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');
        
        [$start, $end] = $this->getDateRange($periode, $dateDebut, $dateFin);

        $paiements = Paiement::with(['client', 'rendez_vous.pack'])
            ->whereBetween('date_paiement', [$start, $end])
            ->orderBy('date_paiement', 'desc')
            ->get();

        $csv = "Date,Client,Pack,Montant,Méthode\n";
        
        foreach ($paiements as $p) {
            $csv .= sprintf(
                "%s,%s %s,%s,%s,%s\n",
                $p->date_paiement->format('d/m/Y'),
                $p->client->prenom,
                $p->client->nom,
                $p->rendez_vous?->pack?->nom ?? '-',
                $p->montant,
                $p->methode
            );
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="statistiques_' . date('Y-m-d') . '.csv"');
    }
}