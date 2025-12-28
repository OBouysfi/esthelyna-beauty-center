<?php

namespace App\Http\Controllers;

use App\Models\Prestation;
use Illuminate\Http\Request;

class PrestationController extends Controller
{
    public function index(Request $request)
    {
        $query = Prestation::query();

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('categorie', 'like', "%{$search}%");
            });
        }

        // Filtre catégorie
        if ($request->has('categorie') && $request->categorie !== 'all') {
            $query->where('categorie', $request->categorie);
        }

        // Filtre actif
        if ($request->has('actif') && $request->actif !== 'all') {
            $query->where('actif', $request->actif === '1');
        }

        $prestations = $query->orderBy('categorie')->orderBy('nom')->get();

        return response()->json($prestations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:prestations,nom',
            'categorie' => 'required|string|max:100',
            'prix' => 'required|numeric|min:0',
            'duree' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'actif' => 'boolean',
        ], [
            'nom.unique' => 'Cette prestation existe déjà',
            'prix.min' => 'Le prix doit être supérieur à 0',
            'duree.min' => 'La durée doit être supérieure à 0',
        ]);

        $validated['actif'] = $validated['actif'] ?? true;

        $prestation = Prestation::create($validated);

        return response()->json([
            'message' => 'Prestation créée avec succès',
            'prestation' => $prestation
        ], 201);
    }

    public function update(Request $request, Prestation $prestation)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255|unique:prestations,nom,' . $prestation->id,
            'categorie' => 'sometimes|string|max:100',
            'prix' => 'sometimes|numeric|min:0',
            'duree' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'actif' => 'sometimes|boolean',
        ], [
            'nom.unique' => 'Cette prestation existe déjà',
            'prix.min' => 'Le prix doit être supérieur à 0',
            'duree.min' => 'La durée doit être supérieure à 0',
        ]);

        $prestation->update($validated);

        return response()->json([
            'message' => 'Prestation mise à jour',
            'prestation' => $prestation
        ]);
    }

    public function destroy(Prestation $prestation)
    {
        $prestation->delete();

        return response()->json([
            'message' => 'Prestation supprimée'
        ]);
    }

    public function stats()
    {
        $total = Prestation::count();
        $actives = Prestation::where('actif', true)->count();
        $categories = Prestation::select('categorie')
            ->groupBy('categorie')
            ->get()
            ->pluck('categorie');

        return response()->json([
            'total' => $total,
            'actives' => $actives,
            'categories' => $categories,
        ]);
    }

    public function toggleActif(Prestation $prestation)
    {
        $prestation->update(['actif' => !$prestation->actif]);

        return response()->json([
            'message' => 'Statut mis à jour',
            'prestation' => $prestation
        ]);
    }
}