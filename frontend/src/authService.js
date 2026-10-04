import { createDemoAuth } from './demoAuth';

export const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';
const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
async function request(path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method, credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new Error('We couldn’t reach the server. Please try again.'); }
  if (path === '/auth/session' && response.status === 401) return null;
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Something went wrong. Please try again.');
  return data;
}

export const auth = isDemo ? createDemoAuth() : {
  courses: () => request('/courses'),
  session: async () => (await request('/auth/session'))?.user || null,
  register: async values => (await request('/auth/register', 'POST', values)).user,
  login: async values => (await request('/auth/login', 'POST', values)).user,
  logout: () => request('/auth/logout', 'POST'),
};
