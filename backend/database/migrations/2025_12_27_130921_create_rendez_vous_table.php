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
            $table->foreignId('client_pack_id')->constrained()->onDelete('cascade');
            $table->integer('numero_seance');
            $table->dateTime('date_heure');
            $table->integer('duree')->default(60)->comment('Durée en minutes');
            $table->enum('statut', ['planifie', 'confirme', 'termine', 'annule', 'absent'])->default('planifie');
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