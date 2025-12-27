<?php

// database/seeders/SuperAdminSeeder.php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\UserRole;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        
        try {
            // 1. Créer le rôle Super Admin
            $superAdminRole = Role::create([
                'name' => 'super_admin',
                'display_name' => 'Super Administrateur',
                'description' => 'Accès complet au système Scholora',
                'is_active' => true
            ]);

            // 2. Créer les permissions
            $permissions = [
                [
                    'name' => 'manage_users',
                    'display_name' => 'Gestion des utilisateurs',
                    'description' => 'Créer, modifier, supprimer des utilisateurs',
                    'module' => 'admin'
                ],
                [
                    'name' => 'manage_roles',
                    'display_name' => 'Gestion des rôles',
                    'description' => 'Créer, modifier, supprimer des rôles',
                    'module' => 'admin'
                ],
                [
                    'name' => 'view_dashboard',
                    'display_name' => 'Voir le tableau de bord',
                    'description' => 'Accès au tableau de bord administrateur',
                    'module' => 'admin'
                ]
            ];

            foreach ($permissions as $permissionData) {
                $permission = Permission::create($permissionData);
                
                // Attribuer la permission au rôle super admin
                RolePermission::create([
                    'role_id' => $superAdminRole->id,
                    'permission_id' => $permission->id
                ]);
            }

            // 3. Créer le super admin
            $superAdmin = User::create([
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'bouysfi.othman@gmail.com',
                'password' => Hash::make('Scholora2025@'),
                'phone' => '+212600000000',
                'is_active' => true,
                'email_verified_at' => now()
            ]);

            // 4. Attribuer le rôle au super admin
            UserRole::create([
                'user_id' => $superAdmin->id,
                'role_id' => $superAdminRole->id
            ]);

            DB::commit();

            $this->command->info('✅ Super Admin créé avec succès!');
            $this->command->info('📧 Email: bouysfi.othman@gmail.com');
            $this->command->info('🔑 Password: Scholora2025@');
            
        } catch (\Exception $e) {
            DB::rollback();
            $this->command->error('❌ Erreur: ' . $e->getMessage());
            throw $e;
        }
    }
}