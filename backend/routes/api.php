<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\RendezVousController;
use App\Http\Controllers\PrestationController;
use App\Http\Controllers\PackController;
use App\Http\Controllers\CategorieController;

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