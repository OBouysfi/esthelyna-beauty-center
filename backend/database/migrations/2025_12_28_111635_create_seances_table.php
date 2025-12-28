<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_pack_id')->constrained('client_packs')->onDelete('cascade');
            $table->unsignedBigInteger('rendez_vous_id')->nullable();
            $table->foreignId('prestation_id')->nullable()->constrained('prestations')->onDelete('set null');
            $table->date('date_seance');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Foreign key manuelle pour rendez_vous
            $table->foreign('rendez_vous_id')
                ->references('id')
                ->on('rendez_vous')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seances');
    }
};