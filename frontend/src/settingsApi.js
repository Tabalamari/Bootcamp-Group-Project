const defaultBase = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

export function createSettingsApi({ base = defaultBase, storage = globalThis.window?.sessionStorage, fetcher = fetch } = {}) {
  async function request(path, method = 'GET', body) {
    const token = storage?.getItem('bootcamp-connect-token');
    if (!token) throw new Error('Please sign in again to manage your account.');

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
    async get() {
      const account = await request('/account');
      return { displayName: account.displayName, courseId: account.courseId };
    },
    async save(_user, values) {
      const account = await request('/account', 'PATCH', {
        displayName: values.displayName.trim(),
        courseId: values.courseId,
      });
      return { displayName: account.displayName, courseId: account.courseId };
    },
    async password(_user, values) {
      return request('/account/password', 'POST', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
  };
}

export const settingsApi = createSettingsApi();
