import React, { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, MapPin, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { GHANA_LOCATIONS } from '../../contexts/LocationContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { Button, Input } from '../../components/ui';
import { createManagedServiceCase } from '../../services/cases/managedCaseService.js';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const INITIAL_FORM = {
  description: '',
  urgency: 'normal',
  preferredDate: '',
  preferredTime: '',
  alternateDate: '',
  alternateTime: '',
  region: '',
  city: '',
  area: '',
  streetAddress: '',
  landmark: '',
  postalCode: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  budgetMin: '',
  budgetMax: '',
  additionalNotes: '',
};

const ManagedServiceRequest = () => {
  const { category: categorySlug, service: serviceSlug } = useParams();
  const { showNotification } = useNotification();
  const actor = useWorkflowActor();
  const workflowServices = useWorkflowServices();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState('');

  const selectedService = useMemo(() => {
    const category = ALL_CATEGORIES.find(item => item.slug === categorySlug);
    const service = category?.services.find(item => item.slug === serviceSlug);
    return category && service ? { category, service } : null;
  }, [categorySlug, serviceSlug]);

  const selectedRegion = GHANA_LOCATIONS.find(item => item.region === form.region);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleRegionChange = event => {
    const region = event.target.value;
    setForm(current => ({ ...current, region, area: '' }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const minimum = Number(form.budgetMin);
    const maximum = Number(form.budgetMax);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum < 0 || maximum < minimum) {
      showNotification('Enter a valid range. The maximum must be at least the minimum.', 'error');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (actor.mode === 'preview') {
        result = await workflowServices.cases.create({
          service: selectedService.service.name,
          category: selectedService.category.name,
          scope: form.description.trim(),
          description: form.description.trim(),
          clientRange: { min: minimum, max: maximum, currency: 'GHS' },
          locationSummary: [form.area, form.city.trim(), form.region].filter(Boolean).join(', '),
        }, { role: actor.role, userId: actor.userId });
        if (result.error) throw result.error;
      } else {
        result = await createManagedServiceCase(
          {
            service_slug: serviceSlug,
            service_name: selectedService.service.name,
            description: form.description.trim(),
            urgency: form.urgency,
            preferred_date: form.preferredDate || null,
            preferred_time: form.preferredTime || null,
            alternate_date: form.alternateDate || null,
            alternate_time: form.alternateTime || null,
            budget_min: minimum,
            budget_max: maximum,
            currency: 'GHS',
          },
          {
            region: form.region,
            city: form.city.trim() || null,
            street_address: form.streetAddress.trim(),
            area: form.area,
            landmark: form.landmark.trim() || null,
            postal_code: form.postalCode.trim() || null,
            contact_name: form.contactName.trim(),
            contact_phone: form.contactPhone.trim(),
            contact_email: form.contactEmail.trim() || null,
            additional_notes: form.additionalNotes.trim() || null,
          },
        );
      }

      setSubmittedCaseId(result.id || result.data?.id);
      showNotification('Your request has been sent to LUCID.', 'success');
    } catch (error) {
      console.error('Managed service request could not be submitted:', error);
      showNotification(error.message || 'We could not submit your request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedService) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-[#0f1117] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Service not found</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Choose a service from the catalog to start a request.</p>
          <Link className="mt-6 inline-block font-semibold text-primary" to="/lucid/services">Browse services</Link>
        </div>
      </main>
    );
  }

  if (submittedCaseId) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16 dark:bg-[#0f1117]">
        <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e] sm:p-10">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-slate-100">LUCID received your request</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            Your case reference is <span className="font-semibold text-gray-900 dark:text-slate-100">{submittedCaseId.slice(0, 8).toUpperCase()}</span>.
            LUCID will review the information and contact you if anything is missing.
          </p>
          <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
            No provider has been assigned yet. Your range is a budget expectation; you will review the final itemized amount before paying.
          </p>
          <Link className="mt-7 inline-flex font-semibold text-primary hover:underline" to="/lucid/cases">
            View my requests
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-[#0f1117] sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Request through LUCID</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{selectedService.service.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">{selectedService.category.name}</p>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>LUCID coordinates the request, inspection, provider assignment, final bill, and payment. Your contact and exact location details are submitted privately to LUCID.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Describe the work</h2>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
              What issue needs attention?
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                maxLength={4000}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100 dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200 dark:focus:ring-blue-900/40"
                placeholder="Describe the issue and what you would like LUCID to arrange."
              />
            </label>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                Urgency
                <select name="urgency" value={form.urgency} onChange={handleChange} className="rounded-xl border-2 border-gray-300 bg-white px-4 py-3 dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <Input label="Preferred date" name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} />
              <Input label="Preferred time" name="preferredTime" type="time" value={form.preferredTime} onChange={handleChange} />
              <Input label="Alternate date (optional)" name="alternateDate" type="date" value={form.alternateDate} onChange={handleChange} />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Where and how can LUCID reach you?</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                Region
                <select name="region" value={form.region} onChange={handleRegionChange} required className="rounded-xl border-2 border-gray-300 bg-white px-4 py-3 dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200">
                  <option value="">Choose a region</option>
                  {GHANA_LOCATIONS.map(item => <option key={item.region} value={item.region}>{item.region}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                Area / neighbourhood
                <select name="area" value={form.area} onChange={handleChange} required disabled={!selectedRegion} className="rounded-xl border-2 border-gray-300 bg-white px-4 py-3 disabled:opacity-60 dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200">
                  <option value="">Choose an area</option>
                  {(selectedRegion?.areas || []).map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
              <Input label="City / town" name="city" value={form.city} onChange={handleChange} />
              <Input label="Street address" name="streetAddress" value={form.streetAddress} onChange={handleChange} required />
              <Input label="Landmark (optional)" name="landmark" value={form.landmark} onChange={handleChange} />
              <Input label="Postal code (optional)" name="postalCode" value={form.postalCode} onChange={handleChange} />
              <Input label="Contact name" name="contactName" value={form.contactName} onChange={handleChange} required />
              <Input label="Contact phone" name="contactPhone" type="tel" value={form.contactPhone} onChange={handleChange} required />
              <Input label="Contact email (optional)" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} />
            </div>
            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
              Additional notes (optional)
              <textarea name="additionalNotes" value={form.additionalNotes} onChange={handleChange} rows={3} maxLength={2000} className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-primary dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200" />
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Your expected price range</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">This helps LUCID find a suitable provider. It is not a fixed quote. After the work, the provider submits their bill and the app shows the bill, LUCID’s percentage charge, and your total before you approve and pay.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Minimum (GHS)" name="budgetMin" type="number" min="0" step="0.01" value={form.budgetMin} onChange={handleChange} required />
              <Input label="Maximum (GHS)" name="budgetMax" type="number" min="0" step="0.01" value={form.budgetMax} onChange={handleChange} required />
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <Link to={`/lucid/services/${categorySlug}/${serviceSlug}`} className="text-center font-semibold text-primary hover:underline sm:text-left">Back to service</Link>
            <Button type="submit" loading={loading} disabled={loading} className="sm:min-w-52">Send request to LUCID</Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ManagedServiceRequest;
