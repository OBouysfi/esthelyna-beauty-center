<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->index('nom');
            $table->index('prenom');
            $table->index('telephone');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['nom']);
            $table->dropIndex(['prenom']);
            $table->dropIndex(['telephone']);
            $table->dropIndex(['email']);
        });
    }
};