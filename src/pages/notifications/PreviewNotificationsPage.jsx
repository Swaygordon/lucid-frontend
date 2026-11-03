// @backend-handoff-delete Preview notification screen backed by sample workflow data.
import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const destinationFor = item => item.caseId ? `/lucid/cases/${item.caseId}` : item.threadId ? `/lucid/messages?conversation=${encodeURIComponent(item.threadId)}` : null;

export default function PreviewNotificationsPage() {
  const actor = useWorkflowActor(); const services = useWorkflowServices();
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    try { const result = await services.notifications.listForRole({ role: actor.role, userId: actor.userId }); if (result.error) setError(result.error.message); else { setItems(result.data || []); setError(''); } }
    catch (cause) { setError(cause.message || 'Notifications could not be loaded.'); }
    finally { setLoading(false); }
  }, [services, actor.role, actor.userId]);
  useEffect(() => { reload(); }, [reload]);
  const markRead = async item => { const result = await services.notifications.markRead(item.id, { role: actor.role, userId: actor.userId }); if (result.error) setError(result.error.message); else reload(); };
  const markAllRead = async () => { setBusy(true); const result = await services.notifications.markAllRead({ role: actor.role, userId: actor.userId }); if (result.error) setError(result.error.message); else await reload(); setBusy(false); };
  const unread = items.filter(item => !item.read).length;
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6"><div className="mx-auto max-w-4xl space-y-5">
    <header className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">{actor.role} workspace · Preview</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-gray-950 dark:text-slate-100"><Bell className="h-7 w-7 text-primary"/>Notifications</h1><p className="mt-2 text-gray-600 dark:text-slate-400">{unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You’re all caught up.'} Updates are simulated in this browser.</p></div><Link to="/lucid/notifications/settings" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 dark:border-[#394458] dark:text-slate-100"><Settings2 size={16}/> Preferences</Link></div></header>
    <section className="divide-y divide-gray-100 rounded-2xl bg-white px-5 shadow-sm dark:divide-[#303a4c] dark:bg-[#1a1f2e]">
      <div className="flex justify-end py-3">{unread > 0 && <button disabled={busy} onClick={markAllRead} className="text-sm font-semibold text-primary disabled:opacity-50">Mark all as read</button>}</div>
      {error && <p role="alert" className="py-4 text-sm text-red-700">{error}</p>}
      {loading ? <p role="status" className="py-12 text-center text-sm text-gray-500">Loading notifications…</p> : items.map(item => { const destination = destinationFor(item); return <article key={item.id} className="flex items-start justify-between gap-4 py-5"><div className="flex gap-3"><span className={`mt-1 rounded-full p-2 ${item.read ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}><Bell size={17}/></span><div><p className="font-semibold text-gray-900 dark:text-slate-100">{item.title || (item.caseId ? `Case update · ${item.caseId}` : 'LUCID update')}</p><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{item.body || item.message}</p><p className="mt-2 text-xs text-gray-500">{item.createdAt || item.at ? new Date(item.createdAt || item.at).toLocaleString() : 'Preview update'}</p>{destination && <Link to={destination} className="mt-2 inline-block text-sm font-semibold text-primary">{item.caseId ? 'Open case' : 'Open conversation'}</Link>}</div></div>{!item.read && <button onClick={() => markRead(item)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200"><CheckCheck size={15}/>Mark read</button>}</article>; })}
      {!loading && !error && !items.length && <p className="py-12 text-center text-sm text-gray-500">No notifications yet. Workflow updates will appear here.</p>}
    </section></div></main>;
}
