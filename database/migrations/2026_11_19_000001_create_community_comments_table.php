<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_comments', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('community_post_id');
            $table->integer('author_id');
            $table->text('body');
            $table->timestamps();

            $table->foreign('community_post_id')
                ->references('id')
                ->on('community_posts')
                ->cascadeOnDelete();
            $table->foreign('author_id')
                ->references('idUser')
                ->on('user')
                ->cascadeOnDelete();
            $table->index(['community_post_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_comments');
    }
};
