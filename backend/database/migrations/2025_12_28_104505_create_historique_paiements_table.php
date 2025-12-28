<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('historique_paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained()->onDelete('cascade');
            $table->decimal('montant', 10, 2);
            $table->enum('methode_paiement', ['Espèces', 'Carte', 'Virement', 'Chèque']);
            $table->date('date_paiement');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historique_paiements');
    }
};
