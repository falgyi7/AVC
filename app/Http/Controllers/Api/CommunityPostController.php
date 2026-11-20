<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityComment;
use App\Models\CommunityPost;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CommunityPostController extends Controller
{
    public function index()
    {
        $posts = CommunityPost::with([
            'author:idUser,name,avatar',
            'product:idproduk,title,deskripsi,price_crypto,image_url,status,user_idUser',
        ])
            ->withCount('comments')
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (CommunityPost $post) => $this->formatPost($post));

        return response()->json(['data' => $posts]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:100'],
            'caption' => ['required', 'string', 'max:1000'],
            'product_id' => [
                'nullable',
                'integer',
                Rule::exists('produk', 'idproduk')->where('user_idUser', $user->idUser),
            ],
        ]);

        $post = CommunityPost::firstOrCreate(
            [
                'author_id' => $user->idUser,
                'client_id' => $validated['client_id'],
            ],
            [
                'product_id' => $validated['product_id'] ?? null,
                'caption' => $validated['caption'],
            ],
        );

        $post->load([
            'author:idUser,name,avatar',
            'product:idproduk,title,deskripsi,price_crypto,image_url,status,user_idUser',
        ]);

        return response()->json(['data' => $this->formatPost($post)], $post->wasRecentlyCreated ? 201 : 200);
    }

    public function syncLegacy(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'posts' => ['required', 'array', 'max:100'],
            'posts.*.id' => ['required', 'string', 'max:100'],
            'posts.*.caption' => ['required', 'string', 'max:1000'],
            'posts.*.product_id' => [
                'nullable',
                'integer',
                Rule::exists('produk', 'idproduk')->where('user_idUser', $user->idUser),
            ],
        ]);

        $posts = DB::transaction(function () use ($validated, $user) {
            return collect($validated['posts'])
                ->map(function (array $legacyPost) use ($user) {
                    $post = CommunityPost::firstOrCreate(
                        [
                            'author_id' => $user->idUser,
                            'client_id' => $legacyPost['id'],
                        ],
                        [
                            'product_id' => $legacyPost['product_id'] ?? null,
                            'caption' => $legacyPost['caption'],
                        ],
                    );

                    return $post;
                })
                ->each(fn (CommunityPost $post) => $post->load([
                    'author:idUser,name,avatar',
                    'product:idproduk,title,deskripsi,price_crypto,image_url,status,user_idUser',
                ]))
                ->map(fn (CommunityPost $post) => $this->formatPost($post));
        });

        return response()->json(['data' => $posts]);
    }

    public function comments(CommunityPost $post)
    {
        $comments = $post->comments()
            ->with('author:idUser,name,avatar')
            ->oldest()
            ->get();
        $commentsByParent = $comments->groupBy(fn (CommunityComment $comment) => $comment->parent_comment_id ?? 0);
        $formatThread = function ($parentId) use (&$formatThread, $commentsByParent) {
            return collect($commentsByParent->get($parentId, []))
                ->map(function (CommunityComment $comment) use (&$formatThread) {
                    return array_merge($this->formatComment($comment), [
                        'replies' => $formatThread($comment->id),
                    ]);
                })
                ->values();
        };

        return response()->json(['data' => $formatThread(0)]);
    }

    public function storeComment(Request $request, CommunityPost $post)
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
            'parent_comment_id' => [
                'nullable',
                'integer',
                Rule::exists('community_comments', 'id')->where('community_post_id', $post->id),
            ],
        ]);

        $comment = $post->comments()->create([
            'author_id' => $request->user()->idUser,
            'parent_comment_id' => $validated['parent_comment_id'] ?? null,
            'body' => trim($validated['body']),
        ]);
        $comment->load('author:idUser,name,avatar');

        return response()->json(['data' => $this->formatComment($comment)], 201);
    }

    private function formatComment(CommunityComment $comment): array
    {
        $name = $comment->author?->name ?? 'Pengguna Art Vibes';
        $handle = strtolower(preg_replace('/[^a-z0-9]+/i', '', $name) ?: 'creator');

        return [
            'id' => $comment->id,
            'user' => $name,
            'handle' => '@'.$handle,
            'avatar' => $comment->author?->avatar,
            'time' => $comment->created_at?->diffForHumans() ?? 'Baru saja',
            'body' => $comment->body,
            'replies' => [],
        ];
    }

    private function formatPost(CommunityPost $post): array
    {
        $name = $post->author?->name ?? 'Kreator Art Vibes';
        $handle = strtolower(preg_replace('/[^a-z0-9]+/i', '', $name) ?: 'creator');
        $product = $post->product;

        if ($product) {
            $image = $product->image_url;
            if ($image && !preg_match('/^(https?:|data:|\/)/i', $image)) {
                $image = Storage::disk('public')->url($image);
            }

            $product = array_merge($product->toArray(), [
                'nama' => $product->title,
                'image' => $image,
            ]);
        }

        return [
            'id' => $post->id,
            'user' => $name,
            'handle' => '@'.$handle,
            'avatar' => $post->author?->avatar,
            'time' => $post->created_at?->diffForHumans() ?? 'Baru saja',
            'mood' => 'Komunitas',
            'title' => 'Postingan komunitas',
            'caption' => $post->caption,
            'mediaType' => 'text',
            'mediaUrl' => null,
            'likes' => (int) $post->likes,
            'comments' => (int) ($post->comments_count ?? 0),
            'commentable' => true,
            'shares' => 0,
            'product' => $product,
        ];
    }
}
