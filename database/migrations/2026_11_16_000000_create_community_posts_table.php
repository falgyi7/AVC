<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_posts', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('author_id');
            $table->integer('product_id')->nullable();
            $table->string('client_id', 100)->nullable();
            $table->text('caption');
            $table->unsignedInteger('likes')->default(0);
            $table->timestamps();

            $table->foreign('author_id')->references('idUser')->on('user')->cascadeOnDelete();
            $table->foreign('product_id')->references('idproduk')->on('produk')->nullOnDelete();
            $table->unique(['author_id', 'client_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_posts');
    }
};
