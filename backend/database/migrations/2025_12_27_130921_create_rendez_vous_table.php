<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('prestation_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('pack_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('seance_numero')->nullable()->comment('Numéro de la séance si pack');
            $table->dateTime('date_heure');
            $table->integer('duree')->comment('Durée en minutes');
            $table->enum('statut', ['Planifié', 'Confirmé', 'Terminé', 'Annulé', 'NoShow'])->default('Planifié');
            $table->foreignId('assistante_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous');
    }
};