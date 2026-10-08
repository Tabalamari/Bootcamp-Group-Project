import { useEffect, useMemo, useState } from 'react';
import { isDemo } from './authService';
import { settingsApi } from './settingsApi';
import { createSettingsService, validatePassword, validateSettings } from './settingsService';

const emptyPasswords = () => ({ currentPassword: '', newPassword: '', confirmPassword: '' });

export default function Settings({ user, courses = [], onUpdated }) {
  const service = useMemo(() => isDemo ? createSettingsService(courses) : settingsApi, [courses]);
  const [saved, setSaved] = useState(null);
  const [values, setValues] = useState(null);
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [passwordFailure, setPasswordFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [failNext, setFailNext] = useState(false);

  async function load() {
    setFailure('');
    try {
      const data = await service.get(user);
      setSaved(data);
      setValues(data);
    } catch (error) {
      setFailure(error.message);
    }
  }

  useEffect(() => { load(); }, [user.id]);

  async function save(event) {
    event.preventDefault();
    setNotice('');
    setFailure('');
    const validation = validateSettings(values, courses);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setBusy(true);
    try {
      const data = await service.save(user, values, isDemo && failNext);
      setSaved(data);
      setValues(data);
      onUpdated?.(data);
      setNotice(isDemo ? 'Sample account details saved. Your real account is unchanged.' : 'Your account details have been updated.');
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
      setFailNext(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordNotice('');
    setPasswordFailure('');
    const validation = validatePassword(passwords);
    setPasswordErrors(validation);
    if (Object.keys(validation).length) return;

    setBusy(true);
    try {
      await service.password(user, passwords, isDemo && failNext);
      setPasswords(emptyPasswords());
      setShow(false);
      setPasswordNotice(isDemo
        ? 'Sample password changed. Use it for your next change in this preview. Your real login password is unchanged.'
        : 'Your password has been changed. Your current session stays active; other sessions have been signed out.');
    } catch (error) {
      setPasswordFailure(error.message);
    } finally {
      setBusy(false);
      setFailNext(false);
    }
  }

  const dirty = values && saved && (values.displayName !== saved.displayName || values.courseId !== saved.courseId);
  return <section>
    <span className="eyebrow">MAKE YOURSELF AT HOME</span>
    <h1>Account settings</h1>
    <p className="intro">Your account details and password, in one place.</p>
    {isDemo && <div className="settings-preview"><strong>Sample account settings</strong><p>Changes stay in this preview until reload. They do not update your real account, profile, course or login password.</p><p>Use fictional passwords only. Initial current sample password: <strong>DemoPass123!</strong> After changing it, use your new sample password here.</p></div>}
    {!values ? <section className="form-card" role="status">{failure ? <><p>{failure}</p><button className="secondary" onClick={load}>Try again</button></> : 'Loading account settings…'}</section> : <div className="settings-grid">
      <form className="form-card" onSubmit={save} noValidate>
        <h2>Account details</h2>
        <p className="intro">Update the name and course connected to your account.</p>
        <fieldset disabled={busy}>
          <div className="field"><label htmlFor="settings-name">Display name</label><input id="settings-name" autoComplete="name" maxLength={80} value={values.displayName} aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? 'settings-name-error' : undefined} onChange={event => { setValues({ ...values, displayName: event.target.value }); setNotice(''); setErrors({ ...errors, displayName: undefined }); }} />{errors.displayName && <p className="field-error" id="settings-name-error">{errors.displayName}</p>}</div>
          <div className="field"><label htmlFor="settings-course">Course</label><select id="settings-course" value={values.courseId} aria-invalid={!!errors.courseId} aria-describedby={errors.courseId ? 'settings-course-error' : undefined} onChange={event => { setValues({ ...values, courseId: event.target.value }); setNotice(''); setErrors({ ...errors, courseId: undefined }); }}><option value="">Choose an active course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select>{errors.courseId && <p id="settings-course-error" className="field-error">{errors.courseId}</p>}</div>
          {notice && <p role="status" className="success-banner">{notice}</p>}
          {failure && <p role="alert" className="error-banner">{failure}</p>}
          <div className="profile-actions"><button className="primary" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save account details'}</button><button className="secondary" type="button" disabled={busy || !dirty} onClick={() => { setValues({ ...saved }); setErrors({}); setFailure(''); setNotice('Unsaved changes discarded.'); }}>Cancel changes</button></div>
        </fieldset>
      </form>

      <form className="form-card" onSubmit={changePassword} noValidate>
        <h2>Change password</h2>
        <p className="intro">Enter your current password to choose a new one.</p>
        <fieldset disabled={busy}>
          {[['currentPassword', 'Current password'], ['newPassword', 'New password'], ['confirmPassword', 'Confirm new password']].map(([key, label]) => <div className="field" key={key}><label htmlFor={`settings-${key}`}>{label}</label><input id={`settings-${key}`} type={show ? 'text' : 'password'} autoComplete="off" maxLength={128} value={passwords[key]} aria-invalid={!!passwordErrors[key]} aria-describedby={passwordErrors[key] ? `${key}-error` : key === 'newPassword' ? 'password-rule' : undefined} onChange={event => { setPasswords({ ...passwords, [key]: event.target.value }); setPasswordErrors({ ...passwordErrors, [key]: undefined }); setPasswordNotice(''); }} />{passwordErrors[key] && <p id={`${key}-error`} className="field-error">{passwordErrors[key]}</p>}{key === 'newPassword' && <p id="password-rule" className="field-help">8–128 characters. Must differ from the current password.</p>}</div>)}
          <label className="settings-show"><input type="checkbox" checked={show} onChange={event => setShow(event.target.checked)} /> Show passwords</label>
          {passwordFailure && <p role="alert" className="error-banner">{passwordFailure} Re-enter your passwords to retry.</p>}
          {passwordNotice && <p role="status" className="success-banner">{passwordNotice}</p>}
          <div className="profile-actions"><button className="primary" disabled={busy}>{busy ? 'Saving…' : isDemo ? 'Change sample password' : 'Change password'}</button><button type="button" className="secondary" onClick={() => { setPasswords(emptyPasswords()); setPasswordErrors({}); setPasswordFailure(''); setPasswordNotice(''); setShow(false); }}>Clear</button></div>
        </fieldset>
      </form>
    </div>}
    {isDemo && <details className="message-demo-tools"><summary>Sample settings controls</summary><label className="option"><input type="checkbox" checked={failNext} onChange={event => setFailNext(event.target.checked)} />Make the next save fail to test retry</label></details>}
  </section>;
}
