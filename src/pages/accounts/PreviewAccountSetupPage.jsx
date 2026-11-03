// @backend-handoff-delete Preview-only profile setup persistence and development guidance.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BriefcaseBusiness, CircleDollarSign, UserRound } from 'lucide-react';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { GHANA_LOCATIONS } from '../../contexts/LocationContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const field = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';

export default function PreviewAccountSetupPage() {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const role = actor.role === 'service_provider' ? 'provider' : actor.role;
  const isProvider = role === 'provider';
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const regions = useMemo(() => GHANA_LOCATIONS, []);
  const cities = regions.find(item => item.region === form?.region)?.areas || [];

  useEffect(() => {
    let active = true;
    services.profiles.getForRole({ role, userId: actor.userId }).then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setForm({ fullName: result.data.fullName || '', phone: result.data.phone || '', homeCity: result.data.homeCity || '', region: result.data.region || '', categories: result.data.categories || [], qualifications: (result.data.qualifications || []).join('\n'), paymentPreference: result.data.paymentPreference || '', presenceStatus: result.data.presenceStatus || 'offline', scheduleStatus: result.data.scheduleStatus || 'on_shift', assignmentCapacity: result.data.assignmentCapacity || 'open', maxActiveAssignments: result.data.maxActiveAssignments || 3, payoutSetup: Boolean(result.data.payoutSetup) });
    }).catch(cause => { if (active) setError(cause.message || 'Profile setup could not be loaded.'); });
    return () => { active = false; };
  }, [services, role, actor.userId]);

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggleCategory = name => update('categories', form.categories.includes(name) ? form.categories.filter(item => item !== name) : [...form.categories, name]);
  const save = async event => {
    event.preventDefault();
    setSaving(true); setError('');
    const result = await services.profiles.updateAccountSetup({ role, userId: actor.userId, profile: { ...form, qualifications: form.qualifications.split('\n').map(item => item.trim()).filter(Boolean) } });
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    window.dispatchEvent(new CustomEvent('lucid:workflow-profile-updated', { detail: { role, userId: actor.userId, profileComplete: true } }));
    showNotification(`${isProvider ? 'Provider' : 'Client'} Preview setup saved.`, 'success');
    navigate(location.state?.from || (isProvider ? '/lucid/provider/work' : '/lucid/dashboard'), { replace: true });
  };

  if (role !== 'client' && role !== 'provider') return <main className="p-8">Choose a Client or Provider Preview account to use this setup page.</main>;
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl space-y-6">
    <Link to="/lucid/" className="text-sm font-semibold text-primary hover:underline">← Browse LUCID</Link>
    <header><p className="text-sm font-semibold uppercase tracking-wide text-primary">{isProvider ? 'Provider account' : 'Client account'}</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">{isProvider ? 'Set up your Provider profile' : 'Set up your Client profile'}</h1><p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">Complete these details to use the Preview workflow. Your changes are stored locally in this browser.</p></header>
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true"/><p><strong>Preview data only.</strong> Use sample contact details. Financial setup below records readiness only and does not collect account numbers.</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}
    {!form ? <p role="status" className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-300">Loading profile setup…</p> : <form onSubmit={save} className="space-y-5">
      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Contact and service location</h2></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Full name<input required className={field} value={form.fullName} onChange={e=>update('fullName',e.target.value)} /></label><label className="space-y-2 text-sm font-medium">Phone number<input required type="tel" className={field} value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="Sample number" /></label><label className="space-y-2 text-sm font-medium">Region<select required className={field} value={form.region} onChange={e=>{update('region',e.target.value);update('homeCity','');}}><option value="">Select region</option>{regions.map(item=><option key={item.region}>{item.region}</option>)}</select></label><label className="space-y-2 text-sm font-medium">City or town<select required disabled={!form.region} className={field} value={form.homeCity} onChange={e=>update('homeCity',e.target.value)}><option value="">Select city or town</option>{cities.map(city=><option key={city}>{city}</option>)}</select></label></div></section>
      {isProvider ? <>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7"><div className="flex items-center gap-3"><BriefcaseBusiness className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Services and assignment capacity</h2></div><fieldset className="mt-4"><legend className="mb-3 text-sm font-medium">Service categories</legend><div className="grid gap-2 sm:grid-cols-2">{ALL_CATEGORIES.map(category=><label key={category.slug} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-[#394458]"><input type="checkbox" checked={form.categories.includes(category.name)} onChange={()=>toggleCategory(category.name)} className="mt-0.5 accent-blue-600"/>{category.name}</label>)}</div></fieldset><label className="mt-4 block space-y-2 text-sm font-medium">Skills or qualifications<textarea required rows={3} className={field} value={form.qualifications} onChange={e=>update('qualifications',e.target.value)} placeholder="One item per line"/></label><p className="mt-5 text-sm font-semibold">These settings have different purposes</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Message presence<select className={field} value={form.presenceStatus} onChange={e=>update('presenceStatus',e.target.value)}><option value="online">Online</option><option value="away">Away</option><option value="offline">Offline</option></select><span className="block text-xs font-normal text-gray-500">Controls reachability only; it does not mean you can take a job.</span></label><label className="space-y-2 text-sm font-medium">Work schedule<select className={field} value={form.scheduleStatus} onChange={e=>update('scheduleStatus',e.target.value)}><option value="on_shift">On shift</option><option value="off_shift">Off shift</option><option value="leave">On leave</option></select></label><label className="space-y-2 text-sm font-medium">Assignment capacity<select className={field} value={form.assignmentCapacity} onChange={e=>update('assignmentCapacity',e.target.value)}><option value="open">Open to assignments</option><option value="limited">Limited assignments</option><option value="full">At capacity</option><option value="paused">Pause new assignments</option></select></label><label className="space-y-2 text-sm font-medium">Maximum active jobs<input type="number" min="1" max="20" className={field} value={form.maxActiveAssignments} onChange={e=>update('maxActiveAssignments',Number(e.target.value))}/></label></div></section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7"><div className="flex items-center gap-3"><CircleDollarSign className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Secure payout onboarding</h2></div><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Your profile can be saved now. Before you can accept an assignment or receive money, you’ll complete identity and payout setup through the payment provider. This Preview records a readiness choice only and never collects account details.</p><label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={form.payoutSetup} onChange={e=>update('payoutSetup',e.target.checked)} className="mt-1 accent-blue-600"/>Mark secure payout onboarding ready in this Preview</label></section>
      </> : <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7"><div className="flex items-center gap-3"><CircleDollarSign className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Payment preference</h2></div><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Choose a preferred way to pay. Actual payment details are entered only during checkout.</p><select required className={`${field} mt-4`} value={form.paymentPreference} onChange={e=>update('paymentPreference',e.target.value)}><option value="">Select preference</option><option>Mobile money</option><option>Card</option><option>Cash after service</option></select></section>}
      <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/lucid/" className="text-sm font-semibold text-gray-600 hover:underline dark:text-slate-300">Skip for now</Link><button disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">{saving?'Saving setup…':'Save and complete setup'}</button></div>
    </form>}
  </div></main>;
}
