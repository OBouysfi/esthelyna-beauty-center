<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;

class DiagnoseCarbonCommand extends Command
{
    protected $signature = 'debug:carbon';
    protected $description = 'Diagnostiquer le problème Carbon avec JWT';

    public function handle()
    {
        $this->info('=== DIAGNOSTIC CARBON JWT ===');
        
        // 1. Vérifier toutes les configurations
        $this->info("\n1. CONFIGURATION CHECK:");
        $configs = [
            'jwt.ttl' => config('jwt.ttl'),
            'jwt.refresh_ttl' => config('jwt.refresh_ttl'),
            'jwt.blacklist_grace_period' => config('jwt.blacklist_grace_period'),
            'jwt.leeway' => config('jwt.leeway'),
            'session.lifetime' => config('session.lifetime'),
        ];
        
        foreach ($configs as $key => $value) {
            $type = gettype($value);
            $this->info("$key: $value ($type)");
            if (is_string($value) && is_numeric($value)) {
                $this->error("  ⚠️  PROBLÈME: $key est une string mais devrait être un nombre!");
            }
        }
        
        // 2. Vérifier les variables d'environnement directes
        $this->info("\n2. ENV VARIABLES:");
        $envVars = [
            'JWT_TTL' => env('JWT_TTL'),
            'JWT_REFRESH_TTL' => env('JWT_REFRESH_TTL'),
            'JWT_BLACKLIST_GRACE_PERIOD' => env('JWT_BLACKLIST_GRACE_PERIOD'),
            'JWT_LEEWAY' => env('JWT_LEEWAY'),
            'SESSION_LIFETIME' => env('SESSION_LIFETIME'),
        ];
        
        foreach ($envVars as $key => $value) {
            $type = gettype($value);
            $this->info("$key: $value ($type)");
        }
        
        // 3. Test Carbon avec différentes valeurs
        $this->info("\n3. CARBON TESTS:");
        try {
            $this->info("Carbon::now(): " . Carbon::now());
            
            // Test avec la valeur problématique potentielle
            $ttl = config('jwt.ttl');
            $this->info("TTL from config: $ttl (" . gettype($ttl) . ")");
            
            if (is_string($ttl)) {
                $this->error("TTL est une string - ceci va causer l'erreur!");
                $ttl = (int) $ttl;
                $this->info("TTL converti en int: $ttl");
            }
            
            $expiry = Carbon::now()->addMinutes($ttl);
            $this->info("addMinutes test réussi: $expiry");
            
        } catch (\Exception $e) {
            $this->error("ERREUR Carbon: " . $e->getMessage());
            $this->error("Ligne: " . $e->getLine() . " dans " . $e->getFile());
        }
        
        // 4. Test JWT Factory directement
        $this->info("\n4. JWT FACTORY TEST:");
        try {
            $user = User::first();
            if (!$user) {
                $this->error("Aucun utilisateur trouvé pour le test");
                return;
            }
            
            $this->info("Utilisateur trouvé: " . $user->email);
            
            // Test génération token
            $this->info("Test génération token...");
            $token = auth('api')->login($user);
            $this->info("✅ Token généré avec succès!");
            
        } catch (\Exception $e) {
            $this->error("❌ ERREUR JWT: " . $e->getMessage());
            $this->error("Fichier: " . $e->getFile() . ":" . $e->getLine());
            $this->error("Stack trace:");
            $this->error($e->getTraceAsString());
        }
        
        // 5. Vérifier les providers JWT
        $this->info("\n5. JWT PROVIDERS:");
        $this->info("JWT Provider: " . config('jwt.providers.jwt'));
        $this->info("Auth Provider: " . config('jwt.providers.auth'));
        $this->info("Storage Provider: " . config('jwt.providers.storage'));
    }
}