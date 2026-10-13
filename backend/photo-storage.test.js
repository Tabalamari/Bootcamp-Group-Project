const test = require('node:test');
const assert = require('node:assert/strict');
const { createSupabasePhotoStorage } = require('./photo-storage');

test('uploads a photo using server-side credentials and returns its public URL', async () => {
  let request;
  const storage = createSupabasePhotoStorage({
    url: 'https://project.supabase.co/',
    serviceRoleKey: 'server-only-key',
    bucket: 'profile-photos',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, text: async () => '' };
    },
  });

  const url = await storage.upload('user-1/photo one.png', Buffer.from('image'), 'image/png');
  assert.equal(url, 'https://project.supabase.co/storage/v1/object/public/profile-photos/user-1/photo%20one.png');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.apikey, 'server-only-key');
  assert.equal(request.options.headers.Authorization, 'Bearer server-only-key');
  assert.equal(storage.objectKeyFromUrl(url), 'user-1/photo one.png');
});

test('does not treat another host or bucket as one of this app’s uploaded photos', () => {
  const storage = createSupabasePhotoStorage({
    url: 'https://project.supabase.co',
    serviceRoleKey: 'server-only-key',
    bucket: 'profile-photos',
  });
  assert.equal(storage.objectKeyFromUrl('https://other.supabase.co/storage/v1/object/public/profile-photos/u/a.png'), null);
  assert.equal(storage.objectKeyFromUrl('https://project.supabase.co/storage/v1/object/public/other/u/a.png'), null);
});

test('reports storage failures without hiding the failed status', async () => {
  const storage = createSupabasePhotoStorage({
    url: 'https://project.supabase.co',
    serviceRoleKey: 'server-only-key',
    fetchImpl: async () => ({ ok: false, status: 403, text: async () => 'bucket policy denied' }),
  });
  await assert.rejects(storage.upload('u/a.png', Buffer.from('image'), 'image/png'), /403/);
});

test('removes a single object through the selected bucket API', async () => {
  let request;
  const storage = createSupabasePhotoStorage({
    url: 'https://project.supabase.co',
    serviceRoleKey: 'server-only-key',
    bucket: 'profile-photos',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, text: async () => '' };
    },
  });
  await storage.remove('user-1/photo.png');
  assert.equal(request.url, 'https://project.supabase.co/storage/v1/object/profile-photos');
  assert.equal(request.options.method, 'DELETE');
  assert.deepEqual(JSON.parse(request.options.body), { prefixes: ['user-1/photo.png'] });
});
