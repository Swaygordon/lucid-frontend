// Backend contract: fetch only cases visible to the signed-in role, with server-side filters and pagination.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, ClipboardList, MessageSquareText, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import { CLIENT_CASE_FILTERS, getCasePresentation } from '../../services/workflow/casePresentation.js';
import FilterPills from '../../components/shared/FilterPills.jsx';

const dateLabel = value => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const money = (value, currency) => `${currency || 'GHS'} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusTone = group => ({
  needs_action: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100',
  closed: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-300',
  active: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100',
}[group] || 'border-gray-200 bg-gray-100 text-gray-700');

const ManagedCases = () => {
  const { role, userId } = useWorkflowActor();
  const services = useWorkflowServices();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await services.cases.listForRole({ role, userId });
      if (result.error) throw result.error;
      setCases((result.data || []).map(item => ({
        ...item,
        serviceName: item.service || item.service_name || 'Service request',
        createdAt: item.createdAt || item.created_at || item.history?.[0]?.at,
        range: item.clientRange || { min: item.suggested_range_min, max: item.suggested_range_max, currency: item.currency || 'GHS' },
      })));
    } catch (error) {
      console.error('Unable to load requests:', error);
      setLoadError(error.message || 'Your requests could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [services, role, userId]);

  useEffect(() => { loadCases(); }, [loadCases, refreshKey]);

  const counts = useMemo(() => cases.reduce((result, item) => {
    const group = getCasePresentation(item.status).group;
    result[group] = (result[group] || 0) + 1;
    return result;
  }, {}), [cases]);

  const visibleCases = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return cases.filter(item => {
      const presentation = getCasePresentation(item.status);
      const matchesFilter = filter === 'all' || presentation.group === filter;
      const matchesSearch = !normalizedSearch || [item.serviceName, item.category, item.id, item.locationSummary]
        .some(value => String(value || '').toLocaleLowerCase().includes(normalizedSearch));
      return matchesFilter && matchesSearch;
    }).sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
    });
  }, [cases, filter, search]);

  return (
    <main className="min-h-[75vh] bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e] sm:p-8">
          <p className="text-sm font-semibold text-primary">Client workspace</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-slate-100">My requests</h1><p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">See what is happening, who acts next, and where to continue each request.</p></div>
            <Link to="/lucid/services" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Request a service <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />My requests</p>
        </header>

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6" aria-label="Request filters">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills
              label="Filter requests by status"
              value={filter}
              onChange={setFilter}
              className="lg:w-auto"
              items={CLIENT_CASE_FILTERS.map(item => ({ value: item.id, label: item.label, count: item.id === 'all' ? cases.length : counts[item.id] || 0 }))}
            />
            <label className="relative block w-full lg:max-w-xs"><span className="sr-only">Search requests</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search service or reference" className="min-h-11 w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100" /></label>
          </div>
        </section>

        {loading ? <div role="status" className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-400">Loading your requests…</div>
          : loadError ? <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/50 dark:bg-[#1a1f2e]"><p role="alert" className="text-sm text-red-800 dark:text-red-200">{loadError}</p><button type="button" onClick={() => setRefreshKey(value => value + 1)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><RefreshCw size={15} aria-hidden="true" />Try again</button></section>
            : visibleCases.length === 0 ? <section className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#1a1f2e]"><ClipboardList className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" /><h2 className="mt-3 font-semibold text-gray-900 dark:text-slate-100">{cases.length ? 'No requests match these filters' : 'No requests yet'}</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{cases.length ? 'Try another status or search term.' : 'Choose a service and send the details to LUCID. Your requests will appear here.'}</p>{cases.length ? <button type="button" onClick={() => { setFilter('all'); setSearch(''); }} className="mt-4 font-semibold text-primary hover:underline">Clear filters</button> : <Link to="/lucid/services" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Browse services</Link>}</section>
              : <section className="mt-6 space-y-3" aria-label={`${visibleCases.length} requests`}>
                {visibleCases.map(item => {
                  const presentation = getCasePresentation(item.status);
                  const messageUrl = `/lucid/messages?conversation=${encodeURIComponent(`client-admin:${item.id}`)}&returnTo=${encodeURIComponent(`/lucid/cases/${item.id}`)}`;
                  return <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">{item.serviceName}</h2><span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(presentation.group)}`}>{presentation.label}</span></div><p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Ref. {item.id} <span aria-hidden="true">·</span> Submitted {dateLabel(item.createdAt)}</p><p className="mt-3 text-sm text-gray-700 dark:text-slate-300">{presentation.next}</p></div>
                      <div className="shrink-0 rounded-xl bg-gray-50 px-4 py-3 text-left sm:min-w-44 sm:text-right dark:bg-[#252b3b]"><p className="text-xs text-gray-500 dark:text-slate-400">Current owner</p><p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{presentation.owner}</p></div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-[#303a4c]">
                      <p className="text-sm text-gray-600 dark:text-slate-400">Expected range: {money(item.range.min, item.range.currency)} – {money(item.range.max, item.range.currency)}</p>
                      <div className="flex flex-wrap gap-2"><Link to={messageUrl} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]"><MessageSquareText size={16} aria-hidden="true" />Message LUCID</Link><Link to={`/lucid/cases/${item.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90">Open request <ArrowRight size={16} aria-hidden="true" /></Link></div>
                    </div>
                  </article>;
                })}
              </section>}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm"><Link to="/lucid/notifications" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"><Bell size={16} aria-hidden="true" />View notifications</Link><Link to="/lucid/messages" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"><MessageSquareText size={16} aria-hidden="true" />Open messages</Link></div>
        <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-slate-400">Your submitted requests appear here with their latest status and next action.</p>
      </div>
    </main>
  );
};

export default ManagedCases;
