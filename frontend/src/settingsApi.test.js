import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsApi } from './settingsApi.js';

function setup() {
  const calls = [];
  const storage = { getItem: key => key === 'bootcamp-connect-token' ? 'session-token' : null };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/account/password')) return Response.json({ message: 'Password updated successfully.' });
    if (options.method === 'PATCH') return Response.json({ displayName: 'Malak Updated', courseId: 'business-dev' });
    return Response.json({ id: 'one', displayName: 'Malak', email: 'malak@example.com', courseId: 'software-dev' });
  };
  return { api: createSettingsApi({ base: '/api', storage, fetcher }), calls };
}

test('account settings API loads and saves the authenticated account', async () => {
  const { api, calls } = setup();
  assert.deepEqual(await api.get(), { displayName: 'Malak', courseId: 'software-dev' });
  assert.deepEqual(await api.save({}, { displayName: ' Malak Updated ', courseId: 'business-dev' }), { displayName: 'Malak Updated', courseId: 'business-dev' });
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
