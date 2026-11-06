// Case detail UI. All mutations and private record reads must go through authorized Supabase services.
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowLeft, CheckCircle2, CircleDollarSign, Clock3, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import ManagedCaseConversation from '../../components/cases/ManagedCaseConversation.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import { normalizeWorkflowRole } from '../../services/workflow/workflowRoles.js';
import { getCasePresentation } from '../../services/workflow/casePresentation.js';
import { buildReceiptPdf } from '../../services/workflow/receiptPdf.js';
import { isCurrentVerifiedCredential, projectClientCredential, rankCredentialMatch } from '../../utils/catalog/credentialRules.js';

const dollars = (value, currency = 'GHS') => `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = value => String(value || 'unknown').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const fields = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';
const toLocalDateTimeInput = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const Panel = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-si dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
    <div className="mb-4"><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">{title}</h2>{subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>}</div>
    {children}
  </section>
);

const ActionButton = ({ children, type = 'button', disabled, onClick, secondary = false }) => (
  <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${secondary ? 'border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200 dark:hover:bg-[#252b3b]' : 'bg-primary text-white hover:bg-primary-hover'}`}>{children}</button>
);

const CaseTimeline = ({ record }) => (
  <ol className="space-y-3">
    {(record.history || []).map((event, index) => <li key={event.id || `${event.at}-${index}`} className="flex gap-3"><span className="mt-0.5 rounded-full bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-gray-800 dark:text-slate-200">{event.label || label(event.action)}</span><span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">{event.actorRole ? `${label(event.actorRole)} Â· ` : ''}{event.at ? new Date(event.at).toLocaleString() : ''}</span>{event.details?.reason && <span className="mt-1 block text-xs text-gray-600 dark:text-slate-400">Reason: {event.details.reason}</span>}{event.details?.overrideReason && <span className="mt-1 block text-xs text-amber-800 dark:text-amber-200">Assignment override: {event.details.overrideReason}</span>}</span></li>)}
  </ol>
);

const ManagedCaseDetailPage = () => {
  const { caseId } = useParams();
  const { role, userId } = useWorkflowActor();
  const normalizedRole = normalizeWorkflowRole(role);
  const services = useWorkflowServices();
  const { showNotification } = useNotification();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [priceAmount, setPriceAmount] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [providerVisitDate, setProviderVisitDate] = useState('');
  const [providerVisitNotes, setProviderVisitNotes] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [materialsAmount, setMaterialsAmount] = useState('');
  const [billNote, setBillNote] = useState('');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptPdfBusy, setReceiptPdfBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    services.cases.get(caseId, { role, userId }).then(async result => {
      if (!active) return;
      if (result.error) setLoadError(result.error.message);
      else {
        setRecord(result.data);
        if (services.receipts?.listForRole) {
          const receiptResult = await services.receipts.listForRole({ role, userId });
          if (active && !receiptResult.error) setReceipt(receiptResult.data.find(itei => itei.caseId === caseId) || null);
        }
        setScope(result.data.confirmedScope || result.data.scope || result.data.service_name || '');
        setBillAmount(String(result.data.providerBill?.providerAmount ?? result.data.providerBillAmount ?? ''));
        setProviderVisitDate(toLocalDateTimeInput(result.data.providerVisit?.scheduledAt));
        setProviderVisitNotes(result.data.providerVisit?.notes || '');
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
      return false;
    }
    setRecord(result.data);
    if (result.data.status === 'completed' && services.receipts?.listForRole) {
      const receiptResult = await services.receipts.listForRole({ role, userId });
      if (!receiptResult.error) setReceipt(receiptResult.data.find(itei => itei.caseId === record.id) || null);
    }
    showNotification('Request updated.', 'success');
    return true;
  };

  const downloadReceiptPdf = async () => {
    if (!receipt || !record || receiptPdfBusy) return;
    setReceiptPdfBusy(true);
    try {
      const doc = await buildReceiptPdf({
        ...receipt,
        caseRecord: record,
        client: normalizedRole === 'client' ? 'You' : record.clientName || 'Client',
        provider: normalizedRole === 'provider' ? 'You' : record.providerAssignment?.providerName || 'Provider',
      });
      doc.save(`LUCID-${receipt.caseId}-receipt.pdf`);
      showNotification('A4 receipt PDF downloaded.', 'success');
    } catch {
      showNotification('The receipt PDF could not be created. Please try again.', 'error');
    } finally {
      setReceiptPdfBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    try {
      const result = await services.finance.createPaymentCheckout({ caseId: record.id, billId: record.providerBill?.id, purpose: 'final_bill', role, userId });
      if (result.error) throw result.error;
      if (!result.data?.url) throw new Error('A secure payment link was not returned.');
      window.location.assign(result.data.url);
    } catch (error) { showNotification(error.message || 'Secure checkout could not be opened.', 'error'); setBusy(false); }
  };

  if (loading) return <main className="min-h-[60vh] bg-gray-50 p-8 dark:bg-[#0f1117]"><p role="status" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-gray-600 dark:bg-[#1a1f2e] dark:text-slate-300">Loading caseâ€¦</p></main>;
  if (loadError || !record) return <main className="min-h-[60vh] bg-gray-50 p-8 dark:bg-[#0f1117]"><div role="alert" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 dark:bg-[#1a1f2e]"><p className="font-semibold text-gray-900 dark:text-slate-100">Case unavailable</p><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{loadError || 'This case could not be found.'}</p><Link to="/lucid/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Return to dashboard</Link></div></main>;

  const serviceName = record.serviceNameSnapshot || record.service_name_snapshot || record.service || record.service_name || 'Managed service request';
  const range = record.clientRange || { min: record.suggested_range_min, max: record.suggested_range_max, currency: record.currency || 'GHS' };
  const bill = record.providerBill || (record.providerBillAmount == null ? null : { providerAmount: record.providerBillAmount, commissionAmount: record.commissionAmount || 0, commissionRate: record.commissionRate || 0, payableAmount: record.clientTotal || record.providerBillAmount });
  const clientCredential = normalizedRole === 'client' ? projectClientCredential(record.providerAssignment?.relevantVerifiedCredential, record.serviceId) : null;
  const clientPresentation = getCasePresentation(record.status);
  const conversationHref = audience => `/lucid/messages?conversation=${encodeURIComponent(`${audience}:${record.id}`)}&returnTo=${encodeURIComponent(`/lucid/cases/${record.id}`)}`;
  const requestCancellation = () => {
    // Cancellation liability is returned by the backend policy calculation. The frontend must not invent a fee.
    const feeAmount = Number(record.cancellationFeeDue || 0);
    const consequence = feeAmount ? `A cancellation fee of ${dollars(feeAmount, range.currency)} applies under the policy returned for this request.` : 'Any applicable cancellation terms must be shown before this request is closed.';
    if (window.confirm(`Cancel ${serviceName}? ${consequence}`)) {
      apply('cancel_case');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-si dark:bg-[#1a1f2e] sm:p-8">
          <Link to={normalizedRole === 'provider' ? '/lucid/provider/work' : normalizedRole === 'admin' ? '/lucid/admin' : normalizedRole === 'inspector' ? '/lucid/inspector/visits' : '/lucid/cases'} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to workspace</Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Managed service case Â· {record.id}</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">{serviceName}</h1><p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">{record.scope || record.description || 'LUCID coordinates the request, work, communication, and payment status.'}</p>{record.constructionWorkType && <p className="mt-2 text-sm font-medium text-primary">Construction work type: {record.constructionWorkType}</p>}</div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"><Clock3 className="h-4 w-4" aria-hidden="true" />{label(record.status)}</span></div>
        </header>

        {normalizedRole === 'client' && <section className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:grid-cols-3 sm:p-6" aria-label="Current case status and next step">
          <div><p className="text-xs font-semibold text-blue-800 dark:text-blue-200">Current status</p><p className="mt-1 font-semibold text-blue-950 dark:text-blue-100">{clientPresentation.label}</p></div>
          <div><p className="text-xs font-semibold text-blue-800 dark:text-blue-200">Current owner</p><p className="mt-1 font-semibold text-blue-950 dark:text-blue-100">{clientPresentation.owner}</p></div>
          <div><p className="text-xs font-semibold text-blue-800 dark:text-blue-200">Next step</p><p className="mt-1 font-semibold text-blue-950 dark:text-blue-100">{clientPresentation.next}</p></div>
        </section>}
        {normalizedRole === 'client' && record.providerAssignment && <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#394458] dark:bg-[#1a1f2e]" aria-label="Assigned Provider credential information"><h2 className="font-semibold text-gray-900 dark:text-slate-100">Provider credential</h2>{clientCredential ? <p className="mt-2 text-sm text-gray-700 dark:text-slate-300"><span className="font-medium">{clientCredential.title}</span> <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true"/>{clientCredential.badge}</span></p> : <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">No relevant credential has been verified by LUCID for this assignment.</p>}<p className="mt-2 text-xs text-gray-500">Credential details are limited to work relevant to this request. Certificate documents and numbers stay private.</p></section>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <div className="space-y-6">
            <Panel title="Bookmng timeline" subtitle="The same case and status appear in each authorized role workspace."><CaseTimeline record={record} /></Panel>

            {normalizedRole === 'admin' && record.inspection && <Panel title="Inspector assessment" subtitle="Review the submitted findings before confirming scope or closing an infeasible request."><dl className="grid gap-3 text-sm sm:grid-cols-2"><SummaryRow label="Feasibility" value={label(record.inspection.feasibility || 'feasible')} /><SummaryRow label="Site safety" value={label(record.inspection.safetyStatus || 'no known concern')} /><div className="sm:col-span-2"><SummaryRow label="Findings" value={record.inspection.findings || 'No findings recorded'} /></div>{record.inspection.scope && <div className="sm:col-span-2"><SummaryRow label="Proposed scope" value={record.inspection.scope} /></div>}</dl>{record.inspection.feasibilityNotes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">Feasibility notes: {record.inspection.feasibilityNotes}</p>}{record.inspection.safetyNotes && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-950 dark:bg-rose-950/20 dark:text-rose-100">Safety notes: {record.inspection.safetyNotes}</p>}{record.inspection.evidence?.length > 0 && <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">{record.inspection.evidence.map((itei, index) => <li key={`${itei.name}-${index}`}>Evidence reference: {itei.name}</li>)}</ul>}</Panel>}

            {normalizedRole === 'client' && (
              <Panel title="Client actions" subtitle="Your available next steps depend on the current case status.">
                <div className="space-y-4">
                  {record.status === 'completed' && (record.review ? <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">Thank you for reviewing this service. Your rating was {record.review.rating} out of 5.</p> : reviewDismissed ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-[#252b3b] dark:text-slate-200">No review left. You can return to this case and leave one later.</p> : <form onSubmit={event => { event.preventDefault(); apply('leave_review', { rating: reviewRating, comment: reviewComment }); }} className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20"><div><p className="font-semibold text-gray-950 dark:text-slate-100">How was the service?</p><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Leave an optional review about the Providerâ€™s work.</p></div><div className="flex gap-1" role="radiogroup" aria-label="Provider rating">{[1,2,3,4,5].map(value => <button key={value} type="button" role="radio" aria-checked={reviewRating===value} aria-label={`${value} star${value===1?'':'s'}`} onClick={()=>setReviewRating(value)} className={`rounded px-1 text-2xl ${reviewRating>=value?'text-amber-500':'text-gray-300 dark:text-slate-600'}`}>â˜…</button>)}</div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Review (optional)<textarea className={`${fields} mt-1.5`} rows={3} maxLength={1200} value={reviewComment} onChange={event=>setReviewComment(event.target.value)} placeholder="Share a few details, or leave this blank" /></label><div className="flex flex-wrap gap-2"><ActionButton type="submit" disabled={busy}>Submit review</ActionButton><ActionButton secondary onClick={() => setReviewDismissed(true)}>Not now</ActionButton></div></form>)}
                  {record.status === 'inspector_bypass_pending' && <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><div><h3 className="font-semibold text-amber-950 dark:text-amber-100">Would you like to continue without an Inspector?</h3><p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-200">No suitable Inspector is available. If you agree, LUCID can assign a Provider. The Provider will assess the site after accepting and can then start the agreed work. You will not need to fill out another form.</p>{record.inspectorBypassRequest?.reason && <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">LUCIDâ€™s note: {record.inspectorBypassRequest.reason}</p>}</div><div className="flex flex-col gap-2 sm:flex-row"><ActionButton disabled={busy} onClick={() => apply('approve_inspector_bypass')}>Yes, continue without Inspector</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('decline_inspector_bypass')}>No, keep lookmng for an Inspector</ActionButton></div></section>}
                  {record.status === 'inspector_bypass_approved' && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100">You agreed to continue without an Inspector. LUCID is finding a Provider. No more information is needed from you right now.</p>}
                  {record.requestAmendment?.status === 'pending' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="font-semibold text-amber-950 dark:text-amber-100">LUCID proposed a request update</p><p className="mt-2 text-sm text-amber-900 dark:text-amber-200">Reason: {record.requestAmendment.reason}</p><dl className="mt-3 space-y-2 text-sm">{Object.entries(record.requestAmendment.proposed).map(([key, value]) => <div key={key} className="grid gap-1 sm:grid-cols-[150px_1fr]"><dt className="font-medium text-amber-900 dark:text-amber-200">{label(key)}</dt><dd className="text-amber-950 dark:text-amber-100">{String(value || 'Not provided')}</dd></div>)}</dl><div className="mt-4 flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('accept_request_amendment')}>Accept request update</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('reject_request_amendment', { reason })}>Decline and discuss with LUCID</ActionButton></div></div>}
                  {record.status === 'needs_information' && <div className="space-y-3"><label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Information for LUCID<textarea className={`${fields} mt-1.5`} rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Add the requested information" /></label><ActionButton disabled={busy || !reason.trim()} onClick={() => apply('provide_information', { message: reason })}>Send information</ActionButton></div>}
                  {record.pendingPriceChange && <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><div><p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">Optional added work</p><h3 className="mt-1 text-lg font-semibold text-amber-950 dark:text-amber-100">Review this extra cost</h3><p className="mt-1 text-sm text-amber-900 dark:text-amber-200">The Provider can continue with the original request. This extra work will only happen if you approve it.</p></div><div className="rounded-xl bg-white p-4 text-sm dark:bg-[#1a1f2e]"><p className="font-semibold text-gray-900 dark:text-slate-100">{record.pendingPriceChange.scope}</p><p className="mt-1 text-gray-600 dark:text-slate-400">Why it is needed: {record.pendingPriceChange.reason}</p><dl className="mt-4 space-y-2"><SummaryRow label="Additional work cost" value={dollars(record.pendingPriceChange.amount, range.currency)} /></dl><p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-slate-400">If approved, the Provider will include this work in the final bill. Platform charges appear in the bill breakdown.</p></div><div className="flex flex-col gap-2 sm:flex-row"><ActionButton disabled={busy} onClick={() => apply('approve_price_change')}>Approve extra work</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('reject_price_change')}>Decline extra work</ActionButton></div><p className="text-xs text-amber-900 dark:text-amber-200">If you decline, this additional work will be left out of the job.</p></div>}
                  {record.status === 'awaiting_client_approval' && <div className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Final bill Â· {bill?.version ? `version ${bill.version}` : 'for review'}</p><h3 className="mt-1 text-xl font-semibold text-gray-950 dark:text-slate-100">Check the bill</h3><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Review the total and breakdown. Accept to continue to secure payment, or reject the bill and optionally tell the Provider what needs to change.</p></div><div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-[#303a4c] dark:bg-[#252b3b]"><p className="mb-3 text-sm font-semibold text-gray-800 dark:text-slate-200">Aiount due</p><Invoice bill={bill} currency={range.currency} /></div>{bill?.note && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-950 dark:bg-blue-950/20 dark:text-blue-100">Provider note: {bill.note}</p>}{record.providerBillHistory?.length > 1 && <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-[#394458]"><summary className="cursor-pointer font-semibold">See previous bill versions</summary><ol className="mt-3 space-y-2">{record.providerBillHistory.slice(0, -1).map(itei => <li key={itei.version} className="rounded-lg bg-gray-50 p-3 dark:bg-[#252b3b]">Version {itei.version}: {dollars(itei.payableAmount, range.currency)} Â· {label(itei.status)}{itei.clientDecisionReason && <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Your note: {itei.clientDecisionReason}</p>}</li>)}</ol></details>}<label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Note for the Provider (optional)<textarea className={`${fields} mt-1.5`} rows={2} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Optional: explain what you would like changed" /></label><div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-[#303a4c] sm:flex-row"><ActionButton disabled={busy} onClick={() => apply('approve_bill')}>Accept bill and continue to payment</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('reject_bill', { note: reason.trim() })}>Reject bill</ActionButton></div></div>}
                  {record.status === 'bill_rejected' && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="font-semibold text-amber-950 dark:text-amber-100">Bill rejected Â· waiting for Provider revision</p>{record.billRejection?.note ? <p className="text-sm text-amber-900 dark:text-amber-200">Your note: {record.billRejection.note}</p> : <p className="text-sm text-amber-900 dark:text-amber-200">You left no note. The Provider can message you if they need clarification.</p>}<p className="text-xs text-amber-900 dark:text-amber-200">No payment has been made. The Provider can send an updated bill for you to review.</p>{record.assignedInspectorId && <Link to={conversationHref('client-inspector')} className="inline-flex min-h-11 items-center rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-950/50">Message your Inspector</Link>}</div>}
                  {record.status === 'awaiting_payment' && <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20"><div><h3 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Ready to pay LUCID?</h3><p className="mt-1 text-sm text-gray-700 dark:text-slate-300">Your total is {dollars(bill?.payableAmount, range.currency)}. Payment opens with the secure payment provider. Your payment details are not saved in your profile.</p></div><p className="text-sm text-gray-600 dark:text-slate-400">Continue to the secure checkout to pay. LUCID does not store your payment details.</p><ActionButton disabled={busy} onClick={pay}>Pay securely ? {dollars(bill?.payableAmount, range.currency)}</ActionButton></div>}
                  {['payment_failed', 'payment_delayed'].includes(record.status) && <div className="space-y-3"><p className="text-sm text-gray-700 dark:text-slate-300">Payment status: <strong>{label(record.paymentStatus)}</strong>. The Provider payout remains unreleased until confirmation.</p><ActionButton disabled={busy} onClick={pay}>Retry secure checkout</ActionButton></div>}
                  {record.status === 'cancelled_fee_due' && <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20"><p className="font-semibold text-red-950 dark:text-red-100">Cancellation fee due</p><p className="mt-2 text-sm text-red-900 dark:text-red-200">The fee shown was calculated under the cancellation policy attached to this request. Other requests and messages remain available.</p><ActionButton disabled={busy} onClick={() => services.finance.createPaymentCheckout({ caseId: record.id, purpose: 'cancellation_fee', role, userId }).then(result => result.error ? showNotification(result.error.message, 'error') : result.data?.url ? window.location.assign(result.data.url) : showNotification('A secure payment link was not returned.', 'error'))}>Pay securely Â· {dollars(record.cancellationFeeDue, range.currency)}</ActionButton></div>}
                  {record.paymentStatus === 'confirmed' && !['refund_pending', 'refund_approved'].includes(record.status) && <div className="space-y-3"><label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Refund reason<textarea className={`${fields} mt-1.5`} rows={2} value={reason} onChange={event => setReason(event.target.value)} placeholder="Tell LUCID why you are requesting a refund" /></label><ActionButton secondary disabled={busy || !reason.trim()} onClick={() => apply('request_refund', { reason })}>Request a refund decision</ActionButton></div>}
                  {!['completed', 'cancelled', 'cancelled_fee_due', 'refund_pending', 'refund_approved'].includes(record.status) && <div className="border-t border-gray-100 pt-4 dark:border-[#303a4c]"><div><p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{record.assignedProviderId || record.providerAcceptedAt ? 'Cancellation terms shown here are determined by the policy accepted for this request.' : 'You can cancel before a Provider is assigned.'}</p><ActionButton secondary disabled={busy} onClick={requestCancellation}>Cancel this request</ActionButton></div></div>}
                </div>
              </Panel>
            )}

            {normalizedRole === 'provider' && <Panel title="Provider work actions" subtitle="Accept an assignment, record work progress, and submit the final bill."><ProviderActions record={record} billAmount={billAmount} setBillAmount={setBillAmount} materialsAmount={materialsAmount} setMaterialsAmount={setMaterialsAmount} billNote={billNote} setBillNote={setBillNote} priceAmount={priceAmount} setPriceAmount={setPriceAmount} priceReason={priceReason} setPriceReason={setPriceReason} declineReason={declineReason} setDeclineReason={setDeclineReason} providerVisitDate={providerVisitDate} setProviderVisitDate={setProviderVisitDate} providerVisitNotes={providerVisitNotes} setProviderVisitNotes={setProviderVisitNotes} busy={busy} apply={apply} currency={range.currency} /></Panel>}

            {normalizedRole === 'provider' && record.inspection && <Panel title="Inspector handoff" subtitle="Review the relevant assessment and safety notes before beginning the approved work."><dl className="grid gap-3 text-sm sm:grid-cols-2"><SummaryRow label="Feasibility" value={label(record.inspection.feasibility || 'feasible')} /><SummaryRow label="Site safety" value={label(record.inspection.safetyStatus || 'no known concern')} /><div className="sm:col-span-2"><SummaryRow label="Inspection findings" value={record.inspection.findings || 'No findings recorded'} /></div>{record.inspection.scope && <div className="sm:col-span-2"><SummaryRow label="Proposed scope" value={record.inspection.scope} /></div>}</dl>{record.inspection.feasibilityNotes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">Conditions: {record.inspection.feasibilityNotes}</p>}{record.inspection.safetyNotes && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-950 dark:bg-rose-950/20 dark:text-rose-100">Safety precautions: {record.inspection.safetyNotes}</p>}</Panel>}

            {normalizedRole === 'inspector' && <Panel title="Inspection assessment" subtitle="Submit findings and a proposed scope for LUCID review. LUCID confirms the scope before any Provider offer."><InspectorActions record={record} busy={busy} apply={apply} /></Panel>}

            {normalizedRole === 'admin' && <Panel title="Admin case controls" subtitle="Coordinate the request, assignment, payment exceptions, disputes, and refunds."><AdminActions record={record} scope={scope} setScope={setScope} reason={reason} setReason={setReason} busy={busy} apply={apply} services={services} userId={userId} /></Panel>}

            {record.review && <Panel title="Client review" subtitle="Shared with the people involved in this completed service."><div className="flex items-center gap-2 text-amber-500" aria-label={`${record.review.rating} out of 5 stars`}>{'â˜…'.repeat(record.review.rating)}<span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{record.review.rating}/5</span></div>{record.review.comment && <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">{record.review.comment}</p>}<p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{new Date(record.review.submittedAt).toLocaleDateString()}</p></Panel>}

            {normalizedRole === 'admin' && <ManagedCaseConversation caseId={record.id} status={record.status} staffView />}
            {normalizedRole === 'client' && <Panel title="People and messages" subtitle="Message LUCID or your assigned Inspector. Provider contact details are not available to Clients.">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-[#252b3b]"><div><p className="text-sm font-semibold text-gray-900 dark:text-slate-100">LUCID Admin/HR</p><p className="text-xs text-gray-500 dark:text-slate-400">Request review and support</p></div><Link to={conversationHref('client-admin')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-white dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#303a4c]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message LUCID</Link></div>
                {record.assignedInspectorId ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-[#252b3b]"><div><p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Assigned Inspector</p><p className="text-xs text-gray-500 dark:text-slate-400">{record.inspectorAssignment?.inspectorName || 'Your case Inspector'}</p></div><Link to={conversationHref('client-inspector')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-white dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#303a4c]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message Inspector</Link></div> : record.inspectorBypassConsent ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">You agreed to continue without a preliminary Inspector. Message LUCID here if you need help.</p> : <p className="text-sm text-gray-500 dark:text-slate-400">An Inspector conversation will appear here after assignment.</p>}
              </div>
            </Panel>}
            {normalizedRole === 'provider' && <Panel title="Assignment contacts" subtitle="Coordinate through case-specific conversations. Client identity, phone, email, profile, and direct messaging are private."><div className="flex flex-wrap gap-3"><Link to={conversationHref('provider-admin')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message LUCID</Link>{record.providerAcceptedAt && record.assignedInspectorId && <Link to={conversationHref('provider-inspector')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message Inspector</Link>}</div></Panel>}
            {normalizedRole === 'inspector' && <Panel title="Case contacts" subtitle="Use the direct case threads for coordination. Request contact details are private and shared with assigned workers for this request."><div className="flex flex-wrap gap-3"><Link to={conversationHref('client-inspector')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message Client</Link><Link to={conversationHref('inspector-admin')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message LUCID</Link>{record.assignedProviderId && <Link to={conversationHref('provider-inspector')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Message assigned Provider</Link>}</div>{record.assignedProviderId ? <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">Assigned Provider: {record.providerAssignment?.providerName || 'Provider'}</p> : <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">The Provider contact link appears after LUCID sends an offer and the Provider accepts.</p>}</Panel>}
          </div>

          <aside className="space-y-6">
            {normalizedRole === 'provider' && <Panel title="Assignment details" subtitle="Only information needed for the assigned work is shown. Client identity, contact details, and direct messages are private."><dl className="space-y-3 text-sm"><SummaryRow label="Service" value={serviceName} /><SummaryRow label="Approved work scope" value={record.confirmedScope || record.scope || 'Awaiting approved scope'} /><SummaryRow label="Service area" value={record.locationSummary || 'Shared by LUCID'} />{record.serviceLocation?.address && <SummaryRow label='Service address' value={[record.serviceLocation.address, record.serviceLocation.area, record.city, record.region].filter(Boolean).join(', ')} />}{record.serviceLocation?.accessNotes && <SummaryRow label='Access notes' value={record.serviceLocation.accessNotes} />}{record.urgency && <SummaryRow label="Urgency" value={label(record.urgency)} />}{record.preferredDate && <SummaryRow label="Client preferred work window" value={[record.preferredDate, record.preferredTime].filter(Boolean).join(' Â· ')} />}{record.alternateDate && <SummaryRow label="Alternate work window" value={[record.alternateDate, record.alternateTime].filter(Boolean).join(' Â· ')} />}{record.providerVisit?.scheduledAt && <SummaryRow label="Your scheduled work visit" value={`${new Date(record.providerVisit.scheduledAt).toLocaleString()}${record.providerVisit.notes ? ` Â· ${record.providerVisit.notes}` : ''}`} />}{record.clientRange && <div><SummaryRow label="Client suggested range" value={`${dollars(range.min, range.currency)} â€“ ${dollars(range.max, range.currency)}`} /><p className="mt-1 text-right text-xs text-gray-500 dark:text-slate-400">Optional guidance, not a quote or price cap.</p></div>}<SummaryRow label="Inspector" value={record.inspectorWaived ? 'None; Client agreed to proceed without preliminary assessment' : (record.inspectorAssignment?.inspectorName || 'LUCID assigned Inspector')} /><SummaryRow label="LUCID liaison" value={record.providerAssignment?.adminName || 'LUCID Admin/HR'} /></dl></Panel>}
            {normalizedRole !== 'provider' && <Panel title="Your request" subtitle="Private account and contact details are not shown to Providers.">
              <dl className="space-y-3 text-sm"><SummaryRow label="Service" value={serviceName} /><SummaryRow label="Your description" value={record.requestAmendment?.original?.description || record.description || record.scope || 'No description saved'} />{record.requestAmendment && <div className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-950/20"><p className="font-semibold text-amber-950 dark:text-amber-100">Request change {label(record.requestAmendment.status)}</p>{record.requestAmendment.proposed?.description && <p className="mt-2 text-amber-900 dark:text-amber-200">Updated description: {record.requestAmendment.proposed.description}</p>}<p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Reason: {record.requestAmendment.reason}</p></div>}<SummaryRow label="Service area" value={record.locationSummary || 'Managed by LUCID'} />{record.serviceLocation?.address && <SummaryRow label='Service address' value={[record.serviceLocation.address, record.serviceLocation.area, record.city, record.region].filter(Boolean).join(', ')} />}{record.serviceLocation?.accessNotes && <SummaryRow label='Access notes' value={record.serviceLocation.accessNotes} />}{record.requestContact && <SummaryRow label='Client contact' value={[record.requestContact.name, record.requestContact.phone, record.requestContact.email].filter(Boolean).join(', ')} />}{record.urgency && <SummaryRow label="Urgency" value={label(record.urgency)} />}{record.preferredDate && <SummaryRow label="Preferred visit" value={[record.preferredDate, record.preferredTime].filter(Boolean).join(' Â· ')} />}{record.alternateDate && <SummaryRow label="Alternate visit" value={[record.alternateDate, record.alternateTime].filter(Boolean).join(' Â· ')} />}{record.clientRange && <div><SummaryRow label="Suggested range" value={`${dollars(range.min, range.currency)} â€“ ${dollars(range.max, range.currency)}`} /><p className="mt-1 text-right text-xs text-gray-500 dark:text-slate-400">Optional guidance only; not a quote or price cap.</p></div>}<SummaryRow label="Inspector" value={record.inspectionBypassConsent ? 'Client agreed to proceed without an Inspector' : (record.inspectorAssignment?.inspectorName || (record.assignedInspectorId ? 'Assigned' : 'Not assigned'))} /><SummaryRow label="Provider" value={record.assignedProviderId ? 'Assigned' : 'Not assigned'} /><SummaryRow label="Payment" value={label(record.paymentStatus)} /></dl>
            </Panel>}
            {bill && <Panel title="Bill and payment" subtitle="Provider work and LUCID charge are shown separately."><Invoice bill={bill} currency={range.currency} /><div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/20 dark:text-blue-100"><ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden="true" />Platform charges must be calculated by the server policy. Client-purchased materials are excluded.</div></Panel>}
            <Panel title="Receipts and ledger" subtitle="Case payment summary for the selected account.">{receipt ? <><dl className="space-y-3 text-sm"><SummaryRow label="Receipt" value={receipt.id} /><SummaryRow label="Issued" value={new Date(receipt.issuedAt).toLocaleDateString()} /><SummaryRow label="Provider work" value={dollars(receipt.providerAmount, receipt.currency)} /><SummaryRow label="LUCID charge" value={dollars(receipt.platformAmount, receipt.currency)} /><SummaryRow label="Inspector charge" value={dollars(receipt.inspectorAmount, receipt.currency)} /><SummaryRow label="Total paid" value={dollars(receipt.totalAmount, receipt.currency)} /><SummaryRow label="Payment reference" value={receipt.paymentReference} /></dl><button type="button" onClick={downloadReceiptPdf} disabled={receiptPdfBusy} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"><ArrowDownToLine className="h-4 w-4" aria-hidden="true" />{receiptPdfBusy ? 'Creating PDFâ€¦' : 'Download A4 PDF'}</button></> : <p className="text-sm text-gray-600 dark:text-slate-400">A receipt is issued to each involved account after the case is completed. No receipt is available yet.</p>}<Link to="/lucid/transactions" className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><CircleDollarSign className="h-4 w-4" aria-hidden="true" />Open financial history</Link></Panel>
          </aside>
        </div>
      </div>
    </main>
  );
};

const SummaryRow = ({ label: title, value }) => <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-slate-400">{title}</dt><dd className="text-right font-medium text-gray-900 dark:text-slate-100">{value}</dd></div>;

const Invoice = ({ bill, currency }) => (
  <dl className="space-y-3 text-sm"><SummaryRow label="Provider work" value={dollars(bill.providerAmount, currency)} /><SummaryRow label={`LUCID charge (${bill.commissionRate ?? 0}% placeholder)`} value={dollars(bill.commissionAmount, currency)} />{Number(bill.inspectorAmount) > 0 && <SummaryRow label={`Inspector charge (${bill.inspectorRate ?? 0}% placeholder)`} value={dollars(bill.inspectorAmount, currency)} />}<div className="border-t border-gray-100 pt-3 dark:border-[#303a4c]"><SummaryRow label="Client total" value={dollars(bill.payableAmount, currency)} /></div>{Number(bill.clientPurchasedMaterialsAmount) > 0 && <p className="text-xs text-gray-500 dark:text-slate-400">Client-purchased materials ({dollars(bill.clientPurchasedMaterialsAmount, currency)}) are paid in person and excluded from this total.</p>}</dl>
);

const ProviderActions = ({ record, billAmount, setBillAmount, materialsAmount, setMaterialsAmount, billNote, setBillNote, priceAmount, setPriceAmount, priceReason, setPriceReason, declineReason, setDeclineReason, providerVisitDate, setProviderVisitDate, providerVisitNotes, setProviderVisitNotes, busy, apply, currency }) => {
  const [changeScope, setChangeScope] = useState(record.pendingPriceChange?.scope || '');
  return <div className="space-y-4">
    {record.status === 'offer_sent' && <div className="space-y-4"><div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-950 dark:bg-blue-950/20 dark:text-blue-100"><p className="font-semibold">Review this assignment before you respond</p><p className="mt-1">Review the request scope and service area. Client identity and direct contact remain private.</p>{record.inspectorWaived && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">The Client agreed to proceed without a preliminary Inspector. After you accept, assess the site, confirm the conditions with the Client, and start work when ready. No extra Client form is required.</p>}{record.inspection?.findings && <p className="mt-3 rounded-lg bg-white/70 p-3 dark:bg-[#1a1f2e]"><span className="font-semibold">Inspector findings:</span> {record.inspection.findings}</p>}{record.clientRange && <p className="mt-3 rounded-lg bg-white/70 p-3 dark:bg-[#1a1f2e]"><span className="font-semibold">Clientâ€™s suggested range:</span> {dollars(record.clientRange.min, currency)}â€“{dollars(record.clientRange.max, currency)} <span className="block text-xs">Optional guidance only. It is not a quote or price cap.</span></p>}</div><ActionButton disabled={busy} onClick={() => apply('accept_offer')}>Accept offer</ActionButton><form onSubmit={event => { event.preventDefault(); apply('decline_offer', { reason: declineReason.trim() }); }} className="grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-[#303a4c]"><label className="text-sm font-medium text-gray-800 dark:text-slate-200">If declining, tell LUCID why<textarea required maxLength={1000} value={declineReason} onChange={event => setDeclineReason(event.target.value)} rows={2} className={`${fields} mt-1.5`} placeholder="For example, unavailable during the requested work window" /></label><button disabled={busy || !declineReason.trim()} className="w-fit rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-[#394458] dark:text-slate-200 dark:hover:bg-[#252b3b]">Decline offer with reason</button></form></div>}
     {['accepted', 'work_in_progress'].includes(record.status) && <form onSubmit={event => { event.preventDefault(); apply('schedule_provider_visit', { scheduledAt: new Date(providerVisitDate).toISOString(), notes: providerVisitNotes.trim() }); }} className="grid gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20"><div><p className="text-sm font-semibold text-blue-950 dark:text-blue-100">Provider work schedule</p><p className="mt-1 text-xs text-blue-900 dark:text-blue-200">{record.inspectorWaived ? 'Share schedule changes with LUCID and the Client.' : 'This is separate from the Inspectorâ€™s assessment visit. Share schedule changes with LUCID and the Inspector.'}</p></div><label className="text-sm font-medium text-gray-800 dark:text-slate-200">Date and time<input aria-label="Provider work date and time" type="datetime-local" required min={toLocalDateTimeInput(Date.now() + 60000)} value={providerVisitDate} onChange={event => setProviderVisitDate(event.target.value)} className={`${fields} mt-1`} /></label><label className="text-sm font-medium text-gray-800 dark:text-slate-200">Work window or site note<textarea maxLength={500} value={providerVisitNotes} onChange={event => setProviderVisitNotes(event.target.value)} rows={2} className={`${fields} mt-1`} /></label><button disabled={busy} className="w-fit rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50">Save Provider schedule</button></form>}
    {record.status === 'accepted' && <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20"><div><h3 className="font-semibold text-emerald-950 dark:text-emerald-100">Ready to start</h3><p className="mt-1 text-sm leading-6 text-emerald-900 dark:text-emerald-200">Assess the site and confirm it matches the request. No estimate or Client approval is needed before you begin. Ask for approval before doing any additional work.</p></div><ActionButton disabled={busy} onClick={() => apply('start_work')}>Start work</ActionButton></section>}
     {record.status === 'work_in_progress' && <div className="space-y-4"><section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><div><h3 className="font-semibold text-amber-950 dark:text-amber-100">Need to do extra work?</h3><p className="mt-1 text-sm text-amber-900 dark:text-amber-200">Describe it and its cost. Wait for the Clientâ€™s approval before starting that extra work. You can continue the original job.</p></div>{record.pendingPriceChange ? <p className="rounded-xl bg-white p-3 text-sm text-amber-950 dark:bg-[#1a1f2e] dark:text-amber-100">Your added-work request is waiting for the Client. Keep to the original scope until they respond.</p> : <form onSubmit={event => { event.preventDefault(); apply('request_price_change', { amount: Number(priceAmount), scope: changeScope, reason: priceReason }); }} className="grid gap-3"><label className="block text-sm font-medium text-amber-950 dark:text-amber-100">Extra work<textarea required maxLength={2000} value={changeScope} onChange={event => setChangeScope(event.target.value)} rows={2} className={`${fields} mt-1.5`} placeholder="What additional work is needed?" /></label><label className="block text-sm font-medium text-amber-950 dark:text-amber-100">Why is it needed?<textarea required maxLength={1000} value={priceReason} onChange={event => setPriceReason(event.target.value)} rows={2} className={`${fields} mt-1.5`} placeholder="Explain what you found" /></label><label className="block text-sm font-medium text-amber-950 dark:text-amber-100">Additional cost ({currency})<input type="number" min="0.01" step="0.01" required value={priceAmount} onChange={event => setPriceAmount(event.target.value)} className={`${fields} mt-1.5`} placeholder="For example, 120.00" /></label><button disabled={busy || !priceAmount || !changeScope.trim() || !priceReason.trim()} className="min-h-11 w-fit rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Ask Client to approve extra work</button></form>}</section><ActionButton secondary disabled={busy || Boolean(record.pendingPriceChange)} onClick={() => apply('complete_work')}>Mark work complete</ActionButton></div>}
     {record.pendingPriceChange && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"><p className="font-semibold">Additional work awaiting approval Â· {dollars(record.pendingPriceChange.amount, currency)}</p><p className="mt-1">{record.pendingPriceChange.scope}</p><p className="mt-1 text-xs">Reason: {record.pendingPriceChange.reason}. Continue only with the original request until the Client responds.</p></div>}
    {['awaiting_provider_bill', 'bill_rejected'].includes(record.status) && <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#303a4c] dark:bg-[#252b3b]"><div><h3 className="font-semibold text-gray-950 dark:text-slate-100">Submit final bill</h3><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Enter the amount for the completed work. The Client will review a clear cost breakdown and accept or reject it.</p></div>{record.billRejection?.note && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">Clientâ€™s optional note: {record.billRejection.note}</p>}<p className="rounded-xl bg-white p-3 text-sm dark:bg-[#1a1f2e]">The Clientâ€™s suggested range is optional guidance, not a price cap. Any added work must be approved before you do it.</p><form onSubmit={event => { event.preventDefault(); apply('submit_bill', { amount: Number(billAmount), clientPurchasedMaterialsAmount: Number(materialsAmount), note: billNote.trim() }); }} className="grid gap-3"><label className="block text-sm font-medium text-gray-800 dark:text-slate-200">Final Provider work amount ({currency})<input type="number" min="0.01" step="0.01" required value={billAmount} onChange={event => setBillAmount(event.target.value)} className={`${fields} mt-1.5`} /></label><label className="block text-sm font-medium text-gray-800 dark:text-slate-200">Client-paid materials to exclude ({currency}, optional)<input type="number" min="0" step="0.01" value={materialsAmount} onChange={event => setMaterialsAmount(event.target.value)} className={`${fields} mt-1.5`} /></label><label className="block text-sm font-medium text-gray-800 dark:text-slate-200">Note for Client (optional)<textarea maxLength={2000} value={billNote} onChange={event => setBillNote(event.target.value)} rows={2} className={`${fields} mt-1.5`} placeholder="Optional: explain the work or a cost" /></label><button disabled={busy || !billAmount} className="min-h-11 w-fit rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{record.status === 'bill_rejected' ? 'Send revised bill' : 'Send bill to Client'}</button></form></div>}
    {record.providerBill && <div className="rounded-xl border border-gray-100 p-4 dark:border-[#303a4c]"><p className="mb-3 text-sm font-semibold text-gray-800 dark:text-slate-200">Bill version {record.providerBill.version || 1} Â· {label(record.providerBill.status || 'submitted')}</p><Invoice bill={record.providerBill} currency={currency} /></div>}
    {record.providerBillHistory?.length > 1 && <details className="rounded-xl border border-gray-200 p-4 text-sm dark:border-[#394458]"><summary className="cursor-pointer font-semibold">Previous bill versions ({record.providerBillHistory.length - 1})</summary><ol className="mt-3 space-y-2">{record.providerBillHistory.slice(0, -1).map(itei => <li key={itei.version} className="rounded-lg bg-gray-50 p-3 dark:bg-[#252b3b]">Version {itei.version} Â· {dollars(itei.payableAmount, currency)} Â· {label(itei.status)}{itei.clientDecisionReason && <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Client: {itei.clientDecisionReason}</p>}</li>)}</ol></details>}
    {['payment_failed', 'payment_delayed', 'paid', 'completed'].includes(record.status) && <p className="text-sm text-gray-600 dark:text-slate-400">Payment: {label(record.paymentStatus)} Â· Payout: {label(record.providerPayoutStatus)}</p>}
  </div>;
};

const INSPECTION_CHECKLIST = [
  ['access_reviewed', 'Access and work area reviewed'],
  ['hazards_reviewed', 'Likely site hazards reviewed'],
  ['materials_reviewed', 'Likely materials and equipment identified'],
  ['qualifications_reviewed', 'Required Provider skmlls or licence considered'],
  ['client_expectations_confirmed', 'Client expectations clarified'],
];
const asLocalDateTime = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
const minimumVisitTime = () => asLocalDateTime(new Date(Date.now() + 5 * 60 * 1000).toISOString());

const InspectorActions = ({ record, busy, apply }) => {
  const inspection = record.inspection || {};
  const [visitAt, setVisitAt] = useState(asLocalDateTime(record.inspectionVisit?.scheduledAt));
  const [visitNotes, setVisitNotes] = useState(record.inspectionVisit?.notes || '');
  const [findings, setFindings] = useState(inspection.findings || '');
  const [scope, setScope] = useState(inspection.scope || record.scope || '');
  const [feasibility, setFeasibility] = useState(inspection.feasibility || 'feasible');
  const [feasibilityNotes, setFeasibilityNotes] = useState(inspection.feasibilityNotes || '');
  const [safetyStatus, setSafetyStatus] = useState(inspection.safetyStatus || 'no_known_concern');
  const [safetyNotes, setSafetyNotes] = useState(inspection.safetyNotes || '');
  const [checklist, setChecklist] = useState(inspection.checklist || []);
  const [evidence, setEvidence] = useState(inspection.evidence || []);
  const [evidenceError, setEvidenceError] = useState('');
  const [reportError, setReportError] = useState('');
  const reportable = ['inspector_assigned', 'inspection_scheduled'].includes(record.status);

  const handleEvidence = event => {
    const selected = [...(event.target.files || [])];
    if (selected.length + evidence.length > 6) {
      setEvidenceError('Add up to 6 evidence files. Remove one before adding more.');
      event.target.value = '';
      return;
    }
    const oversized = selected.find(file => file.size > 10 * 1024 * 1024);
    if (oversized) {
      setEvidenceError(`${oversized.name} is over the 10 MB upload limit.`);
      event.target.value = '';
      return;
    }
    setEvidenceError('');
    setEvidence(current => [...current, ...selected.map(file => ({ name: file.name, type: file.type, size: file.size }))]);
    event.target.value = '';
  };
  const toggleChecklist = value => setChecklist(current => current.includes(value) ? current.filter(itei => itei !== value) : [...current, value]);
  const submitReport = async event => {
    event.preventDefault();
    setReportError('');
    const saved = await apply('record_inspection', { findings, scope, feasibility, feasibilityNotes, safetyStatus, safetyNotes, checklist, evidence });
    if (!saved) setReportError('The report could not be saved. Review the form and try again.');
  };
  const scheduleVisit = event => {
    event.preventDefault();
    const date = new Date(visitAt);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return;
    apply('schedule_inspection', { scheduledAt: date.toISOString(), notes: visitNotes });
  };

  return <div className="space-y-5">
    {reportable && <>
      <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div><h3 className="font-semibold text-gray-950 dark:text-slate-100">Site visit schedule</h3><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Record or update when you plan to attend. You can still submit an assessment without a scheduled visit.</p></div>
        {record.inspectionVisit?.scheduledAt && <p className="mt-3 rounded-lg bg-white p-3 text-sm font-medium text-blue-900 dark:bg-[#1a1f2e] dark:text-blue-100">Current visit: {new Date(record.inspectionVisit.scheduledAt).toLocaleString()}{record.inspectionVisit.notes ? ` Â· ${record.inspectionVisit.notes}` : ''}</p>}
        <form onSubmit={scheduleVisit} className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Visit date and time<input required type="datetime-local" min={minimumVisitTime()} value={visitAt} onChange={event => setVisitAt(event.target.value)} className={`${fields} mt-1`} /></label>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Visit note (optional)<input maxLength={300} value={visitNotes} onChange={event => setVisitNotes(event.target.value)} className={`${fields} mt-1`} placeholder="For example, Client prefers a morning visit" /></label>
          <ActionButton disabled={busy || !visitAt || new Date(visitAt).getTime() <= Date.now()}>{busy ? 'Savingâ€¦' : record.inspectionVisit?.scheduledAt ? 'Update visit' : 'Schedule visit'}</ActionButton>
        </form>
      </section>

      <form onSubmit={submitReport} className="space-y-4">
        <div><h3 className="font-semibold text-gray-950 dark:text-slate-100">Assessment report</h3><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">This report goes to LUCID for review. A feasible scope remains proposed until Admin confirms it.</p></div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Inspection findings<textarea required maxLength={4000} value={findings} onChange={event => setFindings(event.target.value)} rows={4} className={`${fields} mt-1`} placeholder="What did you observe at the site?" /></label>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Feasibility outcome<select required value={feasibility} onChange={event => setFeasibility(event.target.value)} className={`${fields} mt-1`}><option value="feasible">Feasible</option><option value="feasible_with_conditions">Feasible with conditions</option><option value="not_feasible">Not feasible</option></select></label>
        {feasibility !== 'feasible' && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Conditions or reason required<textarea required maxLength={2000} value={feasibilityNotes} onChange={event => setFeasibilityNotes(event.target.value)} rows={3} className={`${fields} mt-1`} placeholder={feasibility === 'not_feasible' ? 'Explain why this request cannot safely or practically proceed.' : 'Describe the conditions LUCID must address before assigning a Provider.'} /></label>}
        {feasibility !== 'not_feasible' && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Proposed work scope<textarea required maxLength={3000} value={scope} onChange={event => setScope(event.target.value)} rows={3} className={`${fields} mt-1`} placeholder="Describe the work this inspection supports." /></label>}
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Site safety status<select required value={safetyStatus} onChange={event => setSafetyStatus(event.target.value)} className={`${fields} mt-1`}><option value="no_known_concern">No known safety concern</option><option value="precautions_required">Precautions required</option><option value="unsafe_stop">Unsafe â€” stop and escalate</option></select></label>
        {safetyStatus !== 'no_known_concern' && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Safety notes required<textarea required maxLength={2000} value={safetyNotes} onChange={event => setSafetyNotes(event.target.value)} rows={3} className={`${fields} mt-1`} placeholder="Describe the hazard, precaution, or escalation taken." /></label>}

        <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-[#394458]"><legend className="px-1 text-sm font-semibold text-gray-800 dark:text-slate-200">Inspection checklist</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{INSPECTION_CHECKLIST.map(([value, text]) => <label key={value} className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-[#252b3b] dark:text-slate-200"><input type="checkbox" checked={checklist.includes(value)} onChange={() => toggleChecklist(value)} className="mt-0.5 accent-blue-600" />{text}</label>)}</div></fieldset>

        <section className="rounded-xl border border-gray-200 p-4 dark:border-[#394458]"><label className="block text-sm font-semibold text-gray-800 dark:text-slate-200" htmlFor="inspector-evidence">Evidence references (optional)</label><input id="inspector-evidence" type="file" accept="image/*,.pdf" multiple onChange={handleEvidence} className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-800 dark:text-slate-300 dark:file:bg-blue-950/40 dark:file:text-blue-200" /><p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Evidence files are uploaded to secure storage with access limited to this case. Up to 6 files, 10 MB each.</p>{evidenceError && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{evidenceError}</p>}{evidence.length > 0 && <ul className="mt-3 space-y-2">{evidence.map((itei, index) => <li key={`${itei.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-[#252b3b]"><span className="min-w-0 break-all">{itei.name} <span className="text-xs text-gray-500">({Math.max(1, Math.round(itei.size / 1024))} KB)</span></span><button type="button" onClick={() => setEvidence(current => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-rose-700 hover:underline dark:text-rose-300">Remove</button></li>)}</ul>}</section>
        {reportError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{reportError}</p>}
        <button disabled={busy || !findings.trim() || (feasibility !== 'feasible' && !feasibilityNotes.trim()) || (feasibility !== 'not_feasible' && !scope.trim()) || (safetyStatus !== 'no_known_concern' && !safetyNotes.trim())} className="min-h-11 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Submitting reportâ€¦' : 'Submit assessment to LUCID'}</button>
      </form>
    </>}

    {record.inspection && <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-[#394458]"><div><h3 className="font-semibold text-gray-950 dark:text-slate-100">Submitted inspection report</h3><p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Submitted {record.inspection.submittedAt ? new Date(record.inspection.submittedAt).toLocaleString() : 'on record'}. LUCID reviews the feasibility and confirms the final scope.</p></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><SummaryRow label="Feasibility" value={label(record.inspection.feasibility || 'feasible')} /><SummaryRow label="Safety" value={label(record.inspection.safetyStatus || 'no known concern')} /><div className="sm:col-span-2"><SummaryRow label="Findings" value={record.inspection.findings || 'No findings recorded'} /></div>{record.inspection.scope && <div className="sm:col-span-2"><SummaryRow label="Proposed scope" value={record.inspection.scope} /></div>}</dl>{record.inspection.feasibilityNotes && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">Feasibility notes: {record.inspection.feasibilityNotes}</p>}{record.inspection.safetyNotes && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-950 dark:bg-rose-950/20 dark:text-rose-100">Safety notes: {record.inspection.safetyNotes}</p>}{record.inspection.checklist?.length > 0 && <p className="text-xs text-gray-600 dark:text-slate-400">Checklist completed: {record.inspection.checklist.map(value => INSPECTION_CHECKLIST.find(([itei]) => itei === value)?.[1] || value).join(' Â· ')}</p>}{record.inspection.evidence?.length > 0 && <ul className="space-y-1 text-sm text-gray-700 dark:text-slate-300">{record.inspection.evidence.map((itei, index) => <li key={`${itei.name}-${index}`}>Evidence reference: {itei.name}</li>)}</ul>}</section>}
    {record.status === 'work_in_progress' && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">Your preliminary assessment is complete. Provider work and Client payment continue without Inspector bill approval.</p>}
    {!reportable && !record.inspection && record.status !== 'work_in_progress' && <p className="text-sm text-gray-600 dark:text-slate-400">Assessment actions are available only for cases assigned to this Inspector and awaiting inspection.</p>}
  </div>;
};

const AdminActions = ({ record, scope, setScope, reason, setReason, busy, apply, services, userId }) => {
  const [inspectors, setInspectors] = useState([]);
  const [providers, setProviders] = useState([]);
  const [currentInspector, setCurrentInspector] = useState(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [showOutsideRadius, setShowOutsideRadius] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [reassignmentReason, setReassignmentReason] = useState('');
  const [bypassReason, setBypassReason] = useState('');
  const [proposedDescription, setProposedDescription] = useState(record.description || record.scope || '');
  const [proposedLocation, setProposedLocation] = useState(record.locationSummary || '');
  const [proposalReason, setProposalReason] = useState('');
  const [inspectorCandidateError, setInspectorCandidateError] = useState('');
  const [providerCandidateError, setProviderCandidateError] = useState('');
  const [inspectorsLoading, setInspectorsLoading] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [showDistantProviders, setShowDistantProviders] = useState(false);
  const [providerOverrideReason, setProviderOverrideReason] = useState('');
  const [providersLoading, setProvidersLoading] = useState(false);

  useEffect(() => {
    if (!['submitted', 'inspector_assigned'].includes(record.status)) return;
    let active = true;
    setInspectorsLoading(true);
    setInspectorCandidateError('');
    Promise.all([
      services.assignments.searchEligible({ caseId: record.id, serviceId: record.serviceId, role: 'admin', userId }),
      services.operations.listDirectory({ role: 'admin', userId }),
    ]).then(([result, directory]) => {
      if (!active) return;
      if (result.error) setInspectorCandidateError(result.error.message);
      else setInspectors(result.data || []);
      setCurrentInspector((directory.data || []).find(person => person.id === record.assignedInspectorId) || null);
    }).catch(error => { if (active) setInspectorCandidateError(error.message || 'Inspector candidates could not be loaded.'); }).finally(() => { if (active) setInspectorsLoading(false); });
    return () => { active = false; };
  }, [services, record.id, record.status, record.assignedInspectorId, record.serviceId, userId]);

  useEffect(() => {
    if (!['scope_confirmed', 'provider_declined', 'inspector_bypass_approved'].includes(record.status)) {
      setProviders([]);
      setSelectedProviderId('');
      setProvidersLoading(false);
      return;
    }
    let active = true;
    setProvidersLoading(true);
    setProviderCandidateError('');
    services.assignments.searchProviderCandidates({ caseId: record.id, serviceId: record.serviceId, preferVerifiedCredential: Boolean(record.preferVerifiedCredential), role: 'admin', userId })
      .then(result => {
        if (!active) return;
        if (result.error) setProviderCandidateError(result.error.message);
        else setProviders(result.data || []);
      })
      .catch(error => { if (active) setProviderCandidateError(error.message || 'Provider candidates could not be loaded.'); })
      .finally(() => { if (active) setProvidersLoading(false); });
    return () => { active = false; };
  }, [services, record.id, record.status, record.serviceId, record.preferVerifiedCredential, userId]);

  const nearby = inspectors.filter(itei => itei.distanceKm <= 25);
  const outside = inspectors.filter(itei => itei.distanceKm > 25);
  const selectedInspector = inspectors.find(itei => itei.id === selectedInspectorId);
  const needsOverride = Boolean(selectedInspector && selectedInspector.distanceKm > 25);
  const providerMatches = rankCredentialMatch(providers.filter(itei => { const serviceIds = itei.serviceIds || itei.services || []; const serviceMatches = !record.serviceId || serviceIds.includes(record.serviceId); const searchMatches = `${itei.displayName} ${itei.homeCity || ''} ${itei.region || ''} ${(itei.categories || []).join(' ')}`.toLocaleLowerCase().includes(providerSearch.trim().toLocaleLowerCase()); return serviceMatches && searchMatches; }), record.serviceId, Boolean(record.preferVerifiedCredential));
  const nearbyProviders = providerMatches.filter(itei => itei.withinDefaultRadius);
  const distantProviders = providerMatches.filter(itei => !itei.withinDefaultRadius);
  const visibleProviders = [...nearbyProviders, ...(showDistantProviders ? distantProviders : [])];
  const selectedProvider = providers.find(itei => itei.id === selectedProviderId);
  const selectedProviderCredential = selectedProvider?.credentials?.find(credential => isCurrentVerifiedCredential(credential, record.serviceId));
  const providerNeedsOverride = Boolean(selectedProvider && !selectedProvider.withinDefaultRadius);
  const assignProvider = () => {
    if (!selectedProvider) return;
    if (providerNeedsOverride && !window.confirm(`Assign ${selectedProvider.displayName} from about ${selectedProvider.distanceKm} km away? Your reason will be saved to the case history.`)) return;
    apply('offer_provider', { providerId: selectedProvider.id, distanceKm: selectedProvider.distanceKm, overrideReason: providerOverrideReason.trim() });
  };

  return (
    <div className="space-y-5">
      {(record.status === 'submitted' || record.status === 'needs_information') && <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-[#394458]">
        <div><h3 className="font-semibold text-gray-900 dark:text-slate-100">Review and propose request edits</h3><p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Changes stay pending until the Client accepts them. The original submission remains in the case history.</p></div>
        {record.requestAmendment?.status === 'pending' ? <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"><p className="font-semibold">Waiting for Client acknowledgement</p><p className="mt-1">Reason: {record.requestAmendment.reason}</p>{Object.entries(record.requestAmendment.proposed).map(([key, value]) => <div key={key} className="mt-2 grid gap-1 border-t border-amber-200 pt-2 dark:border-amber-800 sm:grid-cols-2"><p><span className="font-semibold">Current:</span> {String(record.requestAmendment.original[key] || 'Not provided')}</p><p><span className="font-semibold">Proposed:</span> {String(value || 'Not provided')}</p></div>)}</div> : <form onSubmit={event => { event.preventDefault(); apply('aiend_request', { patch: { description: proposedDescription.trim(), scope: proposedDescription.trim(), locationSummary: proposedLocation.trim() }, reason: proposalReason.trim() }); }} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Request description<textarea required maxLength={4000} value={proposedDescription} onChange={event => setProposedDescription(event.target.value)} rows={3} className={`${fields} mt-1`} /></label>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Broad location summary<input value={proposedLocation} onChange={event => setProposedLocation(event.target.value)} className={`${fields} mt-1`} /></label>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Why does this need to change?<textarea required maxLength={1000} value={proposalReason} onChange={event => setProposalReason(event.target.value)} rows={2} className={`${fields} mt-1`} placeholder="Explain the proposed correction or clarification" /></label>
          <ActionButton type="submit" disabled={busy || !proposalReason.trim()}>Send proposed edits to Client</ActionButton>
        </form>}
      </section>}

      {['submitted', 'inspector_assigned'].includes(record.status) && <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-[#394458]">
        <div><h3 className="font-semibold text-gray-900 dark:text-slate-100">{record.status === 'inspector_assigned' ? 'Inspector assignment' : 'Assign an Inspector'}</h3><p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Eligible candidates, distance, availability, and assignment capacity must be supplied by the assignment service.</p></div>
        {record.status === 'inspector_assigned' && currentInspector?.accountStatus === 'active' ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">{currentInspector.name} is active and assigned to this request.</p> : record.requestAmendment?.status === 'pending' ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">Assignment is paused until the Client acknowledges the proposed request edits.</p> : <>
          {record.status === 'inspector_assigned' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">The assigned Inspector is unavailable. Choose a replacement; the previous assignment and reason will remain in the audit history.</p>}
          {inspectorCandidateError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{inspectorCandidateError}</p>}
          {!inspectorsLoading && !inspectorCandidateError && nearby.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">No eligible Inspector was found within 25 km. Expand the search to view farther candidates.</p>}
          <div className="space-y-2">{[...nearby, ...(showOutsideRadius ? outside : [])].map(candidate => <label key={candidate.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:border-primary dark:border-[#394458]"><input type="radio" name="inspectorCandidate" value={candidate.id} checked={selectedInspectorId === candidate.id} onChange={() => setSelectedInspectorId(candidate.id)} className="mt-1 accent-blue-600" /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2 font-medium text-gray-900 dark:text-slate-100"><span>{candidate.displayName}</span><span className="text-xs text-gray-500 dark:text-slate-400">~{candidate.distanceKm} km Â· {candidate.availability}</span></span><span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">{candidate.homeCity} Â· {candidate.categories.find(category => category.toLowerCase() === String(record.category || '').toLowerCase()) || record.category}</span></span></label>)}</div>
          {outside.length > 0 && <div className="mb-2"><button type="button" onClick={() => setShowOutsideRadius(value => !value)} className="min-h-10 rounded-lg px-2 text-left text-sm font-semibold text-primary hover:bg-blue-50 hover:underline dark:hover:bg-blue-950/30">{showOutsideRadius ? 'Hide farther candidates' : 'Expand search beyond 25 km'}</button></div>}
          {record.status === 'inspector_assigned' && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Why does this Inspector need to be replaced?<textarea required maxLength={1000} value={reassignmentReason} onChange={event => setReassignmentReason(event.target.value)} rows={2} className={`${fields} mt-1`} placeholder="For example, the assigned Inspector's account was suspended" /></label>}
          {needsOverride && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Reason for assigning outside the 25 km range<textarea required maxLength={1000} value={overrideReason} onChange={event => setOverrideReason(event.target.value)} rows={2} className={`${fields} mt-1`} placeholder="Record why this Inspector is the best available option" /></label>}
          <ActionButton disabled={busy || !selectedInspector || (needsOverride && !overrideReason.trim()) || (record.status === 'inspector_assigned' && !reassignmentReason.trim())} onClick={() => apply('assign_inspector', { inspectorId: selectedInspector.id, distanceKm: selectedInspector.distanceKm, searchRadiusKm: 25, overrideReason, reassignmentReason })}>{record.status === 'inspector_assigned' ? 'Reassign to selected Inspector' : 'Assign selected Inspector'}</ActionButton>
          {!inspectorsLoading && !inspectorCandidateError && inspectors.length === 0 && !record.inspection?.submittedAt && !record.inspection?.findings && record.requestAmendment?.status !== 'pending' && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="text-sm font-semibold text-amber-950 dark:text-amber-100">No eligible Inspector is available in the full search.</p><p className="text-xs leading-5 text-amber-900 dark:text-amber-200">Ask the Client once whether they agree to continue without a preliminary Inspector. If they agree, this case becomes ready for Provider assignment with no further Client form.</p><label className="block text-sm font-medium text-amber-950 dark:text-amber-100">Why is an Inspector unavailable?<textarea required maxLength={1000} value={bypassReason} onChange={event => setBypassReason(event.target.value)} rows={2} className={`${fields} mt-1`} placeholder="For example, no qualified Inspector can take this case" /></label><ActionButton secondary disabled={busy || !bypassReason.trim()} onClick={() => apply('request_inspector_bypass', { reason: bypassReason.trim() })}>Ask Client to proceed without an Inspector</ActionButton></div>}
        </>}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-[#303a4c]"><label className="sr-only" htmlFor="admin-request-question">Clarification question</label><input id="admin-request-question" value={reason} onChange={event => setReason(event.target.value)} placeholder="Question for the Client" className={fields} /><ActionButton secondary disabled={busy || !reason.trim()} onClick={() => apply('request_information', { message: reason.trim() })}>Request more information</ActionButton></div>
      </section>}

      {record.status === 'inspector_bypass_pending' && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20"><h3 className="font-semibold text-amber-950 dark:text-amber-100">Waiting for the Clientâ€™s Inspector decision</h3><p className="mt-1 text-amber-900 dark:text-amber-200">The Client can approve or decline from themr case page. If they approve, this case returns here ready for Provider assignment without another Client form.</p></section>}{record.status === 'inspection_reported' && record.inspection?.feasibility !== 'not_feasible' && <div className="space-y-3"><label className="block text-sm text-gray-700 dark:text-slate-300">Admin-confirmed scope<textarea className={`${fields} mt-1.5`} rows={3} value={scope} onChange={event => setScope(event.target.value)} /></label><div className="flex flex-wrap gap-2"><ActionButton disabled={busy || !scope.trim()} onClick={() => apply('confirm_scope', { scope })}>Confirm scope</ActionButton></div></div>}
      {record.status === 'inspection_reported' && record.inspection?.feasibility === 'not_feasible' && <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><div><h3 className="font-semibold text-amber-950 dark:text-amber-100">Inspector marked this request not feasible</h3><p className="mt-1 text-sm text-amber-900 dark:text-amber-200">Provider assignment is blocked. Review the report and record the closure reason for the Client.</p></div><label className="block text-sm font-medium text-amber-950 dark:text-amber-100">Closure reason<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} rows={2} className={`${fields} mt-1`} placeholder="Explain why the request cannot proceed." /></label><ActionButton disabled={busy || !reason.trim()} onClick={() => apply('mark_not_feasible', { reason: reason.trim() })}>Close request as not feasible</ActionButton></section>}
      {['scope_confirmed', 'provider_declined', 'inspector_bypass_approved'].includes(record.status) && <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/10">
        <div><h3 className="font-semibold text-gray-900 dark:text-slate-100">Find and assign a Provider</h3><p className="mt-1 text-xs leading-5 text-gray-600 dark:text-slate-400">Suggested matches support this request category and are sorted by estimated distance. Provider identities remain private from the Client.</p></div>
        {record.status === 'inspector_bypass_approved' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">The Client agreed to proceed without a preliminary Inspector. The request details are the approved starting scope; the Provider will assess site conditions after accepting. No further Client form is required.</p>}
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Search Providers<input value={providerSearch} onChange={event => setProviderSearch(event.target.value)} className={`${fields} mt-1`} placeholder="Name, service, city or region" /></label>{record.preferVerifiedCredential && <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">The Client prefers a relevant LUCID-verified credential. Suitable matches are shown first when available; you can still assign the best suitable Provider if no verified match is available.</p>}{selectedProvider && selectedProviderCredential && <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">The selected Provider has a current LUCID-verified credential linked to this service.</p>}
        {providerCandidateError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{providerCandidateError}</p>}
        {providersLoading && <p role="status" className="rounded-lg bg-white p-3 text-sm text-gray-700 dark:bg-[#252b3b] dark:text-slate-200">Searching available Providers...</p>}
        {!providersLoading && !providerCandidateError && providers.length === 0 && <p className="rounded-lg bg-white p-3 text-sm text-gray-700 dark:bg-[#252b3b] dark:text-slate-200">No available Provider matches this category right now. Review the request category or search the broader roster from the Workers section.</p>}
        {providers.length > 0 && visibleProviders.length === 0 && <p className="rounded-lg bg-white p-3 text-sm text-gray-700 dark:bg-[#252b3b] dark:text-slate-200">No Providers match that search. Try a name, service category, city, or region.</p>}
        <div className="grid gap-2 sm:grid-cols-2">{visibleProviders.map(candidate => <label key={candidate.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-primary dark:border-[#394458] dark:bg-[#252b3b]"><input type="radio" name={`provider-${record.id}`} checked={selectedProviderId === candidate.id} onChange={() => { setSelectedProviderId(candidate.id); setProviderOverrideReason(''); }} className="mt-1 accent-blue-600"/><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2 font-medium text-gray-900 dark:text-slate-100"><span>{candidate.displayName}</span><span className="text-xs text-gray-500 dark:text-slate-400">~{candidate.distanceKm} km</span></span><span className="mt-1 block text-xs text-gray-600 dark:text-slate-400">{candidate.categories.join(', ')} Â· {candidate.homeCity || candidate.region || 'Area not set'}</span><span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">{candidate.availability} Â· {candidate.assignmentCapacity} capacity Â· {candidate.reviewCount ? `${candidate.averageRating}/5 (${candidate.reviewCount} reviews)` : 'No ratings yet'}</span></span></label>)}</div>
        {distantProviders.length > 0 && <button type="button" onClick={() => setShowDistantProviders(value => !value)} className="min-h-10 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-blue-50 hover:underline dark:hover:bg-blue-950/30">{showDistantProviders ? 'Show nearby matches only' : `Expand search beyond 25 km (${distantProviders.length})`}</button>}
        {providerNeedsOverride && <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Reason for assigning outside 25 km<textarea required maxLength={1000} value={providerOverrideReason} onChange={event => setProviderOverrideReason(event.target.value)} rows={2} className={`${fields} mt-1`} placeholder="Explain why this Provider is the best available match" /></label>}
        <ActionButton disabled={busy || !selectedProvider || (providerNeedsOverride && !providerOverrideReason.trim())} onClick={assignProvider}>{record.status === 'provider_declined' ? 'Send offer to selected Provider' : 'Assign selected Provider'}</ActionButton>
      </section>}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3">
        <Link to="/lucid/messages" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-blue-50 hover:underline dark:hover:bg-blue-950/30"><MessageSquareText className="h-4 w-4 shrink-0" aria-hidden="true" />Open role-authorized messages</Link>
      </div>
      {record.status === 'payment_delayed' && <ActionButton disabled={busy} onClick={() => apply('confirm_delayed_payment')}>Record verified payment status</ActionButton>}
      {record.status === 'disputed' && <div className="space-y-2"><label className="block text-sm text-gray-700 dark:text-slate-300">Resolution note<textarea className={`${fields} mt-1.5`} rows={2} value={reason} onChange={event => setReason(event.target.value)} /></label><ActionButton disabled={busy} onClick={() => apply('resolve_dispute', { decision: 'resolved', reason })}>Resolve and return to Client</ActionButton></div>}
      {record.status === 'refund_pending' && <div className="flex flex-wrap gap-2"><ActionButton disabled={busy} onClick={() => apply('decide_refund', { decision: 'approved', reason: reason || 'Approved after review.' })}>Approve refund</ActionButton><ActionButton secondary disabled={busy} onClick={() => apply('decide_refund', { decision: 'rejected', reason: reason || 'Rejected after review.' })}>Reject refund</ActionButton></div>}
      <p className="pt-1 text-xs text-gray-500 dark:text-slate-400">Routine Provider bills do not require staff approval.</p>
    </div>
  );
};

export default ManagedCaseDetailPage;
