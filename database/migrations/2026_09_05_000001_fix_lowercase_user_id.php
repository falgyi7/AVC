<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user') && Schema::hasColumn('user', 'iduser') && !Schema::hasColumn('user', 'idUser')) {
            DB::statement('ALTER TABLE "user" RENAME COLUMN iduser TO "idUser"');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('user') && Schema::hasColumn('user', 'idUser') && !Schema::hasColumn('user', 'iduser')) {
            DB::statement('ALTER TABLE "user" RENAME COLUMN "idUser" TO iduser');
        }
    }
};