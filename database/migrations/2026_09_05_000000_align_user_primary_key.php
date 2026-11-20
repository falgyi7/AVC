<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user') && !Schema::hasColumn('user', 'idUser') && Schema::hasColumn('user', 'id')) {
            Schema::table('user', function (Blueprint $table) {
                $table->renameColumn('id', 'idUser');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('user') && Schema::hasColumn('user', 'idUser') && !Schema::hasColumn('user', 'id')) {
            Schema::table('user', function (Blueprint $table) {
                $table->renameColumn('idUser', 'id');
            });
        }
    }
};