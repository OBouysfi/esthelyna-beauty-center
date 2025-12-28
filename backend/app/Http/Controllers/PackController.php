<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use Illuminate\Http\Request;

class PackController extends Controller
{
    public function index()
    {
        $packs = Pack::where('actif', true)->with('prestations')->get();
        return response()->json($packs);
    }
}