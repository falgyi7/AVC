const fetchWithTimeout = async (url, options = {}, timeoutMs = 22000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function uploadAssetToIpfs(file, name) {
  const formData = new FormData();
  formData.append('file', file);
  if (name) {
    formData.append('name', name);
  }

  const response = await fetchWithTimeout('/api/ipfs/upload-asset', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Upload asset ke IPFS gagal');
  }

  return data;
}

export async function uploadMetadataToIpfs(payload) {
  const response = await fetchWithTimeout('/api/ipfs/upload-metadata', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Upload metadata ke IPFS gagal');
  }

  return data;
}

export async function linkNftToProduct(payload) {
  const response = await fetchWithTimeout('/api/nfts/link', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Sinkronisasi NFT ke produk gagal');
  }

  return data;
}
