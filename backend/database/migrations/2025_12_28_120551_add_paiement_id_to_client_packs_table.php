<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_packs', function (Blueprint $table) {
            $table->foreignId('paiement_id')->nullable()->after('pack_id')->constrained('paiements')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('client_packs', function (Blueprint $table) {
            $table->dropForeign(['paiement_id']);
            $table->dropColumn('paiement_id');
        });
    }
};