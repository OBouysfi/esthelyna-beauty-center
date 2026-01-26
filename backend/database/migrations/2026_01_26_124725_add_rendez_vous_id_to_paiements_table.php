<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->foreignId('rendez_vous_id')
                ->nullable()
                ->after('client_pack_id')
                ->constrained('rendez_vous')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropForeign(['rendez_vous_id']);
            $table->dropColumn('rendez_vous_id');
        });
    }
};