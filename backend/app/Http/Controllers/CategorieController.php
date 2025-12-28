<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use Illuminate\Http\Request;

class CategorieController extends Controller
{
    public function index()
    {
        $categories = Categorie::where('actif', true)
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get();
        
        return response()->json($categories);
    }

    public function all()
    {
        $categories = Categorie::orderBy('ordre')->orderBy('nom')->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:categories,nom',
            'actif' => 'boolean',
            'ordre' => 'integer',
        ], [
            'nom.unique' => 'Cette catégorie existe déjà',
        ]);

        $validated['actif'] = $validated['actif'] ?? true;
        $validated['ordre'] = $validated['ordre'] ?? Categorie::max('ordre') + 1;

        $categorie = Categorie::create($validated);

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'categorie' => $categorie
        ], 201);
    }

    public function update(Request $request, Categorie $categorie)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100|unique:categories,nom,' . $categorie->id,
            'actif' => 'sometimes|boolean',
            'ordre' => 'sometimes|integer',
        ]);

        $categorie->update($validated);

        return response()->json([
            'message' => 'Catégorie mise à jour',
            'categorie' => $categorie
        ]);
    }

    public function destroy(Categorie $categorie)
    {
        // Vérifier si des prestations utilisent cette catégorie
        $count = \App\Models\Prestation::where('categorie', $categorie->nom)->count();
        
        if ($count > 0) {
            return response()->json([
                'message' => "Impossible de supprimer: {$count} prestation(s) utilisent cette catégorie"
            ], 422);
        }

        $categorie->delete();

        return response()->json([
            'message' => 'Catégorie supprimée'
        ]);
    }

    public function toggleActif(Categorie $categorie)
    {
        $categorie->update(['actif' => !$categorie->actif]);

        return response()->json([
            'message' => 'Statut mis à jour',
            'categorie' => $categorie
        ]);
    }
}