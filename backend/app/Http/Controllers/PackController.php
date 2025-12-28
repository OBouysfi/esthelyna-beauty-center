<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use Illuminate\Http\Request;

class PackController extends Controller
{
    public function index()
    {
        $packs = Pack::with('prestations')->get();
        return response()->json($packs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix' => 'required|numeric|min:0',
            'nombre_seances_total' => 'required|integer|min:1',
            'validite_jours' => 'required|integer|min:1',
            'actif' => 'boolean',
            'prestations' => 'nullable|array',
            'prestations.*.prestation_id' => 'required|exists:prestations,id',
            'prestations.*.nombre_seances' => 'required|integer|min:1',
        ]);

        $pack = Pack::create([
            'nom' => $validated['nom'],
            'description' => $validated['description'],
            'prix' => $validated['prix'],
            'nombre_seances_total' => $validated['nombre_seances_total'],
            'validite_jours' => $validated['validite_jours'],
            'actif' => $validated['actif'] ?? true,
        ]);

        if (isset($validated['prestations'])) {
            foreach ($validated['prestations'] as $prestation) {
                $pack->prestations()->attach($prestation['prestation_id'], [
                    'nombre_seances' => $prestation['nombre_seances']
                ]);
            }
        }

        return response()->json([
            'message' => 'Pack créé avec succès',
            'pack' => $pack->load('prestations')
        ], 201);
    }

    public function update(Request $request, Pack $pack)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'prix' => 'sometimes|numeric|min:0',
            'nombre_seances_total' => 'sometimes|integer|min:1',
            'validite_jours' => 'sometimes|integer|min:1',
            'actif' => 'boolean',
            'prestations' => 'nullable|array',
            'prestations.*.prestation_id' => 'required|exists:prestations,id',
            'prestations.*.nombre_seances' => 'required|integer|min:1',
        ]);

        $pack->update($validated);

        if (isset($validated['prestations'])) {
            $pack->prestations()->detach();
            foreach ($validated['prestations'] as $prestation) {
                $pack->prestations()->attach($prestation['prestation_id'], [
                    'nombre_seances' => $prestation['nombre_seances']
                ]);
            }
        }

        return response()->json([
            'message' => 'Pack mis à jour',
            'pack' => $pack->load('prestations')
        ]);
    }

    public function destroy(Pack $pack)
    {
        $pack->delete();
        return response()->json(['message' => 'Pack supprimé']);
    }

    public function toggleActif(Pack $pack)
    {
        $pack->update(['actif' => !$pack->actif]);
        return response()->json([
            'message' => 'Statut mis à jour',
            'pack' => $pack
        ]);
    }
}