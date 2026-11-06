// Profile setup persists private role fields through the Supabase workflow service.
import React, { useEffect, useMemo, useState } from 'react';
import PayoutSetupPanel from '../../components/finance/PayoutSetupPanel.jsx';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BriefcaseBusiness, CircleDollarSign, ImagePlus, MapPin, Trash2, UserRound } from 'lucide-react';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { CONSTRUCTION_WORK_TYPES } from '../../data/catalog/launchServices.js';
import CredentialEditor from '../../components/accounts/CredentialEditor.jsx';
import { ProfileEditorPageSkeleton } from '../../app/components/RouteSkeletons.jsx';
import { accountLocationFromProfile, useSearchLocation } from '../../contexts/LocationContext.jsx';
import { normalizeCredentialForSave } from '../../utils/catalog/credentialRules.js';
import { GHANA_LOCATIONS } from '../../contexts/LocationContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowMode, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const field = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';
const newId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const preparePortfolioImage = file => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith('image/')) return reject(new Error('Choose an image file.'));
  if (file.size > 8 * 1024 * 1024) return reject(new Error('Choose an image smaller than 8 MB.'));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('This image could not be read.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.onload = () => {
      const scale = Math.min(1, 768 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.72);
      if (compressed.length > 850_000) return reject(new Error('This image is too large after resizing. Choose a smaller image.'));
      resolve(compressed);
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

export default function AccountSetupPage() {
  const actor = useWorkflowActor();
  const { user } = useWorkflowMode();
  const services = useWorkflowServices();
  const { updateDefaultLocation } = useSearchLocation();
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const role = actor.role === 'service_provider' ? 'provider' : actor.role;
  const isProvider = role === 'provider';
  const isClient = role === 'client';
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
      else {
        const data = result.data;
        const accountLocation = accountLocationFromProfile(data);
        if (accountLocation.area) updateDefaultLocation(accountLocation);
        setForm({
          fullName: data.fullName || '', phone: data.phone || '', homeCity: data.homeCity || '', region: data.region || '',
          profilePhoto: data.profilePhoto || '', serviceLocations: data.serviceLocations || [], categories: data.categories || [], serviceIds: data.serviceIds || ALL_CATEGORIES.filter(category => (data.categories || []).includes(category.name)).flatMap(category => category.services.map(service => service.id)), constructionWorkTypeIds: data.constructionWorkTypeIds || [],
          qualifications: (data.qualifications || []).join('\n'), credentials: (data.credentials || []).map(item => ({ ...item, credentialTypeId: item.credentialTypeId || 'other', certificateNumber: item.certificateNumber || item.reference || '', verificationStatus: item.verificationStatus || item.status || 'self_declared' })),
          bio: data.bio || '', yearsExperience: data.yearsExperience || 0,
          serviceRadiusKm: data.serviceRadiusKm || 25, skills: (data.skills || []).join('\n'),
          languages: (data.languages || []).join('\n'), portfolioItems: data.portfolioItems || [],
          presenceStatus: data.presenceStatus || 'offline', scheduleStatus: data.scheduleStatus || 'on_shift',
          assignmentCapacity: data.assignmentCapacity || 'open', maxActiveAssignments: data.maxActiveAssignments || 3,
        });
      }
    }).catch(cause => { if (active) setError(cause.message || 'Profile setup could not be loaded.'); });
    return () => { active = false; };
  }, [services, role, actor.userId, updateDefaultLocation]);

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggleConstructionWorkType = id => update('constructionWorkTypeIds', form.constructionWorkTypeIds.includes(id) ? form.constructionWorkTypeIds.filter(item => item !== id) : [...form.constructionWorkTypeIds, id]);
  const toggleService = serviceId => {
    const selected = form.serviceIds.includes(serviceId) ? form.serviceIds.filter(id => id !== serviceId) : [...form.serviceIds, serviceId];
    update('serviceIds', selected);
    update('categories', [...new Set(ALL_CATEGORIES.filter(category => category.services.some(service => selected.includes(service.id))).map(category => category.name))]);
  };
  const updateLocation = (id, key, value) => update('serviceLocations', form.serviceLocations.map(item => item.id === id ? { ...item, [key]: value, ...(key === 'region' ? { city: '' } : {}) } : item));
  const addLocation = () => update('serviceLocations', [...form.serviceLocations, { id: newId('location'), label: '', region: '', city: '', area: '', address: '', accessNotes: '', isDefault: form.serviceLocations.length === 0 }]);
  const removeLocation = id => update('serviceLocations', form.serviceLocations.filter(item => item.id !== id));
  const updatePortfolio = (id, changes) => update('portfolioItems', form.portfolioItems.map(item => item.id === id ? { ...item, ...changes } : item));
  const addPortfolioImage = async event => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length || !form) return;
    if (form.portfolioItems.length + files.length > 6) { setError('Add up to 6 portfolio photos.'); return; }
    setError('');
    try {
      const items = await Promise.all(files.map(async file => ({ id: newId('work'), title: file.name.replace(/\.[^.]+$/, '').slice(0, 100), description: '', category: '', imageName: file.name, imageData: await preparePortfolioImage(file), imagePosition: 'center', consentToShare: false })));
      update('portfolioItems', [...form.portfolioItems, ...items]);
    } catch (cause) { setError(cause.message || 'The photo could not be added.'); }
  };
  const replacePortfolioImage = async (id, file) => {
    if (!file) return;
    try { updatePortfolio(id, { imageData: await preparePortfolioImage(file), imageName: file.name }); }
    catch (cause) { setError(cause.message || 'The photo could not be replaced.'); }
  };
  const updateCredential = (id, changes) => update('credentials', form.credentials.map(item => item.id === id ? { ...item, ...changes } : item));
  const uploadCredential = async (credential, file) => {
    if (file.size > 5 * 1024 * 1024) { setError('Choose credential evidence smaller than 5 MB.'); return; }
    const result = await services.credentials.uploadEvidence({ file, credentialId: credential.id, role, userId: actor.userId });
    if (result.error) { updateCredential(credential.id, { uploadError: result.error.message }); return; }
    updateCredential(credential.id, { evidenceObjectKey: result.data.objectKey, evidenceName: file.name, verificationStatus: 'document_uploaded', uploadError: '' });
  };
  const setProfilePhoto = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || !form) return;
    try { update('profilePhoto', await preparePortfolioImage(file)); setError(''); }
    catch (cause) { setError(cause.message || 'The photo could not be added.'); }
  };

  const save = async event => {
    event.preventDefault();
    setSaving(true); setError('');
    const profile = {
      ...form,
      email: user?.email || '',
      credentials: form.credentials.map(normalizeCredentialForSave),
      qualifications: form.qualifications.split('\n').map(item => item.trim()).filter(Boolean),
      skills: form.skills.split('\n').map(item => item.trim()).filter(Boolean),
      languages: form.languages.split('\n').map(item => item.trim()).filter(Boolean),
    };
    const result = await services.profiles.updateAccountSetup({ role, userId: actor.userId, profile });
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    updateDefaultLocation(accountLocationFromProfile(profile));
    window.dispatchEvent(new CustomEvent('lucid:workflow-profile-updated', { detail: { role, userId: actor.userId, profileComplete: true } }));
    showNotification(`${isProvider ? 'Provider' : 'Client'} profile saved.`, 'success');
    navigate(location.state?.from || (isProvider ? '/lucid/provider/work' : '/lucid/dashboard'), { replace: true });
  };

  if (!isClient && !isProvider) return <main className="p-8">This setup is available to Client and Service provider accounts.</main>;
  if (!form && !error) return <ProfileEditorPageSkeleton />;
  if (!form) return <main className="min-h-[60vh] bg-gray-50 px-4 py-10 dark:bg-[#0f1117]"><p role="alert" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-300">{error}</p></main>;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/lucid/" className="text-sm font-semibold text-primary hover:underline">← Browse LUCID</Link>
        <header><p className="text-sm font-semibold uppercase tracking-wide text-primary">{isProvider ? 'Provider account' : 'Client account'}</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">{isProvider ? 'Set up your Provider profile' : 'Set up your Client profile'}</h1><p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">Add the details needed to use your LUCID account.</p></header>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}

        <form onSubmit={save} className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
            <div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Private account and contact</h2></div>
            <label className="block max-w-xl space-y-2 text-sm font-medium">Login email<input readOnly value={user?.email || "Not available"} className={`${field} cursor-not-allowed bg-gray-50 dark:bg-[#202636]`}/><span className="block text-xs font-normal text-gray-500">This comes from sign-up and is copied to your private Admin-visible profile when you save. Changing it requires the account security flow.</span></label>
            <div className="flex flex-wrap items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-lg font-semibold text-primary dark:bg-blue-950/40">{form.profilePhoto ? <img src={form.profilePhoto} alt="Your profile" className="h-full w-full object-cover"/> : form.fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'LU'}</div><div><label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-[#394458]">{form.profilePhoto ? 'Replace photo' : 'Add profile photo'}<input type="file" accept="image/*" className="sr-only" onChange={setProfilePhoto}/></label>{form.profilePhoto && <button type="button" onClick={() => update('profilePhoto', '')} className="ml-2 min-h-10 px-2 text-sm font-semibold text-red-700 dark:text-red-300">Remove</button>}<p className="mt-1 text-xs text-gray-500">Your photo is shared according to your role profile visibility.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Full name<input required className={field} value={form.fullName} onChange={event => update('fullName', event.target.value)} autoComplete="name"/></label><label className="space-y-2 text-sm font-medium">Phone number<input required type="tel" className={field} value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="Phone number" autoComplete="tel"/></label><label className="space-y-2 text-sm font-medium">Region<select required className={field} value={form.region} onChange={event => { update('region', event.target.value); update('homeCity', ''); }}><option value="">Select region</option>{regions.map(item => <option key={item.region} value={item.region}>{item.region}</option>)}</select></label><label className="space-y-2 text-sm font-medium">City or town<select required disabled={!form.region} className={field} value={form.homeCity} onChange={event => update('homeCity', event.target.value)}><option value="">Select city or town</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select></label></div>
          </section>

          {isClient && <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary"/><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Saved service locations</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Add locations you may use when requesting a service.</p></div></div><button type="button" onClick={addLocation} disabled={form.serviceLocations.length >= 8} className="min-h-10 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50">Add location</button></div>
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">Exact addresses and access notes stay private here. They should be shared with LUCID and assigned workers only for the specific active request.</p>
            {form.serviceLocations.length ? <div className="mt-4 space-y-4">{form.serviceLocations.map(item => { const locationCities = regions.find(region => region.region === item.region)?.areas || []; return <article key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-[#394458]"><div className="flex items-start justify-between gap-3"><label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="default-location" checked={item.isDefault} onChange={() => update('serviceLocations', form.serviceLocations.map(entry => ({ ...entry, isDefault: entry.id === item.id })))} />Default location</label><button type="button" onClick={() => removeLocation(item.id)} aria-label={`Remove ${item.label || 'saved'} location`} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={17}/></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Location name<input required className={field} value={item.label} onChange={event => updateLocation(item.id, 'label', event.target.value)} placeholder="Home, work, family"/></label><label className="space-y-2 text-sm font-medium">Region<select required className={field} value={item.region} onChange={event => updateLocation(item.id, 'region', event.target.value)}><option value="">Select region</option>{regions.map(region => <option key={region.region} value={region.region}>{region.region}</option>)}</select></label><label className="space-y-2 text-sm font-medium">City or town<select required disabled={!item.region} className={field} value={item.city} onChange={event => updateLocation(item.id, 'city', event.target.value)}><option value="">Select city or town</option>{locationCities.map(city => <option key={city} value={city}>{city}</option>)}</select></label><label className="space-y-2 text-sm font-medium">Area or neighbourhood<select required disabled={!item.region} className={field} value={item.area || ''} onChange={event => updateLocation(item.id, 'area', event.target.value)}><option value="">Select area</option>{locationCities.map(area => <option key={area} value={area}>{area}</option>)}</select></label><label className="space-y-2 text-sm font-medium sm:col-span-2">Street address<input required className={field} value={item.address} onChange={event => updateLocation(item.id, 'address', event.target.value)} placeholder="Street, landmark, building"/></label><label className="space-y-2 text-sm font-medium sm:col-span-2">Access notes <span className="font-normal text-gray-500">(optional)</span><textarea rows={2} maxLength={500} className={field} value={item.accessNotes} onChange={event => updateLocation(item.id, 'accessNotes', event.target.value)} placeholder="Gate, access hours, or other visit instructions"/></label></div></article>; })}</div> : <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">No saved locations yet. You can add one now or add locations later.</p>}
          </section>}

          {isProvider && <>
            <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
              <div className="flex items-center gap-3"><BriefcaseBusiness className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Provider work profile</h2></div>
              <p className="text-sm text-gray-600 dark:text-slate-400">This profile supports Admin matching. Provider identity and direct contact remain private from Clients.</p>
              <label className="block space-y-2 text-sm font-medium">Short introduction<textarea rows={4} maxLength={1200} className={field} value={form.bio} onChange={event => update('bio', event.target.value)} placeholder="Describe the work you do and how you approach it."/><span className="block text-xs font-normal text-gray-500">Up to 1,200 characters.</span></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Years of experience<input type="number" min="0" max="80" className={field} value={form.yearsExperience} onChange={event => update('yearsExperience', Number(event.target.value))}/></label><label className="space-y-2 text-sm font-medium">Service radius (km)<input type="number" min="5" max="500" step="5" className={field} value={form.serviceRadiusKm} onChange={event => update('serviceRadiusKm', Number(event.target.value))}/><span className="block text-xs font-normal text-gray-500">Your work area starts from the selected city or town.</span></label></div>
              <fieldset><legend className="mb-3 text-sm font-medium">Services you provide</legend><div className="grid gap-2 sm:grid-cols-2">{ALL_CATEGORIES.map(category => <fieldset key={category.slug} className="rounded-xl border border-gray-200 p-3 dark:border-[#394458]"><legend className="px-1 text-sm font-semibold">{category.name}</legend><div className="mt-1 grid gap-2 sm:grid-cols-2">{category.services.map(service => <label key={service.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} className="mt-1 accent-blue-600"/><span>{service.name}</span></label>)}</div></fieldset>)}</div></fieldset>
              {form.serviceIds.includes('construction-worker') && <fieldset className="mt-4 rounded-xl border border-blue-200 p-3 dark:border-blue-900/50"><legend className="px-1 text-sm font-semibold">Construction work types</legend><div className="grid gap-2 sm:grid-cols-2">{CONSTRUCTION_WORK_TYPES.map(type => <label key={type.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.constructionWorkTypeIds.includes(type.id)} onChange={() => toggleConstructionWorkType(type.id)} className="mt-1 accent-blue-600"/><span>{type.label}</span></label>)}</div></fieldset>}
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Skills<textarea rows={3} className={field} value={form.skills} onChange={event => update('skills', event.target.value)} placeholder="One skill per line"/></label><label className="space-y-2 text-sm font-medium">Languages<textarea rows={3} className={field} value={form.languages} onChange={event => update('languages', event.target.value)} placeholder="One language per line"/></label></div>
              <label className="block space-y-2 text-sm font-medium">Qualifications<textarea required rows={3} className={field} value={form.qualifications} onChange={event => update('qualifications', event.target.value)} placeholder="One qualification per line"/></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Message presence<select className={field} value={form.presenceStatus} onChange={event => update('presenceStatus', event.target.value)}><option value="online">Online</option><option value="away">Away</option><option value="offline">Offline</option></select><span className="block text-xs font-normal text-gray-500">Reachability only; this does not mean you can accept a job.</span></label><label className="space-y-2 text-sm font-medium">Work schedule<select className={field} value={form.scheduleStatus} onChange={event => update('scheduleStatus', event.target.value)}><option value="on_shift">On shift</option><option value="off_shift">Off shift</option><option value="leave">On leave</option></select></label><label className="space-y-2 text-sm font-medium">Assignment capacity<select className={field} value={form.assignmentCapacity} onChange={event => update('assignmentCapacity', event.target.value)}><option value="open">Open to assignments</option><option value="limited">Limited assignments</option><option value="full">At capacity</option><option value="paused">Pause new assignments</option></select></label><label className="space-y-2 text-sm font-medium">Maximum active jobs<input type="number" min="1" max="20" className={field} value={form.maxActiveAssignments} onChange={event => update('maxActiveAssignments', Number(event.target.value))}/></label></div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Work portfolio</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Keep examples for your LUCID work profile. Project examples are visible according to your role profile visibility and consent.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"><ImagePlus size={16}/>Add photos<input className="sr-only" type="file" accept="image/*" multiple onChange={addPortfolioImage}/></label></div><p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Only add work you have permission to share. Remove client names, faces, addresses and location metadata. Project images are uploaded to secure profile storage.</p>
              {form.portfolioItems.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{form.portfolioItems.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#394458]"><img src={item.imageData} alt={item.title || 'Provider project'} className="h-48 w-full object-cover" style={{ objectPosition: item.imagePosition || 'center' }}/><div className="space-y-3 p-4"><label className="block space-y-1 text-sm font-medium">Project title<input className={field} maxLength={100} value={item.title} onChange={event => updatePortfolio(item.id, { title: event.target.value })}/></label><label className="block space-y-1 text-sm font-medium">Category<input className={field} maxLength={100} value={item.category} onChange={event => updatePortfolio(item.id, { category: event.target.value })}/></label><label className="block space-y-1 text-sm font-medium">Short caption<textarea className={field} rows={2} maxLength={400} value={item.description} onChange={event => updatePortfolio(item.id, { description: event.target.value })}/></label><label className="block space-y-1 text-sm font-medium">Image framing<select className={field} value={item.imagePosition || 'center'} onChange={event => updatePortfolio(item.id, { imagePosition: event.target.value })}><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></label><label className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300"><input type="checkbox" checked={item.consentToShare} onChange={event => updatePortfolio(item.id, { consentToShare: event.target.checked })} className="mt-0.5 accent-blue-600"/>I own or have permission to share this project photo.</label><div className="flex flex-wrap items-center justify-between gap-2"><label className="cursor-pointer text-sm font-semibold text-primary">Replace photo<input className="sr-only" type="file" accept="image/*" onChange={event => { replacePortfolioImage(item.id, event.target.files?.[0]); event.target.value = ''; }}/></label><button type="button" onClick={() => update('portfolioItems', form.portfolioItems.filter(entry => entry.id !== item.id))} className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700 dark:text-rose-300"><Trash2 size={15}/>Remove</button></div></div></article>)}</div> : <div className="mt-4 rounded-xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">No portfolio photos yet. Add up to six examples of completed work.</div>}
            </section>

            <CredentialEditor credentials={form.credentials} onChange={value => update('credentials', value)} onUpload={uploadCredential} />

            <PayoutSetupPanel services={services} role={role} userId={actor.userId}/>
          </>}

          <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/lucid/" className="text-sm font-semibold text-gray-600 hover:underline dark:text-slate-300">Skip for now</Link><button disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">{saving ? 'Saving…' : isProvider ? 'Save profile' : 'Save and complete setup'}</button></div>
        </form>
      </div>
    </main>
  );
}
