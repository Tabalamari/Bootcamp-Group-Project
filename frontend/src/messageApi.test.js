import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  location: { origin: 'http://localhost:5173' },
  sessionStorage: { getItem: () => 'peer-session' },
};
let mockConversations = [{
  id: 'preserved-chat',
  otherParticipant: { id: null, displayName: 'Deleted User', courseName: null, photoUrl: null, status: 'deleted' },
  lastMessage: { id: 'old-message', senderId: null, text: 'History stays here', createdAt: '2026-01-01T00:00:00.000Z' },
  unreadCount: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
}];
let mockMessages = [];
globalThis.fetch = async (url, options = {}) => {
  if (url.endsWith('/new-chat') && options.method === 'DELETE') {
    mockConversations = mockConversations.filter(item => item.id !== 'new-chat');
    return new Response(null, { status: 204 });
  }
  if (url.endsWith('/conversations')) {
    if (options.method === 'POST') {
      const conversation = {
        id: 'new-chat',
        otherParticipant: { id: 'new-person', displayName: 'New Person', courseName: 'Software Development', photoUrl: null },
        lastMessage: null,
        unreadCount: 0,
        updatedAt: '2026-01-02T00:00:00.000Z',
      };
      mockConversations.push(conversation);
      return Response.json({ conversation });
    }
    return Response.json({ conversations: mockConversations });
  }
  if (url.endsWith('/new-chat/messages')) {
    if (options.method === 'POST') {
      const text = JSON.parse(options.body).text;
      const message = { id: 'new-message', conversationId: 'new-chat', senderId: 'new-user', text, createdAt: '2026-01-02T00:00:01.000Z' };
      mockMessages.push(message);
      mockConversations.find(item => item.id === 'new-chat').lastMessage = message;
      return Response.json(message);
    }
    return Response.json({ conversationId: 'new-chat', messages: mockMessages });
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

test('an unsent conversation stays available to its sender but hidden from the inbox until the first message', async () => {
  mockConversations = [];
  mockMessages = [];
  const conversationId = await messageApi.open('new-user', 'new-person');
  assert.equal((await messageApi.list('new-user')).length, 0);
  assert.equal(messageApi.pending('new-user', conversationId).person.displayName, 'New Person');

  await messageApi.send('new-user', conversationId, 'Hello!');
  const inbox = await messageApi.list('new-user');
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].id, conversationId);
  assert.equal(inbox[0].lastMessage.text, 'Hello!');
  assert.equal(messageApi.pending('new-user', conversationId), null);
});

test('deleting a conversation for me removes only the local inbox copy after the API confirms', async () => {
  assert.equal((await messageApi.list('new-user')).length, 1);
  messageApi.saveDraft('new-user', 'new-person', 'A draft');
  await messageApi.hide('new-user', 'new-chat');
  assert.deepEqual(await messageApi.list('new-user'), []);
  assert.equal(messageApi.draft('new-user', 'new-person'), '');
});
