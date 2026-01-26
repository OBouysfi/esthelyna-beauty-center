<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Pack;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admins
        User::create([
            'nom' => 'Admin',
            'prenom' => 'Epiloria',
            'email' => 'bouysfi.othman@gmail.com',
            'password' => Hash::make('123456789'),
            'telephone' => '0612345678',
            'role' => 'admin',
            'actif' => true,
        ]);

        User::create([
            'nom' => 'Manager',
            'prenom' => 'Beauty',
            'email' => 'manager@epiloria.ma',
            'password' => Hash::make('123456789'),
            'telephone' => '0623456789',
            'role' => 'admin',
            'actif' => true,
        ]);

        // Packs selon l'image Excel
        $packs = [
            // CAVITATION
            ['nom' => 'PACK AMIN', 'categorie' => 'cavitation', 'zones' => null, 'prix' => 2000, 'nombre_seances' => 1, 'duree_seance' => 60],
            ['nom' => 'PACK 10 S CAVITATION', 'categorie' => 'cavitation', 'zones' => null, 'prix' => 2000, 'nombre_seances' => 10, 'duree_seance' => 60],
            ['nom' => 'PACK 15 S CAVITATION', 'categorie' => 'cavitation', 'zones' => null, 'prix' => 2500, 'nombre_seances' => 15, 'duree_seance' => 60],
            ['nom' => 'PACK 1H CRYO+ 10 S AMIN', 'categorie' => 'cryo', 'zones' => null, 'prix' => 3000, 'nombre_seances' => 10, 'duree_seance' => 60],
            ['nom' => 'PACK 2CRYO +10 S AMIN', 'categorie' => 'cryo', 'zones' => null, 'prix' => 3500, 'nombre_seances' => 10, 'duree_seance' => 60],
            
            // PRESSO
            ['nom' => 'PACK PRESSO 10 S', 'categorie' => 'presso', 'zones' => null, 'prix' => 1000, 'nombre_seances' => 10, 'duree_seance' => 45],
            ['nom' => 'PACK PRESSO 5 S', 'categorie' => 'presso', 'zones' => null, 'prix' => 500, 'nombre_seances' => 5, 'duree_seance' => 45],
            
            // RADIO FREQUENCE
            ['nom' => 'PACK RADIOFRICCONS 10 S', 'categorie' => 'radiofriconce', 'zones' => null, 'prix' => 2300, 'nombre_seances' => 10, 'duree_seance' => 60],
            
            // CARBAN PELL
            ['nom' => 'PACK CARBAN PELL 3S', 'categorie' => 'carban', 'zones' => null, 'prix' => 1800, 'nombre_seances' => 3, 'duree_seance' => 45],
            ['nom' => 'PACK CARBAN PELL 6S', 'categorie' => 'carban', 'zones' => null, 'prix' => 2990, 'nombre_seances' => 6, 'duree_seance' => 45],
            
            // MICRO
            ['nom' => 'PACK MICRO 3S', 'categorie' => 'micro', 'zones' => null, 'prix' => 1500, 'nombre_seances' => 3, 'duree_seance' => 30],
            ['nom' => 'PACK MICRO 6 S', 'categorie' => 'micro', 'zones' => null, 'prix' => 2500, 'nombre_seances' => 6, 'duree_seance' => 30],
            
            // LASER avec ZONES
            ['nom' => 'PACK 1 ZONE', 'categorie' => 'laser', 'zones' => 1, 'prix' => 1500, 'nombre_seances' => 10, 'duree_seance' => 30],
            ['nom' => 'PACK 2 ZONE', 'categorie' => 'laser', 'zones' => 2, 'prix' => 3400, 'nombre_seances' => 10, 'duree_seance' => 45],
            ['nom' => 'PACK 3 ZONE', 'categorie' => 'laser', 'zones' => 3, 'prix' => 5000, 'nombre_seances' => 10, 'duree_seance' => 60],
            ['nom' => 'PACK 4 ZONE', 'categorie' => 'laser', 'zones' => 4, 'prix' => 7000, 'nombre_seances' => 10, 'duree_seance' => 75],
            ['nom' => 'PACK 6 ZONE', 'categorie' => 'laser', 'zones' => 6, 'prix' => 9000, 'nombre_seances' => 10, 'duree_seance' => 90],
            ['nom' => 'PACK 8 ZONE', 'categorie' => 'laser', 'zones' => 8, 'prix' => 10000, 'nombre_seances' => 10, 'duree_seance' => 105],
            ['nom' => 'PACK 9 ZONE', 'categorie' => 'laser', 'zones' => 9, 'prix' => 11000, 'nombre_seances' => 10, 'duree_seance' => 120],
            ['nom' => 'PACK 10 ZONE', 'categorie' => 'laser', 'zones' => 10, 'prix' => 12000, 'nombre_seances' => 10, 'duree_seance' => 135],
            ['nom' => 'PACK 12 ZONE', 'categorie' => 'laser', 'zones' => 12, 'prix' => 15000, 'nombre_seances' => 10, 'duree_seance' => 150],
            
            // LUMIERE PULSEE avec ZONES
            ['nom' => '1 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 1, 'prix' => 200, 'nombre_seances' => 1, 'duree_seance' => 30],
            ['nom' => 'PACK 1 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 1, 'prix' => 1200, 'nombre_seances' => 10, 'duree_seance' => 30],
            ['nom' => 'PACK 2 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 2, 'prix' => 2400, 'nombre_seances' => 10, 'duree_seance' => 45],
            ['nom' => 'PACK 3 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 3, 'prix' => 3600, 'nombre_seances' => 10, 'duree_seance' => 60],
            ['nom' => 'PACK 4 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 4, 'prix' => 4800, 'nombre_seances' => 10, 'duree_seance' => 75],
            ['nom' => 'PACK 6 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 6, 'prix' => 5500, 'nombre_seances' => 10, 'duree_seance' => 90],
            ['nom' => 'PACK 9 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 9, 'prix' => 7500, 'nombre_seances' => 10, 'duree_seance' => 120],
            ['nom' => 'PACK 10 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 10, 'prix' => 8000, 'nombre_seances' => 10, 'duree_seance' => 135],
            ['nom' => 'PACK 12 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 12, 'prix' => 10000, 'nombre_seances' => 10, 'duree_seance' => 150],
            ['nom' => 'PACK 8 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 8, 'prix' => 6500, 'nombre_seances' => 10, 'duree_seance' => 105],
            ['nom' => '6 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 6, 'prix' => 1000, 'nombre_seances' => 1, 'duree_seance' => 90],
            ['nom' => '12 ZONE', 'categorie' => 'lumiere_pulsee', 'zones' => 12, 'prix' => 1800, 'nombre_seances' => 1, 'duree_seance' => 150],
            
            // AUTRES
            ['nom' => 'COUVERTURE CHAUFFANTE', 'categorie' => 'autres', 'zones' => null, 'prix' => 1500, 'nombre_seances' => 1, 'duree_seance' => 45],
        ];

        foreach ($packs as $pack) {
            Pack::create(array_merge($pack, ['actif' => true]));
        }
    }
}