// Backend contract: create the request and private contact/location details atomically through a validated service function.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, MapPin, ShieldCheck } from 'lucide-react';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { CONSTRUCTION_WORK_TYPES, validateLaunchServiceRequest } from '../../data/catalog/launchServices.js';
import { GHANA_LOCATIONS } from '../../contexts/LocationContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { Input } from '../../components/ui';
import { useWorkflowActor, useWorkflowMode, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const INITIAL_FORM = {
  description: '', urgency: 'normal', preferredDate: '', preferredTime: '', alternateDate: '', alternateTime: '',
  region: '', city: '', area: '', streetAddress: '', landmark: '', postalCode: '', accessNotes: '',
  contactName: '', contactPhone: '', contactEmail: '', contactPreference: 'phone',
  constructionWorkTypeId: '', preferVerifiedCredential: false,
  budgetMin: '', budgetMax: '', additionalNotes: '',
};

const STEPS = [
  { id: 'request', label: 'Request details' },
  { id: 'location', label: 'Location and contact' },
  { id: 'review', label: 'Review and submit' },
];

const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';

function ReviewRow({ label, children }) {
  return <div className="grid gap-1 border-b border-gray-100 py-3 last:border-0 dark:border-[#303a4c] sm:grid-cols-[10rem_1fr] sm:gap-4"><dt className="text-sm text-gray-500 dark:text-slate-400">{label}</dt><dd className="whitespace-pre-wrap text-sm font-medium text-gray-900 dark:text-slate-100">{children || 'Not provided'}</dd></div>;
}

function formatSchedule(date, time) {
  if (!date && !time) return 'Flexible';
  return [date, time].filter(Boolean).join(' at ');
}

const ManagedServiceRequest = () => {
  const { category: categorySlug, service: serviceSlug } = useParams();
  const { showNotification } = useNotification();
  const actor = useWorkflowActor();
  const { user } = useWorkflowMode();
  const workflowServices = useWorkflowServices();
  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedCaseId, setSubmittedCaseId] = useState('');
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedSavedLocation, setSelectedSavedLocation] = useState('');

  useEffect(() => {
    let active = true;
    workflowServices.profiles.getForRole({ role: actor.role, userId: actor.userId }).then(result => {
      if (!active || result.error) return;
      const locations = result.data?.serviceLocations || [];
      setSavedLocations(locations);
      setForm(current => ({ ...current, contactName: result.data?.fullName || current.contactName, contactPhone: result.data?.phone || current.contactPhone, contactEmail: user?.email || current.contactEmail }));
      const defaultLocation = locations.find(item => item.isDefault);
      if (defaultLocation) {
        setSelectedSavedLocation(defaultLocation.id);
        setForm(current => ({ ...current, region: defaultLocation.region, city: defaultLocation.city, area: defaultLocation.area || '', streetAddress: defaultLocation.address || '', accessNotes: defaultLocation.accessNotes || '' }));
      }
    }).catch(() => { /* A Client can continue with a manually entered location if their profile is unavailable. */ });
    return () => { active = false; };
  }, [workflowServices, actor.role, actor.userId, user?.email]);

  const selectedService = useMemo(() => {
    const category = ALL_CATEGORIES.find(item => item.slug === categorySlug);
    const service = category?.services.find(item => item.slug === serviceSlug);
    return category && service ? { category, service } : null;
  }, [categorySlug, serviceSlug]);
  const selectedRegion = GHANA_LOCATIONS.find(item => item.region === form.region);
  const selectedConstructionWorkType = CONSTRUCTION_WORK_TYPES.find(item => item.id === form.constructionWorkTypeId);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (['region', 'city', 'area', 'streetAddress', 'accessNotes'].includes(name)) setSelectedSavedLocation('');
    setError('');
  };

  const handleRegionChange = event => {
    setForm(current => ({ ...current, region: event.target.value, area: '' }));
    setSelectedSavedLocation('');
    setError('');
  };

  const validateStep = currentStep => {
    if (currentStep === 0) {
      const serviceCheck = validateLaunchServiceRequest({ serviceId: selectedService?.service.id, constructionWorkTypeId: form.constructionWorkTypeId, preferVerifiedCredential: form.preferVerifiedCredential });
      if (!serviceCheck.valid) return serviceCheck.error || 'Choose a valid service and work type.';
      if (!form.description.trim()) return 'Describe the issue so LUCID can review your request.';
      if (form.description.trim().length < 10) return 'Add a little more detail about the work you need.';
      const hasMinimum = form.budgetMin.trim() !== '';
      const hasMaximum = form.budgetMax.trim() !== '';
      const minimum = Number(form.budgetMin);
      const maximum = Number(form.budgetMax);
      if (hasMinimum !== hasMaximum || (hasMinimum && (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum < 0 || maximum < minimum))) {
        return 'Enter both ends of the optional range, with the maximum at least the minimum, or leave both blank.';
      }
      if (form.preferredDate && form.alternateDate && form.alternateDate < form.preferredDate) return 'Choose an alternate date that is the same day or later.';
    }
    if (currentStep === 1) {
      if (!form.region || !form.city.trim() || !form.area || !form.streetAddress.trim()) return 'Complete the required service location fields.';
      if (!form.contactName.trim() || !form.contactPhone.trim()) return 'Enter a contact name and phone number.';
      if (form.contactPreference === 'email' && !form.contactEmail.trim()) return 'Enter an email address or choose another contact preference.';
    }
    return '';
  };

  const goToNextStep = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(current => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousStep = () => {
    setError('');
    setStep(current => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validateStep(0) || validateStep(1);
    if (validationError) {
      setError(validationError);
      setStep(validateStep(0) ? 0 : 1);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await workflowServices.cases.create({
        serviceId: selectedService.service.id,
        serviceSlug: selectedService.service.slug,
        constructionWorkTypeId: selectedConstructionWorkType?.id || null,
        constructionWorkType: selectedConstructionWorkType?.label || null,
        preferVerifiedCredential: form.preferVerifiedCredential,
        service: selectedService.service.name,
        serviceNameSnapshot: selectedService.service.name,
        category: selectedService.category.name,
        categoryNameSnapshot: selectedService.category.name,
        scope: form.description.trim(),
        description: form.description.trim(),
        urgency: form.urgency,
        preferredDate: form.preferredDate || null,
        preferredTime: form.preferredTime || null,
        alternateDate: form.alternateDate || null,
        alternateTime: form.alternateTime || null,
        region: form.region,
        city: form.city.trim(),
        clientRange: form.budgetMin.trim() && form.budgetMax.trim()
          ? { min: Number(form.budgetMin), max: Number(form.budgetMax), currency: 'GHS', binding: false }
          : null,
        locationSummary: [form.city.trim(), form.region].filter(Boolean).join(', '),
        serviceLocation: { area: form.area, address: form.streetAddress.trim(), landmark: form.landmark.trim(), postalCode: form.postalCode.trim(), accessNotes: form.accessNotes?.trim() || '' },
        requestContact: { name: form.contactName.trim(), phone: form.contactPhone.trim(), email: form.contactEmail.trim(), preference: form.contactPreference },
      }, { role: actor.role, userId: actor.userId });
      if (result.error) throw result.error;
      const caseId = result.data?.id;
      if (!caseId) throw new Error('The request was not saved. Please try again.');
      setSubmittedCaseId(caseId);
      showNotification('Your request has been sent to LUCID.', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      console.error('Service request could not be submitted:', submitError);
      setError(submitError.message || 'We could not submit your request. Your details are still here; please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedService) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-[#0f1117]">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Service not found</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Choose a service from the catalog to start a request.</p>
          <Link className="mt-6 inline-block font-semibold text-primary" to="/lucid/services">arowse services</Link>
        </div>
      </main>
    );
  }

  if (submittedCaseId) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-[#0f1117] sm:py-16">
        <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e] sm:p-10">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Request received</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">LUCID will review your request</h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">Your reference is <span className="font-semibold text-gray-900 dark:text-slate-100">{submittedCaseId.slice(-8).toUpperCase()}</span>.</p>
          </div>
          <div className="mt-7 rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-[#252b3b] dark:text-slate-300">
            <p><strong>What happens next:</strong> LUCID reviews the details and will message you if clarification is needed. No Provider has been assigned. You can cancel without a fee before a Provider accepts an assignment.</p>
            <p className="mt-3">This optional range is only guidance and does not set the Provider's bill. You will see the Provider's final bill after the work is ready, before deciding whether to pay.</p>
          </div>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 dark:border-[#394458] dark:text-slate-100" to="/lucid/cases">View my requests</Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white" to={`/lucid/cases/${submittedCaseId}`}>Open this request</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:py-12">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Request steps" className="mb-7">
          <ol className="grid grid-cols-3 gap-2">
            {STEPS.map((item, index) => {
              const complete = index < step;
              const current = index === step;
              return <li key={item.id} aria-current={current ? 'step' : undefined} className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold sm:px-4 sm:text-sm ${current ? 'border-primary bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100' : complete ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-gray-200 bg-white text-gray-500 dark:border-[#303a4c] dark:bg-[#1a1f2e] dark:text-slate-400'}`}><span className="mr-1.5">{complete ? '✓' : index + 1}</span>{item.label}</li>;
            })}
          </ol>
        </nav>

        <header className="mb-6">
          <Link to={`/lucid/services/${categorySlug}/${serviceSlug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" /> aack to {selectedService.service.name}</Link>
          <p className="mt-5 text-sm font-semibold text-primary">Request through LUCID</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950 dark:text-slate-100">{selectedService.service.name}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{selectedService.category.name}</p>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>LUCID receives your request, reviews it, and coordinates an inspection and Provider assignment. The Provider is not selected when you submit this form.</p>
          </div>
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">{error}</p>}

        {step === 0 && <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
          <div className="mb-5 flex items-center gap-3"><ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" /><div><h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Describe the work</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Share what needs attention and when you are available.</p></div></div>
          <label htmlFor="request-description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">What issue needs attention? <span className="font-normal text-gray-500">Required</span></label>
          <textarea id="request-description" name="description" value={form.description} onChange={handleChange} required rows={5} maxLength={4000} className={`${fieldClass} mt-2`} placeholder="Describe the issue and what you would like LUCID to arrange." />
          <p className="mt-1 text-right text-xs text-gray-500">{form.description.length}/4000</p>
          {selectedService.service.slug === 'construction-worker' && <label htmlFor="construction-work-type" className="mt-5 block text-sm font-medium text-gray-700 dark:text-slate-300">Type of construction work <span className="font-normal text-gray-500">Required</span><select id="construction-work-type" value={form.constructionWorkTypeId} onChange={event => setForm(current => ({ ...current, constructionWorkTypeId: event.target.value }))} required className={`${fieldClass} mt-2`}><option value="">Choose the closest match</option>{CONSTRUCTION_WORK_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select><span className="mt-1 block text-xs font-normal text-gray-500">This helps LUCID route the request to a suitable team.</span></label>}
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-[#394458]"><input type="checkbox" checked={form.preferVerifiedCredential} onChange={event => setForm(current => ({ ...current, preferVerifiedCredential: event.target.checked }))} className="mt-1 accent-blue-600"/><span><span className="font-semibold text-gray-900 dark:text-slate-100">Prefer a Provider with a relevant LUCID-verified credential</span><span className="mt-1 block text-xs font-normal text-gray-600 dark:text-slate-400">Optional preference only. It is not guaranteed and will not delay your request or assignment.</span></span></label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label htmlFor="request-urgency" className="text-sm font-medium text-gray-700 dark:text-slate-300">When do you need help?
              <select id="request-urgency" name="urgency" value={form.urgency} onChange={handleChange} className={`${fieldClass} mt-2`}><option value="normal">Within the next few days</option><option value="urgent">As soon as possible</option></select>
            </label>
            <Input label="Preferred date (optional)" name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} />
            <Input label="Preferred time (optional)" name="preferredTime" type="time" value={form.preferredTime} onChange={handleChange} />
            <Input label="Alternate date (optional)" name="alternateDate" type="date" min={form.preferredDate || undefined} value={form.alternateDate} onChange={handleChange} />
            <Input label="Alternate time (optional)" name="alternateTime" type="time" value={form.alternateTime} onChange={handleChange} />
          </div>
          <div className="mt-7 border-t border-gray-100 pt-6 dark:border-[#303a4c]">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">Optional budget guidance</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-slate-400">A range can help LUCID and the Provider understand your expectations. It is not a quote, price cap, or promise you must pay. You can leave it blank; the Provider submits the final bill after the work is ready.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="From (GHS, optional)" name="budgetMin" type="number" min="0" step="0.01" value={form.budgetMin} onChange={handleChange} /><Input label="To (GHS, optional)" name="budgetMax" type="number" min="0" step="0.01" value={form.budgetMax} onChange={handleChange} /></div>
          </div>
        </section>}

        {step === 1 && <section className="space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
            <div className="mb-5 flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" aria-hidden="true" /><div><h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Service location</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">LUCID uses the service area to plan a suitable inspection.</p></div></div>
            {savedLocations.length > 0 && <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-slate-300">Use a saved location<select className={`${fieldClass} mt-2`} value={selectedSavedLocation} onChange={event => { const id = event.target.value; setSelectedSavedLocation(id); const saved = savedLocations.find(item => item.id === id); if (saved) setForm(current => ({ ...current, region: saved.region, city: saved.city, area: saved.area || '', streetAddress: saved.address || '', accessNotes: saved.accessNotes || '' })); else setForm(current => ({ ...current, region: '', city: '', area: '', streetAddress: '', accessNotes: '' })); }}><option value="">Enter another location</option>{savedLocations.map(item => <option key={item.id} value={item.id}>{item.label} · {item.city}, {item.region}</option>)}</select></label>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="request-region" className="text-sm font-medium text-gray-700 dark:text-slate-300">Region <span className="font-normal text-gray-500">Required</span><select id="request-region" name="region" value={form.region} onChange={handleRegionChange} required className={`${fieldClass} mt-2`}><option value="">Choose a region</option>{GHANA_LOCATIONS.map(item => <option key={item.region} value={item.region}>{item.region}</option>)}</select></label>
              <label htmlFor="request-city" className="text-sm font-medium text-gray-700 dark:text-slate-300">City or town <span className="font-normal text-gray-500">Required</span><input id="request-city" name="city" value={form.city} onChange={handleChange} required className={`${fieldClass} mt-2`} /></label>
              <label htmlFor="request-area" className="text-sm font-medium text-gray-700 dark:text-slate-300">Area or neighbourhood <span className="font-normal text-gray-500">Required</span><select id="request-area" name="area" value={form.area} onChange={handleChange} required disabled={!selectedRegion} className={`${fieldClass} mt-2 disabled:opacity-60`}><option value="">Choose an area</option>{(selectedRegion?.areas || []).map(area => <option key={area} value={area}>{area}</option>)}</select></label>
              <Input label="Street address" name="streetAddress" value={form.streetAddress} onChange={handleChange} required />
              <Input label="Nearby landmark (optional)" name="landmark" value={form.landmark} onChange={handleChange} />
              <Input label="Postal code (optional)" name="postalCode" value={form.postalCode} onChange={handleChange} />
              <label htmlFor="request-access-notes" className="text-sm font-medium text-gray-700 dark:text-slate-300 sm:col-span-2">Access notes (optional)<textarea id="request-access-notes" name="accessNotes" value={form.accessNotes} onChange={handleChange} maxLength={500} rows={2} className={`${fieldClass} mt-2`} placeholder="Entry instructions or the best time to visit"/></label>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-slate-400">Your exact location is for LUCID’s request review and inspection coordination. Providers receive only the location details needed after an offer is accepted.</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Contact preference</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">LUCID may contact you to clarify the request or coordinate an inspection.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Contact name" name="contactName" value={form.contactName} onChange={handleChange} required />
              <Input label="Contact phone" name="contactPhone" type="tel" value={form.contactPhone} onChange={handleChange} required />
              <Input label="Contact email (optional)" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} required={form.contactPreference === 'email'} />
              <label htmlFor="contact-preference" className="text-sm font-medium text-gray-700 dark:text-slate-300">Preferred way to reach you<select id="contact-preference" name="contactPreference" value={form.contactPreference} onChange={handleChange} className={`${fieldClass} mt-2`}><option value="phone">Phone call</option><option value="text">Text message</option><option value="email">Email</option></select></label>
            </div>
            <label htmlFor="request-notes" className="mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">Access notes for LUCID (optional)<textarea id="request-notes" name="additionalNotes" value={form.additionalNotes} onChange={handleChange} rows={3} maxLength={2000} className={`${fieldClass} mt-2`} placeholder="For example, the best entrance or when someone is available." /></label>
            <p className="mt-2 text-right text-xs text-gray-500">{form.additionalNotes.length}/2000</p>
          </div>
        </section>}

        {step === 2 && <section className="space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Review your request</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Check the details before sending them to LUCID.</p>
            <dl className="mt-5 divide-y divide-gray-100 dark:divide-[#303a4c]">
              <ReviewRow label="Service">{selectedService.service.name} · {selectedService.category.name}</ReviewRow>
              <ReviewRow label="What needs attention">{form.description.trim()}</ReviewRow>
              <ReviewRow label="Urgency">{form.urgency === 'urgent' ? 'As soon as possible' : 'Within the next few days'}</ReviewRow>
              <ReviewRow label="Availability">Preferred: {formatSchedule(form.preferredDate, form.preferredTime)}{form.alternateDate || form.alternateTime ? ` · Alternate: ${formatSchedule(form.alternateDate, form.alternateTime)}` : ''}</ReviewRow>
              <ReviewRow label="Optional budget guidance">{form.budgetMin && form.budgetMax ? `GHS ${Number(form.budgetMin).toFixed(2)} – GHS ${Number(form.budgetMax).toFixed(2)} (non-binding)` : 'Not provided'}</ReviewRow>
              <ReviewRow label="Service location">{[form.streetAddress, form.area, form.city, form.region, form.landmark].filter(Boolean).join(', ')}</ReviewRow>
              <ReviewRow label="Contact">{[form.contactName, form.contactPhone, form.contactEmail, `Preferred: ${form.contactPreference}`].filter(Boolean).join(' · ')}</ReviewRow>
              <ReviewRow label="Access notes">{form.additionalNotes.trim()}</ReviewRow>
            </dl>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
            <strong>Before you send:</strong> this request goes to LUCID for review. No Provider is assigned now. You can cancel without a fee before a Provider is assigned. Any budget guidance is optional and non-binding. After accepting an assignment, the Provider can start the agreed work without a quote. Added work and its cost must be approved by you before it begins. The Provider sends the final bill after the work is ready.
          </div>
        </section>}

        <form onSubmit={event => { event.preventDefault(); if (step < 2) goToNextStep(); else handleSubmit(event); }} className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          {step === 0 ? <Link to={`/lucid/services/${categorySlug}/${serviceSlug}`} className="inline-flex min-h-11 items-center justify-center font-semibold text-primary hover:underline">aack to service</Link> : <button type="button" onClick={goToPreviousStep} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#1a1f2e]"><ArrowLeft size={17} aria-hidden="true" /> aack</button>}
          {step < 2 ? <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Continue <ArrowRight size={18} aria-hidden="true" /></button> : <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{loading ? 'Sending request…' : 'Send request to LUCID'} {!loading && <ArrowRight size={18} aria-hidden="true" />}</button>}
        </form>
      </div>
    </main>
  );
};

export default ManagedServiceRequest;
