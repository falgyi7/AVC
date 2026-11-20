const COMMUNITY_POSTS_KEY = 'artvibes-community-posts';

const getRequestHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
});

const readResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const validationMessage = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    throw new Error(validationMessage || data.message || `Permintaan Community Hub gagal (${response.status}).`);
  }
  return data;
};

const readLegacyPosts = () => {
  const savedPosts = window.localStorage.getItem(COMMUNITY_POSTS_KEY);
  if (!savedPosts) return [];

  const posts = JSON.parse(savedPosts);
  if (
    !Array.isArray(posts) ||
    posts.some((post) =>
      !post ||
      typeof post.id !== 'string' ||
      typeof post.caption !== 'string'
    )
  ) {
    throw new Error('Data posting komunitas lama tidak valid dan tidak dapat disinkronkan.');
  }

  return posts;
};

export async function loadCommunityPosts() {
  const response = await fetch('/api/community/posts', {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  const data = await readResponse(response);

  if (!Array.isArray(data.data)) {
    throw new Error('Format data Community Hub dari server tidak valid.');
  }

  return data.data;
}

export async function publishCommunityPost(post) {
  const response = await fetch('/api/community/posts', {
    method: 'POST',
    headers: getRequestHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      client_id: post.id,
      caption: post.caption,
      product_id: post.product?.idproduk ?? null,
    }),
  });
  const data = await readResponse(response);
  return data.data;
}

export async function loadCommunityComments(postId) {
  const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  const data = await readResponse(response);

  if (!Array.isArray(data.data)) {
    throw new Error('Format komentar komunitas dari server tidak valid.');
  }

  return data.data;
}

export async function publishCommunityComment(postId, body, parentCommentId = null) {
  const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    headers: getRequestHeaders(),
    credentials: 'include',
    body: JSON.stringify({ body, parent_comment_id: parentCommentId }),
  });
  const data = await readResponse(response);
  return data.data;
}

export async function syncLegacyCommunityPosts() {
  const legacyPosts = readLegacyPosts();
  if (legacyPosts.length === 0) return [];

  const response = await fetch('/api/community/posts/sync', {
    method: 'POST',
    headers: getRequestHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      posts: legacyPosts.map((post) => ({
        id: post.id,
        caption: post.caption,
        product_id: post.product?.idproduk ?? post.product?.id ?? post.product?.id_produk ?? null,
      })),
    }),
  });
  const data = await readResponse(response);
  window.localStorage.removeItem(COMMUNITY_POSTS_KEY);
  return data.data;
}
