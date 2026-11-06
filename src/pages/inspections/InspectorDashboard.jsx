import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarCheck2, CalendarClock, CheckCircle2, ClipboardCheck, Clock3, MapPin, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const ASSESSMENT_STATUSES = ['inspector_assigned', 'inspection_scheduled'];
const REVIEW_STATUSES = ['inspection_reported'];
const COORDINATION_STATUSES = ['scope_confirmed', 'offer_sent', 'provider_declined', 'accepted', 'work_in_progress', 'price_change_pending'];
const PAYMENT_STATUSES = ['awaiting_client_approval', 'awaiting_payment', 'payment_failed', 'payment_delayed', 'paid'];
const CLOSED_STATUSES = ['completed', 'cancelled', 'not_feasible', 'resolved'];
const messageHref = (audience, caseId) => `/lucid/messages?conversation=${encodeURIComponent(`${audience}:${caseId}`)}&returnTo=${encodeURIComponent(`/lucid/cases/${caseId}`)}`;
const formatTime = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
const statusLabel = status => String(status || '').replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());
const caseCreatedAt = record => {
  const value = record.createdAt || record.created_at || record.history?.[0]?.at || 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

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

const InspectorWorkspace = ({ cases, loading, error }) => {
  const newestCases = useMemo(() => [...cases].sort((a, b) => caseCreatedAt(b) - caseCreatedAt(a)), [cases]);
  const assessment = useMemo(() => newestCases.filter(item => ASSESSMENT_STATUSES.includes(item.status)), [newestCases]);
  const scheduled = useMemo(() => newestCases.filter(item => item.status === 'inspection_scheduled'), [newestCases]);
  const reports = useMemo(() => newestCases.filter(item => REVIEW_STATUSES.includes(item.status)), [newestCases]);
  const coordination = useMemo(() => newestCases.filter(item => COORDINATION_STATUSES.includes(item.status)), [newestCases]);
  const payment = useMemo(() => newestCases.filter(item => PAYMENT_STATUSES.includes(item.status)), [newestCases]);
  const recent = useMemo(() => newestCases.filter(item => CLOSED_STATUSES.includes(item.status)), [newestCases]);

  return (
    <main className="min-h-[75vh] bg-gray-50 px-4 py-5 dark:bg-[#0f1117] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-4 text-white shadow-lg sm:flex-row sm:items-end sm:justify-between sm:rounded-3xl sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">LUCID field team</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-4xl">Inspector workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">Review assigned requests, plan site visits, submit assessments, and coordinate active work.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link to="/lucid/messages" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 sm:px-4"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Messages</Link>
            <Link to="/lucid/inspector/profile" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:px-4">My profile</Link>
            <Link to="/lucid/inspector/finance" className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:col-span-1">Financial history</Link>
          </div>
        </header>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}
        <section aria-label="Inspector work summary" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <Stat label="Assessment due" value={assessment.length} icon={ClipboardCheck} tone="amber" />
          <Stat label="Scheduled visits" value={scheduled.length} icon={CalendarClock} />
          <Stat label="Reports with LUCID" value={reports.length} icon={CheckCircle2} tone="green" />
          <Stat label="Work coordination" value={coordination.length} icon={CalendarCheck2} />
          <Stat label="Payment / completion" value={payment.length} icon={Clock3} tone="violet" className="col-span-2 xl:col-span-1" />
        </section>

        <InspectorCaseSection title="Assessments and site visits" description="Set or update a visit time, review the Client request, and submit findings and feasibility." items={assessment} empty="No assessments are waiting for you." actionLabel="Review and assess" icon={MapPin} loading={loading} />
        <InspectorCaseSection title="Reports awaiting LUCID review" description="Submitted findings remain separate from the Admin-confirmed scope." items={reports} empty="No reports are waiting for review." actionLabel="Review submitted report" icon={ClipboardCheck} loading={loading} />
        <InspectorCaseSection title="Coordination and payment follow-up" description="Open a case to message the assigned people and track work, payment, or completion status." items={[...coordination, ...payment]} empty="No active coordination or payment follow-up." actionLabel="Open shared case" icon={MessageSquareText} loading={loading} />
        <InspectorCaseSection title="Recent history" description="Recently closed or completed cases assigned to this Inspector." items={recent} empty="Completed and closed cases will appear here." actionLabel="Open case history" icon={CheckCircle2} loading={loading} />

      </div>
    </main>
  );
};

const InspectorCaseSection = ({ title, description, items, empty, actionLabel, icon: Icon, loading }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, 3);
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
      <div className="mb-4 flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-xl font-semibold text-gray-950 dark:text-slate-100">{title}</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{description}</p></div></div>
      {loading ? <p role="status" className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">Loading assigned cases…</p> : items.length === 0 ? <div className="rounded-xl bg-gray-50 p-6 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">{empty}</div> : <div className="space-y-3">{visibleItems.map(item => <InspectorCaseCard key={`${title}-${item.id}`} record={item} actionLabel={actionLabel} />)}</div>}
      {!loading && items.length > 3 && <button type="button" onClick={() => setShowAll(value => !value)} className="mt-4 min-h-10 text-sm font-semibold text-primary hover:underline">{showAll ? 'Show fewer' : `View all ${items.length}`} {showAll ? '' : '→'}</button>}
    </section>
  );
};

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

const Stat = ({ label, value, icon: Icon, tone = 'blue', className = '' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
  };
  return <article className={`flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-4 ${className}`}><div className="min-w-0"><p className="text-xs leading-4 text-gray-500 dark:text-slate-400 sm:text-sm">{label}</p><p className="mt-1 text-2xl font-bold text-gray-950 dark:text-slate-100 sm:mt-2 sm:text-3xl">{value}</p></div><span className={`shrink-0 rounded-lg p-2 sm:rounded-xl sm:p-3 ${tones[tone]}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /></span></article>;
};

const InspectorDashboard = () => {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    services.cases.listForRole({ role: actor.role, userId: actor.userId }).then(caseResult => {
      if (!active) return;
      setError(caseResult.error?.message || '');
      setCases(caseResult.data || []);
      setLoading(false);
    }).catch(cause => {
      if (!active) return;
      setError(cause.message || 'Assigned cases could not be loaded.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  return <InspectorWorkspace cases={cases} loading={loading} error={error} />;
};

export default InspectorDashboard;
