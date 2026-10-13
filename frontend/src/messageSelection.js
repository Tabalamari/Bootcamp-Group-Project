export function findSelectedConversation(chats, selected) {
  if (selected === null || selected === undefined || selected === '') return null;
  return chats.find(chat => chat.id === selected || chat.person?.id === selected) || null;
}

export function isConversationSelected(chat, selected) {
  return selected !== null && selected !== undefined && selected !== '' &&
    (chat.id === selected || chat.person?.id === selected);
}
