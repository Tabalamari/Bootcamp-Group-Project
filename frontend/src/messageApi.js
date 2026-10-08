const apiRoot = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');
const assetOrigin = import.meta.env?.VITE_ASSET_ORIGIN || `${window.location.protocol}//${window.location.hostname}:3000`;

let conversations = [];
let ownerId = null;
const listeners = new Set();
const drafts = new Map();
const notify = () => listeners.forEach(listener => listener());
const draftKey = (userId, personId) => `${userId}:${personId}`;

async function request(path, options = {}) {
  const token = window.sessionStorage.getItem('bootcamp-connect-token');
  if (!token) throw new Error('Please sign in again to view messages.');
  let response;
  try {
    response = await fetch(`${apiRoot}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
  } catch {
    throw new Error('We couldn’t reach the server. Your message is still in the draft. Please try again.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || data?.message || 'Could not load messages. Please try again.');
  return data;
}

function mapConversation(conversation) {
  const person = conversation.otherParticipant;
  const previous = conversations.find(item => item.person.id === person.id);
  return {
    id: conversation.id,
    person: {
      ...person,
      photo: person.photoUrl ? new URL(person.photoUrl, assetOrigin).href : '',
    },
    messages: previous?.messages || [],
    lastMessage: conversation.lastMessage,
    unread: conversation.unreadCount || 0,
    updatedAt: conversation.updatedAt,
  };
}

async function list(userId) {
  if (ownerId !== userId) {
    conversations = [];
    ownerId = userId;
  }
  const data = await request('/conversations');
  conversations = (data.conversations || []).map(mapConversation);
  notify();
  return structuredClone(conversations);
}

function getConversation(userId, personId) {
  if (ownerId !== userId) throw new Error('Refresh your inbox and try again.');
  const conversation = conversations.find(item => item.person.id === personId);
  if (!conversation) throw new Error('Conversation unavailable. Refresh your inbox and try again.');
  return conversation;
}

export const messageApi = {
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  snapshot() { return structuredClone(conversations); },
  list,
  async open(userId, personId) {
    const data = await request('/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: personId }),
    });
    await list(userId);
    return data.conversation.otherParticipant.id;
  },
  async history(userId, personId) {
    const conversation = getConversation(userId, personId);
    const data = await request(`/conversations/${encodeURIComponent(conversation.id)}/messages`);
    const latest = conversations.find(item => item.id === data.conversationId);
    if (!latest) return [];
    latest.messages = data.messages.map(message => ({
      id: message.id,
      sender: message.senderId === userId ? 'you' : personId,
      text: message.text,
      createdAt: message.createdAt,
    }));
    notify();
    return structuredClone(latest.messages);
  },
  async read(_userId, personId) {
    const conversation = getConversation(_userId, personId);
    if (!conversation.unread) return;
    await request(`/conversations/${encodeURIComponent(conversation.id)}/read`, { method: 'POST' });
    conversation.unread = 0;
    notify();
  },
  draft(userId, personId) { return drafts.get(draftKey(userId, personId)) || ''; },
  saveDraft(userId, personId, text) { drafts.set(draftKey(userId, personId), text); },
  async send(userId, personId, text) {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 2000) throw new Error('Write a message between 1 and 2,000 characters.');
    const conversation = getConversation(userId, personId);
    await request(`/conversations/${encodeURIComponent(conversation.id)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });
    drafts.delete(draftKey(userId, personId));
    await list(userId);
    await this.history(userId, personId);
  },
};
