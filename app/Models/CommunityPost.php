<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    protected $fillable = [
        'author_id',
        'product_id',
        'client_id',
        'caption',
        'likes',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id', 'idUser');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'product_id', 'idproduk');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CommunityComment::class, 'community_post_id');
    }
}
