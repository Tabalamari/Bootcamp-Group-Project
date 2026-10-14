import { samplePeople } from './discoveryService.js';

export function createMessageService() {
  const accounts = new Map();
  const listeners = new Set();
  let sequence = 0;
  const notify = () => listeners.forEach(listener => listener());
  function account(userId) {
    if (!userId) throw new Error('Sign in to view messages.');
    if (!accounts.has(userId)) accounts.set(userId, { chats: [], drafts: {} });
    return accounts.get(userId);
  }
  function chat(userId, personId) {
    const found = account(userId).chats.find(c => c.person.id === personId);
    if (!found) throw new Error('Conversation unavailable.');
    return found;
  }
  function open(userId, personId) {
    const person = samplePeople.find(p => p.id === personId && p.status === 'active');
    if (!person || personId === userId) throw new Error('This person cannot be contacted.');
    const data = account(userId);
    if (!data.chats.some(c => c.person.id === personId)) data.chats.unshift({ person: structuredClone(person), messages: [], unread: 0, hidden: false });
    else data.chats.find(c => c.person.id === personId).hidden = false;
    notify();
    return personId;
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    list(userId) { return structuredClone(account(userId).chats.filter(chat => chat.messages.length > 0 && !chat.hidden)).sort((a,b) => (b.messages.at(-1)?.order || 0) - (a.messages.at(-1)?.order || 0)); },
    open,
    pending(userId, personId) {
      const conversation = account(userId).chats.find(item => item.person.id === personId && item.messages.length === 0);
      return conversation ? structuredClone(conversation) : null;
    },
    read(userId, personId) { const c = chat(userId, personId); if (c.unread) { c.unread = 0; notify(); } },
    hide(userId, personId) {
      const c = chat(userId, personId);
      c.hidden = true;
      delete account(userId).drafts[personId];
      notify();
    },
    draft(userId, personId) { return account(userId).drafts[personId] || ''; },
    saveDraft(userId, personId, text) { account(userId).drafts[personId] = text; },
    async send(userId, personId, text, fail = false) {
      const c = chat(userId, personId);
      if (!text.trim() || text.trim().length > 2000) throw new Error('Write a message between 1 and 2,000 characters.');
      await new Promise(resolve => setTimeout(resolve, 150));
      if (fail) throw new Error('Sample send failure. Your draft is kept; try sending again.');
      c.messages.push({ id: `message-${++sequence}`, order: sequence, sender: 'you', text: text.trim(), createdAt: new Date().toISOString() });
      account(userId).drafts[personId] = '';
      notify();
    },
    simulateIncoming(userId, personId = 'sample-amara') {
      open(userId, personId);
      const c = chat(userId, personId);
      c.hidden = false;
      c.messages.push({ id: `message-${++sequence}`, order: sequence, sender: personId, text: 'Hi! Would you like to share ideas for a bootcamp project?', createdAt: new Date().toISOString() });
      c.unread++;
      notify();
      return c.person.displayName;
    },
  };
}
export const messageService = createMessageService();
