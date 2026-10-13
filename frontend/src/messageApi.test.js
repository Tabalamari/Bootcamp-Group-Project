import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  location: { origin: 'http://localhost:5173' },
  sessionStorage: { getItem: () => 'peer-session' },
};
globalThis.fetch = async (url, options = {}) => {
  if (url.endsWith('/conversations')) {
    return Response.json({ conversations: [{
      id: 'preserved-chat',
      otherParticipant: { id: null, displayName: 'Deleted User', courseName: null, photoUrl: null, status: 'deleted' },
      lastMessage: { id: 'old-message', senderId: null, text: 'History stays here', createdAt: '2026-01-01T00:00:00.000Z' },
      unreadCount: 0,
      updatedAt: '2026-01-01T00:00:00.000Z',
    }] });
  }
  if (url.endsWith('/preserved-chat/messages')) {
    if (options.method === 'POST') return Response.json({ error: 'This conversation is read-only because the other account was deleted' }, { status: 410 });
    return Response.json({
      conversationId: 'preserved-chat',
      messages: [{ id: 'old-message', senderId: null, text: 'History stays here', createdAt: '2026-01-01T00:00:00.000Z' }],
    });
  }
  throw new Error(`Unexpected request: ${url}`);
};

const { messageApi } = await import('./messageApi.js');

test('inbox retains deleted-user conversations under a stable ID and renders old messages as incoming', async () => {
  const inbox = await messageApi.list('peer-user');
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].id, 'preserved-chat');
  assert.equal(inbox[0].person.displayName, 'Deleted User');
  assert.equal(inbox[0].person.photo, '');
  const history = await messageApi.history('peer-user', 'preserved-chat');
  assert.equal(history[0].sender, 'other');
  assert.equal(history[0].text, 'History stays here');
  await assert.rejects(messageApi.send('peer-user', 'preserved-chat', 'New message'), /read-only because the other account was deleted/);
});
