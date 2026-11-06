// Backend contract: persist private Inspector identity and work profile fields through authenticated profile services.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleDollarSign, Clock3, ImagePlus, MapPin, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { CONSTRUCTION_WORK_TYPES } from '../../data/catalog/launchServices.js';
import CredentialEditor from '../../components/accounts/CredentialEditor.jsx';
import { normalizeCredentialForSave } from '../../utils/catalog/credentialRules.js';
import { GHANA_LOCATIONS } from '../../contexts/LocationContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowMode, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import PayoutSetupPanel from '../../components/finance/PayoutSetupPanel.jsx';
import { ProfileEditorPageSkeleton } from '../../app/components/RouteSkeletons.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';

const InspectorProfilePage = () => {
  const actor = useWorkflowActor();
  const { user } = useWorkflowMode();
  const services = useWorkflowServices();
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const locations = useMemo(() => GHANA_LOCATIONS, []);
  const cities = locations.find(item => item.region === form?.region)?.areas || [];

  useEffect(() => {
    let active = true;
    services.profiles.getForRole({ role: actor.role, userId: actor.userId }).then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else {
        const data = result.data;
        setProfile(data);
        setForm({
          displayName: data.displayName || '',
          homeCity: data.homeCity || '',
          region: data.region || '',
          categories: data.categories || [],
          serviceIds: data.serviceIds || ALL_CATEGORIES.filter(category => (data.categories || []).includes(category.name)).flatMap(category => category.services.map(service => service.id)),
          constructionWorkTypeIds: data.constructionWorkTypeIds || [],
          qualifications: (data.qualifications || []).join('\n'),
          credentials: (data.credentials || []).map(item => ({ ...item, credentialTypeId: item.credentialTypeId || 'other', certificateNumber: item.certificateNumber || item.reference || '', verificationStatus: item.verificationStatus || item.status || 'self_declared' })), phone: data.phone || '', profilePhoto: data.profilePhoto || '',
          availableDays: data.availableDays || [],
          startTime: data.startTime || '09:00',
          endTime: data.endTime || '17:00',
          availability: data.availability || 'Available',
          presenceStatus: data.presenceStatus || 'offline',
          scheduleStatus: data.scheduleStatus || 'on_shift',
          assignmentCapacity: data.assignmentCapacity || 'open',
          maxActiveAssignments: data.maxActiveAssignments || 3,
          payoutSetup: Boolean(data.payoutSetup), payoutStatus: data.payoutStatus || (data.payoutSetup ? 'active' : 'not_started'),
        });
      }
    }).catch(loadError => { if (active) setError(loadError.message || 'Inspector profile could not be loaded.'); });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);
  if (!form && !error) return <ProfileEditorPageSkeleton />;

  const update = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const toggleConstructionWorkType = id => update('constructionWorkTypeIds', form.constructionWorkTypeIds.includes(id) ? form.constructionWorkTypeIds.filter(item => item !== id) : [...form.constructionWorkTypeIds, id]);
  const toggleService = serviceId => {
    const selected = form.serviceIds.includes(serviceId) ? form.serviceIds.filter(id => id !== serviceId) : [...form.serviceIds, serviceId];
    update('serviceIds', selected);
    update('categories', [...new Set(ALL_CATEGORIES.filter(category => category.services.some(service => selected.includes(service.id))).map(category => category.name))]);
  };
  const toggleDay = day => update('availableDays', form.availableDays.includes(day)
    ? form.availableDays.filter(item => item !== day)
    : [...form.availableDays, day]);
  const updateCredential = (id, changes) => update('credentials', form.credentials.map(item => item.id === id ? { ...item, ...changes } : item));
  const uploadCredential = async (credential, file) => {
    if (file.size > 5 * 1024 * 1024) { setError('Choose credential evidence smaller than 5 MB.'); return; }
    const result = await services.credentials.uploadEvidence({ file, credentialId: credential.id, role: 'inspector', userId: actor.userId });
    if (result.error) { updateCredential(credential.id, { uploadError: result.error.message }); return; }
    updateCredential(credential.id, { evidenceObjectKey: result.data.objectKey, evidenceName: file.name, verificationStatus: 'document_uploaded', uploadError: '' });
  };
  const setProfilePhoto = event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) { setError('Choose an image smaller than 8 Ma.'); return; }
    const reader = new FileReader();
    reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 768 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height); const compressed = canvas.toDataURL('image/jpeg', .72); if (compressed.length > 850000) { setError('Choose a smaller photo.'); return; } update('profilePhoto', compressed); }; image.onerror = () => setError('This photo could not be opened.'); image.src = String(reader.result); };
    reader.onerror = () => setError('This photo could not be read.'); reader.readAsDataURL(file);
  };

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const result = await services.profiles.updateInspectorWorkProfile({
      role: actor.role,
      userId: actor.userId,
      profile: { ...form, email: user?.email || '', credentials: form.credentials.map(normalizeCredentialForSave), qualifications: form.qualifications.split('\n').map(item => item.trim()).filter(Boolean) },
    });
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setProfile(result.data);
    window.dispatchEvent(new CustomEvent('lucid:workflow-profile-updated', { detail: { role: 'inspector', userId: actor.userId, profileComplete: true } }));
    showNotification('Inspector work profile saved.', 'success');
    if (location.state?.from) navigate(location.state.from, { replace: true });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/lucid/inspector/visits" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">â† Inspector workspace</Link>
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Private staff profile</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">Inspector profile and work setup</h1>
          <p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">Keep your service coverage, qualifications, and availability current so LUCID can route suitable inspection requests.</p>
        </header>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}

        {!form ? <p role="status" className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-300">Loading Inspector profileâ€¦</p> : profile?.editable ? (
          <form onSubmit={save} className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"><UserRound className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Work location</h2><p className="text-sm text-gray-500 dark:text-slate-400">Used to estimate assignment proximity.</p></div></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile.profileComplete ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'}`}>{profile.profileComplete ? 'Work setup complete' : 'Work setup incomplete'}</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Region<select required className={fieldClass} value={form.region} onChange={event => { update('region', event.target.value); update('homeCity', ''); }}><option value="">Select region</option>{locations.map(item => <option key={item.region} value={item.region}>{item.region}</option>)}</select></label>
                <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Home city or town<select required disabled={!form.region} className={fieldClass} value={form.homeCity} onChange={event => update('homeCity', event.target.value)}><option value="">Select city or town</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select></label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Private identity and contact</h2></div><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Visible to you and authorized LUCID staff.</p><label className="mt-4 block max-w-md space-y-2 text-sm font-medium">Login email<input readOnly value={user?.email || "Not available"} className={`${fieldClass} cursor-not-allowed bg-gray-50 dark:bg-[#202636]`}/><span className="block text-xs font-normal text-gray-500">Copied from sign-up to your private Admin-visible profile when you save these details. Changing it requires the account security flow.</span></label><div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-primary dark:bg-blue-950/40">{form.profilePhoto ? <img src={form.profilePhoto} alt="Your profile" className="h-full w-full object-cover"/> : <UserRound/>}</div><div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-[#394458]"><ImagePlus size={16}/> {form.profilePhoto ? 'Replace photo' : 'Add profile photo'}<input type="file" accept="image/*" className="sr-only" onChange={setProfilePhoto}/></label>{form.profilePhoto && <button type="button" onClick={() => update('profilePhoto', '')} className="ml-2 min-h-10 px-2 text-sm font-semibold text-red-700 dark:text-red-300">Remove</button>}<div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block space-y-2 text-sm font-medium">Full name<input required maxLength={120} className={fieldClass} value={form.displayName} onChange={event => update('displayName', event.target.value)} autoComplete="name"/></label><label className="block space-y-2 text-sm font-medium">Phone number<input className={fieldClass} type="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="Work contact phone" autoComplete="tel"/></label></div></div></div><p className="mt-2 text-xs text-gray-500">Email and phone verification status is shown here when available.</p></section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-3 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Service categories and qualifications</h2><p className="text-sm text-gray-500 dark:text-slate-400">Select work areas you are prepared to inspect and list relevant qualifications.</p></div></div>
              <fieldset className="mt-5"><legend className="mb-3 text-sm font-medium text-gray-700 dark:text-slate-300">Service categories</legend><div className="grid gap-2 sm:grid-cols-2">{ALL_CATEGORIES.map(category => <fieldset key={category.slug} className="rounded-xl border border-gray-200 p-3 dark:border-[#394458]"><legend className="px-1 text-sm font-semibold">{category.name}</legend><div className="mt-1 grid gap-2 sm:grid-cols-2">{category.services.map(service => <label key={service.id} className="flex cursor-pointer items-start gap-2 text-sm text-gray-800 dark:text-slate-200"><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} className="mt-1 accent-blue-600" /><span>{service.name}</span></label>)}</div></fieldset>)}</div></fieldset>{form.serviceIds.includes('construction-worker') && <fieldset className="mt-4 rounded-xl border border-blue-200 p-3 dark:border-blue-900/50"><legend className="px-1 text-sm font-semibold">Construction work types</legend><div className="grid gap-2 sm:grid-cols-2">{CONSTRUCTION_WORK_TYPES.map(type => <label key={type.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.constructionWorkTypeIds.includes(type.id)} onChange={() => toggleConstructionWorkType(type.id)} className="mt-1 accent-blue-600"/><span>{type.label}</span></label>)}</div></fieldset>}
              <CredentialEditor credentials={form.credentials} onChange={value => update('credentials', value)} onUpload={uploadCredential} />
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"><Clock3 className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Availability</h2><p className="text-sm text-gray-500 dark:text-slate-400">Set the days and hours when you can take inspection assignments.</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2">{DAYS.map(day => <label key={day} className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${form.availableDays.includes(day) ? 'border-blue-700 bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-100' : 'border-gray-200 text-gray-700 dark:border-[#394458] dark:text-slate-300'}`}><input type="checkbox" className="sr-only" checked={form.availableDays.includes(day)} onChange={() => toggleDay(day)} />{day.slice(0, 3)}</label>)}</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">From<input className={fieldClass} type="time" required value={form.startTime} onChange={event => update('startTime', event.target.value)} /></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Until<input className={fieldClass} type="time" required value={form.endTime} onChange={event => update('endTime', event.target.value)} /></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Message presence<select className={fieldClass} value={form.presenceStatus} onChange={event => update('presenceStatus', event.target.value)}><option value="online">Online</option><option value="away">Away</option><option value="offline">Offline</option></select><span className="block text-xs font-normal text-gray-500">Reachability only; it does not indicate dispatch availability.</span></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Work schedule<select className={fieldClass} value={form.scheduleStatus} onChange={event => update('scheduleStatus', event.target.value)}><option value="on_shift">On shift</option><option value="off_shift">Off shift</option><option value="leave">On leave</option></select></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Assignment capacity<select className={fieldClass} value={form.assignmentCapacity} onChange={event => update('assignmentCapacity', event.target.value)}><option value="open">Open to assignments</option><option value="limited">Limited assignments</option><option value="full">At capacity</option><option value="paused">Pause new assignments</option></select></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Maximum active cases<input className={fieldClass} type="number" min="1" max="20" value={form.maxActiveAssignments} onChange={event => update('maxActiveAssignments', Number(event.target.value))}/></label></div>
            </section>

              <PayoutSetupPanel services={services} role={actor.role} userId={actor.userId}/>

            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-gray-500 dark:text-slate-400">Your private staff profile is visible to you and authorized LUCID staff.</p><div className="flex flex-wrap items-center gap-3"><Link to="/lucid/" className="text-sm font-semibold text-gray-600 hover:underline dark:text-slate-300">Skip for now</Link><button type="submit" disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving work profileâ€¦' : profile.profileComplete ? 'Save work profile' : 'Save and complete work setup'}</button></div></div>
          </form>
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><p className="font-semibold text-gray-900 dark:text-slate-100">Inspector staff profile</p><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{`${[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Signed-in Inspector'} ? staff account`}</p><p className="mt-3 text-sm text-gray-600 dark:text-slate-400">Work profile editing is available for your signed-in Inspector account.</p></section>
        )}
      </div>
    </main>
  );
};

export default InspectorProfilePage;
