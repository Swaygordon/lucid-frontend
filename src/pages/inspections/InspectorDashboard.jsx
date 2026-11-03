// @backend-handoff-delete Local Preview assignment queues and field-work guidance.
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarCheck2, CalendarClock, CheckCircle2, ClipboardCheck, Clock3, MapPin, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowActor, useWorkflowMode, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const ASSESSMENT_STATUSES = ['inspector_assigned', 'inspection_scheduled'];
const REVIEW_STATUSES = ['inspection_reported'];
const COORDINATION_STATUSES = ['scope_confirmed', 'offer_sent', 'provider_declined', 'accepted', 'work_in_progress', 'price_change_pending'];
const PAYMENT_STATUSES = ['awaiting_client_approval', 'awaiting_payment', 'payment_failed', 'payment_delayed', 'paid'];
const CLOSED_STATUSES = ['completed', 'cancelled', 'not_feasible', 'resolved'];
const messageHref = (audience, caseId) => `/lucid/messages?conversation=${encodeURIComponent(`${audience}:${caseId}`)}&returnTo=${encodeURIComponent(`/lucid/cases/${caseId}`)}`;
const formatTime = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
const statusLabel = status => String(status || '').replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());

const nextStep = record => {
  if (record.status === 'inspector_assigned') return 'Set a visit time and complete the site assessment.';
  if (record.status === 'inspection_scheduled') return `Complete the visit${record.inspectionVisit?.scheduledAt ? ` scheduled for ${formatTime(record.inspectionVisit.scheduledAt)}` : ''}.`;
  if (record.status === 'inspection_reported') return 'LUCID is reviewing your report and confirming the scope.';
  if (record.status === 'scope_confirmed') return 'LUCID is selecting a Provider for the approved scope.';
  if (record.status === 'offer_sent') return 'Waiting for the Provider to accept or decline.';
  if (record.status === 'provider_declined') return 'LUCID is finding another suitable Provider.';
  if (record.status === 'accepted') return 'Coordinate the Provider and Client schedule.';
  if (record.status === 'work_in_progress') return 'Coordinate progress and report any safety or scope issue.';
  if (record.status === 'price_change_pending') return 'Work is paused while the Client reviews the price change.';
  if (['awaiting_client_approval', 'awaiting_payment'].includes(record.status)) return 'The Client is reviewing or paying the Provider’s bill.';
  if (['payment_failed', 'payment_delayed'].includes(record.status)) return 'Payment needs follow-up with LUCID before completion.';
  if (record.status === 'paid') return 'Record the satisfactory completion and close the service.';
  return 'No further Inspector action is needed.';
};

const PreviewInspectorWorkspace = ({ cases, inspectors, selectedInspectorId, onInspectorChange, loading, error }) => {
  const assessment = useMemo(() => cases.filter(item => ASSESSMENT_STATUSES.includes(item.status)), [cases]);
  const scheduled = useMemo(() => cases.filter(item => item.status === 'inspection_scheduled'), [cases]);
  const reports = useMemo(() => cases.filter(item => REVIEW_STATUSES.includes(item.status)), [cases]);
  const coordination = useMemo(() => cases.filter(item => COORDINATION_STATUSES.includes(item.status)), [cases]);
  const payment = useMemo(() => cases.filter(item => PAYMENT_STATUSES.includes(item.status)), [cases]);
  const recent = useMemo(() => cases.filter(item => CLOSED_STATUSES.includes(item.status)).slice(0, 5), [cases]);

  return (
    <main className="min-h-[75vh] bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-lg sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">LUCID field team · Preview</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Inspector workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">Review assigned requests, plan site visits, submit assessments, and coordinate active work.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/lucid/messages" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Messages</Link>
            <Link to="/lucid/inspector/profile" className="inline-flex min-h-10 items-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">My profile</Link>
            <Link to="/lucid/inspector/finance" className="inline-flex min-h-10 items-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Financial history</Link>
          </div>
        </header>

        <label className="flex max-w-xl flex-col gap-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
          Preview Inspector account
          <select value={selectedInspectorId} onChange={event => onInspectorChange(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-900 shadow-sm outline-none focus:border-primary dark:border-[#303a4c] dark:bg-[#1a1f2e] dark:text-slate-100">
            {inspectors.map(inspector => <option key={inspector.id} value={inspector.id}>{inspector.displayName} · {inspector.homeCity}, {inspector.region}</option>)}
          </select>
          <span className="font-normal text-gray-500 dark:text-slate-400">Switching this sample account refreshes the list to that Inspector’s assignments only.</span>
        </label>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}
        <section aria-label="Inspector work summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <PreviewStat label="Assessment due" value={assessment.length} icon={ClipboardCheck} tone="amber" />
          <PreviewStat label="Scheduled visits" value={scheduled.length} icon={CalendarClock} />
          <PreviewStat label="Reports with LUCID" value={reports.length} icon={CheckCircle2} tone="green" />
          <PreviewStat label="Work coordination" value={coordination.length} icon={CalendarCheck2} />
          <PreviewStat label="Payment / completion" value={payment.length} icon={Clock3} tone="violet" />
        </section>

        <InspectorCaseSection title="Assessments and site visits" description="Set or update a visit time, review the Client request, and submit findings and feasibility." items={assessment} empty="No assessments are waiting for you." actionLabel="Review and assess" icon={MapPin} loading={loading} />
        <InspectorCaseSection title="Reports awaiting LUCID review" description="Submitted findings remain separate from the Admin-confirmed scope." items={reports} empty="No reports are waiting for review." actionLabel="Review submitted report" icon={ClipboardCheck} loading={loading} />
        <InspectorCaseSection title="Coordination and payment follow-up" description="Open a case to message the assigned people and track work, payment, or completion status." items={[...coordination, ...payment]} empty="No active coordination or payment follow-up." actionLabel="Open shared case" icon={MessageSquareText} loading={loading} />
        <InspectorCaseSection title="Recent history" description="Recently closed or completed cases assigned to this Inspector." items={recent} empty="Completed and closed cases will appear here." actionLabel="Open case history" icon={CheckCircle2} loading={loading} />

        <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100"><strong>Preview data.</strong> Assignment changes, schedules, assessments, and notices are stored in this browser. Inspection evidence saves file details only; no file content is uploaded.</p>
      </div>
    </main>
  );
};

const InspectorCaseSection = ({ title, description, items, empty, actionLabel, icon: Icon, loading }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
    <div className="mb-4 flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-xl font-semibold text-gray-950 dark:text-slate-100">{title}</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{description}</p></div></div>
    {loading ? <p role="status" className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">Loading assigned cases…</p> : items.length === 0 ? <div className="rounded-xl bg-gray-50 p-6 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">{empty}</div> : <div className="space-y-3">{items.map(item => <InspectorCaseCard key={`${title}-${item.id}`} record={item} actionLabel={actionLabel} />)}</div>}
  </section>
);

const InspectorCaseCard = ({ record, actionLabel }) => (
  <article className="rounded-xl border border-gray-100 p-4 dark:border-[#303a4c] sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-950 dark:text-slate-100">{record.service || record.service_name}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">{statusLabel(record.status)}</span>{record.urgency === 'urgent' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />Urgent</span>}</div>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{record.id} · {record.category} · {record.locationSummary || 'Location details in case'}</p>
        {record.inspectionVisit?.scheduledAt && <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 dark:text-blue-200"><CalendarClock className="h-4 w-4" aria-hidden="true" />Visit: {formatTime(record.inspectionVisit.scheduledAt)}</p>}
        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">{nextStep(record)}</p>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-400">{record.scope || record.description || 'Review the request and coordinate next steps with LUCID.'}</p>
      </div>
      <Link to={`/lucid/cases/${record.id}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">{actionLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-3 dark:border-[#303a4c]">
      <Link to={messageHref('client-inspector', record.id)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message Client</Link>
      <Link to={messageHref('inspector-admin', record.id)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message LUCID</Link>
      {record.assignedProviderId && <Link to={messageHref('provider-inspector', record.id)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message assigned Provider</Link>}
    </div>
  </article>
);

const PreviewStat = ({ label, value, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
  };
  return <article className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e]"><div><p className="text-sm text-gray-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">{value}</p></div><span className={`rounded-xl p-3 ${tones[tone]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span></article>;
};

const InspectorDashboard = () => {
  const actor = useWorkflowActor();
  const { previewInspectorId, setPreviewInspectorId } = useWorkflowMode();
  const services = useWorkflowServices();
  const [cases, setCases] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      services.cases.listForRole({ role: actor.role, userId: actor.userId }),
      services.assignments.listInspectorPrincipals({ role: actor.role, userId: actor.userId }),
    ]).then(([caseResult, inspectorResult]) => {
      if (!active) return;
      const failure = caseResult.error || inspectorResult.error;
      setError(failure?.message || '');
      setCases(caseResult.data || []);
      setInspectors(inspectorResult.data || []);
      setLoading(false);
    }).catch(cause => {
      if (!active) return;
      setError(cause.message || 'Assigned cases could not be loaded.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  return <PreviewInspectorWorkspace cases={cases} inspectors={inspectors} selectedInspectorId={previewInspectorId} onInspectorChange={setPreviewInspectorId} loading={loading} error={error} />;
};

export default InspectorDashboard;
