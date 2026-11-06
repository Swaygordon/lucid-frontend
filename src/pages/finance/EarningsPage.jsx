import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Wallet } from 'lucide-react';
import { useNavigateBack } from '../../hooks/useNavigateBack.js';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import PayoutSetupPanel from '../../components/finance/PayoutSetupPanel.jsx';

export default function EarningsPayments() {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const goBack = useNavigateBack('/lucid/dashboard', 600);
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      services.finance.getEarningsSummary({ role: actor.role, userId: actor.userId }),
      services.finance.listEntries({ role: actor.role, userId: actor.userId }),
    ]).then(([summaryResult, entryResult]) => {
      if (!active) return;
      const failures = [summaryResult.error, entryResult.error].filter(Boolean);
      if (failures.length) setError(failures[0].message);
      else { setSummary(summaryResult.data); setEntries(entryResult.data || []); }
    }).catch(cause => active && setError(cause.message || 'Financial information could not be loaded.'));
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  const exportCsv = () => {
    const headers = ['Date', 'Case', 'Type', 'Amount', 'Currency', 'Status'];
    const rows = entries.map(item => [item.at || item.createdAt || '', item.caseId || '', item.type || '', item.amount ?? '', item.currency || 'GHS', item.status || '']);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6">
    <div className="mx-auto max-w-6xl space-y-6">
      <button type="button" onClick={goBack} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={18}/>Back</button>
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Provider workspace</p><h1 className="mt-1 text-3xl font-bold text-gray-950 dark:text-slate-100">Earnings and payouts</h1><p className="mt-2 text-gray-600 dark:text-slate-400">Review confirmed earnings, payout status, and financial history.</p></div><Link to="/lucid/transactions" className="text-sm font-semibold text-primary hover:underline">View transactions</Link></header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">{error}</p>}
      <PayoutSetupPanel services={services} role={actor.role} userId={actor.userId}/>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['This month', summary?.thisMonth], ['Pending', summary?.pending], ['Available for payout', summary?.available], ['Paid out', summary?.paidOut]].map(([title, amount]) => <article key={title} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e]"><p className="text-sm text-gray-600 dark:text-slate-400">{title}</p><p className="mt-2 text-2xl font-bold text-gray-950 dark:text-slate-100">{amount == null ? '—' : `GHS ${Number(amount).toFixed(2)}`}</p></article>)}</section>
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-gray-950 dark:text-slate-100">Financial history</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Payout and case-related entries recorded for your account.</p></div><button type="button" onClick={exportCsv} disabled={!entries.length} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50 dark:border-[#394458] dark:text-slate-100"><Download size={16}/>Export CSV</button></div>
        {entries.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-3">Date</th><th>Case</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{entries.map(item => <tr key={item.id} className="border-b border-gray-100 dark:border-[#303a4c]"><td className="py-3">{item.at || item.createdAt ? new Date(item.at || item.createdAt).toLocaleDateString() : '—'}</td><td>{item.caseId || '—'}</td><td>{String(item.type || 'entry').replaceAll('_', ' ')}</td><td>{item.currency || 'GHS'} {Number(item.amount || 0).toFixed(2)}</td><td>{item.status || '—'}</td></tr>)}</tbody></table></div> : !error && <div className="mt-5 rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300"><Wallet className="mx-auto mb-2 h-5 w-5"/>No financial records are available.</div>}
      </section>
    </div>
  </main>;
}
