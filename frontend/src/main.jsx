import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { auth, isDemo } from './authService';
import { validateAuth } from './validation';
import './styles.css';
import Profile, { Avatar } from './Profile';
import Discovery from './Discovery';
import Messages from './Messages';
import Admin from './Admin';
import Settings from './Settings';
import { messageService } from './messageService';
import { messageApi } from './messageApi';
import { profileService } from './profileService';
import { profileApi } from './profileApi';

function App() {
  const [page, setPage] = useState(location.hash === '#settings' ? 'settings' : location.hash === '#admin' ? 'admin' : location.hash === '#messages' ? 'messages' : location.hash === '#discover' ? 'discover' : location.hash === '#profile' ? 'profile' : location.hash === '#login' ? 'login' : 'register');
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unread, setUnread] = useState(0);
  const [messageNotice, setMessageNotice] = useState('');
  const messaging = isDemo ? messageService : messageApi;
  useEffect(() => {
    setSelectedChat(null); setMessageNotice(''); setUnread(0);
    if (!user) return;
    let active = true;
    const update = chats => { if (active) setUnread(chats.reduce((total, chat) => total + chat.unread, 0)); };
    const refresh = async () => {
      try { update(await messaging.list(user.id)); }
      catch { /* The Messages page presents any API loading error. */ }
    };
    const unsubscribe = messaging.subscribe(() => update(isDemo ? messageService.list(user.id) : messageApi.snapshot()));
    refresh();
    const timer = isDemo ? null : window.setInterval(refresh, 20000);
    return () => { active = false; unsubscribe(); if (timer) window.clearInterval(timer); };
  }, [user?.id]);
  async function startChat(personId) {
    try { const id = await messaging.open(user.id, personId); setSelectedChat(id); location.hash = 'messages'; }
    catch (e) { setMessageNotice(e.message); }
  }
  const [ready, setReady] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseError, setCourseError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({ displayName: '', email: '', password: '', courseId: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const formRef = useRef(null);
  const registering = page === 'register';
  const [profilePhoto, setProfilePhoto] = useState('');
  useEffect(() => { let active = true; setProfilePhoto(''); if (user) (isDemo ? profileService.get(user) : profileApi.get()).then(profile => { if (active) { setProfilePhoto(profile.photo); setUser(u => u ? { ...u, displayName: profile.displayName } : u); } }).catch(() => { if (active) setProfilePhoto(''); }); return () => { active = false; }; }, [user?.id]);

  async function loadCourses() {
    setCourseError('');
    try { setCourses(await auth.courses()); }
    catch (error) { setCourseError(error.message); }
  }
  async function start() {
    setFailure('');
    try { setUser(await auth.session()); setReady(true); }
    catch (error) { setFailure(error.message); }
  }
  useEffect(() => { start(); loadCourses(); }, []);
  useEffect(() => {
    function navigate() {
      setPage(location.hash === '#settings' ? 'settings' : location.hash === '#admin' ? 'admin' : location.hash === '#messages' ? 'messages' : location.hash === '#discover' ? 'discover' : location.hash === '#profile' ? 'profile' : location.hash === '#register' ? 'register' : 'login');
      setErrors({}); setFailure(''); setValues(v => ({ ...v, password: '' }));
    }
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => { if (ready) document.title = `${user ? 'Welcome' : registering ? 'Join the community' : 'Sign in'} · Bootcamp Connect`; }, [ready, user, registering]);

  function change(event) {
    const { name, value } = event.target;
    setValues(v => ({ ...v, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
    setFailure('');
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const problems = validateAuth(values, registering);
    setErrors(problems); setFailure(''); setMessage('');
    if (Object.keys(problems).length) {
      formRef.current.elements[Object.keys(problems)[0]].focus(); return;
    }
    setBusy(true);
    try {
      const payload = { ...values, email: values.email.trim().toLowerCase(), displayName: values.displayName.trim() };
      const account = registering ? await auth.register(payload) : await auth.login({ email: payload.email, password: payload.password });
      if (!account) throw new Error('The server did not return your account. Please try again.');
      setUser(account); setValues(v => ({ ...v, password: '' }));
    } catch (error) { setFailure(error.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setFailure('');
    try { await auth.logout(); setUser(null); setPage('login'); location.hash = 'login'; setMessage('You’ve been logged out.'); }
    catch (error) { setFailure(error.message); }
    finally { setBusy(false); }
  }
  const fieldProps = name => ({ name, id: name, value: values[name], onChange: change, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-error` : name === 'password' && registering ? 'password-help' : undefined });
  const errorFor = name => errors[name] && <p className="field-error" id={`${name}-error`}>{errors[name]}</p>;

  return <div className="min-h-screen bg-[#f3f7fd] text-[#183252]">
    <header className="site-header flex flex-wrap items-center justify-between gap-4">
      <a className="brand flex items-center gap-3" href={user ? '#welcome' : '#register'} aria-label="Bootcamp Connect home"><span className="brand-mark">bc</span><span>bootcamp connect</span></a>
      {user ? <div className="flex items-center gap-3"><a href="#profile" className="account-link" aria-label="Open your profile"><span className="hidden sm:inline">{user.displayName}</span><Avatar photo={profilePhoto} name={user.displayName} /></a><button className="secondary" disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Log out'}</button></div> : <span className="text-sm text-[#526782]">Different skills. Shared possibilities.</span>}
    </header>
    {isDemo && <div className="demo-banner">Frontend demo · Use fictional details. Accounts reset when this page reloads.</div>}
    {!isDemo && user && <div className="demo-banner">Account, profile, discovery and private messaging are connected to the backend · Administration and account settings are sample previews.</div>}
    <div className={user ? "signed-in-layout" : "signed-out-layout"}>
    {user && <nav className="community-nav" aria-label="Community"><span className="sidebar-label">YOUR COMMUNITY</span><a href="#welcome" aria-current={!["profile","discover","messages","admin","settings"].includes(page) ? "page" : undefined}>Welcome</a><a href="#discover" aria-current={page === "discover" ? "page" : undefined}>Discover</a><a href="#profile" aria-current={page === "profile" ? "page" : undefined}>My profile</a><a href="#messages" aria-current={page === "messages" ? "page" : undefined}>Messages {unread > 0 && <span className="unread-badge" aria-label={`${unread} unread messages`}>{unread}</span>}</a><a href="#settings" aria-current={page === "settings" ? "page" : undefined}>Account settings</a><a href="#admin" aria-current={page === "admin" ? "page" : undefined}>Admin preview</a>{isDemo && <button className="sample-incoming" onClick={() => { const name = messageService.simulateIncoming(user.id); setMessageNotice(`Sample message from ${name}. Open Messages to read it.`); }}>Try sample incoming message</button>}</nav>}
    <main className="page-wrap">{user && messageNotice && <div className="message-notice" role="status">{messageNotice} {isDemo && <a href="#messages" onClick={() => setSelectedChat("sample-amara")}>Open chat</a>}<button aria-label="Dismiss message notification" onClick={() => setMessageNotice("")}>×</button></div>}
      {!ready ? <section className="form-card mx-auto max-w-lg" aria-live="polite"><h1>Getting things ready…</h1>{failure && <><p role="alert" className="error-banner">{failure}</p><button className="primary" onClick={start}>Try again</button></>}</section> : user ?
        (page === 'settings' ? <Settings key={user.id} user={user} /> : page === 'admin' ? <Admin key={user.id} /> : page === 'messages' ? <Messages key={user.id} user={user} selected={selectedChat} onSelect={setSelectedChat} /> : page === 'discover' ? <Discovery key={user.id} user={user} onMessage={startChat} /> : page === 'profile' ? <Profile key={user.id} user={user} courses={courses} onSaved={profile => { setProfilePhoto(profile.photo); setUser(u => ({ ...u, displayName: profile.displayName })); }} /> : <section className="welcome-card mx-auto max-w-3xl"><span className="eyebrow">YOU’RE PART OF THE COMMUNITY</span><h1>Welcome, {user.displayName}.</h1><p className="intro">Your next chapter starts with a connection.</p><div className="account-details"><p><span>Your course</span><strong>{courses.find(c => c.id === user.courseId)?.name || user.courseId}</strong></p><p><span>Your email</span><strong>{user.email}</strong></p></div><p className="text-[#526782]">Add your skills, interests and goals so your community can get to know you.</p>{<a className="primary profile-start" href="#profile">View your profile →</a>}{failure && <p className="error-banner" role="alert">{failure}</p>}</section>) :
        <div className="auth-layout">
          <aside className="story"><span className="eyebrow">YOUR BOOTCAMP. YOUR PEOPLE.</span><h2>Good things start<br className="hidden lg:block" /> with a hello.</h2><p>Meet the people learning alongside you. Find complementary skills, share ideas, and build something together.</p><img src="/community-hero.webp" alt="Bootcamp learners collaborating around a laptop" width="1448" height="1086" /><div className="story-note"><span className="note-dot" /> Software minds. Business ideas. Shared ambition.</div></aside>
          <section className="form-card"><div className="eyebrow">{registering ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}</div><h1>{registering ? 'Let’s get you connected.' : 'Your community awaits.'}</h1><p className="intro">{registering ? 'Create your account and find your people.' : 'Sign in to pick up where you left off.'}</p>
            {message && <p className="success-banner" role="status">{message}</p>}
            <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
              <fieldset disabled={busy}>
                {registering && <div className="field"><label htmlFor="displayName">Your name</label><input {...fieldProps('displayName')} autoComplete="name" maxLength="80" placeholder="e.g. Malak" required />{errorFor('displayName')}</div>}
                <div className="field"><label htmlFor="email">Email address</label><input {...fieldProps('email')} type="email" autoComplete="email" maxLength="254" placeholder="you@example.com" required />{errorFor('email')}</div>
                <div className="field"><label htmlFor="password">Password</label><div className="password-wrap"><input {...fieldProps('password')} type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} placeholder={registering ? 'Create a password' : 'Enter your password'} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div>{registering && <p className="field-help" id="password-help">Use at least 8 characters.</p>}{errorFor('password')}</div>
                {registering && <div className="field"><label htmlFor="courseId">Your course</label><select {...fieldProps('courseId')} required disabled={!courses.length}><option value="">{courses.length ? 'Choose your course' : 'Loading courses…'}</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select>{errorFor('courseId')}{courseError && <div role="alert"><p className="field-error">{courseError}</p><button type="button" className="text-button" onClick={loadCourses}>Retry loading courses</button></div>}</div>}
                {failure && <p className="error-banner" role="alert">{failure}</p>}
                <button className="primary w-full" disabled={busy || (registering && !courses.length)}>{busy ? (registering ? 'Creating your account…' : 'Signing in…') : registering ? 'Create account →' : 'Sign in →'}</button>
              </fieldset>
            </form>
            <p className="switch-page">{registering ? 'Already part of the community?' : 'New to Bootcamp Connect?'} <a href={registering ? '#login' : '#register'} onClick={() => setMessage('')}>{registering ? 'Sign in' : 'Create an account'}</a></p>
            {isDemo && !registering && <div className="demo-details"><strong>Try the sample account</strong><span>malak@example.com</span><span>Password: DemoPass123!</span></div>}
          </section>
        </div>}
    </main></div><footer className="site-footer">Bootcamp Connect <span>Learn together. Build together.</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
