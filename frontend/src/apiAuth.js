export function createApiAuth({ base = '/api', storage, fetcher = fetch }) {
  const key = 'bootcamp-connect-token';
  async function request(path, method = 'GET', body) {
    const token = storage.getItem(key);
    let response;
    try {
      response = await fetcher(`${base}${path}`, {
        method,
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    } catch { throw new Error('We couldn’t reach the server. Please try again.'); }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.error || data?.message || 'Something went wrong. Please try again.');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  async function authenticate(path, values) {
    const result = await request(path, 'POST', values);
    if (!result?.token || !result?.user) throw new Error('The server did not return your account. Please try again.');
    storage.setItem(key, result.token);
    return result.user;
  }
  return {
    courses: () => request('/courses'),
    session: async () => {
      if (!storage.getItem(key)) return null;
      try { return (await request('/auth/me')).user; }
      catch (error) {
        if ([401,403].includes(error.status)) { storage.removeItem(key); return null; }
        throw error;
      }
    },
    register: values => authenticate('/auth/register', values),
    login: values => authenticate('/auth/login', values),
    logout: async () => {
      try { if (storage.getItem(key)) await request('/auth/logout', 'POST'); }
      catch (error) { if (![401,403].includes(error.status)) throw error; }
      storage.removeItem(key);
    },
  };
}
