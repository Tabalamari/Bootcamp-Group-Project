import { useEffect, useRef, useState } from 'react';
import { adminService, managedLists } from './adminService';
import { adminApi } from './adminApi';
import { isDemo } from './authService';

const previewAdmin = { role: 'admin' };
export default function Admin({ user }) {
  const [role, setRole] = useState('learner');
  const [data, setData] = useState(null);
  const [kind, setKind] = useState('users');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const editor = useRef(null);
  const confirmation = useRef(null);
  const allowed = isDemo ? role === 'admin' : user?.role === 'admin';
  const service = isDemo ? adminService : adminApi;
  const actor = isDemo ? previewAdmin : user;
  async function load() {
    setError(''); setBusy(true);
    try { setData(await service.load(actor)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (allowed) load(); else { setData(null); setEditing(null); setPending(null); setError(''); setNotice(''); } }, [allowed]);
  useEffect(() => { if (editing) editor.current?.showModal(); }, [editing?.id, editing?.kind]);
  useEffect(() => { if (pending) confirmation.current?.showModal(); }, [pending]);
  function changeList(value) { setKind(value); setQuery(''); setFilter('all'); setError(''); setNotice(''); }
  function edit(record = {}) { setError(''); setEditing({ ...record, kind, name: record.name || '', categoryId: record.categoryId || '' }); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (kind === 'users') {
        if (editing.status !== data.users.find(u => u.id === editing.id).status) { setPending({ user: editing, fail: failNext }); return; }
        await service.updateUser(actor, editing.id, editing, isDemo && failNext);
      } else await service.save(actor, kind, editing, isDemo && failNext);
      setEditing(null); setNotice(isDemo ? 'Changes saved in the sample workspace.' : 'Changes saved.'); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); setFailNext(false); }
  }
  async function confirm() {
    setBusy(true); setError('');
    try {
      if (pending.user) { const fail = pending.fail; setPending(value => ({ ...value, fail: false })); await service.updateUser(actor, pending.user.id, pending.user, isDemo && fail); }
      else await service.setActive(actor, kind, pending.id, !pending.active);
      setPending(null); setEditing(null); setNotice(isDemo ? 'Changes saved in the sample workspace.' : 'Changes saved.'); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); setFailNext(false); }
  }
  const records = data?.[kind].filter(item => (item.name || item.displayName).toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || (kind === 'users' ? item.status : item.active ? 'active' : 'inactive') === filter)) || [];
  return <section><span className="eyebrow">COMMUNITY MANAGEMENT</span><h1>Administration</h1><p className="intro">Manage the people and choices that shape your community.</p>
    {isDemo && <div className="admin-preview form-card"><strong>Sample administration preview</strong><p>Fictional records only. Changes reset on reload and do not change real accounts or learner screens.</p><label>Preview role<select value={role} onChange={e => setRole(e.target.value)}><option value="learner">Learner</option><option value="admin">Administrator (sample)</option></select></label></div>}
    {!allowed ? <div className="form-card"><h2>Administrator access required</h2><p>This area is available to administrator accounts only.</p></div> : !data ? <div className="form-card" role="status">{busy ? (isDemo ? 'Loading sample workspace…' : 'Loading administration workspace…') : <><p>{error}</p><button className="secondary" onClick={load}>Try again</button></>}</div> : <>
      <nav className="admin-tabs" aria-label="Administration sections">{['users', ...managedLists].map(value => <button key={value} className="secondary" aria-pressed={kind === value} onClick={() => changeList(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</nav>
      {notice && <p className="success-banner" role="status">{notice}</p>}
      {error && !editing && !pending && <p className="error-banner" role="alert">{error}</p>}
      <div className="form-card admin-content"><div className="admin-toolbar"><label>Search {kind}<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name"/></label><label>Status<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value={kind === 'users' ? 'suspended' : 'inactive'}>{kind === 'users' ? 'Suspended' : 'Inactive'}</option></select></label>{kind !== 'users' && <button className="primary" onClick={() => edit()}>Add {kind === 'categories' ? 'category' : kind.slice(0, -1)}</button>}</div>
        <p className="field-help" role="status">{records.length} records</p>
        {!records.length ? <div className="admin-empty"><h2>No matching records</h2><p>Try another name or status.</p><button className="secondary" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button></div> : <ul className="admin-records">{records.map(record => <li key={record.id}><div><h2>{record.name || record.displayName}</h2><span className="admin-status">{kind === 'users' ? record.status : record.active ? 'Active' : 'Inactive'}</span>{kind === 'users' && <p>{data.courses.find(c => c.id === record.courseId)?.name || record.courseId}</p>}{record.categoryId && <p>Category: {data.categories.find(c => c.id === record.categoryId)?.name || record.categoryId}{data.categories.find(c => c.id === record.categoryId)?.active === false ? ' (inactive)' : ''}</p>}</div><div className="admin-row-actions"><button className="secondary" aria-label={`${kind === 'users' ? 'Manage' : 'Edit'} ${record.name || record.displayName}`} onClick={() => edit(record)}>{kind === 'users' ? 'View / manage' : 'Edit'}</button>{kind !== 'users' && <button className="text-button" onClick={() => { setError(''); setPending(record); }}>{record.active ? 'Deactivate' : 'Reactivate'}</button>}</div></li>)}</ul>}
      </div>{isDemo && <details className="message-demo-tools"><summary>Sample administration controls</summary><label className="option"><input type="checkbox" checked={failNext} onChange={e => setFailNext(e.target.checked)}/>Make the next save fail to test retry</label></details>}
    </>}
    {editing && <dialog ref={editor} className="admin-dialog" onCancel={e => { if (busy) e.preventDefault(); else setEditing(null); }} aria-labelledby="admin-editor-title"><form onSubmit={save}><h2 id="admin-editor-title">{kind === 'users' ? editing.displayName : editing.id ? 'Edit record' : 'Add record'}</h2>{kind === 'users' ? <><p className="field-help">Email: {editing.email} · Role: {editing.role}</p><p>{editing.bio}</p><p className="field-help">Skills: {editing.skills.join(', ')} · Interests: {editing.interests.join(', ')} · Goals: {(editing.goals || []).join(', ') || 'None listed'}</p><p className="field-help">Private conversations are not available to administrators.</p><div className="field"><label htmlFor="admin-course">Course</label><select id="admin-course" value={editing.courseId} onChange={e => setEditing({ ...editing, courseId: e.target.value })}>{data.courses.filter(c => c.active || c.id === editing.courseId).map(c => <option key={c.id} value={c.id}>{c.name}{!c.active ? ' (inactive, existing)' : ''}</option>)}</select></div><div className="field"><label htmlFor="admin-status">Account status</label><select id="admin-status" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option></select></div></> : <><div className="field"><label htmlFor="admin-name">Name</label><input autoFocus id="admin-name" maxLength={80} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></div>{['skills', 'interests'].includes(kind) && <div className="field"><label htmlFor="admin-category">Category</label><select id="admin-category" value={editing.categoryId} onChange={e => setEditing({ ...editing, categoryId: e.target.value })}><option value="">Uncategorised</option>{data.categories.filter(c => c.active || c.id === editing.categoryId).map(c => <option key={c.id} value={c.id}>{c.name}{!c.active ? ' (inactive, existing)' : ''}</option>)}</select></div>}</>}{error && <p className="error-banner" role="alert">{error}</p>}<div className="profile-actions"><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button><button type="button" className="secondary" disabled={busy} onClick={() => setEditing(null)}>Cancel</button></div></form></dialog>}
    {pending && <dialog ref={confirmation} className="admin-dialog" onCancel={e => { if (busy) e.preventDefault(); else setPending(null); }} aria-labelledby="admin-confirm-title"><h2 id="admin-confirm-title">Confirm {pending.user ? 'account change' : pending.active ? 'deactivation' : 'reactivation'}</h2><p>{pending.user ? `Set ${pending.user.displayName} to ${pending.user.status}?${isDemo ? ' This preview changes only the sample admin record.' : ' Suspending an account revokes its active sessions.'}` : `${pending.active ? 'Deactivate' : 'Reactivate'} ${pending.name}? Existing references remain readable. Inactive records cannot be selected for new assignments.`}</p>{error && <p className="error-banner" role="alert">{error}</p>}<div className="profile-actions"><button className="primary" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Confirm change'}</button><button className="secondary" disabled={busy} onClick={() => setPending(null)}>Cancel</button></div></dialog>}
  </section>;
}
