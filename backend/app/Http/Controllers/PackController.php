<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use Illuminate\Http\Request;

class PackController extends Controller
{
    public function index()
    {
        $packs = Pack::orderBy('created_at', 'desc')->get();
        return response()->json($packs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string',
            'categorie' => 'required|string',
            'zones' => 'nullable|integer',
            'prix' => 'required|numeric',
            'nombre_seances' => 'required|integer',
            'duree_seance' => 'nullable|integer',
            'validite_jours' => 'nullable|integer',
            'description' => 'nullable|string',
            'actif' => 'boolean',
        ]);

        $pack = Pack::create($validated);
        return response()->json($pack, 201);
    }

    public function update(Request $request, $id)
    {
        $pack = Pack::findOrFail($id);
        $pack->update($request->all());
        return response()->json($pack);
    }

    public function destroy($id)
    {
        $pack = Pack::findOrFail($id);
        $pack->delete();
        return response()->json(null, 204);
    }
}