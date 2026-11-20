<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_comments', function (Blueprint $table) {
            $table->unsignedInteger('parent_comment_id')->nullable();
            $table->foreign('parent_comment_id')
                ->references('id')
                ->on('community_comments')
                ->cascadeOnDelete();
            $table->index(['community_post_id', 'parent_comment_id']);
        });
    }

    public function down(): void
    {
        Schema::table('community_comments', function (Blueprint $table) {
            $table->dropForeign(['parent_comment_id']);
            $table->dropIndex(['community_post_id', 'parent_comment_id']);
            $table->dropColumn('parent_comment_id');
        });
    }
};
