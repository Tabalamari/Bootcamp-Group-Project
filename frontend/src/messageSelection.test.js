import test from 'node:test';
import assert from 'node:assert/strict';
import { findSelectedConversation, isConversationSelected } from './messageSelection.js';

const deletedChat = { id: 'deleted-chat', person: { id: null, displayName: 'Deleted User' } };
const activeChat = { id: 'active-chat', person: { id: 'active-user', displayName: 'Learner' } };
const chats = [deletedChat, activeChat];

test('clearing selection returns to the inbox even when a deleted participant has a null ID', () => {
  assert.equal(findSelectedConversation(chats, null), null);
  assert.equal(findSelectedConversation(chats, undefined), null);
});

test('selecting a conversation by conversation ID or active user ID opens that chat', () => {
  assert.equal(findSelectedConversation(chats, deletedChat.id), deletedChat);
  assert.equal(findSelectedConversation(chats, activeChat.person.id), activeChat);
});

test('a deleted-user row is not highlighted when no conversation is selected', () => {
  assert.equal(isConversationSelected(deletedChat, null), false);
  assert.equal(isConversationSelected(deletedChat, deletedChat.id), true);
});
