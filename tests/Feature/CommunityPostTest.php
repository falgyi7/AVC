<?php

namespace Tests\Feature;

use App\Models\CommunityPost;
use App\Models\CommunityComment;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityPostTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_read_posts_published_by_a_user(): void
    {
        $author = User::factory()->create(['name' => 'Community Creator']);
        CommunityPost::create([
            'author_id' => $author->idUser,
            'client_id' => 'creator-post-1',
            'caption' => 'Sharing a new artwork',
        ]);

        $this->getJson('/api/community/posts')
            ->assertOk()
            ->assertJsonPath('data.0.user', 'Community Creator')
            ->assertJsonPath('data.0.caption', 'Sharing a new artwork');
    }

    public function test_authenticated_user_can_publish_a_post_with_their_product(): void
    {
        $author = User::factory()->create(['name' => 'Community Creator']);
        $category = Kategori::create(['name' => 'Art', 'slug' => 'art']);
        $product = Produk::create([
            'title' => 'Blue artwork',
            'price_crypto' => '0.5',
            'image_url' => 'produk/blue-art.png',
            'kategori_idkategori' => $category->idkategori,
            'user_idUser' => $author->idUser,
            'status' => 'listing',
        ]);

        $this->actingAs($author, 'web')
            ->postJson('/api/community/posts', [
                'client_id' => 'creator-post-2',
                'caption' => 'Promoting my artwork',
                'product_id' => $product->idproduk,
            ])
            ->assertCreated()
            ->assertJsonPath('data.user', 'Community Creator')
            ->assertJsonPath('data.caption', 'Promoting my artwork')
            ->assertJsonPath('data.product.idproduk', $product->idproduk)
            ->assertJsonPath('data.product.nama', 'Blue artwork');

        $this->assertDatabaseHas('community_posts', [
            'author_id' => $author->idUser,
            'product_id' => $product->idproduk,
            'caption' => 'Promoting my artwork',
        ]);
    }

    public function test_user_cannot_promote_another_users_product(): void
    {
        $author = User::factory()->create();
        $productOwner = User::factory()->create();
        $category = Kategori::create(['name' => 'Art', 'slug' => 'art']);
        $product = Produk::create([
            'title' => 'Private product',
            'price_crypto' => '0.5',
            'image_url' => 'produk/private-art.png',
            'kategori_idkategori' => $category->idkategori,
            'user_idUser' => $productOwner->idUser,
            'status' => 'listing',
        ]);

        $this->actingAs($author, 'web')
            ->postJson('/api/community/posts', [
                'client_id' => 'creator-post-3',
                'caption' => 'Promoting a product',
                'product_id' => $product->idproduk,
            ])
            ->assertUnprocessable();
    }

    public function test_authenticated_users_can_comment_on_other_users_posts(): void
    {
        $author = User::factory()->create(['name' => 'Post Creator']);
        $commenter = User::factory()->create(['name' => 'Community Member']);
        $post = CommunityPost::create([
            'author_id' => $author->idUser,
            'client_id' => 'commentable-post',
            'caption' => 'A new community post',
        ]);

        $this->actingAs($commenter, 'web')
            ->postJson("/api/community/posts/{$post->id}/comments", [
                'body' => 'Karyanya bagus!',
            ])
            ->assertCreated()
            ->assertJsonPath('data.user', 'Community Member')
            ->assertJsonPath('data.body', 'Karyanya bagus!');

        $replyAuthor = User::factory()->create(['name' => 'Another Member']);
        $this->actingAs($replyAuthor, 'web')
            ->postJson("/api/community/posts/{$post->id}/comments", [
                'body' => 'Setuju!',
                'parent_comment_id' => CommunityComment::query()->value('id'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.user', 'Another Member')
            ->assertJsonPath('data.body', 'Setuju!');

        $this->assertDatabaseHas('community_comments', [
            'community_post_id' => $post->id,
            'author_id' => $commenter->idUser,
            'body' => 'Karyanya bagus!',
        ]);

        $this->getJson("/api/community/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.user', 'Community Member')
            ->assertJsonPath('data.0.body', 'Karyanya bagus!')
            ->assertJsonPath('data.0.replies.0.user', 'Another Member')
            ->assertJsonPath('data.0.replies.0.body', 'Setuju!');

        $this->getJson('/api/community/posts')
            ->assertOk()
            ->assertJsonPath('data.0.comments', 2)
            ->assertJsonPath('data.0.commentable', true);
    }

    public function test_comment_reply_must_belong_to_the_same_post(): void
    {
        $author = User::factory()->create();
        $firstPost = CommunityPost::create([
            'author_id' => $author->idUser,
            'client_id' => 'first-comment-post',
            'caption' => 'First post',
        ]);
        $secondPost = CommunityPost::create([
            'author_id' => $author->idUser,
            'client_id' => 'second-comment-post',
            'caption' => 'Second post',
        ]);
        $parentComment = $firstPost->comments()->create([
            'author_id' => $author->idUser,
            'body' => 'Parent comment',
        ]);
        $replyAuthor = User::factory()->create();

        $this->actingAs($replyAuthor, 'web')
            ->postJson("/api/community/posts/{$secondPost->id}/comments", [
                'body' => 'Cross-post reply',
                'parent_comment_id' => $parentComment->id,
            ])
            ->assertUnprocessable();

        $this->assertSame(1, CommunityComment::count());
    }

    public function test_guest_cannot_comment_and_comment_body_is_validated(): void
    {
        $author = User::factory()->create();
        $post = CommunityPost::create([
            'author_id' => $author->idUser,
            'client_id' => 'protected-comment-post',
            'caption' => 'A post',
        ]);

        $this->postJson("/api/community/posts/{$post->id}/comments", [
            'body' => 'Guest comment',
        ])->assertUnauthorized();

        $commenter = User::factory()->create();
        $this->actingAs($commenter, 'web')
            ->postJson("/api/community/posts/{$post->id}/comments", [
                'body' => str_repeat('a', 1001),
            ])
            ->assertUnprocessable();

        $this->assertSame(0, CommunityComment::count());
    }
}
