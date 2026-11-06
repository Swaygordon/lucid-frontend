// Shows only a fee obligation returned by the authenticated case service.
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

export default function CancellationFeeRecoveryBanner() {
  const { role, userId, isAuthenticated } = useWorkflowActor();
  const services = useWorkflowServices();
  const [feeCases, setFeeCases] = useState([]);
  const refresh = useCallback(async () => {
    if (!isAuthenticated || role !== 'client' || !userId) { setFeeCases([]); return; }
    const result = await services.cases.listForRole({ role, userId });
    if (!result.error) setFeeCases((result.data || []).filter(record => record.status === 'cancelled_fee_due' && !record.cancellationFeePaid));
  }, [isAuthenticated, role, userId, services]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    window.addEventListener('lucid:workflow-cases-updated', refresh);
    return () => {
      window.removeEventListener('lucid:workflow-cases-updated', refresh);
    };
  }, [refresh]);
  if (!feeCases.length) return null;
  const totalDue = feeCases.reduce((sum, item) => sum + Number(item.cancellationFeeDue || 0), 0);
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100" role="status">
    <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/><p className="text-sm">A cancellation fee is due for {feeCases.length} request{feeCases.length === 1 ? '' : 's'} (GHS {totalDue.toFixed(2)}). Other requests and messages remain available.</p></div>
    <Link to={`/lucid/cases/${feeCases[0].id}`} className="rounded-lg bg-amber-200 px-3 py-1.5 text-sm font-semibold hover:bg-amber-300 dark:bg-amber-800/70 dark:hover:bg-amber-800">Review fee</Link>
  </div>;
}
