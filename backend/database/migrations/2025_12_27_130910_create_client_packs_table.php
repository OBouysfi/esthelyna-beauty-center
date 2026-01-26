<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_packs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('pack_id')->constrained()->onDelete('cascade');
            $table->date('date_achat');
            $table->date('date_expiration')->nullable();
            $table->integer('nombre_seances_total');
            $table->integer('seances_effectuees')->default(0);
            $table->integer('seances_restantes');
            $table->decimal('prix_total', 10, 2);
            $table->decimal('montant_paye', 10, 2)->default(0);
            $table->decimal('reste_a_payer', 10, 2);
            $table->enum('statut', ['actif', 'termine', 'expire', 'suspendu'])->default('actif');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_packs');
    }
};