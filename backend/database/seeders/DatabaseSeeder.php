<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Client;
use App\Models\Prestation;
use App\Models\Pack;
use App\Models\Categorie;  // ← AJOUTE CETTE LIGNE
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        User::create([
            'nom' => 'Admin',
            'prenom' => 'Esthelyna',
            'email' => 'bouysfi.othman@gmail.com',
            'password' => Hash::make('123456789'),
            'telephone' => '0612345678',
            'role' => 'admin',
            'actif' => true,
        ]);

        User::create([
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'email' => 'assistante@esthelyna.com',
            'password' => Hash::make('password'),
            'telephone' => '0623456789',
            'role' => 'assistante',
            'actif' => true,
        ]);

        // Clients
        $clients = [
            ['nom' => 'Martin', 'prenom' => 'Sophie', 'telephone' => '0612345678', 'email' => 'sophie.martin@email.com'],
            ['nom' => 'Dubois', 'prenom' => 'Isabelle', 'telephone' => '0623456789', 'email' => 'isabelle.dubois@email.com'],
            ['nom' => 'Laurent', 'prenom' => 'Marie', 'telephone' => '0634567890', 'email' => 'marie.laurent@email.com'],
            ['nom' => 'Petit', 'prenom' => 'Camille', 'telephone' => '0645678901', 'email' => 'camille.petit@email.com'],
            ['nom' => 'Bernard', 'prenom' => 'Julie', 'telephone' => '0656789012', 'email' => 'julie.bernard@email.com'],
            ['nom' => 'Thomas', 'prenom' => 'Emma', 'telephone' => '0667890123', 'email' => 'emma.thomas@email.com'],
            ['nom' => 'Robert', 'prenom' => 'Léa', 'telephone' => '0678901234', 'email' => 'lea.robert@email.com'],
            ['nom' => 'Richard', 'prenom' => 'Chloé', 'telephone' => '0689012345', 'email' => 'chloe.richard@email.com'],
        ];

        foreach ($clients as $client) {
            Client::create($client);
        }

        // Catégories
        $categories = [
            ['nom' => 'Soin', 'ordre' => 1],
            ['nom' => 'Épilation', 'ordre' => 2],
            ['nom' => 'Massage', 'ordre' => 3],
            ['nom' => 'Minceur', 'ordre' => 4],
            ['nom' => 'Anti-âge', 'ordre' => 5],
            ['nom' => 'Hydratation', 'ordre' => 6],
            ['nom' => 'Maquillage', 'ordre' => 7],
            ['nom' => 'Manucure', 'ordre' => 8],
            ['nom' => 'Pédicure', 'ordre' => 9],
            ['nom' => 'Autre', 'ordre' => 10],
        ];

        foreach ($categories as $cat) {
            Categorie::create($cat);
        }

        // Prestations
        $prestations = [
            ['nom' => 'Facial Treatment Premium', 'categorie' => 'Soin', 'prix' => 400, 'duree' => 90],
            ['nom' => 'Anti-Aging Package', 'categorie' => 'Anti-âge', 'prix' => 600, 'duree' => 120],
            ['nom' => 'Hydrating Facial', 'categorie' => 'Hydratation', 'prix' => 300, 'duree' => 60],
            ['nom' => 'Luxury Spa Treatment', 'categorie' => 'Soin', 'prix' => 800, 'duree' => 150],
            ['nom' => 'Épilation Complète', 'categorie' => 'Épilation', 'prix' => 250, 'duree' => 60],
            ['nom' => 'Massage Relaxant', 'categorie' => 'Massage', 'prix' => 350, 'duree' => 90],
            ['nom' => 'Soin Minceur', 'categorie' => 'Minceur', 'prix' => 500, 'duree' => 90],
        ];

        foreach ($prestations as $prestation) {
            Prestation::create($prestation);
        }

        // Packs
        $packs = [
            [
                'nom' => 'Pack Minceur 10 séances',
                'prix' => 4000,
                'nombre_seances_total' => 10,
                'description' => 'Programme minceur complet'
            ],
            [
                'nom' => 'Pack Anti-âge 6 séances',
                'prix' => 3000,
                'nombre_seances_total' => 6,
                'description' => 'Cure anti-âge intensive'
            ],
        ];

        foreach ($packs as $packData) {
            $pack = Pack::create($packData);
            
            if ($pack->nom === 'Pack Minceur 10 séances') {
                $pack->prestations()->attach(7, ['nombre_seances' => 10]);
            } else {
                $pack->prestations()->attach(2, ['nombre_seances' => 6]);
            }
        }
    }
}