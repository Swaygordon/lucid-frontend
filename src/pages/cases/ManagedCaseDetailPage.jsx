import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleDollarSign, Clock3, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import ManagedCaseConversation from '../../components/cases/ManagedCaseConversation.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import { normalizeWorkflowRole } from '../../services/workflow/workflowRoles.js';

const dollars = (value, currency = 'GHS') => `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = value => String(value || 'unknown').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const fields = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';

const Panel = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
    <div className="mb-4"><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">{title}</h2>{subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>}</div>
    {children}
  </section>
);

const ActionButton = ({ children, disabled, onClick, secondary = false }) => (
  <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${secondary ? 'border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200 dark:hover:bg-[#252b3b]' : 'bg-primary text-white hover:bg-primary-hover'}`}>{children}</button>
);

const CaseTimeline = ({ record }) => (
  <ol className="space-y-3">
    {(record.history || []).map((event, index) => <li key={event.id || `${event.at}-${index}`} className="flex gap-3"><span className="mt-0.5 rounded-full bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-gray-800 dark:text-slate-200">{event.label || label(event.action)}</span><span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">{event.actorRole ? `${label(event.actorRole)} · ` : ''}{event.at ? new Date(event.at).toLocaleString() : ''}</span></span></li>)}
  </ol>
);

const ManagedCaseDetailPage = () => {
  const { caseId } = useParams();
  const { mode, role, userId } = useWorkflowActor();
  const normalizedRole = normalizeWorkflowRole(role);
  const services = useWorkflowServices();
  const { showNotification } = useNotification();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [priceAmount, setPriceAmount] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [materialsAmount, setMaterialsAmount] = useState('');
  const [billNote, setBillNote] = useState('');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('');
  const [inspectionFindings, setInspectionFindings] = useState('');
  const [cancellationFee, setCancellationFee] = useState('75');
  const [commissionRate, setCommissionRate] = useState('10');

  useEffect(() => {
    let active = true;
    setLoading(true);
    services.cases.get(caseId, { role, userId }).then(result => {
      if (!active) return;
      if (result.error) setLoadError(result.error.message);
      else {
        setRecord(result.data);
        setScope(result.data.confirmedScope || result.data.scope || result.data.service_name || '');
        setBillAmount(String(result.data.providerBill?.providerAmount ?? result.data.providerBillAmount ?? ''));
        setCommissionRate(String(result.data.commissionRate ?? result.data.providerBill?.commissionRate ?? 10));
        setLoading(false);
        return;
      }
      setLoading(false);
    }).catch(error => {
      if (active) {
        setLoadError(error.message || 'This case could not be loaded.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [services, caseId, role, userId]);

  const apply = async (action, payload = {}) => {
    if (!record) return;
    setBusy(true);
    const result = await services.cases.apply(record.id, { role, userId, action, payload });
    setBusy(false);
    if (result.error) {
      showNotification(result.error.message, 'error');
      return;
    }
    setRecord(result.data);
    showNotification('Preview workflow updated in this browser.', 'success');
  };

  const pay = async outcome => {
    setBusy(true);
    const result = await services.finance.simulatePayment(record.id, { role, userId, outcome });
    setBusy(false);
    if (result.error) showNotification(result.error.message, 'error');
    else {
      setRecord(result.data);
      showNotification(outcome === 'confirmed' ? 'Payment simulated as confirmed; Provider payout released.' : `Payment simulated as ${outcome}. No money was charged.`, outcome === 'failed' ? 'warning' : 'success');
    }
  };

  if (loading) return <main className="min-h-[60vh] bg-gray-50 p-8 dark:bg-[#0f1117]"><p role="status" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-gray-600 dark:bg-[#1a1f2e] dark:text-slate-300">Loading case…</p></main>;
  if (loadError || !record) return <main className="min-h-[60vh] bg-gray-50 p-8 dark:bg-[#0f1117]"><div role="alert" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 dark:bg-[#1a1f2e]"><p className="font-semibold text-gray-900 dark:text-slate-100">Case unavailable</p><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{loadError || 'This case could not be found.'}</p><Link to="/lucid/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Return to dashboard</Link></div></main>;

  const serviceName = record.service || record.service_name || 'Managed service request';
  const range = record.clientRange || { min: record.budget_min, max: record.budget_max, currency: record.currency || 'GHS' };
  const bill = record.providerBill || (record.providerBillAmount == null ? null : { providerAmount: record.providerBillAmount, commissionAmount: record.commissionAmount || 0, commissionRate: record.commissionRate || 0, payableAmount: record.clientTotal || record.providerBillAmount });
  const canShowClientThread = ['client', 'admin'].includes(normalizedRole);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e] sm:p-8">
          <Link to={normalizedRole === 'provider' ? '/lucid/provider/work' : normalizedRole === 'admin' ? '/lucid/admin' : normalizedRole === 'inspector' ? '/lucid/inspector/visits' : '/lucid/cases'} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to workspace</Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">{mode === 'preview' ? 'Preview case' : 'Managed service case'} · {record.id}</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">{serviceName}</h1><p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">{record.scope || record.description || 'LUCID coordinates the request, work, communication, and payment status.'}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"><Clock3 className="h-4 w-4" aria-hidden="true" />{label(record.status)}</span></div>
          {mode === 'preview' && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">This case is simulated and stored in this browser. It cannot change a real account or charge money.</p>}
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <div className="space-y-6">
            <Panel title="Booking timeline" subtitle="The same case and status appear in each authorized role workspace."><CaseTimeline record={record} /></Panel>

            {normalizedRole === 'client' && mode === 'preview' && (
              <Panel title="Client actions" subtitle="Your available next steps depend on the current case status.">
                <div className="space-y-4">
                  {record.status === 'needs_information' && <div className="space-y-3"><label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Information for LUCID<textarea className={`${fields} mt-1.5`} rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Add the requested information" /></label><ActionButton disabled={busy || !reason.trim()} onClick={() => apply('provide_information', { message: reason })}>Send information</ActionButton></div>}
                  {record.status === 'price_change_pending' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="font-semibold text-amber-950 dark:text-amber-100">Work is paused while you review this price change.</p><p className="mt-2 text-sm text-amber-900 dark:text-amber-200">Requested amount: {dollars(record.pendingPriceChange?.amount, range.currency)} · {record.pendingPriceChange?.reason}</p><div className="mt-4 flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('approve_price_change')}>Approve and resume work</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('reject_price_change')}>Reject change</ActionButton></div></div>}
                  {record.status === 'awaiting_client_approval' && <div className="space-y-4"><Invoice bill={bill} currency={range.currency} /><div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('confirm_satisfaction')}>Work is satisfactory — approve bill</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('raise_dispute', { reason: reason || 'I need LUCID to review this bill.' })}>Raise a concern</ActionButton></div><label className="block text-sm text-gray-700 dark:text-slate-300">Concern details<textarea className={`${fields} mt-1.5`} rows={2} value={reason} onChange={event => setReason(event.target.value)} placeholder="Describe your concern for LUCID" /></label></div>}
                  {record.status === 'awaiting_payment' && <div className="space-y-4"><Invoice bill={bill} currency={range.currency} /><p className="text-sm text-gray-600 dark:text-slate-400">Choose a simulated outcome to preview payment status. No charge is made.</p><div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => pay('confirmed')}>Simulate successful payment</ActionButton><ActionButton secondary disabled={busy} onClick={() => pay('delayed')}>Simulate delayed confirmation</ActionButton><ActionButton secondary disabled={busy} onClick={() => pay('failed')}>Simulate failed payment</ActionButton></div></div>}
                  {['payment_failed', 'payment_delayed'].includes(record.status) && <div className="space-y-3"><p className="text-sm text-gray-700 dark:text-slate-300">Payment status: <strong>{label(record.paymentStatus)}</strong>. The Provider payout remains unreleased until confirmation.</p><div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => pay('confirmed')}>Retry simulated payment</ActionButton><ActionButton secondary disabled={busy} onClick={() => pay('failed')}>Keep payment failed</ActionButton></div></div>}
                  {record.status === 'cancelled_fee_due' && <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20"><p className="font-semibold text-red-950 dark:text-red-100">Account recovery required</p><p className="mt-2 text-sm text-red-900 dark:text-red-200">A cancellation after Provider acceptance created a simulated fee of {dollars(record.cancellationFeeDue, range.currency)}. Normal Client actions are restricted until recovery.</p><ActionButton disabled={busy} onClick={() => apply('pay_cancellation_fee')}>Simulate fee recovery</ActionButton></div>}
                  {record.paymentStatus === 'confirmed' && !['refund_pending', 'refund_approved'].includes(record.status) && <div className="space-y-3"><label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Refund reason<textarea className={`${fields} mt-1.5`} rows={2} value={reason} onChange={event => setReason(event.target.value)} placeholder="Tell LUCID why you are requesting a refund" /></label><ActionButton secondary disabled={busy || !reason.trim()} onClick={() => apply('request_refund', { reason })}>Request a refund decision</ActionButton></div>}
                  {!['completed', 'cancelled', 'cancelled_fee_due', 'refund_pending', 'refund_approved'].includes(record.status) && <div className="border-t border-gray-100 pt-4 dark:border-[#303a4c]"><label className="mb-2 block text-sm text-gray-600 dark:text-slate-400">Cancellation fee preview (after acceptance): <input type="number" min="0" value={cancellationFee} onChange={event => setCancellationFee(event.target.value)} className={`${fields} mt-1 max-w-48`} /></label><ActionButton secondary disabled={busy} onClick={() => apply('cancel_case', { feeAmount: Number(cancellationFee) })}>Cancel this request</ActionButton></div>}
                </div>
              </Panel>
            )}

            {normalizedRole === 'provider' && mode === 'preview' && <Panel title="Provider work actions" subtitle="Your offer acceptance and final bill are recorded in the simulated case history."><ProviderActions record={record} billAmount={billAmount} setBillAmount={setBillAmount} materialsAmount={materialsAmount} setMaterialsAmount={setMaterialsAmount} billNote={billNote} setBillNote={setBillNote} priceAmount={priceAmount} setPriceAmount={setPriceAmount} priceReason={priceReason} setPriceReason={setPriceReason} busy={busy} apply={apply} /></Panel>}

            {normalizedRole === 'inspector' && mode === 'preview' && <Panel title="Inspector liaison actions" subtitle="Record the assessment and complete the case only after satisfaction and confirmed payment."><InspectorActions record={record} findings={inspectionFindings} setFindings={setInspectionFindings} scope={scope} setScope={setScope} busy={busy} apply={apply} /></Panel>}

            {normalizedRole === 'admin' && mode === 'preview' && <Panel title="Admin case controls" subtitle="Coordinate the request, assignment, payment exceptions, disputes, and refunds."><AdminActions record={record} scope={scope} setScope={setScope} reason={reason} setReason={setReason} commissionRate={commissionRate} setCommissionRate={setCommissionRate} busy={busy} apply={apply} /></Panel>}

            {canShowClientThread && <ManagedCaseConversation caseId={record.id} status={record.status} staffView={normalizedRole === 'admin'} />}
            {normalizedRole === 'provider' && <Link to="/lucid/messages" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message your LUCID liaison</Link>}
            {normalizedRole === 'inspector' && <Link to="/lucid/messages" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Open assigned conversations</Link>}
          </div>

          <aside className="space-y-6">
            <Panel title="Request summary" subtitle="Private account details are not shown to Providers.">
              <dl className="space-y-3 text-sm"><SummaryRow label="Service" value={serviceName} /><SummaryRow label="Location" value={record.locationSummary || 'Managed by LUCID'} /><SummaryRow label="Client range" value={`${dollars(range.min, range.currency)} – ${dollars(range.max, range.currency)}`} /><SummaryRow label="Inspector / liaison" value={record.assignedInspectorId ? 'Assigned' : 'Not assigned'} /><SummaryRow label="Provider" value={record.assignedProviderId ? 'Offer or work assigned' : 'Not assigned'} /><SummaryRow label="Payment" value={label(record.paymentStatus)} /></dl>
            </Panel>
            {bill && <Panel title="Bill and payment" subtitle="Provider work and LUCID charge are shown separately."><Invoice bill={bill} currency={range.currency} /><div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/20 dark:text-blue-100"><ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden="true" />Commission rate is an editable placeholder. Client-purchased materials are excluded.</div></Panel>}
            <Panel title="Receipts and ledger" subtitle="Simulated financial events for this case."><Link to="/lucid/transactions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><CircleDollarSign className="h-4 w-4" aria-hidden="true" />Open financial history</Link></Panel>
          </aside>
        </div>
      </div>
    </main>
  );
};

const SummaryRow = ({ label: title, value }) => <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-slate-400">{title}</dt><dd className="text-right font-medium text-gray-900 dark:text-slate-100">{value}</dd></div>;

const Invoice = ({ bill, currency }) => (
  <dl className="space-y-3 text-sm"><SummaryRow label="Provider work" value={dollars(bill.providerAmount, currency)} /><SummaryRow label={`LUCID charge (${bill.commissionRate ?? 0}% placeholder)`} value={dollars(bill.commissionAmount, currency)} /><div className="border-t border-gray-100 pt-3 dark:border-[#303a4c]"><SummaryRow label="Client total" value={dollars(bill.payableAmount, currency)} /></div>{Number(bill.clientPurchasedMaterialsAmount) > 0 && <p className="text-xs text-gray-500 dark:text-slate-400">Client-purchased materials ({dollars(bill.clientPurchasedMaterialsAmount, currency)}) are paid in person and excluded from this total.</p>}</dl>
);

const ProviderActions = ({ record, billAmount, setBillAmount, materialsAmount, setMaterialsAmount, billNote, setBillNote, priceAmount, setPriceAmount, priceReason, setPriceReason, busy, apply, currency }) => (
  <div className="space-y-4">
    {record.status === 'offer_sent' && <div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('accept_offer')}>Accept offer in app</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('decline_offer')}>Decline offer</ActionButton><p className="w-full text-xs text-gray-500 dark:text-slate-400">Record acceptance here even if you agreed with LUCID in person.</p></div>}
    {record.status === 'accepted' && <ActionButton disabled={busy} onClick={() => apply('start_work')}>Start work</ActionButton>}
    {record.status === 'work_in_progress' && <div className="space-y-4"><form onSubmit={event => { event.preventDefault(); apply('request_price_change', { amount: Number(priceAmount), reason: priceReason }); }} className="grid gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20"><p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Request a price increase</p><input type="number" min="1" required value={priceAmount} onChange={event => setPriceAmount(event.target.value)} placeholder={`New amount (${currency})`} className={fields} /><textarea required value={priceReason} onChange={event => setPriceReason(event.target.value)} placeholder="Explain the added work" className={fields} rows={2} /><button disabled={busy} className="w-fit rounded-lg bg-amber-700 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">Pause work and request approval</button></form><form onSubmit={event => { event.preventDefault(); apply('submit_bill', { amount: Number(billAmount), clientPurchasedMaterialsAmount: Number(materialsAmount), note: billNote }); }} className="grid gap-3 rounded-xl bg-gray-50 p-4 dark:bg-[#252b3b]"><p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Submit final work bill</p><input type="number" min="0" required value={billAmount} onChange={event => setBillAmount(event.target.value)} placeholder={`Provider work amount (${currency})`} className={fields} /><input type="number" min="0" value={materialsAmount} onChange={event => setMaterialsAmount(event.target.value)} placeholder={`Client-purchased materials to exclude (${currency})`} className={fields} /><textarea value={billNote} onChange={event => setBillNote(event.target.value)} placeholder="Work completed and included in this bill" className={fields} rows={2} /><button disabled={busy} className="w-fit rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit bill for Client review</button></form></div>}
    {record.pendingPriceChange && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">Work is paused pending Client approval. Requested amount: {dollars(record.pendingPriceChange.amount, currency)}.</p>}
    {record.providerBill && <Invoice bill={record.providerBill} currency={currency} />}
    {['payment_failed', 'payment_delayed', 'paid', 'completed'].includes(record.status) && <p className="text-sm text-gray-600 dark:text-slate-400">Payment: {label(record.paymentStatus)} · Payout: {label(record.providerPayoutStatus)}</p>}
  </div>
);

const InspectorActions = ({ record, findings, setFindings, scope, setScope, busy, apply }) => (
  <div className="space-y-4">
    {record.status === 'inspector_assigned' && <form onSubmit={event => { event.preventDefault(); apply('record_inspection', { findings, scope }); }} className="grid gap-3"><textarea required value={findings} onChange={event => setFindings(event.target.value)} placeholder="Assessment findings" className={fields} rows={3} /><textarea required value={scope} onChange={event => setScope(event.target.value)} placeholder="Confirmed work scope" className={fields} rows={3} /><button disabled={busy} className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Submit assessment to LUCID</button></form>}
    {record.status === 'paid' && record.clientSatisfied && <ActionButton disabled={busy} onClick={() => apply('complete_case')}>Record satisfactory completion</ActionButton>}
    {!['inspector_assigned', 'paid'].includes(record.status) && <p className="text-sm text-gray-600 dark:text-slate-400">Assessment and completion actions appear when assigned or when Client satisfaction and confirmed payment are recorded.</p>}
  </div>
);

const AdminActions = ({ record, scope, setScope, reason, setReason, commissionRate, setCommissionRate, busy, apply }) => (
  <div className="space-y-4">
    <div className="grid gap-2 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20"><p className="text-sm font-semibold text-blue-950 dark:text-blue-100">Editable commission placeholder</p><p className="text-xs text-blue-900 dark:text-blue-200">Use a demo percentage for this walkthrough; the production rate is not set here.</p><div className="flex flex-wrap gap-2"><input aria-label="Preview commission rate percent" type="number" min="0" max="100" step="0.1" value={commissionRate} onChange={event => setCommissionRate(event.target.value)} className={fields + ' max-w-40'} /><ActionButton disabled={busy} onClick={() => apply('set_commission_rate', { rate: Number(commissionRate) })}>Save placeholder</ActionButton></div></div>
    {record.status === 'submitted' && <div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('assign_inspector', { inspectorId: 'demo-inspector' })}>Assign Inspector</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('request_information', { message: reason || 'Please add more details to your request.' })}>Request more information</ActionButton></div>}
    {record.status === 'inspection_reported' && <div className="space-y-3"><label className="block text-sm text-gray-700 dark:text-slate-300">Confirmed scope<textarea className={`${fields} mt-1.5`} rows={3} value={scope} onChange={event => setScope(event.target.value)} /></label><div className="flex flex-wrap gap-2"><ActionButton disabled={busy || !scope.trim()} onClick={() => apply('confirm_scope', { scope })}>Confirm scope</ActionButton></div></div>}
    {record.status === 'scope_confirmed' && <ActionButton disabled={busy} onClick={() => apply('offer_provider', { providerId: 'demo-provider' })}>Send Provider offer</ActionButton>}
    {record.status === 'payment_delayed' && <ActionButton disabled={busy} onClick={() => apply('confirm_delayed_payment')}>Simulate Admin confirmation</ActionButton>}
    {record.status === 'disputed' && <div className="space-y-2"><label className="block text-sm text-gray-700 dark:text-slate-300">Resolution note<textarea className={`${fields} mt-1.5`} rows={2} value={reason} onChange={event => setReason(event.target.value)} /></label><ActionButton disabled={busy} onClick={() => apply('resolve_dispute', { decision: 'resolved', reason })}>Resolve and return to Client</ActionButton></div>}
    {record.status === 'refund_pending' && <div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('decide_refund', { decision: 'approved', reason: reason || 'Approved in the Preview workflow.' })}>Approve simulated refund</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('decide_refund', { decision: 'rejected', reason: reason || 'Rejected in the Preview workflow.' })}>Reject refund</ActionButton></div>}
    {!['submitted', 'needs_information', 'inspection_reported', 'scope_confirmed', 'payment_delayed', 'disputed', 'refund_pending'].includes(record.status) && <p className="text-sm text-gray-600 dark:text-slate-400">No Admin action is due for this case status.</p>}
    <Link to="/lucid/messages" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Open role-authorized messages</Link>
    <p className="text-xs text-gray-500 dark:text-slate-400">Routine Provider bills do not require staff approval.</p>
  </div>
);

export default ManagedCaseDetailPage;


