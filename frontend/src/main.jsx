import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { auth, isDemo } from './authService';
import { validateAuth } from './validation';
import './styles.css';
import Profile, { Avatar, PhotoViewerProvider } from './Profile';
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
  useEffect(() => { if (ready) document.title = `${user ? 'Welcome' : registering ? 'Join the community' : 'Sign in'} · SkillBridge`; }, [ready, user, registering]);

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

  return <PhotoViewerProvider><div className="min-h-screen bg-[#f3f7fd] text-[#183252]">
    <header className="site-header flex flex-wrap items-center justify-between gap-4">
      <a className="brand flex items-center gap-3" href={user ? '#welcome' : '#register'} aria-label="SkillBridge home"><img className="brand-mark" src="/favicon.svg" alt="" width="40" height="40"/><span>SkillBridge</span></a>
      {user ? <div className="flex items-center gap-3"><a href="#profile" className="account-link" aria-label="Open your profile"><span className="hidden sm:inline">{user.displayName}</span></a><Avatar photo={profilePhoto} name={user.displayName} /><button className="secondary" disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Log out'}</button></div> : <span className="text-sm text-[#526782]">Different skills. Shared possibilities.</span>}
    </header>
    {isDemo && <div className="demo-banner">Frontend demo · Use fictional details. Accounts reset when this page reloads.</div>}
    <div className={user ? "signed-in-layout" : "signed-out-layout"}>
    {user && <nav className="community-nav" aria-label="Community"><span className="sidebar-label">YOUR COMMUNITY</span><a href="#welcome" aria-current={!["profile","discover","messages","admin","settings"].includes(page) ? "page" : undefined}>Welcome</a><a href="#discover" aria-current={page === "discover" ? "page" : undefined}>Discover</a><a href="#profile" aria-current={page === "profile" ? "page" : undefined}>My profile</a><a href="#messages" aria-current={page === "messages" ? "page" : undefined}>Messages {unread > 0 && <span className="unread-badge" aria-label={`${unread} unread messages`}>{unread}</span>}</a><a href="#settings" aria-current={page === "settings" ? "page" : undefined}>Account settings</a><a href="#admin" aria-current={page === "admin" ? "page" : undefined}>{isDemo ? 'Admin preview' : 'Administration'}</a>{isDemo && <button className="sample-incoming" onClick={() => { const name = messageService.simulateIncoming(user.id); setMessageNotice(`Sample message from ${name}. Open Messages to read it.`); }}>Try sample incoming message</button>}</nav>}
    <main className="page-wrap">{user && messageNotice && <div className="message-notice" role="status">{messageNotice} {isDemo && <a href="#messages" onClick={() => setSelectedChat("sample-amara")}>Open chat</a>}<button aria-label="Dismiss message notification" onClick={() => setMessageNotice("")}>×</button></div>}
      {!ready ? <section className="form-card mx-auto max-w-lg" aria-live="polite"><h1>Getting things ready…</h1>{failure && <><p role="alert" className="error-banner">{failure}</p><button className="primary" onClick={start}>Try again</button></>}</section> : user ?
        (page === 'settings' ? <Settings key={user.id} user={user} courses={courses} onUpdated={account => setUser(current => ({ ...current, ...account }))} onDeleted={() => { setProfilePhoto(''); setUser(null); setPage('login'); location.hash = 'login'; setMessage('Your account has been deleted.'); }} /> : page === 'admin' ? <Admin key={user.id} user={user} /> : page === 'messages' ? <Messages key={user.id} user={user} selected={selectedChat} onSelect={setSelectedChat} /> : page === 'discover' ? <Discovery key={user.id} user={user} onMessage={startChat} /> : page === 'profile' ? <Profile key={user.id} user={user} courses={courses} onSaved={profile => { setProfilePhoto(profile.photo); setUser(u => ({ ...u, displayName: profile.displayName })); }} /> : <section className="welcome-home" aria-labelledby="welcome-heading">
          <div className="welcome-hero">
            <div className="welcome-copy">
              <span className="welcome-eyebrow">A COMMUNITY BUILT AROUND YOU</span>
              <h1 id="welcome-heading">Welcome, {user.displayName}.</h1>
              <p>Different skills can lead to something brilliant. Find the people who bring a fresh perspective to what you want to build.</p>
              <span className="welcome-course"><span aria-hidden="true" />{courses.find(c => c.id === user.courseId)?.name || user.courseId}</span>
              <div className="welcome-actions"><a className="primary" href="#discover">Meet your community <span aria-hidden="true">→</span></a><a className="secondary" href="#profile">Add to your profile</a></div>
            </div>
            <div className="welcome-visual" aria-label="Business and software learners bringing complementary skills together">
              <span className="welcome-orbit" aria-hidden="true" /><span className="welcome-spark welcome-spark-one" aria-hidden="true">✦</span><span className="welcome-spark welcome-spark-two" aria-hidden="true">✧</span>
              <div className="learner-chip learner-chip-business"><span className="learner-mark" aria-hidden="true">B</span><span><strong>Business development</strong><small>Strategy · Market research</small></span></div>
              <div className="learner-chip learner-chip-software"><span className="learner-mark" aria-hidden="true">S</span><span><strong>Software development</strong><small>Web apps · Product ideas</small></span></div>
            </div>
          </div>
          <div className="welcome-section-heading"><div><h2>Your next connection starts here</h2><p>Three simple steps turn a shared goal into a collaboration.</p></div></div>
          <div className="welcome-steps" aria-label="How SkillBridge works">
            <article className="welcome-step"><span>1</span><div><h3>Show what you bring</h3><p>Add skills, interests and goals to your profile.</p></div></article>
            <article className="welcome-step"><span>2</span><div><h3>Find complementary people</h3><p>Explore learners and see why you might connect.</p></div></article>
            <article className="welcome-step"><span>3</span><div><h3>Start a conversation</h3><p>Say hello and take the first step together.</p></div></article>
          </div>
          {failure && <p className="error-banner" role="alert">{failure}</p>}
        </section>) :
        <div className="auth-layout">
          <aside className="story auth-story-hero">
            <span className="discovery-hero-kicker"><span aria-hidden="true">✦</span> YOUR BOOTCAMP. YOUR PEOPLE.</span>
            <h2>Good things start<br className="hidden lg:block" /> with a hello.</h2>
            <p>Meet the people learning alongside you. Find complementary skills, share ideas, and build something together.</p>
            <div className="discovery-hero-photo auth-story-photo">
              <img src="/discover-collaboration-hero.jpg" alt="Three bootcamp learners collaborating around a laptop in a bright coworking space" width="1448" height="1086" />
              <span className="discovery-photo-label"><span aria-hidden="true">●</span> Business + software</span>
            </div>
            <div className="story-note"><span className="note-dot" /> Software minds. Business ideas. Shared ambition.</div>
          </aside>
          <section className={`form-card${registering ? ' register-card' : ''}`}><div className="eyebrow">{registering ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}</div><h1>{registering ? 'Let’s get you connected.' : 'Your community awaits.'}</h1><p className="intro">{registering ? 'Create your account and find your people.' : 'Sign in to pick up where you left off.'}</p>
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
            <p className="switch-page">{registering ? 'Already part of the community?' : 'New to SkillBridge?'} <a href={registering ? '#login' : '#register'} onClick={() => setMessage('')}>{registering ? 'Sign in' : 'Create an account'}</a></p>
            {isDemo && !registering && <div className="demo-details"><strong>Try the sample account</strong><span>malak@example.com</span><span>Password: DemoPass123!</span></div>}
          </section>
        </div>}
    </main></div><footer className="site-footer">SkillBridge <span>Learn together. Build together.</span></footer>
  </div></PhotoViewerProvider>;
}

createRoot(document.getElementById('root')).render(<App />);
