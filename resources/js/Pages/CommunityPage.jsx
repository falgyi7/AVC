import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  Camera,
  Flame,
  Heart,
  MessageCircle,
  Play,
  Reply,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import {
  loadCommunityComments,
  loadCommunityPosts,
  publishCommunityComment,
  syncLegacyCommunityPosts,
} from '../Utils/communityPosts';

const initialFeed = [
  {
    id: 'demo-feed-1',
    user: 'Maya Atelier',
    handle: '@mayaatelier',
    time: '12m',
    mood: 'Drop baru',
    title: 'Kolase moodboard proses digital painting untuk koleksi terbaru',
    caption:
      'Banyak request untuk tema light luxury. Hari ini saya share proses eksplorasi color grading sampai final frame untuk produk NFT art.',
    mediaType: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    likes: 129,
    comments: 21,
    shares: 8,
    product: {
      idproduk: 101,
      nama: 'Aurora Bloom Frame',
      price_crypto: '0.47 ETH',
      price: 430000,
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    },
  },
  {
    id: 'demo-feed-2',
    user: 'Sora Studio',
    handle: '@sorastudio',
    time: '35m',
    mood: 'Behind the scene',
    title: 'Reel tim kami saat menciptakan mood visual untuk campaign launch',
    caption:
      'Bisa lihat alur dari sketching, scan texture, sampai edit audio. Kita sedang membangun komunitas yang dekat dengan proses kreatif.',
    mediaType: 'video',
    mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    likes: 244,
    comments: 34,
    shares: 11,
    product: {
      idproduk: 102,
      nama: 'Canvas Motion Pack',
      price_crypto: '0.32 ETH',
      price: 290000,
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    },
  },
  {
    id: 'demo-feed-3',
    user: 'Rin Collective',
    handle: '@rincollective',
    time: '1h',
    mood: 'Community challenge',
    title: 'Challenge minggu ini: bagikan karya hasil kolaborasi komunitas kamu',
    caption:
      'Setiap karya yang masuk akan dipilah untuk ditampilkan di homepage explore. Komunitas yang aktif akan mendapat special spotlight.',
    mediaType: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    likes: 111,
    comments: 14,
    shares: 5,
    product: {
      idproduk: 103,
      nama: 'Collective Spotlight',
      price_crypto: '0.21 ETH',
      price: 240000,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    },
  },
];

const trendingCommunities = [
  { name: 'Art Drop Lab', members: '8.4k', color: 'from-fuchsia-500 to-rose-500' },
  { name: 'NFT Storytelling', members: '5.1k', color: 'from-cyan-500 to-blue-500' },
  { name: 'Creator Bazaar', members: '3.9k', color: 'from-amber-500 to-orange-500' },
  { name: 'Pixel Motion', members: '2.7k', color: 'from-emerald-500 to-lime-500' },
];

const getReplyDraftKey = (postId, commentId) => `reply-${postId}-${commentId}`;

const appendReplyToThread = (comments, parentId, reply) =>
  comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...(comment.replies || []), reply] };
    }

    if (comment.replies?.length) {
      return { ...comment, replies: appendReplyToThread(comment.replies, parentId, reply) };
    }

    return comment;
  });

function CommunityCommentThread({
  comments,
  postId,
  replyingToId,
  replyDrafts,
  replySubmitting,
  auth,
  onStartReply,
  onReplyDraftChange,
  onSubmitReply,
}) {
  return comments.map((comment) => {
    const draftKey = getReplyDraftKey(postId, comment.id);
    const isReplying = replyingToId === comment.id;

    return (
      <article key={comment.id} className="min-w-0">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-xs font-bold text-white ring-2 ring-slate-950">
            {comment.avatar ? (
              <img src={comment.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              comment.user.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-bold text-white">{comment.user}</p>
              <p className="text-xs text-slate-500">{comment.handle}</p>
              <p className="text-[10px] text-slate-500">· {comment.time}</p>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-300">{comment.body}</p>
            <button
              type="button"
              onClick={() => onStartReply(postId, comment.id)}
              aria-expanded={isReplying}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-fuchsia-500/10 hover:text-fuchsia-200"
            >
              <Reply className="h-3.5 w-3.5" />
              Balas
            </button>

            {isReplying && (
              auth?.user ? (
                <form onSubmit={(event) => onSubmitReply(event, postId, comment.id)} className="mt-2 flex items-end gap-2">
                  <textarea
                    value={replyDrafts[draftKey] || ''}
                    onChange={(event) => onReplyDraftChange(draftKey, event.target.value)}
                    maxLength={1000}
                    rows={1}
                    placeholder={`Balas ${comment.user}...`}
                    aria-label={`Balas komentar ${comment.user}`}
                    className="min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60"
                  />
                  <button
                    type="submit"
                    disabled={replySubmitting || !(replyDrafts[draftKey] || '').trim()}
                    className="h-10 shrink-0 rounded-xl bg-fuchsia-500 px-3 text-xs font-bold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {replySubmitting ? 'Mengirim...' : 'Balas'}
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Login melalui tombol di header untuk membalas.</p>
              )
            )}
          </div>
        </div>

        {comment.replies?.length > 0 && (
          <div className="ml-4 mt-3 border-l border-white/10 pl-4 sm:ml-5 sm:pl-5">
            <CommunityCommentThread
              comments={comment.replies}
              postId={postId}
              replyingToId={replyingToId}
              replyDrafts={replyDrafts}
              replySubmitting={replySubmitting}
              auth={auth}
              onStartReply={onStartReply}
              onReplyDraftChange={onReplyDraftChange}
              onSubmitReply={onSubmitReply}
            />
          </div>
        )}
      </article>
    );
  });
}

export default function CommunityPage({ navigateTo, auth }) {
  const [feed, setFeed] = useState(initialFeed);
  const [cartCount, setCartCount] = useState(2);
  const [feedError, setFeedError] = useState('');
  const [expandedCommentPosts, setExpandedCommentPosts] = useState(() => new Set());
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [replyingToByPost, setReplyingToByPost] = useState({});
  const [commentLoadingByPost, setCommentLoadingByPost] = useState({});
  const [commentSubmittingByPost, setCommentSubmittingByPost] = useState({});
  const [commentErrors, setCommentErrors] = useState({});

  const totalLikes = useMemo(() => feed.reduce((sum, post) => sum + post.likes, 0), [feed]);

  useEffect(() => {
    let isActive = true;

    const fetchCommunityFeed = async () => {
      let legacySyncError = '';

      if (auth?.user) {
        try {
          await syncLegacyCommunityPosts();
        } catch (error) {
          console.error('Gagal menyinkronkan posting komunitas lama:', error);
          legacySyncError = error instanceof Error ? error.message : 'Posting lama gagal disinkronkan.';
        }
      }

      try {
        const communityPosts = await loadCommunityPosts();
        if (!isActive) return;
        setFeed([...communityPosts, ...initialFeed]);
        setFeedError(legacySyncError);
      } catch (error) {
        console.error('Gagal memuat posting komunitas:', error);
        if (!isActive) return;
        setFeedError(error instanceof Error ? error.message : 'Posting komunitas gagal dimuat.');
      }
    };

    fetchCommunityFeed();
    return () => {
      isActive = false;
    };
  }, [auth?.user?.idUser, auth?.user?.id]);

  const toggleLike = (postId) => {
    setFeed((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
              liked: !post.liked,
            }
          : post,
      ),
    );
  };

  const addToCart = (product) => {
    setCartCount((prev) => prev + 1);
    navigateTo('product-detail', product);
  };

  const handleOpenProduct = (product) => {
    navigateTo('product-detail', product);
  };

  const toggleComments = async (post) => {
    const isExpanded = expandedCommentPosts.has(post.id);
    setExpandedCommentPosts((previous) => {
      const next = new Set(previous);
      if (next.has(post.id)) next.delete(post.id);
      else next.add(post.id);
      return next;
    });

    if (isExpanded || !post.commentable || commentsByPost[post.id] !== undefined) return;

    setCommentLoadingByPost((previous) => ({ ...previous, [post.id]: true }));
    setCommentErrors((previous) => ({ ...previous, [post.id]: '' }));
    try {
      const comments = await loadCommunityComments(post.id);
      setCommentsByPost((previous) => ({ ...previous, [post.id]: comments }));
    } catch (error) {
      console.error('Gagal memuat komentar komunitas:', error);
      setCommentErrors((previous) => ({
        ...previous,
        [post.id]: error instanceof Error ? error.message : 'Komentar gagal dimuat.',
      }));
    } finally {
      setCommentLoadingByPost((previous) => ({ ...previous, [post.id]: false }));
    }
  };

  const startReply = (postId, commentId) => {
    setReplyingToByPost((previous) => ({
      ...previous,
      [postId]: previous[postId] === commentId ? null : commentId,
    }));
  };

  const submitComment = async (event, post, parentCommentId = null) => {
    event.preventDefault();
    const draftKey = parentCommentId === null
      ? post.id
      : getReplyDraftKey(post.id, parentCommentId);
    const body = (commentDrafts[draftKey] || '').trim();
    if (!body || !auth?.user || !post.commentable || commentSubmittingByPost[post.id]) return;

    setCommentSubmittingByPost((previous) => ({ ...previous, [post.id]: true }));
    setCommentErrors((previous) => ({ ...previous, [post.id]: '' }));
    try {
      const comment = await publishCommunityComment(post.id, body, parentCommentId);
      setCommentsByPost((previous) => ({
        ...previous,
        [post.id]: parentCommentId === null
          ? [...(previous[post.id] || []), comment]
          : appendReplyToThread(previous[post.id] || [], parentCommentId, comment),
      }));
      setCommentDrafts((previous) => ({ ...previous, [draftKey]: '' }));
      if (parentCommentId !== null) {
        setReplyingToByPost((previous) => ({ ...previous, [post.id]: null }));
      }
      setFeed((previous) =>
        previous.map((item) =>
          item.id === post.id ? { ...item, comments: item.comments + 1 } : item,
        ),
      );
    } catch (error) {
      console.error('Gagal mengirim komentar komunitas:', error);
      setCommentErrors((previous) => ({
        ...previous,
        [post.id]: error instanceof Error ? error.message : 'Komentar gagal dikirim.',
      }));
    } finally {
      setCommentSubmittingByPost((previous) => ({ ...previous, [post.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(137,92,246,0.18),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] text-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-700/40 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" />
              Community Hub
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Sosialisasi dan promosi karya komunitas</h1>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-950/80 px-3 py-2 backdrop-blur">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari komunitas atau creator"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <button className="rounded-xl border border-slate-700/40 bg-slate-950/70 p-2 text-slate-200">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-700/40 bg-slate-950/80 p-4 shadow-2xl shadow-slate-950/30">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Community Spotlight</p>
                  <p className="text-xs text-slate-400">Kreator aktif hari ini</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-3">
                <p className="text-2xl font-black text-white">{totalLikes}</p>
                <p className="text-xs text-slate-400">reaksi dari posting komunitas</p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-2">
                  <span>Post baru</span>
                  <span className="font-semibold text-emerald-300">24</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-2">
                  <span>Creator online</span>
                  <span className="font-semibold text-sky-300">118</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-2">
                  <span>Keranjang sosial</span>
                  <span className="font-semibold text-amber-300">{cartCount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/40 bg-slate-950/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Komunitas populer</p>
                  <p className="text-xs text-slate-400">Yang lagi ramai dibahas</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Live</span>
              </div>

              <div className="space-y-3">
                {trendingCommunities.map((community) => (
                  <div key={community.name} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <div className="mb-2 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${community.color}`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{community.name}</p>
                        <p className="text-xs text-slate-400">{community.members} members</p>
                      </div>
                    </div>
                    <button className="w-full rounded-xl bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200">Join Komunitas</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Camera className="h-4 w-4 text-fuchsia-200" />
                Promosi creator
              </div>
              <p className="text-sm leading-6 text-slate-300">
                Setiap post bisa jadi media promosi. Bagikan proses, tampilkan detail produk, dan arahkan audience ke halaman checkout premium.
              </p>
            </div>
          </aside>

          <main className="space-y-4">
            {feedError && (
              <p role="alert" className="border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">
                {feedError}
              </p>
            )}
            <div className="rounded-3xl border border-slate-700/40 bg-slate-950/80 p-4 backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 p-3 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">Bagikan proses kreatifmu</p>
                    <p className="text-sm text-slate-400">Foto, video, dan karya komunitas bisa dipromosikan sekaligus dipasarkan.</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">Feed Utama</p>
                  <p className="text-xs">Konten lebih besar, fokus ke cerita komunitas dan produk terpilih.</p>
                </div>
              </div>
            </div>

            {feed.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-[0_20px_60px_-30px_rgba(168,85,247,0.5)]">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 font-black text-white">
                      {post.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{post.user}</p>
                      <p className="text-xs text-slate-400">{post.handle} • {post.time}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-200">
                    {post.mood}
                  </span>
                </div>

                <div className="px-4 pb-3">
                  <h2 className="text-lg font-semibold text-white">{post.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{post.caption}</p>
                </div>

                {post.mediaType !== 'text' && (
                  <div className="px-4 pb-4">
                    {post.mediaType === 'image' ? (
                      <img src={post.mediaUrl} alt={post.title} className="h-72 w-full rounded-2xl object-cover" />
                    ) : (
                      <div className="relative overflow-hidden rounded-2xl bg-black">
                        <video src={post.mediaUrl} controls className="h-72 w-full object-cover" />
                        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                          <Play className="h-3.5 w-3.5" />
                          Video Process
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-white/10 px-4 py-3">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">Campaign</span>
                    <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">Promosi</span>
                    <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">Sosial</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${post.liked ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-950/70 text-slate-300'}`}
                    >
                      <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                      {post.likes}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(post)}
                      aria-expanded={expandedCommentPosts.has(post.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${expandedCommentPosts.has(post.id) ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'bg-slate-950/70 text-slate-300'}`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                      <Share2 className="h-4 w-4" />
                      {post.shares}
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                      <Bookmark className="h-4 w-4" />
                      Simpan
                    </button>
                  </div>
                </div>

                {expandedCommentPosts.has(post.id) && (
                  <section className="border-t border-white/10 bg-slate-950/40 px-4 py-4" aria-label="Komentar komunitas">
                    <div className="space-y-3">
                      {commentLoadingByPost[post.id] ? (
                        <p className="text-sm text-slate-400">Memuat komentar...</p>
                      ) : !post.commentable ? (
                        <p className="text-sm text-slate-400">Komentar tersedia pada posting komunitas yang tersimpan.</p>
                      ) : commentsByPost[post.id]?.length ? (
                        <div className="space-y-4">
                          <CommunityCommentThread
                            comments={commentsByPost[post.id]}
                            postId={post.id}
                            replyingToId={replyingToByPost[post.id]}
                            replyDrafts={commentDrafts}
                            replySubmitting={commentSubmittingByPost[post.id]}
                            auth={auth}
                            onStartReply={startReply}
                            onReplyDraftChange={(key, value) => setCommentDrafts((previous) => ({ ...previous, [key]: value }))}
                            onSubmitReply={(event, _postId, commentId) => submitComment(event, post, commentId)}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Belum ada komentar. Jadilah yang pertama berkomentar.</p>
                      )}
                    </div>

                    {commentErrors[post.id] && (
                      <p role="alert" className="mt-3 text-xs text-rose-300">{commentErrors[post.id]}</p>
                    )}

                    {post.commentable && (
                      auth?.user ? (
                        <form onSubmit={(event) => submitComment(event, post)} className="mt-4 flex items-end gap-2">
                          <textarea
                            value={commentDrafts[post.id] || ''}
                            onChange={(event) => setCommentDrafts((previous) => ({ ...previous, [post.id]: event.target.value }))}
                            maxLength={1000}
                            rows={1}
                            placeholder={`Tulis komentar sebagai ${auth.user.name || 'pengguna'}...`}
                            aria-label="Tulis komentar"
                            className="min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60"
                          />
                          <button
                            type="submit"
                            disabled={commentSubmittingByPost[post.id] || !(commentDrafts[post.id] || '').trim()}
                            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-fuchsia-500 px-4 text-sm font-bold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            {commentSubmittingByPost[post.id] ? 'Mengirim...' : 'Kirim'}
                          </button>
                        </form>
                      ) : (
                        <p className="mt-4 rounded-xl bg-slate-900/80 px-3 py-2 text-sm text-slate-400">
                          Login melalui tombol di header untuk ikut berkomentar.
                        </p>
                      )
                    )}
                  </section>
                )}

                {post.product && (
                  <div className="border-t border-white/10 bg-slate-950/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                      <ShoppingBag className="h-4 w-4 text-amber-300" />
                      Produk yang dipromosikan
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <img src={post.product.image} alt={post.product.nama} className="h-16 w-16 rounded-2xl object-cover" />
                        <div>
                          <p className="text-sm font-bold text-white">{post.product.nama}</p>
                          <p className="text-xs text-slate-400">Harga {post.product.price_crypto}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenProduct(post.product)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Lihat Detail
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => addToCart(post.product)}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Tambah Keranjang
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </main>

        </div>
      </div>
    </div>
  );
}
