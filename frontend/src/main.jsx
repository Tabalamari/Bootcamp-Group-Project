import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { auth, isDemo } from './authService';
import { validateAuth } from './validation';
import './styles.css';

function App() {
  const [page, setPage] = useState(location.hash === '#login' ? 'login' : 'register');
  const [user, setUser] = useState(null);
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
      setPage(location.hash === '#register' ? 'register' : 'login');
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
      {user ? <div className="flex items-center gap-3"><span className="hidden sm:inline">{user.displayName}</span><span className="avatar" aria-hidden="true">{user.displayName.charAt(0).toUpperCase()}</span><button className="secondary" disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Log out'}</button></div> : <span className="text-sm text-[#526782]">Different skills. Shared possibilities.</span>}
    </header>
    {isDemo && <div className="demo-banner">Frontend demo · Use fictional details. Accounts reset when this page reloads.</div>}
    <main className="page-wrap">
      {!ready ? <section className="form-card mx-auto max-w-lg" aria-live="polite"><h1>Getting things ready…</h1>{failure && <><p role="alert" className="error-banner">{failure}</p><button className="primary" onClick={start}>Try again</button></>}</section> : user ?
        <section className="welcome-card mx-auto max-w-3xl"><span className="eyebrow">YOU’RE PART OF THE COMMUNITY</span><h1>Welcome, {user.displayName}.</h1><p className="intro">Your next chapter starts with a connection.</p><div className="account-details"><p><span>Your course</span><strong>{courses.find(c => c.id === user.courseId)?.name || user.courseId}</strong></p><p><span>Your email</span><strong>{user.email}</strong></p></div><p className="text-[#526782]">Your account journey is ready to explore. Profiles, discovery, and messaging are coming in the next features.</p>{failure && <p className="error-banner" role="alert">{failure}</p>}</section> :
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
    </main><footer className="site-footer">Bootcamp Connect <span>Learn together. Build together.</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
