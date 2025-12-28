<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\PrestationController;
use App\Http\Controllers\PackController;
use App\Http\Controllers\ClientPackController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\StatistiqueController;

// Auth routes (public)
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
Route::middleware('auth:sanctum')->group(function () {
    // Rendez-vous
    Route::get('/rendez-vous', [RendezVousController::class, 'index']);
    Route::get('/rendez-vous/calendar', [RendezVousController::class, 'calendar']);
    Route::get('/rendez-vous/disponibilites', [RendezVousController::class, 'disponibilites']);
    Route::post('/rendez-vous', [RendezVousController::class, 'store']);
    Route::put('/rendez-vous/{rendezVous}', [RendezVousController::class, 'update']);
    Route::patch('/rendez-vous/{rendezVous}/status', [RendezVousController::class, 'updateStatus']);
    Route::delete('/rendez-vous/{rendezVous}', [RendezVousController::class, 'destroy']);
    Route::get('/rendez-vous/disponibilites', [RendezVousController::class, 'disponibilites']);

    // Prestations
    Route::get('/prestations', [PrestationController::class, 'index']);
    
    // Packs
    Route::get('/packs', [PackController::class, 'index']);
});
Route::middleware('auth:sanctum')->group(function () {
    // Clients
    Route::get('/clients/stats', [ClientController::class, 'stats']);
    Route::get('/clients/search', [ClientController::class, 'search']);
    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::put('/clients/{client}', [ClientController::class, 'update']);
    Route::delete('/clients/{client}', [ClientController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Prestations
    Route::get('/prestations/stats', [PrestationController::class, 'stats']);
    Route::get('/prestations', [PrestationController::class, 'index']);
    Route::post('/prestations', [PrestationController::class, 'store']);
    Route::put('/prestations/{prestation}', [PrestationController::class, 'update']);
    Route::patch('/prestations/{prestation}/toggle', [PrestationController::class, 'toggleActif']);
    Route::delete('/prestations/{prestation}', [PrestationController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Catégories
    Route::get('/categories', [CategorieController::class, 'index']);
    Route::get('/categories/all', [CategorieController::class, 'all']);
    Route::post('/categories', [CategorieController::class, 'store']);
    Route::put('/categories/{categorie}', [CategorieController::class, 'update']);
    Route::patch('/categories/{categorie}/toggle', [CategorieController::class, 'toggleActif']);
    Route::delete('/categories/{categorie}', [CategorieController::class, 'destroy']);
});


Route::middleware('auth:sanctum')->group(function () {
    // Paiements
    Route::get('/paiements/stats', [PaiementController::class, 'stats']);
    Route::get('/paiements', [PaiementController::class, 'index']);
    Route::post('/paiements', [PaiementController::class, 'store']);
    Route::put('/paiements/{paiement}', [PaiementController::class, 'update']);
    Route::delete('/paiements/{paiement}', [PaiementController::class, 'destroy']);
    Route::post('/paiements/{paiement}/ajouter', [PaiementController::class, 'ajouterPaiement']);
    Route::get('/paiements/analytics', [PaiementController::class, 'analytics']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Packs (catalogue)
    Route::get('/packs', [PackController::class, 'index']);
    Route::post('/packs', [PackController::class, 'store']);
    Route::put('/packs/{pack}', [PackController::class, 'update']);
    Route::delete('/packs/{pack}', [PackController::class, 'destroy']);
    Route::patch('/packs/{pack}/toggle', [PackController::class, 'toggleActif']);
    // Client Packs (packs achetés)
    Route::get('/client-packs', [ClientPackController::class, 'index']);
    Route::get('/client-packs/stats', [ClientPackController::class, 'stats']);
    Route::post('/client-packs', [ClientPackController::class, 'store']);
    Route::post('/client-packs/{clientPack}/consommer', [ClientPackController::class, 'consommerSeance']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/statistiques/dashboard', [StatistiqueController::class, 'dashboard']);
    Route::get('/statistiques/export', [StatistiqueController::class, 'export']);
});