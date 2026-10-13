const { URL } = require('url');

function createSupabasePhotoStorage({ url, serviceRoleKey, bucket = 'profile-photos', fetchImpl = globalThis.fetch }) {
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for profile photo storage');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required for Supabase photo storage');
  }

  const projectUrl = url.replace(/\/+$/, '');
  const objectRoot = `${projectUrl}/storage/v1/object`;
  const publicRoot = `${objectRoot}/public/${encodeURIComponent(bucket)}/`;
  const encodedKey = (key) => key.split('/').map(encodeURIComponent).join('/');

  async function request(endpoint, options) {
    const response = await fetchImpl(`${objectRoot}/${endpoint}`, {
      ...options,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      throw new Error(`Supabase Storage request failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }
    return response;
  }

  return {
    publicUrl(key) {
      return `${publicRoot}${encodedKey(key)}`;
    },
    objectKeyFromUrl(photoUrl) {
      if (!photoUrl) return null;
      try {
        const candidate = new URL(photoUrl);
        const root = new URL(projectUrl);
        if (candidate.origin !== root.origin || !candidate.pathname.startsWith(new URL(publicRoot).pathname)) return null;
        return candidate.pathname.slice(new URL(publicRoot).pathname.length).split('/').map(decodeURIComponent).join('/');
      } catch {
        return null;
      }
    },
    async upload(key, file, contentType, { upsert = false } = {}) {
      await request(`${encodeURIComponent(bucket)}/${encodedKey(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': contentType, 'x-upsert': String(upsert), 'cache-control': '3600' },
        body: file,
      });
      return this.publicUrl(key);
    },
    async remove(key) {
      if (!key) return;
      await request(encodeURIComponent(bucket), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [key] }),
      });
    },
  };
}

module.exports = { createSupabasePhotoStorage };
