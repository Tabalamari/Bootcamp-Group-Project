import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminApi } from './adminApi.js';

function setup(handler) {
  const calls = [];
  const storage = { getItem: key => key === 'bootcamp-connect-token' ? 'admin-token' : null };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return handler(url, options);
  };
  return { api: createAdminApi({ base: 'http://localhost:3000/api', storage, fetcher }), calls };
}

const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('admin API loads the workspace with the signed-in bearer token', async () => {
  const workspace = { categories: [], skills: [], interests: [], courses: [], users: [] };
  const { api, calls } = setup(() => json(workspace));
  assert.deepEqual(await api.load(), workspace);
  assert.equal(calls[0].url, 'http://localhost:3000/api/admin/workspace');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer admin-token');
});

test('admin API maps create, edit, activation, and user changes to backend routes', async () => {
  const { api, calls } = setup(() => json({ ok: true }));
  await api.save(null, 'skills', { name: 'Accessibility', categoryId: 'technical' });
  await api.save(null, 'courses', { id: 'software-dev', name: 'Software development' });
  await api.setActive(null, 'categories', 'technical', false);
  await api.updateUser(null, 'learner-1', { courseId: 'business-dev', status: 'suspended' });

  assert.deepEqual(calls.map(({ url, options }) => [url, options.method, options.body]), [
    ['http://localhost:3000/api/admin/skills', 'POST', '{"name":"Accessibility","categoryId":"technical"}'],
    ['http://localhost:3000/api/admin/courses/software-dev', 'PATCH', '{"name":"Software development"}'],
    ['http://localhost:3000/api/admin/categories/technical', 'PATCH', '{"active":false}'],
    ['http://localhost:3000/api/admin/users/learner-1', 'PATCH', '{"courseId":"business-dev","status":"suspended"}'],
  ]);
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
});

test('admin API reports access errors and does not make unauthenticated requests', async () => {
  let count = 0;
  const { api } = setup(() => { count += 1; return json({ error: 'Administrator access required' }, 403); });
  await assert.rejects(api.load(), error => error.message === 'Administrator access required' && error.status === 403);
  assert.equal(count, 1);

  const unauthenticated = createAdminApi({
    base: '/api', storage: { getItem: () => null }, fetcher: async () => { count += 1; },
  });
  await assert.rejects(unauthenticated.load(), /Please sign in again/);
  assert.equal(count, 1);
});
