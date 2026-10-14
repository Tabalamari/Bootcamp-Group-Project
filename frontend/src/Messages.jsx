import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Profile';
import { isDemo } from './authService';
import { messageApi } from './messageApi';
import { messageService } from './messageService';
import { findSelectedConversation, isConversationSelected } from './messageSelection';

const service = isDemo ? messageService : messageApi;

export default function Messages({ user, selected, onSelect }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [failNext, setFailNext] = useState(false);
  const end = useRef(null);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const result = await service.list(user.id);
      setChats(result);
      setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => {
    if (isDemo) {
      load();
      return messageService.subscribe(() => load(false));
    }
    const sync = () => { setChats(messageApi.snapshot()); setLoading(false); };
    const unsubscribe = messageApi.subscribe(sync);
    load();
    return unsubscribe;
  }, [user.id]);

  const current = findSelectedConversation(chats, selected) || service.pending(user.id, selected);

  useEffect(() => {
    setDraft(selected ? service.draft(user.id, selected) : '');
    setError('');
    setHistoryError('');
    if (!selected || isDemo) { setHistoryLoading(false); return; }
    let active = true;
    setHistoryLoading(true);
    messageApi.history(user.id, selected)
      .catch(e => { if (active) setHistoryError(e.message); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [selected, user.id]);

  useEffect(() => {
    if (!current || (isDemo ? !current.unread : current.unread <= 0)) return;
    function markRead() {
      if (document.visibilityState === 'visible') Promise.resolve(service.read(user.id, selected)).catch(e => setError(e.message));
    }
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [selected, current?.unread, user.id]);

  useEffect(() => {
    const history = end.current?.parentElement;
    if (history) history.scrollTop = history.scrollHeight;
  }, [selected, current?.messages.length]);

  async function send(event) {
    event.preventDefault();
    if (sending) return;
    setSending(true); setError('');
    try { await service.send(user.id, selected, draft, failNext); setDraft(''); }
    catch (e) { setError(e.message); }
    finally { setSending(false); setFailNext(false); }
  }

  async function refresh() {
    setRefreshing(true);
    await load(false);
    if (!isDemo && selected) {
      try { await messageApi.history(user.id, selected); }
      catch (e) { setError(e.message); }
    }
  }

  async function deleteForMe(chatKey, displayName) {
    if (deleting || !window.confirm(`Delete your conversation with ${displayName}? They will still see their chat and messages.`)) return;
    setDeleting(chatKey); setError('');
    try {
      await service.hide(user.id, chatKey);
      if (selected === chatKey) onSelect(null);
      await load(false);
    } catch (e) { setError(e.message); }
    finally { setDeleting(null); }
  }

  return <section><span className="eyebrow">KEEP THE CONVERSATION GOING</span><h1>Messages</h1><p className="intro">Your people, one conversation at a time.</p>
    {isDemo ? <p className="message-demo">Sample messaging · Conversations and drafts reset on reload. No messages are sent to real people.</p> : <p className="field-help">Your conversations are saved to your account. Refresh to check for new messages.</p>}
    {loading ? <p role="status">Loading conversations…</p> : <div className={`inbox-layout ${current ? 'chat-open' : ''}`}>
      <aside className="conversation-list form-card" aria-label="Conversations"><div className="flex items-center justify-between gap-3"><h2>Your conversations</h2><button className="text-button" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
        {!chats.length && <p className="intro">No conversations yet. <a href="#discover">Find someone in Discover</a> and open their profile to say hello.</p>}
        {chats.map(c => { const chatKey = c.id || c.person.id; return <div className="message-conversation-row" key={chatKey}><button className="conversation-item" aria-pressed={isConversationSelected(c, selected)} disabled={sending || deleting === chatKey} onClick={() => onSelect(chatKey)}><Avatar photo={c.person.photo} name={c.person.displayName}/><span><strong>{c.person.displayName}</strong><span className="conversation-preview">{c.lastMessage?.text || c.messages.at(-1)?.text || 'Start your conversation'}</span></span>{c.unread > 0 && <span className="unread-badge" aria-label={`${c.unread} unread messages`}>{c.unread}</span>}</button><button type="button" className="conversation-delete" aria-label={`Delete conversation with ${c.person.displayName} for me`} title="Delete for me" disabled={Boolean(deleting)} onClick={() => deleteForMe(chatKey, c.person.displayName)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg></button></div>; })}
      </aside>
      <div className="chat-panel form-card">
        {current ? <><header className="chat-heading flex items-center justify-between gap-3"><div className="flex items-center gap-3"><button className="text-button mobile-chat-back" disabled={sending} onClick={() => onSelect(null)}>← All conversations</button><Avatar photo={current.person.photo} name={current.person.displayName}/><h2>{current.person.displayName}</h2></div><button type="button" className="conversation-delete" aria-label={`Delete conversation with ${current.person.displayName} for me`} title="Delete for me" disabled={Boolean(deleting)} onClick={() => deleteForMe(selected, current.person.displayName)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg></button></header>
          <div className="message-history" role="log" aria-label={`Messages with ${current.person.displayName}`} aria-live="polite">{historyLoading ? <p role="status" className="intro">Loading message history…</p> : historyError ? <div role="alert" className="error-banner">{historyError}<button className="text-button" onClick={() => { setHistoryError(''); setHistoryLoading(true); messageApi.history(user.id, selected).catch(e => setHistoryError(e.message)).finally(() => setHistoryLoading(false)); }}>Try again</button></div> : !current.messages.length ? <p className="intro">{current.person.status === 'deleted' ? 'No earlier messages are available in this conversation.' : 'Say hello and introduce yourself.'}</p> : current.messages.map(m => <div className={`message-bubble ${m.sender === 'you' ? 'outgoing' : 'incoming'}`} key={m.id}><span className="message-author">{m.sender === 'you' ? 'You' : current.person.displayName}</span><p>{m.text}</p><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div>)}<div ref={end}/></div>
          {current.person.status === 'deleted' ? <p className="deleted-chat-notice" role="status">This conversation is read-only because this account was deleted. Earlier messages are kept for your records.</p> : <form onSubmit={send} className="message-composer"><label htmlFor="message-draft">Your message</label><textarea id="message-draft" maxLength={2000} value={draft} disabled={sending} onChange={e => { setDraft(e.target.value); service.saveDraft(user.id, selected, e.target.value); }} placeholder="Write a friendly hello…"/><div className="composer-actions"><span className="field-help">{draft.length}/2,000 · Enter adds a new line</span><button className="primary" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send message'}</button></div></form>}
        </> : <div className="chat-placeholder"><h2>A space to connect</h2><p>Choose a conversation or find someone new in Discover.</p><a href="#discover">Discover people →</a></div>}
        {error && <div role="alert" className="error-banner">{error}{!current && <button className="text-button" onClick={() => load()}>Try again</button>}</div>}
      </div>
    </div>}
    {isDemo && <details className="message-demo-tools"><summary>Sample messaging controls</summary><p className="field-help">Use the sidebar’s sample incoming-message button to check unread alerts from any page.</p><label className="option"><input type="checkbox" checked={failNext} onChange={e => setFailNext(e.target.checked)}/>Make the next send fail to test retry</label></details>}
  </section>;
}
