import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Profile';
import { isDemo } from './authService';
import { messageApi } from './messageApi';
import { messageService } from './messageService';

const service = isDemo ? messageService : messageApi;

export default function Messages({ user, selected, onSelect }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
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

  const current = chats.find(c => c.person.id === selected);

  useEffect(() => {
    setDraft(selected ? service.draft(user.id, selected) : '');
    setError('');
    if (!selected || isDemo) return;
    messageApi.history(user.id, selected).catch(e => setError(e.message));
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

  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [selected, current?.messages.length]);

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

  return <section><span className="eyebrow">KEEP THE CONVERSATION GOING</span><h1>Messages</h1><p className="intro">Your people, one conversation at a time.</p>
    {isDemo ? <p className="message-demo">Sample messaging · Conversations and drafts reset on reload. No messages are sent to real people.</p> : <p className="field-help">Your conversations are saved to your account. Refresh to check for new messages.</p>}
    {loading ? <p role="status">Loading conversations…</p> : <div className={`inbox-layout ${current ? 'chat-open' : ''}`}>
      <aside className="conversation-list form-card" aria-label="Conversations"><div className="flex items-center justify-between gap-3"><h2>Your conversations</h2><button className="text-button" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
        {!chats.length && <p className="intro">No conversations yet. <a href="#discover">Find someone in Discover</a> and open their profile to say hello.</p>}
        {chats.map(c => <button className="conversation-item" key={c.person.id} aria-pressed={selected === c.person.id} disabled={sending} onClick={() => onSelect(c.person.id)}><Avatar photo={c.person.photo} name={c.person.displayName}/><span><strong>{c.person.displayName}</strong><span className="conversation-preview">{c.lastMessage?.text || c.messages.at(-1)?.text || 'Start your conversation'}</span></span>{c.unread > 0 && <span className="unread-badge" aria-label={`${c.unread} unread messages`}>{c.unread}</span>}</button>)}
      </aside>
      <div className="chat-panel form-card">
        {current ? <><header className="chat-heading"><button className="text-button mobile-chat-back" disabled={sending} onClick={() => onSelect(null)}>← All conversations</button><div className="flex items-center gap-3"><Avatar photo={current.person.photo} name={current.person.displayName}/><h2>{current.person.displayName}</h2></div></header>
          <div className="message-history" role="log" aria-label={`Messages with ${current.person.displayName}`} aria-live="polite">{!current.messages.length && <p className="intro">Say hello and introduce yourself.</p>}{current.messages.map(m => <div className={`message-bubble ${m.sender === 'you' ? 'outgoing' : 'incoming'}`} key={m.id}><span className="message-author">{m.sender === 'you' ? 'You' : current.person.displayName}</span><p>{m.text}</p><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div>)}<div ref={end}/></div>
          <form onSubmit={send} className="message-composer"><label htmlFor="message-draft">Your message</label><textarea id="message-draft" maxLength={2000} value={draft} disabled={sending} onChange={e => { setDraft(e.target.value); service.saveDraft(user.id, selected, e.target.value); }} placeholder="Write a friendly hello…"/><div className="composer-actions"><span className="field-help">{draft.length}/2,000 · Enter adds a new line</span><button className="primary" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send message'}</button></div></form>
        </> : <div className="chat-placeholder"><h2>A space to connect</h2><p>Choose a conversation or find someone new in Discover.</p><a href="#discover">Discover people →</a></div>}
        {error && <div role="alert" className="error-banner">{error}{!current && <button className="text-button" onClick={() => load()}>Try again</button>}</div>}
      </div>
    </div>}
    {isDemo && <details className="message-demo-tools"><summary>Sample messaging controls</summary><p className="field-help">Use the sidebar’s sample incoming-message button to check unread alerts from any page.</p><label className="option"><input type="checkbox" checked={failNext} onChange={e => setFailNext(e.target.checked)}/>Make the next send fail to test retry</label></details>}
  </section>;
}
