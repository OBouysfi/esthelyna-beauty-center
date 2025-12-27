<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pack_prestations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pack_id')->constrained()->onDelete('cascade');
            $table->foreignId('prestation_id')->constrained()->onDelete('cascade');
            $table->integer('nombre_seances');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pack_prestations');
    }
};