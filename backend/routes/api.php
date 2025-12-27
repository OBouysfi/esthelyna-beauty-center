<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Auth routes (public)
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'message' => 'Backend fonctionne!',
        'timestamp' => now()
    ]);
});