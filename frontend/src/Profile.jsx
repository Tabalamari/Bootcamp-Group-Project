import { useEffect, useRef, useState } from 'react';
import { profileOptions, profileService, validatePhoto, validateProfile } from './profileService';
import { profileApi } from './profileApi';
import { isDemo } from './authService';

const assetOrigin = import.meta.env.VITE_ASSET_ORIGIN || window.location.origin;

export function Avatar({ photo, name, large = false }) {
  return <span className={`profile-avatar ${large ? 'large' : ''}`}>{photo ? <img src={photo} alt={`${name}'s profile photo`} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></svg>}</span>;
}
function BinIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></svg>; }

export default function Profile({ user, courses, onSaved }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [availableOptions, setAvailableOptions] = useState(profileOptions);
  const dialog = useRef(null), fileInput = useRef(null), form = useRef(null), photoVersion = useRef(0);
  useEffect(() => { let alive = true; Promise.all([isDemo ? profileService.get(user) : profileApi.get(), isDemo ? Promise.resolve(profileOptions) : profileApi.options()]).then(([value, options]) => { if (alive) { setSaved(value); setDraft(value); setAvailableOptions(options); } }).catch(error => { if (alive) setFailure(error.message); }); return () => { alive = false; photoVersion.current++; }; }, [user.id]);
  const profile = editing ? draft : saved;
  async function save(event) {
    event.preventDefault();
    const problems = isDemo ? validateProfile(draft) : {
      ...(!draft.displayName.trim() || draft.displayName.trim().length < 2 || draft.displayName.trim().length > 80 ? { displayName: 'Enter a name between 2 and 80 characters.' } : {}),
      ...(draft.bio.length > 500 ? { bio: 'Keep your bio to 500 characters.' } : {}),
      ...Object.fromEntries(['skills', 'interests', 'goals'].filter(key => !Array.isArray(draft[key]) || draft[key].some(value => !availableOptions[key].includes(value))).map(key => [key, 'Choose from the current community options.'])),
    };
    setErrors(problems); setFailure(''); setNotice('');
    if (Object.keys(problems).length) { form.current.querySelector('[name="displayName"]')?.focus(); return; }
    setBusy(true);
    try {
      const result = isDemo ? await profileService.save(user, draft) : await profileApi.save(user, draft);
      if (!isDemo && draft.photo !== saved.photo) {
        if (draft.photo) {
          const blob = await (await fetch(draft.photo)).blob();
          const uploaded = await profileApi.upload(new File([blob], 'profile-photo', { type: blob.type }));
          result.photo = uploaded.photoUrl ? new URL(uploaded.photoUrl, assetOrigin).href : '';
        } else { await profileApi.removePhoto(); result.photo = ''; }
      }
      setSaved(result); setDraft(result); setEditing(false); setPhotoError('');
      onSaved(result); setNotice(isDemo ? 'Profile saved in this demo.' : 'Your profile has been saved.');
    } catch (error) { setFailure(error.message); }
    finally { setBusy(false); }
  }
  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    const error = validatePhoto(file);
    if (error) { setPhotoError(error); return; }
    const version = ++photoVersion.current;
    setReadingPhoto(true);
    try {
      const photo = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read this photo.')); reader.readAsDataURL(file);
      });
      await new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error('This image could not be opened. Choose another photo.')); image.src = photo; });
      if (version === photoVersion.current) setDraft(value => ({ ...value, photo }));
    } catch (error) { if (version === photoVersion.current) setPhotoError(error.message); }
    finally { if (version === photoVersion.current) setReadingPhoto(false); }
  }
  function cancel() { photoVersion.current++; setReadingPhoto(false); setDraft(saved); setEditing(false); setErrors({}); setPhotoError(''); setFailure(''); }
  function toggle(key, value) { setDraft(p => ({ ...p, [key]: p[key].includes(value) ? p[key].filter(item => item !== value) : [...p[key], value] })); }
  function selections(key, title) {
    return <fieldset className="profile-options"><legend>{title}</legend><div className="option-grid">{availableOptions[key].map(value => <label key={value} className="option"><input type="checkbox" checked={draft[key].includes(value)} onChange={() => toggle(key, value)} /><span>{value}</span></label>)}</div></fieldset>;
  }
  if (!profile) return <section className="form-card"><h1>Your profile</h1><p role={failure ? 'alert' : 'status'}>{failure || 'Loading your profile…'}</p>{failure && <button className="secondary" onClick={() => { setFailure(''); (isDemo ? profileService.get(user) : profileApi.get()).then(p => { setSaved(p); setDraft(p); }).catch(e => setFailure(e.message)); }}>Try again</button>}</section>;
  return <section className="profile-page">
    <a href="#welcome" className="back-link">← Back to welcome</a>
    <div className="profile-title"><div><span className="eyebrow">LET PEOPLE GET TO KNOW YOU</span><h1>{editing ? 'Edit your profile' : 'Your profile'}</h1><p className="intro">Show what you bring and what you want to build together.</p></div>{!editing && <button className="primary" onClick={() => { setDraft(saved); setNotice(''); setEditing(true); }}>Edit profile</button>}</div>
    {notice && <p className="success-banner" role="status">{notice}</p>}
    {failure && <p className="error-banner" role="alert">{failure}</p>}
    <div className="profile-layout"><aside className="form-card profile-summary">
      {profile.photo ? <button type="button" className="photo-open" aria-label="Enlarge profile photo" onClick={() => dialog.current.showModal()}><Avatar photo={profile.photo} name={profile.displayName} large /></button> : <Avatar name={profile.displayName} large />}
      <h2>{profile.displayName || 'Your name'}</h2><p>{courses.find(c => c.id === profile.courseId)?.name || profile.courseId}</p>
      {profile.photo && <p className="field-help">Select your photo to enlarge it.</p>}
      <p className="profile-hint">Your email and password are not shown on your community profile.</p>
    </aside>
    {editing ? <form ref={form} onSubmit={save} noValidate className="form-card" aria-busy={busy}>
      <fieldset disabled={busy}>
        <div className="field"><label htmlFor="profile-photo">Profile photo</label><div className="photo-controls">
          <input id="profile-photo" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} hidden={!!draft.photo} aria-describedby="photo-help photo-error" disabled={readingPhoto} />
          {draft.photo && <><button type="button" className="native-photo-button" disabled={readingPhoto} onClick={() => fileInput.current.click()}>Edit photo</button><button type="button" className="remove-photo" disabled={readingPhoto} onClick={() => { setDraft(p => ({ ...p, photo: '' })); setPhotoError(''); }}><BinIcon />Remove photo</button></>}
        </div><p className="field-help" id="photo-help">JPG, PNG or WebP. Up to 5 MB. Photo changes apply when you save.</p><p id="photo-error" role="alert" className="field-error">{photoError}</p>{readingPhoto && <p role="status">Opening photo…</p>}</div>
        <div className="field"><label htmlFor="profile-name">Display name</label><input id="profile-name" name="displayName" value={draft.displayName} onChange={e => setDraft(p => ({ ...p, displayName: e.target.value }))} maxLength="80" required aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? 'profile-name-error' : undefined} />{errors.displayName && <p id="profile-name-error" className="field-error">{errors.displayName}</p>}</div>
        <div className="field"><label htmlFor="profile-course">Your course</label><input id="profile-course" value={courses.find(c => c.id === profile.courseId)?.name || profile.courseId} readOnly /><p className="field-help">Course changes will be available in account settings.</p></div>
        <div className="field"><label htmlFor="profile-bio">About you</label><textarea id="profile-bio" rows="4" maxLength="500" value={draft.bio} onChange={e => setDraft(p => ({ ...p, bio: e.target.value }))} placeholder="Share a little about your experience and what you would like to build." /><p className="field-help">{draft.bio.length}/500 characters</p></div>
        {selections('skills', 'Skills you bring')}{selections('interests', 'Your interests')}{selections('goals', 'What are you looking for?')}
        <div className="profile-actions"><button className="primary" disabled={busy || readingPhoto}>{busy ? 'Saving…' : 'Save profile'}</button><button className="secondary" type="button" onClick={cancel}>Cancel</button></div>
      </fieldset>
    </form> : <div className="form-card profile-details"><h2>About me</h2><p className="bio-text">{profile.bio || 'Tell your community a little about yourself. Select Edit profile to get started.'}</p>{[['skills','Skills I bring'],['interests','My interests'],['goals','Looking for']].map(([key,title]) => <section key={key}><h2>{title}</h2><div className="profile-tags">{profile[key].length ? profile[key].map(value => <span key={value}>{value}</span>) : <p className="text-[#526782]">Nothing added yet.</p>}</div></section>)}</div>}
    </div>
    <dialog ref={dialog} className="photo-dialog" aria-label="Enlarged profile photo" onClick={event => { if (event.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.current.close(); } }}><button type="button" className="secondary" onClick={() => dialog.current.close()}>Close photo</button>{profile.photo && <img src={profile.photo} alt={`${profile.displayName}'s profile photo enlarged`} />}</dialog>
  </section>;
}
