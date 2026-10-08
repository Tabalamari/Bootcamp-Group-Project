const apiRoot = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const assetOrigin = import.meta.env.VITE_ASSET_ORIGIN || `${window.location.protocol}//${window.location.hostname}:3000`;
async function request(path) {
  const token = window.sessionStorage.getItem('bootcamp-connect-token');
  if (!token) throw new Error('Please sign in again to discover learners.');
  let response;
  try { response = await fetch(`${apiRoot}${path}`, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new Error('We couldn’t reach the server. Please try again.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Could not load the community. Please try again.');
  return data;
}
export const discoveryApi = {
  async list(filters = {}, page = 1) {
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (filters.query?.trim()) params.set('query', filters.query.trim());
    if (filters.courseId) params.set('courseId', filters.courseId);
    for (const key of ['skills', 'interests', 'goals']) if (filters[key]?.length) params.set(key, filters[key].join(','));
    const result = await request(`/profiles?${params}`);
    return { people: result.profiles.map(p => ({ ...p, photo: p.photoUrl ? new URL(p.photoUrl, assetOrigin).href : '' })), pagination: result.pagination };
  },
  async detail(id) {
    const profile = await request(`/profiles/${encodeURIComponent(id)}`);
    return { ...profile, photo: profile.photoUrl ? new URL(profile.photoUrl, assetOrigin).href : '' };
  },
};
