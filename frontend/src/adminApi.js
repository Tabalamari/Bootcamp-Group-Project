const defaultBase = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

export function createAdminApi({ base = defaultBase, storage = globalThis.window?.sessionStorage, fetcher = fetch } = {}) {
  async function request(path, method = 'GET', body) {
    const token = storage?.getItem('bootcamp-connect-token');
    if (!token) throw new Error('Please sign in again to access administration.');

    let response;
    try {
      response = await fetcher(`${base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('We couldn’t reach the server. Please try again.');
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.error || data?.message || 'Something went wrong. Please try again.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  return {
    load: () => request('/admin/workspace'),
    async save(_actor, kind, input) {
      const path = `/admin/${encodeURIComponent(kind)}${input.id ? `/${encodeURIComponent(input.id)}` : ''}`;
      const body = { name: input.name };
      if (['skills', 'interests'].includes(kind)) body.categoryId = input.categoryId || '';
      return request(path, input.id ? 'PATCH' : 'POST', body);
    },
    setActive: (_actor, kind, id, active) => request(`/admin/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, 'PATCH', { active }),
    updateUser: (_actor, id, changes) => request(`/admin/users/${encodeURIComponent(id)}`, 'PATCH', {
      courseId: changes.courseId,
      status: changes.status,
    }),
  };
}

export const adminApi = createAdminApi();
