<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::create([
            'nom' => 'Admin',
            'prenom' => 'Esthelyna',
            'email' => 'bouysfi.othman@gmail.com',
            'password' => Hash::make('123456789'),
            'telephone' => '0612345678',
            'role' => 'admin',
            'actif' => true,
        ]);

        // Assistante
        User::create([
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'email' => 'assistante@esthelyna.ma',
            'password' => Hash::make('123456789'),
            'telephone' => '0623456789',
            'role' => 'assistante',
            'actif' => true,
        ]);
    }
}