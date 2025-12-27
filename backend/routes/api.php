<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\NewsletterController;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
});

// Password Reset Routes
Route::prefix('auth')->group(function () {
    Route::post('forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('reset-password', [PasswordResetController::class, 'reset']);
    Route::get('/reset-password/{token}', function ($token) {
})->name('password.reset');
});

// Super Admin Routes
Route::prefix('admin')->middleware(['auth:api', 'super.admin'])->group(function () {
    Route::get('dashboard', [AdminController::class, 'dashboard']);
    Route::get('users', [AdminController::class, 'users']);
    Route::get('roles', [AdminController::class, 'roles']);
});

//Newsletter
Route::post('/newsletters', [NewsletterController::class, 'store']);

