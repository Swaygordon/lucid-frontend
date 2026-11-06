// Backend contract: load paginated staff-only financial and audit records from authorized services.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpDown, BriefcaseBusiness, CalendarDays, Check, Clock3, FileText, Printer, Search, Share2, X } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import { buildReceiptPdf } from '../../services/workflow/receiptPdf.js';

const VIEWS = [['all', 'All records'], ['receipts', 'Receipts'], ['transactions', 'Transactions'], ['history', 'History']];
const pretty = value => String(value || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const amountLabel = (amount, currency = 'GHS') => `${currency} ${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const timestamp = item => item.issuedAt || item.at || item.createdAt || '';
const dateLabel = value => value ? new Date(value).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable';
const monthLabel = value => value ? new Date(value).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' }) : 'Date unavailable';

export default function AdminFinancialRecordsPage() {
  const actor = useWorkflowActor(); const services = useWorkflowServices(); const [params, setParams] = useSearchParams();
  const view = VIEWS.some(([key]) => key === params.get('view')) ? params.get('view') : 'all';
  const [cases, setCases] = useState([]); const [finance, setFinance] = useState([]); const [receipts, setReceipts] = useState([]); const [people, setPeople] = useState([]);
  const [search, setSearch] = useState(''); const [type, setType] = useState('all'); const [status, setStatus] = useState('all'); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [sort, setSort] = useState('newest'); const [selected, setSelected] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [notice, setNotice] = useState(''); const [pdfausy, setPdfausy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const request = { role: actor.role, userId: actor.userId };
      const [caseResult, financeResult, receiptResult, peopleResult] = await Promise.all([
        services.cases.listForRole(request), services.finance.listEntries(request), services.receipts.listForRole(request), services.operations.listDirectory(request),
      ]);
      const failure = [caseResult, financeResult, receiptResult, peopleResult].find(item => item?.error);
      if (failure) throw new Error(failure.error.message);
      setCases(caseResult.data || []); setFinance(financeResult.data || []); setReceipts(receiptResult.data || []); setPeople(peopleResult.data || []); setError('');
    } catch (cause) { setError(cause.message || 'Financial records could not be loaded.'); }
    finally { setLoading(false); }
  }, [services, actor.role, actor.userId]);
  useEffect(() => { load(); }, [load]);

  const records = useMemo(() => {
    const caseayId = Object.fromEntries(cases.map(item => [item.id, item]));
    const personayId = Object.fromEntries(people.map(person => [person.id, person]));
    const receiptsayCase = new Map();
    receipts.forEach(receipt => { if (!receiptsayCase.has(receipt.caseId)) receiptsayCase.set(receipt.caseId, receipt); });
    const receiptRows = [...receiptsayCase.values()].map(receipt => {
      const item = caseayId[receipt.caseId] || {};
      return { ...receipt, rowId: `receipt:${receipt.caseId}`, recordKind: 'receipt', type: 'receipt', status: item.paymentStatus || 'issued', at: receipt.issuedAt, caseRecord: item, client: personayId[item.clientRoleId]?.name || item.clientName || 'Client', provider: personayId[item.assignedProviderId]?.name || item.providerAssignment?.providerName || 'Provider' };
    });
    const transactionRows = finance.map(entry => {
      const item = caseayId[entry.caseId] || {};
      return { ...entry, rowId: `transaction:${entry.id}`, recordKind: 'transaction', caseRecord: item, client: personayId[item.clientRoleId]?.name || item.clientName || 'Client', provider: personayId[item.assignedProviderId]?.name || item.providerAssignment?.providerName || 'Provider' };
    });
    const historyRows = cases.flatMap(item => (item.history || []).map(event => ({ ...event, id: event.id || `${item.id}-${event.action}-${event.at}`, caseId: item.id, rowId: `history:${item.id}:${event.id || event.at}`, recordKind: 'history', type: event.action || 'case_event', status: item.status, at: event.at, label: event.label || pretty(event.action), caseRecord: item, client: personayId[item.clientRoleId]?.name || item.clientName || 'Client', provider: personayId[item.assignedProviderId]?.name || item.providerAssignment?.providerName || 'Provider' })));
    return [...receiptRows, ...transactionRows, ...historyRows];
  }, [cases, finance, receipts, people]);

  const viewRecords = useMemo(() => {
    const selectedKind = view === 'receipts' ? 'receipt' : view === 'transactions' ? 'transaction' : view === 'history' ? 'history' : null;
    return selectedKind ? records.filter(item => item.recordKind === selectedKind) : records;
  }, [records, view]);
  const availableTypes = useMemo(() => [...new Set(viewRecords.map(item => item.type).filter(Boolean))].sort(), [viewRecords]);
  const filtered = useMemo(() => {
    const start = from ? new Date(`${from}T00:00:00`) : null; const end = to ? new Date(`${to}T23:59:59.999`) : null;
    const rows = viewRecords.filter(item => {
      const when = timestamp(item); const date = when ? new Date(when) : null;
      const text = `${item.caseId || ''} ${item.id || ''} ${item.paymentReference || ''} ${item.client || ''} ${item.provider || ''} ${item.type || ''} ${item.status || ''} ${item.label || ''} ${item.action || ''} ${item.caseRecord?.service || ''} ${item.caseRecord?.category || ''}`.toLowerCase();
      return (type === 'all' || item.type === type) && (status === 'all' || String(item.status).toLowerCase() === status) && (!search || text.includes(search.toLowerCase())) && (!start || (date && date >= start)) && (!end || (date && date <= end));
    });
    return rows.sort((a, b) => sort === 'oldest' ? new Date(timestamp(a) || 0) - new Date(timestamp(b) || 0) : sort === 'amount-high' ? Number(b.totalAmount ?? b.amount ?? 0) - Number(a.totalAmount ?? a.amount ?? 0) : sort === 'amount-low' ? Number(a.totalAmount ?? a.amount ?? 0) - Number(b.totalAmount ?? b.amount ?? 0) : new Date(timestamp(b) || 0) - new Date(timestamp(a) || 0));
  }, [viewRecords, type, status, search, from, to, sort]);
  const grouped = useMemo(() => {
    const groups = new Map();
    filtered.forEach(item => { const key = monthLabel(timestamp(item)); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
    return [...groups.entries()].sort(([, a], [, b]) => new Date(timestamp(b[0]) || 0) - new Date(timestamp(a[0]) || 0));
  }, [filtered]);
  const changeView = next => { setSelected(null); setParams(next === 'all' ? {} : { view: next }); setType('all'); setStatus('all'); };
  const openReceipt = row => setSelected(row);
  const closeReceipt = () => setSelected(null);
  const downloadReceipt = async () => {
    if (!selected || pdfausy) return;
    setPdfausy(true);
    try { const doc = await buildReceiptPdf(selected); doc.save(`LUCID-${selected.caseId}-receipt.pdf`); setNotice('A4 receipt PDF downloaded.'); }
    catch { setNotice('The receipt PDF could not be created. Please try again.'); }
    finally { setPdfausy(false); }
  };
  const shareReceipt = async () => {
    if (!selected) return;
    const shareData = { title: `LUCID receipt | ${selected.caseId}`, text: `Receipt ${selected.paymentReference || selected.id} for case ${selected.caseId}.` };
    try {
      const doc = await buildReceiptPdf(selected); const file = new File([doc.output('blob')], `LUCID-${selected.caseId}-receipt.pdf`, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ ...shareData, files: [file] });
      else if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`); setNotice('Receipt details copied.'); }
    } catch (cause) { if (cause.name !== 'AbortError') { try { await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`); setNotice('Receipt details copied.'); } catch { setNotice('Download the receipt file to share it.'); } } }
  };
  useEffect(() => { const receiptId = params.get('receiptId'); if (receiptId && receipts.length) { const match = records.find(item => item.recordKind === 'receipt' && item.id === receiptId); if (match) setSelected(match); } }, [params, receipts, records]);
  useEffect(() => { if (!selected) return undefined; const onKey = event => { if (event.key === 'Escape') closeReceipt(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [selected]);

  const statuses = [...new Set(viewRecords.map(item => String(item.status || '').toLowerCase()).filter(Boolean))].sort();
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6"><div className="mx-auto max-w-7xl">
    <p className="text-sm text-gray-500 dark:text-slate-400"><Link to="/lucid/admin/workflow" className="font-semibold text-primary">Operations</Link> / Financial records</p>
    <header className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">LUCID Admin</p><h1 className="mt-1 text-3xl font-bold text-gray-950 dark:text-slate-100">{view === 'history' ? 'History & audit log' : 'Receipts & transactions'}</h1><p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">Search payment records, check the related case, and retrieve a receipt for review or sharing.</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">{viewRecords.length} records</span></header>
    <nav role="tablist" aria-label="Financial record type" className="mt-6 flex gap-5 overflow-x-auto border-b border-gray-200 dark:border-[#303a4c]">{VIEWS.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => changeView(key)} className={`shrink-0 border-b-2 px-1 py-3 text-sm font-semibold ${view === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100'}`}>{label}</button>)}</nav>
    <section aria-label="Search and filter records" className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1a1f2e] sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.6fr)_1fr_1fr_1fr_1fr]"><label className="text-sm font-medium text-gray-700 dark:text-slate-300">Search records<span className="relative mt-1 block"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-gray-400"/><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Case, person, reference, service..." className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 dark:border-[#394458] dark:bg-[#252b3b]"/></span></label><label className="text-sm font-medium text-gray-700 dark:text-slate-300">Category<select value={type} onChange={event => setType(event.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-[#394458] dark:bg-[#252b3b]"><option value="all">All categories</option>{availableTypes.map(value => <option key={value} value={value}>{pretty(value)}</option>)}</select></label><label className="text-sm font-medium text-gray-700 dark:text-slate-300">Status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 capitalize dark:border-[#394458] dark:bg-[#252b3b]"><option value="all">All statuses</option>{statuses.map(value => <option key={value} value={value}>{pretty(value)}</option>)}</select></label><label className="text-sm font-medium text-gray-700 dark:text-slate-300">From<input aria-label="Start date" type="date" value={from} onChange={event => setFrom(event.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-[#394458] dark:bg-[#252b3b]"/></label><label className="text-sm font-medium text-gray-700 dark:text-slate-300">To<input aria-label="End date" type="date" value={to} onChange={event => setTo(event.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-[#394458] dark:bg-[#252b3b]"/></label></section>
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm text-gray-500 dark:text-slate-400"><p aria-live="polite">Showing {filtered.length} of {viewRecords.length} records</p><label className="inline-flex items-center gap-2 font-semibold"><ArrowUpDown size={15}/><span>Sort</span><select value={sort} onChange={event => setSort(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-800 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount-high">Amount: high to low</option><option value="amount-low">Amount: low to high</option></select></label></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{loading ? <p role="status" className="py-16 text-center text-gray-500">Loading financial records...</p> : grouped.map(([month, items]) => <section key={month} className="mb-5"><h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-slate-200"><CalendarDays size={16} className="text-primary"/>{month}<span className="font-normal text-gray-400">{items.length} records</span></h2><div className="space-y-2">{items.map(item => { const foundReceipt = item.recordKind === 'transaction' ? receipts.find(receipt => receipt.caseId === item.caseId) : null; const receiptRow = foundReceipt ? { ...foundReceipt, rowId: `receipt:${item.caseId}`, recordKind: 'receipt', caseRecord: item.caseRecord, client: item.client, provider: item.provider } : null; return <RecordRow key={item.rowId} item={item} hasReceipt={Boolean(receiptRow)} onOpen={() => openReceipt(item.recordKind === 'receipt' ? item : receiptRow)} />; })}</div></section>)}
    {!loading && !error && !filtered.length && <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-[#1a1f2e]"><FileText className="mx-auto h-9 w-9 text-gray-300"/><h2 className="mt-3 font-semibold text-gray-900 dark:text-slate-100">No matching records</h2><p className="mt-1 text-sm text-gray-500">Change your search, filters, or date range and try again.</p><button type="button" onClick={() => { setSearch(''); setType('all'); setStatus('all'); setFrom(''); setTo(''); }} className="mt-4 text-sm font-semibold text-primary">Clear all filters</button></div>}
  </div>
  <style>{'bmedia print { body * { visibility: hidden !important; } #receipt-print-area, #receipt-print-area * { visibility: visible !important; } #receipt-print-area { display: block !important; position: absolute !important; inset: 0 !important; background: white !important; padding: 0 !important; overflow: visible !important; } #receipt-print-area > section { max-height: none !important; overflow: visible !important; box-shadow: none !important; width: 100% !important; max-width: none !important; } #receipt-print-area header button, #receipt-print-area footer { display: none !important; } }'}</style>
  {selected?.recordKind === 'receipt' && <div id="receipt-print-area" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" onMouseDown={event => { if (event.target === event.currentTarget) closeReceipt(); }}><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-[#1a1f2e]"><header className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-[#303a4c]"><div><h2 id="receipt-modal-title" className="text-xl font-bold text-gray-950 dark:text-slate-100">Payment receipt</h2><p className="mt-1 text-sm text-gray-500">{selected.paymentReference || selected.id} | {selected.caseId}</p></div><button type="button" aria-label="Close receipt" onClick={closeReceipt} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252b3b]"><X size={19}/></button></header><ReceiptDocument item={selected}/><footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-6 py-4 dark:border-[#303a4c]"><button type="button" onClick={shareReceipt} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-[#394458] dark:text-slate-200"><Share2 size={16}/>Share receipt</button><div className="flex gap-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-[#394458] dark:text-slate-200"><Printer size={16}/>Print</button><button type="button" onClick={downloadReceipt} disabled={pdfausy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"><ArrowDownToLine size={16}/>{pdfausy ? 'Creating PDF…' : 'Download A4 PDF'}</button></div></footer></section></div>}
  {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{notice}<button type="button" onClick={() => setNotice('')} className="ml-3" aria-label="Dismiss">x</button></div>}
  </main>;
}

function RecordRow({ item, onOpen, hasReceipt = false }) {
  const isReceipt = item.recordKind === 'receipt'; const isHistory = item.recordKind === 'history';
  const date = timestamp(item); const name = isReceipt ? `Receipt | ${item.caseId}` : isHistory ? (item.label || pretty(item.action)) : `${pretty(item.type)} | ${item.caseId || item.id}`;
  const status = pretty(item.status); const value = item.totalAmount ?? item.amount;
  return <article className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm dark:border-[#303a4c] dark:bg-[#1a1f2e] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div className="min-w-0"><h3 className="truncate font-semibold text-gray-900 dark:text-slate-100">{name}</h3><p className="mt-1 truncate text-xs text-gray-500 dark:text-slate-400">{item.caseRecord?.service || 'Service request'} | {item.client}{item.provider ? ` | ${item.provider}` : ''} | {dateLabel(date)}{item.paymentReference ? ` | ${item.paymentReference}` : ''}</p></div><div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1"><strong className="whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{isHistory ? pretty(item.actorRole || 'System') : amountLabel(value, item.currency)}</strong><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${String(item.status).toLowerCase().includes('pending') || item.status === 'due' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200' : 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200'}`}>{String(item.status).toLowerCase().includes('pending') || item.status === 'due' ? <Clock3 size={12}/> : <Check size={12}/>} {status}</span></div><div className="flex justify-end gap-2">{item.caseId && <Link to={`/lucid/cases/${item.caseId}`} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-[#394458] dark:text-slate-200">Open case</Link>}{isReceipt && <button type="button" onClick={onOpen} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">View receipt</button>}{!isReceipt && !isHistory && (hasReceipt ? <button type="button" onClick={onOpen} className="rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary">View receipt</button> : <span className="px-2 py-1 text-xs text-gray-400">No receipt issued</span>)}</div></article>;
}

function ReceiptDocument({ item }) {
  const record = item.caseRecord || {}; const currency = item.currency || 'GHS';
  return <div className="px-6 py-5"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-[#303a4c]"><div><p className="text-2xl font-extrabold tracking-wide text-primary">LUCID</p><p className="text-xs text-gray-500">Service payment receipt</p></div><div className="text-right"><p className="font-semibold text-gray-900 dark:text-slate-100">{dateLabel(item.issuedAt)}</p><p className="mt-1 text-xs uppercase tracking-wide text-green-700">{pretty(record.paymentStatus || 'issued')}</p></div></div><div className="my-4 rounded-xl bg-gray-50 p-4 dark:bg-[#252b3b]"><p className="text-sm text-gray-500">Total paid by {item.client}</p><p className="mt-1 text-3xl font-bold text-gray-950 dark:text-slate-100">{amountLabel(item.totalAmount, currency)}</p><p className="mt-2 text-xs text-gray-500">Payment reference: {item.paymentReference || item.id}</p></div><dl className="divide-y divide-gray-100 text-sm dark:divide-[#303a4c]"><MoneyLine label={`Provider work | ${item.provider || 'Provider'}`} value={item.providerAmount} currency={currency}/><MoneyLine label="Inspector service" value={item.inspectorAmount} currency={currency}/><MoneyLine label="LUCID platform charge" value={item.platformAmount} currency={currency}/><MoneyLine label="Total" value={item.totalAmount} currency={currency} strong/></dl><div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-[#394458]"><div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-slate-100"><BriefcaseBusiness size={16} className="text-primary"/>Related case | {item.caseId}</div><p className="mt-2 text-sm text-gray-700 dark:text-slate-300">{record.service || 'Service request'} | {record.category || 'Category unavailable'}</p><p className="mt-1 text-xs text-gray-500">Client: {item.client} | Provider: {item.provider}{record.inspectorAssignment?.inspectorName ? ` | Inspector: ${record.inspectorAssignment.inspectorName}` : ''}</p><Link to={`/lucid/cases/${item.caseId}`} className="mt-3 inline-flex text-sm font-semibold text-primary">Open case history</Link></div></div>;
}
function MoneyLine({ label, value, currency, strong = false }) { return <div className="flex justify-between gap-4 py-3"><dt className={strong ? 'font-bold text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-300'}>{label}</dt><dd className={strong ? 'font-bold text-gray-900 dark:text-slate-100' : 'font-medium text-gray-900 dark:text-slate-100'}>{amountLabel(value, currency)}</dd></div>; }
