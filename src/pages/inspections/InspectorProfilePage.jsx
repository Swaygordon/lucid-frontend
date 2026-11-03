// @backend-handoff-delete Preview-only profile data notice and local profile persistence.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleDollarSign, Clock3, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { GHANA_LOCATIONS } from '../../contexts/LocationContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';

const InspectorProfilePage = () => {
  const actor = useWorkflowActor();
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
          homeCity: data.homeCity || '',
          region: data.region || '',
          categories: data.categories || [],
          qualifications: (data.qualifications || []).join('\n'),
          availableDays: data.availableDays || [],
          startTime: data.startTime || '09:00',
          endTime: data.endTime || '17:00',
          availability: data.availability || 'Available',
          presenceStatus: data.presenceStatus || 'offline',
          scheduleStatus: data.scheduleStatus || 'on_shift',
          assignmentCapacity: data.assignmentCapacity || 'open',
          maxActiveAssignments: data.maxActiveAssignments || 3,
          payoutSetup: Boolean(data.payoutSetup),
        });
      }
    }).catch(loadError => { if (active) setError(loadError.message || 'Inspector profile could not be loaded.'); });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  const update = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const toggleCategory = category => update('categories', form.categories.includes(category)
    ? form.categories.filter(item => item !== category)
    : [...form.categories, category]);
  const toggleDay = day => update('availableDays', form.availableDays.includes(day)
    ? form.availableDays.filter(item => item !== day)
    : [...form.availableDays, day]);

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const result = await services.profiles.updateInspectorWorkProfile({
      role: actor.role,
      userId: actor.userId,
      profile: { ...form, qualifications: form.qualifications.split('\n').map(item => item.trim()).filter(Boolean) },
    });
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setProfile(result.data);
    window.dispatchEvent(new CustomEvent('lucid:workflow-profile-updated', { detail: { role: 'inspector', userId: actor.userId, profileComplete: true } }));
    showNotification('Inspector work profile saved to Preview data.', 'success');
    if (location.state?.from) navigate(location.state.from, { replace: true });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/lucid/inspector/visits" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">← Inspector workspace</Link>
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Private staff profile</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">Inspector profile and work setup</h1>
          <p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">Keep your service coverage, qualifications, and availability current so LUCID can route suitable inspection requests.</p>
        </header>

        {actor.mode === 'preview' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><strong>Preview only.</strong> Work profile changes are stored in this browser and update the local Inspector assignment roster. Do not enter real identity documents or payment account details.</div>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}

        {!form ? <p role="status" className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-300">Loading Inspector profile…</p> : profile?.editable ? (
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

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-3 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Service categories and qualifications</h2><p className="text-sm text-gray-500 dark:text-slate-400">Select work areas you are prepared to inspect and list relevant qualifications.</p></div></div>
              <fieldset className="mt-5"><legend className="mb-3 text-sm font-medium text-gray-700 dark:text-slate-300">Service categories</legend><div className="grid gap-2 sm:grid-cols-2">{ALL_CATEGORIES.map(category => <label key={category.slug} className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm text-gray-800 hover:border-primary dark:border-[#394458] dark:text-slate-200"><input type="checkbox" checked={form.categories.includes(category.name)} onChange={() => toggleCategory(category.name)} className="mt-0.5 accent-blue-600" /><span>{category.name}</span></label>)}</div></fieldset>
              <label className="mt-5 block space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Qualifications or credentials<textarea className={fieldClass} rows={4} value={form.qualifications} onChange={event => update('qualifications', event.target.value)} placeholder="Add one qualification per line" /><span className="block text-xs font-normal text-gray-500 dark:text-slate-400">Preview accepts sample text only. Credential review and document upload require the staff backend.</span></label>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"><Clock3 className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Availability</h2><p className="text-sm text-gray-500 dark:text-slate-400">Set the days and hours when you can take inspection assignments.</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2">{DAYS.map(day => <label key={day} className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${form.availableDays.includes(day) ? 'border-blue-700 bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-100' : 'border-gray-200 text-gray-700 dark:border-[#394458] dark:text-slate-300'}`}><input type="checkbox" className="sr-only" checked={form.availableDays.includes(day)} onChange={() => toggleDay(day)} />{day.slice(0, 3)}</label>)}</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">From<input className={fieldClass} type="time" required value={form.startTime} onChange={event => update('startTime', event.target.value)} /></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Until<input className={fieldClass} type="time" required value={form.endTime} onChange={event => update('endTime', event.target.value)} /></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Message presence<select className={fieldClass} value={form.presenceStatus} onChange={event => update('presenceStatus', event.target.value)}><option value="online">Online</option><option value="away">Away</option><option value="offline">Offline</option></select><span className="block text-xs font-normal text-gray-500">Reachability only; it does not indicate dispatch availability.</span></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Work schedule<select className={fieldClass} value={form.scheduleStatus} onChange={event => update('scheduleStatus', event.target.value)}><option value="on_shift">On shift</option><option value="off_shift">Off shift</option><option value="leave">On leave</option></select></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Assignment capacity<select className={fieldClass} value={form.assignmentCapacity} onChange={event => update('assignmentCapacity', event.target.value)}><option value="open">Open to assignments</option><option value="limited">Limited assignments</option><option value="full">At capacity</option><option value="paused">Pause new assignments</option></select></label><label className="space-y-2 text-sm font-medium text-gray-700 dark:text-slate-300">Maximum active cases<input className={fieldClass} type="number" min="1" max="20" value={form.maxActiveAssignments} onChange={event => update('maxActiveAssignments', Number(event.target.value))}/></label></div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-6"><div className="flex items-start gap-3"><CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-200" aria-hidden="true" /><div className="flex-1"><h2 className="font-semibold text-amber-950 dark:text-amber-100">Secure payout onboarding</h2><p className="mt-1 text-sm text-amber-900 dark:text-amber-200">Before LUCID assigns you an inspection or sends a payout, you will complete any required identity checks through the payment provider. Preview records readiness only and never saves account numbers. Compensation examples remain in <Link to="/lucid/inspector/finance" className="font-semibold underline">financial history</Link>.</p><label className="mt-4 flex items-start gap-3 text-sm text-amber-950 dark:text-amber-100"><input type="checkbox" checked={form.payoutSetup} onChange={event => update('payoutSetup', event.target.checked)} className="mt-1 accent-blue-600"/>Mark secure payout onboarding ready in this Preview</label></div></div></section>

            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-gray-500 dark:text-slate-400">Your private staff profile is visible to you and authorized LUCID staff.</p><div className="flex flex-wrap items-center gap-3"><Link to="/lucid/" className="text-sm font-semibold text-gray-600 hover:underline dark:text-slate-300">Skip for now</Link><button type="submit" disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving work profile…' : profile.profileComplete ? 'Save work profile' : 'Save and complete work setup'}</button></div></div>
          </form>
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><p className="font-semibold text-gray-900 dark:text-slate-100">Inspector staff profile</p><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{profile?.preview ? 'Synthetic preview profile.' : `${[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Signed-in Inspector'} · staff account`}</p><p className="mt-3 text-sm text-gray-600 dark:text-slate-400">{profile?.preview ? 'Work profile editing is available from the selected Inspector Preview persona.' : 'Work profile editing will be available when the staff profile service is provided.'}</p></section>
        )}
      </div>
    </main>
  );
};

export default InspectorProfilePage;
