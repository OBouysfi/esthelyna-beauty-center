<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packs', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); // PACK 10 S CAVITATION
            $table->text('description')->nullable();
            $table->enum('categorie', [
                'cavitation',
                'laser', 
                'lumiere_pulsee',
                'cryo',
                'presso',
                'radiofriconce',
                'carban',
                'micro',
                'autres'
            ]);
            $table->integer('zones')->nullable(); // 1, 2, 3, 4, 6, 8, 9, 10, 12
            $table->decimal('prix', 10, 2);
            $table->integer('nombre_seances');
            $table->integer('duree_seance')->default(60)->comment('Durée en minutes');
            $table->integer('validite_jours')->nullable()->comment('Validité en jours');
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packs');
    }
};