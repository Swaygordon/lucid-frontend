// @backend-handoff-delete Provider assignment dashboard uses local workflow sample data.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, BriefcaseBusiness, CalendarClock, CircleDollarSign, ClipboardCheck, Clock3, MessageSquareText, ReceiptText, UserRound } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const formatMoney = (amount, currency = 'GHS') => `${currency} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatStatus = status => String(status || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const dateTime = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

const stateLabel = record => ({
  offer_sent: 'Offer awaiting your response', accepted: 'Accepted · plan work', work_in_progress: 'Work in progress',
  work_estimate_pending: 'Estimate sent · Client review', estimate_revision_requested: 'Client asked for an estimate change',
  price_change_pending: 'Work paused · price approval', awaiting_client_approval: 'Bill sent · Client review',
  awaiting_payment: 'Payment in progress', payment_delayed: 'Payment follow-up', payment_failed: 'Payment failed · follow-up',
  paid: 'Paid · completion pending', completed: 'Completed', disputed: 'LUCID reviewing a concern', refund_pending: 'LUCID reviewing refund',
}[record.status] || formatStatus(record.status));

const Card = ({ record, group }) => {
  const action = record.status === 'offer_sent' ? 'Review scope and accept or decline with a reason.'
    : record.status === 'accepted' ? record.approvedWorkEstimate ? 'Start the work after the approved schedule.' : 'Share the work and estimate. Wait for Client approval before starting.'
      : record.status === 'work_estimate_pending' ? 'Wait for the Client to approve or request a change to your estimate.'
        : record.status === 'estimate_revision_requested' ? 'Review the Client’s note and send a revised estimate.'
      : record.status === 'work_in_progress' ? 'Track progress, request approval for changes, or submit your final bill.'
        : record.status === 'price_change_pending' ? 'Work is paused until the Client responds to the requested change.'
          : record.status === 'awaiting_client_approval' ? 'Your submitted bill is with the Client for review.'
            : ['payment_delayed', 'payment_failed'].includes(record.status) ? 'Contact LUCID about the payment status; payout is not released yet.'
              : record.status === 'paid' ? 'Payment is confirmed. Coordinate completion with the Inspector.'
                : record.status === 'completed' ? 'View the final case record and receipt.' : 'Open the shared case record for details.';
  const bill = record.providerBill;
  return <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-gray-950 dark:text-slate-100">{record.service || 'Managed service request'}</h3><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">{stateLabel(record)}</span></div>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{record.id} · {record.category || 'Service request'}</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">{record.confirmedScope || record.scope || 'Review the approved service details in this assignment.'}</p>
        <div className="mt-4 grid gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-slate-400 sm:grid-cols-2">
          <p><span className="font-medium text-gray-800 dark:text-slate-200">Service area:</span> {record.locationSummary || 'Shared after assignment'}</p>
          {record.preferredDate && <p><span className="font-medium text-gray-800 dark:text-slate-200">Client work window:</span> {[record.preferredDate, record.preferredTime].filter(Boolean).join(' · ')}</p>}
          {record.providerVisit?.scheduledAt && <p><span className="font-medium text-gray-800 dark:text-slate-200">Your schedule:</span> {dateTime(record.providerVisit.scheduledAt)}</p>}
          {record.inspectorAssignment?.inspectorName && <p><span className="font-medium text-gray-800 dark:text-slate-200">Inspector:</span> {record.inspectorAssignment.inspectorName}</p>}
          {record.clientRange && <p><span className="font-medium text-gray-800 dark:text-slate-200">Optional Client budget guidance:</span> {formatMoney(record.clientRange.min, record.clientRange.currency)} – {formatMoney(record.clientRange.max, record.clientRange.currency)} <span className="text-xs">(non-binding)</span></p>}
          {record.approvedWorkEstimate && <p><span className="font-medium text-gray-800 dark:text-slate-200">Approved work estimate:</span> {formatMoney(record.approvedWorkEstimate.amount, record.clientRange?.currency)}</p>}
          {bill && <p><span className="font-medium text-gray-800 dark:text-slate-200">Your submitted work amount:</span> {formatMoney(bill.providerAmount, record.clientRange?.currency)}</p>}
          {record.providerPayoutStatus === 'released' && <p><span className="font-medium text-gray-800 dark:text-slate-200">Payout status:</span> Released in sample ledger · {formatMoney(record.providerPayoutAmount, record.clientRange?.currency)}</p>}
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">{action}</p>
      </div>
      <Link to={`/lucid/provider/work/${record.id}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">{record.status === 'offer_sent' ? 'Review offer' : group === 'history' ? 'View case' : 'Open work'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div>
    {record.status === 'offer_sent' && record.inspection && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm dark:border-blue-900/40 dark:bg-blue-950/20"><p className="font-semibold text-blue-950 dark:text-blue-100">Inspector assessment · {formatStatus(record.inspection.feasibility)}</p><p className="mt-1 text-blue-900 dark:text-blue-200">{record.inspection.findings}</p>{record.inspection.safetyStatus !== 'no_known_concern' && <p className="mt-2 text-amber-900 dark:text-amber-200">Safety: {formatStatus(record.inspection.safetyStatus)}{record.inspection.safetyNotes ? ` · ${record.inspection.safetyNotes}` : ''}</p>}</div>}
    {record.status === 'offer_sent' && <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">Client name, profile, phone, email, and direct messages are private. Use the LUCID case thread for questions about this offer.</p>}
  </article>;
};

const Section = ({ title, description, icon: Icon, records, group, empty }) => {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? records : filter === 'needs_action'
    ? records.filter(record => ['offer_sent', 'estimate_revision_requested', 'price_change_pending', 'awaiting_client_approval', 'payment_failed', 'payment_delayed', 'disputed', 'refund_pending'].includes(record.status))
    : records.filter(record => ['work_estimate_pending', 'awaiting_payment', 'paid'].includes(record.status));
  const visible = showAll ? filtered : filtered.slice(0, 3);
  return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="rounded-xl bg-gray-100 p-2.5 text-gray-700 dark:bg-[#252b3b] dark:text-slate-300"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">{title} <span className="ml-1 text-sm font-medium text-gray-500 dark:text-slate-400">{records.length}</span></h2><p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p></div></div>{records.length > 3 && <div className="flex items-center gap-3"><label className="sr-only" htmlFor={`provider-filter-${group}`}>Filter {title}</label><select id={`provider-filter-${group}`} value={filter} onChange={event => { setFilter(event.target.value); setShowAll(true); }} className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-[#394458] dark:bg-[#252b3b]"><option value="all">All</option><option value="needs_action">Needs action</option><option value="waiting">Waiting</option></select></div>}</div>
    {visible.length ? <div className="space-y-3">{visible.map(record => <Card key={record.id} record={record} group={group} />)}</div> : <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">{filter === 'all' ? empty : 'No cases match this filter.'}</p>}
    {filtered.length > 3 && <button type="button" onClick={() => setShowAll(value => !value)} className="mt-4 min-h-10 text-sm font-semibold text-primary hover:underline">{showAll ? 'Show fewer' : `View all ${filtered.length}`} {showAll ? '' : '→'}</button>}
  </section>;
};

const ProviderWorkPage = () => {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const [cases, setCases] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    Promise.all([
      services.cases.listForRole({ role: actor.role, userId: actor.userId }),
      services.notifications.listForRole({ role: actor.role, userId: actor.userId }),
    ]).then(([caseResult, noticeResult]) => {
      if (!active) return;
      if (caseResult.error) setLoadState('error');
      else { setCases(caseResult.data || []); setLoadState('ready'); }
      if (!noticeResult.error) setUnread((noticeResult.data || []).filter(item => !item.read).length);
    }).catch(() => { if (active) setLoadState('error'); });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  const groups = useMemo(() => ({
    offers: cases.filter(record => record.status === 'offer_sent'),
    active: cases.filter(record => ['accepted', 'work_estimate_pending', 'estimate_revision_requested', 'work_in_progress', 'price_change_pending', 'paid'].includes(record.status)),
    action: cases.filter(record => ['awaiting_client_approval', 'awaiting_payment', 'payment_delayed', 'payment_failed', 'disputed', 'refund_pending'].includes(record.status)),
    payouts: cases.filter(record => record.providerBill && record.status !== 'completed'),
    history: cases.filter(record => ['completed', 'cancelled', 'cancelled_fee_due', 'provider_declined', 'not_feasible'].includes(record.status)),
  }), [cases]);
  const released = cases.filter(record => record.providerPayoutStatus === 'released').reduce((sum, record) => sum + Number(record.providerPayoutAmount || 0), 0);

  return <main className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
    <header className="border-b border-gray-100 bg-white dark:border-[#1e293b] dark:bg-[#1a1f2e]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Provider workspace {actor.mode === 'preview' && '· Preview'}</p><h1 className="mt-1 text-xl font-bold text-gray-950 dark:text-slate-100">Your work</h1></div><div className="flex items-center gap-2"><Link to="/lucid/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative rounded-lg bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 dark:bg-[#252b3b] dark:text-slate-200"><Bell className="h-5 w-5" aria-hidden="true" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-xs font-bold text-white dark:border-[#1a1f2e]">{unread > 99 ? '99+' : unread}</span>}</Link><Link to="/lucid/account/profile" aria-label="Provider profile" className="rounded-lg bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 dark:bg-[#252b3b] dark:text-slate-200"><UserRound className="h-5 w-5" aria-hidden="true" /></Link></div></div></header>
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      {actor.mode === 'preview' && <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100"><strong>Preview data.</strong> Offers, work updates, conversations, notices, and payout history are local examples. No Client identity, contact details, or real payment information is included.</p>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Provider work summary">
        {[['New offers', groups.offers.length, 'Review and respond', ClipboardCheck], ['Active work', groups.active.length, 'Accepted, scheduled, or in progress', BriefcaseBusiness], ['Needs follow-up', groups.action.length, 'Client response, payment, or issue', Clock3], ['Released sample payouts', formatMoney(released), 'Preview ledger total', CircleDollarSign]].map(([title, value, helper, Icon]) => <article key={title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-gray-500 dark:text-slate-400">{title}</p><p className="mt-2 text-2xl font-bold text-gray-950 dark:text-slate-100">{value}</p><p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{helper}</p></div><span className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"><Icon className="h-5 w-5" aria-hidden="true" /></span></div></article>)}
      </section>
      <div className="grid gap-3 sm:grid-cols-3"><Link to="/lucid/messages" className="flex min-h-12 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#303a4c] dark:bg-[#1a1f2e] dark:text-slate-200"><span className="inline-flex items-center gap-2"><MessageSquareText className="h-4 w-4" />Messages</span><ArrowRight className="h-4 w-4" /></Link><Link to="/lucid/transactions" className="flex min-h-12 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#303a4c] dark:bg-[#1a1f2e] dark:text-slate-200"><span className="inline-flex items-center gap-2"><ReceiptText className="h-4 w-4" />Transactions and receipts</span><ArrowRight className="h-4 w-4" /></Link><Link to="/lucid/account/profile" className="flex min-h-12 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#303a4c] dark:bg-[#1a1f2e] dark:text-slate-200"><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" />Profile and setup</span><ArrowRight className="h-4 w-4" /></Link></div>
      {loadState === 'loading' && <p role="status" className="rounded-xl bg-white p-6 text-sm text-gray-600 dark:bg-[#1a1f2e] dark:text-slate-300">Loading Provider work…</p>}
      {loadState === 'error' && <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">Work could not be loaded. Refresh the page or contact LUCID support.</p>}
      {loadState === 'ready' && <div className="space-y-6">
        <Section title="New offers" description="Review the approved scope, Inspector assessment, optional Client budget guidance, and work window before responding." icon={ClipboardCheck} records={groups.offers} group="offers" empty="No Provider offers are waiting for your response." />
        <Section title="Accepted and active work" description="Share an estimate for Client approval before starting. Request approval for extra work before doing it." icon={CalendarClock} records={groups.active} group="active" empty="Accepted assignments and active jobs will appear here." />
        <Section title="Client and payment follow-up" description="Check the bill, payment, or case issue that needs a response. Payout remains pending until payment is confirmed." icon={Clock3} records={groups.action} group="action" empty="No Client response or payment follow-up is needed." />
        <Section title="Open bills and payout status" description="Review submitted work amounts and sample payout states. Actual payout and withdrawal availability require backend confirmation." icon={CircleDollarSign} records={groups.payouts} group="payouts" empty="Submitted bills and payout records will appear here." />
        <Section title="Recent work history" description="Review completed, declined, cancelled, or closed assignments." icon={ReceiptText} records={groups.history} group="history" empty="Completed work and past assignment decisions will appear here." />
      </div>}
    </div>
  </main>;
};

export default ProviderWorkPage;
