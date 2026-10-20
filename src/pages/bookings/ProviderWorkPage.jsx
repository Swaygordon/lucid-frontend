import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const ProviderWorkPage = () => {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const [cases, setCases] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    services.cases.listForRole({ role: actor.role, userId: actor.userId }).then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setCases(result.data || []);
    });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  return <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-[#0f1117] sm:px-6"><div className="mx-auto max-w-5xl">
    <p className="text-sm font-semibold uppercase tracking-wide text-primary">Provider workspace {actor.mode === 'preview' && '· Preview'}</p>
    <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">Assigned work</h1>
    <p className="mt-2 text-gray-600 dark:text-slate-400">Review offers, active work, client approvals, and payout status.</p>
    {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {!error && cases.length === 0 && <section className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e]"><BriefcaseBusiness className="mx-auto h-10 w-10 text-gray-400"/><p className="mt-3 font-semibold text-gray-900 dark:text-slate-100">No assigned work</p></section>}
    <div className="mt-6 space-y-4">{cases.map(item => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e]"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold text-gray-900 dark:text-slate-100">{item.service || item.service_name}</h2><p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Case {item.id} · {String(item.status).replaceAll('_',' ')}</p><p className="mt-2 text-sm text-gray-700 dark:text-slate-300">{item.confirmedScope || item.scope || 'Review the case details and assignment.'}</p></div><Link to={`/lucid/provider/work/${item.id}`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open work <ArrowRight className="h-4 w-4"/></Link></div></article>)}</div>
  </div></main>;
};

export default ProviderWorkPage;
