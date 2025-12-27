<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('prestation_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('pack_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('montant_total', 10, 2);
            $table->decimal('montant_paye', 10, 2);
            $table->decimal('reste', 10, 2);
            $table->date('date_paiement');
            $table->enum('methode_paiement', ['Espèces', 'Carte', 'Virement', 'Chèque'])->default('Espèces');
            $table->enum('statut', ['Payé', 'Partiel', 'Impayé'])->default('Payé');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};