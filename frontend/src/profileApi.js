const apiRoot = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const assetOrigin = import.meta.env.VITE_ASSET_ORIGIN || window.location.origin;
function authHeaders() {
  const token = window.sessionStorage.getItem('bootcamp-connect-token');
  if (!token) throw new Error('Please sign in again to manage your profile.');
  return { Authorization: `Bearer ${token}` };
}
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${apiRoot}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } }); }
  catch { throw new Error('We couldn’t reach the server. Please try again.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || data?.message || 'Something went wrong. Please try again.');
  return data;
}
function withPhoto(profile) {
  return { ...profile, photo: profile.photoUrl ? new URL(profile.photoUrl, assetOrigin).href : '' };
}
export const profileApi = {
  async get() { return withPhoto(await request('/profiles/me')); },
  async options() { return request('/profile-options'); },
  async save(_user, profile) {
    const { displayName, bio, skills, interests, goals } = profile;
    return withPhoto(await request('/profiles/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName, bio, skills, interests, goals }) }));
  },
  async upload(file) {
    const body = new FormData(); body.append('photo', file);
    return request('/profiles/me/photo', { method: 'POST', body });
  },
  async removePhoto() { return request('/profiles/me/photo', { method: 'DELETE' }); },
};
