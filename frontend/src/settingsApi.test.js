import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsApi } from './settingsApi.js';

function setup() {
  const calls = [];
  const removed = [];
  const storage = { getItem: key => key === 'bootcamp-connect-token' ? 'session-token' : null, removeItem: key => removed.push(key) };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'DELETE') return new Response(null, { status: 204 });
    if (url.endsWith('/account/password')) return Response.json({ message: 'Password updated successfully.' });
    if (url.endsWith('/account/email')) return Response.json({ email: 'new@example.com' });
    if (options.method === 'PATCH') return Response.json({ displayName: 'Malak Updated', courseId: 'business-dev', email: 'malak@example.com' });
    return Response.json({ id: 'one', displayName: 'Malak', email: 'malak@example.com', courseId: 'software-dev' });
  };
  return { api: createSettingsApi({ base: '/api', storage, fetcher }), calls, removed };
}

test('account settings API loads and saves the authenticated account', async () => {
  const { api, calls } = setup();
  assert.deepEqual(await api.get(), { displayName: 'Malak', courseId: 'software-dev', email: 'malak@example.com' });
  assert.deepEqual(await api.save({}, { displayName: ' Malak Updated ', courseId: 'business-dev' }), { displayName: 'Malak Updated', courseId: 'business-dev', email: 'malak@example.com' });
  assert.equal(calls[0].url, '/api/account');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer session-token');
  assert.equal(calls[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1].options.body), { displayName: 'Malak Updated', courseId: 'business-dev' });
});

test('password API reauthenticates and sends only current and new passwords', async () => {
  const { api, calls } = setup();
  await api.password({}, { currentPassword: 'Current123!', newPassword: 'NewPassword456!' });
  const call = calls[0];
  assert.equal(call.url, '/api/account/password');
  assert.equal(call.options.method, 'POST');
  assert.deepEqual(JSON.parse(call.options.body), { currentPassword: 'Current123!', newPassword: 'NewPassword456!' });
});

test('email API sends the normalized new email and current password', async () => {
  const { api, calls } = setup();
  assert.deepEqual(await api.email({}, { newEmail: ' New@Example.com ', currentPassword: 'Current123!' }), { email: 'new@example.com' });
  assert.equal(calls[0].url, '/api/account/email');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'new@example.com', currentPassword: 'Current123!' });
});

test('account deletion sends password and typed confirmation, then clears only the local session token', async () => {
  const { api, calls, removed } = setup();
  await api.deleteAccount({}, { currentPassword: 'Current123!', confirmText: 'DELETE' });
  assert.equal(calls[0].url, '/api/account');
  assert.equal(calls[0].options.method, 'DELETE');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer session-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), { currentPassword: 'Current123!', confirmText: 'DELETE' });
  assert.deepEqual(removed, ['bootcamp-connect-token']);
});

test('account settings API preserves server status and message for form feedback', async () => {
  const api = createSettingsApi({
    base: '/api',
    storage: { getItem: () => 'session-token' },
    fetcher: async () => Response.json({ error: 'The current password is incorrect.' }, { status: 401 }),
  });
  await assert.rejects(api.password({}, { currentPassword: 'wrong', newPassword: 'NewPassword456!' }), error => {
    assert.equal(error.status, 401);
    assert.equal(error.message, 'The current password is incorrect.');
    return true;
  });
});
