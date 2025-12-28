<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderBy('created_at', 'desc')->get();

        return response()->json($clients);
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'required|string|max:20|unique:clients,telephone',
            'email' => 'nullable|email|max:255|unique:clients,email',
            'adresse' => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'notes' => 'nullable|string',
        ], [
            'telephone.unique' => 'Ce numéro de téléphone existe déjà',
            'email.unique' => 'Cet email existe déjà',
        ]);

        $client = Client::create($validated);

        return response()->json([
            'message' => 'Client créé avec succès',
            'client' => $client
        ], 201);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'telephone' => 'sometimes|string|max:20|unique:clients,telephone,' . $client->id,
            'email' => 'nullable|email|max:255|unique:clients,email,' . $client->id,
            'adresse' => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'notes' => 'nullable|string',
        ], [
            'telephone.unique' => 'Ce numéro de téléphone existe déjà',
            'email.unique' => 'Cet email existe déjà',
        ]);

        $client->update($validated);

        return response()->json([
            'message' => 'Client mis à jour',
            'client' => $client
        ]);
    }
    public function show(Client $client)
    {
        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return response()->json([
            'message' => 'Client supprimé'
        ]);
    }

    public function stats()
    {
        $total = Client::count();
        $nouveaux = Client::whereMonth('created_at', now()->month)->count();
        $actifs = Client::whereHas('rendezVous', function($q) {
            $q->whereMonth('date_heure', now()->month);
        })->count();

        return response()->json([
            'total' => $total,
            'nouveaux' => $nouveaux,
            'actifs' => $actifs,
        ]);
    }
}