<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\RendezVous;
use App\Models\Paiement;
use App\Models\ClientPack;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatistiqueController extends Controller
{
    public function dashboard(Request $request)
    {
        $periode = $request->get('periode', 'mois');
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');

        [$start, $end] = $this->getDateRange($periode, $dateDebut, $dateFin);

        return response()->json([
            'revenus' => $this->getRevenus($start, $end),
            'clients' => $this->getStatsClients($start, $end),
            'rendez_vous' => $this->getStatsRendezVous($start, $end),
            'top_prestations' => $this->getTopPrestations($start, $end),
            'top_packs' => $this->getTopPacks($start, $end),
            'graphique_revenus' => $this->getGraphiqueRevenus($start, $end, $periode),
            'taux_conversion' => $this->getTauxConversion($start, $end),
            'periode' => [
                'debut' => $start->format('Y-m-d'),
                'fin' => $end->format('Y-m-d'),
                'label' => $this->getPeriodeLabel($periode, $start, $end)
            ]
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

    private function getRevenus($start, $end)
    {
        $total = Paiement::whereBetween('date_paiement', [$start, $end])->sum('montant_paye');
        $objectif = 50000;
        $pourcentage = $objectif > 0 ? ($total / $objectif) * 100 : 0;

        $periodePrecedente = $start->copy()->subDays($end->diffInDays($start));
        $totalPrecedent = Paiement::whereBetween('date_paiement', [$periodePrecedente, $start->copy()->subDay()])->sum('montant_paye');
        $evolution = $totalPrecedent > 0 ? (($total - $totalPrecedent) / $totalPrecedent) * 100 : 0;

        return [
            'total' => round($total, 2),
            'objectif' => $objectif,
            'pourcentage_objectif' => round($pourcentage, 1),
            'evolution' => round($evolution, 1),
            'en_hausse' => $evolution >= 0
        ];
    }

    private function getStatsClients($start, $end)
    {
        $total = Client::count();
        $nouveaux = Client::whereBetween('created_at', [$start, $end])->count();
        $actifs = Client::whereHas('rendezvous', function($q) use ($start, $end) {
            $q->whereBetween('date_heure', [$start, $end]);
        })->count();

        $periodePrecedente = $start->copy()->subDays($end->diffInDays($start));
        $nouveauxPrecedent = Client::whereBetween('created_at', [$periodePrecedente, $start->copy()->subDay()])->count();
        $evolution = $nouveauxPrecedent > 0 ? (($nouveaux - $nouveauxPrecedent) / $nouveauxPrecedent) * 100 : 0;

        return [
            'total' => $total,
            'nouveaux' => $nouveaux,
            'actifs' => $actifs,
            'evolution' => round($evolution, 1),
            'en_hausse' => $evolution >= 0
        ];
    }

    private function getStatsRendezVous($start, $end)
    {
        $total = RendezVous::whereBetween('date_heure', [$start, $end])->count();
        $confirmes = RendezVous::whereBetween('date_heure', [$start, $end])->where('statut', 'Confirmé')->count();
        $termines = RendezVous::whereBetween('date_heure', [$start, $end])->where('statut', 'Terminé')->count();
        $annules = RendezVous::whereBetween('date_heure', [$start, $end])->where('statut', 'Annulé')->count();
        $tauxAnnulation = $total > 0 ? ($annules / $total) * 100 : 0;

        return [
            'total' => $total,
            'confirmes' => $confirmes,
            'termines' => $termines,
            'annules' => $annules,
            'taux_annulation' => round($tauxAnnulation, 1)
        ];
    }

    private function getTopPrestations($start, $end, $limit = 5)
    {
        $results = Paiement::whereBetween('date_paiement', [$start, $end])
            ->whereNotNull('prestation_id')
            ->select('prestation_id', DB::raw('COUNT(*) as nombre'), DB::raw('SUM(montant_paye) as revenu'))
            ->with('prestation')
            ->groupBy('prestation_id')
            ->orderBy('revenu', 'desc')
            ->limit($limit)
            ->get();

        return $results->map(function($item) {
            return [
                'id' => $item->prestation_id,
                'nom' => $item->prestation->nom ?? 'N/A',
                'nombre' => $item->nombre,
                'revenu' => round($item->revenu, 2)
            ];
        });
    }

    private function getTopPacks($start, $end, $limit = 5)
    {
        $results = ClientPack::whereBetween('date_achat', [$start, $end])
            ->select('pack_id', DB::raw('COUNT(*) as nombre'), DB::raw('SUM(montant_paye) as revenu'))
            ->with('pack')
            ->groupBy('pack_id')
            ->orderBy('revenu', 'desc')
            ->limit($limit)
            ->get();

        return $results->map(function($item) {
            return [
                'id' => $item->pack_id,
                'nom' => $item->pack->nom ?? 'N/A',
                'nombre' => $item->nombre,
                'revenu' => round($item->revenu, 2)
            ];
        });
    }

    private function getGraphiqueRevenus($start, $end, $periode)
    {
        $groupBy = $this->getGroupByFormat($periode);
        
        $revenus = Paiement::whereBetween('date_paiement', [$start, $end])
            ->select(DB::raw($groupBy . ' as periode'), DB::raw('SUM(montant_paye) as montant'))
            ->groupBy('periode')
            ->orderBy('periode')
            ->get();

        return [
            'labels' => $revenus->pluck('periode')->toArray(),
            'data' => $revenus->pluck('montant')->map(fn($m) => round($m, 2))->toArray()
        ];
    }

    private function getGroupByFormat($periode)
    {
        switch ($periode) {
            case 'semaine':
            case 'mois':
                return "DATE_FORMAT(date_paiement, '%Y-%m-%d')";
            case 'trimestre':
            case 'annee':
                return "DATE_FORMAT(date_paiement, '%Y-%m')";
            default:
                return "DATE_FORMAT(date_paiement, '%Y-%m-%d')";
        }
    }

    private function getTauxConversion($start, $end)
    {
        $totalRdv = RendezVous::whereBetween('date_heure', [$start, $end])->count();
        
        // Compte les RDV qui ont un paiement associé via client_id et date
        $clientsAvecPaiement = Paiement::whereBetween('date_paiement', [$start, $end])
            ->distinct('client_id')
            ->pluck('client_id');
        
        $rdvPayes = RendezVous::whereBetween('date_heure', [$start, $end])
            ->whereIn('client_id', $clientsAvecPaiement)
            ->count();

        $taux = $totalRdv > 0 ? ($rdvPayes / $totalRdv) * 100 : 0;

        return [
            'total_rdv' => $totalRdv,
            'rdv_payes' => $rdvPayes,
            'taux' => round($taux, 1)
        ];
    }

    public function export(Request $request)
    {
        $periode = $request->get('periode', 'mois');
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');
        [$start, $end] = $this->getDateRange($periode, $dateDebut, $dateFin);

        $requestClone = new Request(['periode' => $periode, 'date_debut' => $dateDebut, 'date_fin' => $dateFin]);
        $data = json_decode($this->dashboard($requestClone)->getContent());

        $csv = "Statistiques Esthelyna Beauty Center\n\n";
        $csv .= "Période: " . $data->periode->label . "\n";
        $csv .= "Du: " . $data->periode->debut . " Au: " . $data->periode->fin . "\n\n";
        $csv .= "REVENUS\nTotal: " . $data->revenus->total . " DH\n";
        $csv .= "Objectif: " . $data->revenus->objectif . " DH\n";
        $csv .= "Évolution: " . $data->revenus->evolution . "%\n\n";
        $csv .= "CLIENTS\nTotal: " . $data->clients->total . "\n";
        $csv .= "Nouveaux: " . $data->clients->nouveaux . "\n";
        $csv .= "Actifs: " . $data->clients->actifs . "\n\n";

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="statistiques_' . date('Y-m-d') . '.csv"');
    }
}