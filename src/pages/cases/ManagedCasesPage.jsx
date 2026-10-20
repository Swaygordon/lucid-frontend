import React, { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import ManagedCaseConversation from '../../components/cases/ManagedCaseConversation.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const CASE_STATUS_LABELS = {
  submitted: 'Received by LUCID',
  needs_information: 'Waiting for your information',
  request_confirmed: 'Request confirmed',
  inspector_assigned: 'Inspector assigned',
  inspection_scheduled: 'Inspection scheduled',
  inspection_reported: 'Inspection complete',
  scope_confirmed: 'Scope confirmed',
  scope_and_range_confirmed: 'Scope confirmed',
  provider_offer_pending: 'LUCID is arranging a provider',
  provider_assignment_confirmed: 'Provider assigned',
  work_in_progress: 'Work in progress',
  work_ready: 'Work ready for review',
  final_invoice_pending_validation: 'LUCID is reviewing the final bill',
  final_invoice_pending_client: 'Your approval is needed',
  final_invoice_approved: 'Final amount approved',
  payment_pending: 'Payment pending',
  payment_confirmed: 'Payment received',
  inspector_final_check: 'Final inspection',
  completed: 'Completed',
  offer_sent: 'Provider offer sent',
  provider_declined: 'LUCID is finding another Provider',
  accepted: 'Provider accepted',
  price_change_pending: 'Your approval is needed',
  awaiting_client_approval: 'Your bill is ready to review',
  awaiting_payment: 'Payment is due',
  payment_delayed: 'Payment confirmation is delayed',
  payment_failed: 'Payment did not complete',
  paid: 'Payment received',
  disputed: 'LUCID is reviewing your concern',
  refund_pending: 'Refund decision pending',
  cancelled_fee_due: 'Cancellation fee recovery',
  cancelled: 'Cancelled',
  resolved: 'Resolved',
};

const formatRange = item => {
  const min = Number(item.budget_min).toFixed(2);
  const max = Number(item.budget_max).toFixed(2);
  return `${item.currency} ${min} – ${item.currency} ${max}`;
};

const ManagedCases = () => {
  const { showNotification } = useNotification();
  const { mode, role, userId } = useWorkflowActor();
  const workflowServices = useWorkflowServices();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const handleCaseStatusChange = (caseId, status) => {
    setCases(current => current.map(item => item.id === caseId ? { ...item, status } : item));
  };

  useEffect(() => {
    let active = true;

    async function loadCases() {
      const { data, error } = await workflowServices.cases.listForRole({ role, userId });

      if (!active) return;

      if (error) {
        console.error('Unable to load managed cases:', error);
        setLoadError(true);
        showNotification('Your requests could not be loaded. Please try again.', 'error');
      } else {
        setCases((data || []).map(item => ({
          ...item,
          service_name: item.service_name || item.service,
          created_at: item.created_at || item.history?.[0]?.at,
          budget_min: item.budget_min ?? item.clientRange?.min,
          budget_max: item.budget_max ?? item.clientRange?.max,
          currency: item.currency || item.clientRange?.currency,
        })));
      }

      setLoading(false);
    }

    loadCases();
    return () => { active = false; };
  }, [showNotification, workflowServices, role, userId, mode]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-[#0f1117] sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Your LUCID service requests</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">My requests</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Follow the progress of requests you submitted to LUCID.</p>
          {mode === 'preview' && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">Sample workflow cases</span>}
        </header>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-400" role="status">
            Loading your requests…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e]">
            <p className="text-gray-700 dark:text-slate-300">We could not load your requests just now.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 font-semibold text-primary hover:underline">Try again</button>
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e]">
            <ClipboardList className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-gray-900 dark:text-slate-100">No requests yet</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Choose a service and send the details to LUCID.</p>
            <Link to="/lucid/services" className="mt-5 inline-flex font-semibold text-primary hover:underline">Browse services</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map(item => (
              <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{item.service_name}</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                      Case {item.id.slice(0, 8).toUpperCase()} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">Expected range: {formatRange(item)}</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                    {CASE_STATUS_LABELS[item.status] || 'In progress'}
                  </span>
                </div>
                <p className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-[#2d3748] dark:text-slate-400">
                  Your range is a budget expectation. LUCID will present the approved final amount before you pay.
                </p>
                {mode === 'preview' && <Link to={`/lucid/cases/${item.id}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Open full workflow <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                <ManagedCaseConversation caseId={item.id} status={item.status} onStatusChange={handleCaseStatusChange} />
              </article>
            ))}
          </div>
        )}

        <Link to="/lucid/services" className="mt-7 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
          Browse another service <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
};

export default ManagedCases;
