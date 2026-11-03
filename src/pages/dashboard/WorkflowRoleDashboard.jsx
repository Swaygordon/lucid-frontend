// @backend-handoff-delete Local workflow data disclosure note on role dashboards.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bell, BriefcaseBusiness, CircleDollarSign, ClipboardList, Clock3, MessageSquareText, ReceiptText, RefreshCw, UserRound } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { useWorkflowActor, useWorkflowMode, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';
import { useNavigateBack } from '../../hooks/useNavigateBack.js';
import { getCasePresentation } from '../../services/workflow/casePresentation.js';

const PROVIDER_ACTIVE = new Set(['accepted', 'work_in_progress', 'price_change_pending']);
const PROVIDER_PENDING = new Set(['offer_sent']);
const PROVIDER_FOLLOW_UP = new Set(['awaiting_client_approval', 'awaiting_payment', 'payment_delayed', 'payment_failed']);
const money = (amount, currency = 'GHS') => `${currency} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const prettyStatus = status => String(status || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const Stat = ({ label, value, helper, icon: Icon, tone = 'blue' }) => (
  <article className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-5">
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="line-clamp-2 text-xs leading-4 text-gray-500 dark:text-slate-400 sm:text-sm">{label}</p><p className="mt-1 break-words text-lg font-bold leading-tight text-gray-950 dark:text-slate-100 sm:mt-2 sm:text-3xl">{value}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500 dark:text-slate-400 sm:text-xs">{helper}</p></div><span className={`shrink-0 rounded-lg p-2 sm:rounded-xl sm:p-3 ${tone === 'green' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : tone === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /></span></div>
  </article>
);

const CaseRow = ({ record, role }) => {
  const href = role === 'provider' ? `/lucid/provider/work/${record.id}` : `/lucid/cases/${record.id}`;
  const amount = record.providerBill?.payableAmount;
  const clientStatus = getCasePresentation(record.status);
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 dark:border-[#303a4c] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900 dark:text-slate-100">{record.service}</h3><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-[#252b3b] dark:text-slate-200">{role === 'client' ? clientStatus.label : prettyStatus(record.status)}</span></div>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Case {record.id} · {record.locationSummary}</p>
        {role === 'client' && <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Next: {clientStatus.next}</p>}
        {amount != null && <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-300">{role === 'provider' ? 'Your work bill' : ['awaiting_payment', 'payment_pending'].includes(record.status) ? 'Amount due' : 'Proposed total'}: {money(amount, record.clientRange?.currency)}</p>}
      </div>
      <Link to={href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 px-3.5 py-2 text-sm font-semibold text-primary hover:bg-primary/5">Open case <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </article>
  );
};

const WorkspacePanel = ({ title, description, icon: Icon, action, children }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="rounded-xl bg-gray-100 p-2.5 text-gray-700 dark:bg-[#252b3b] dark:text-slate-300"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">{title}</h2><p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p></div></div>{action}</div>
    {children}
  </section>
);

const WorkflowRoleDashboard = ({ role }) => {
  const { userId } = useWorkflowActor();
  const { mode, user } = useWorkflowMode();
  const services = useWorkflowServices();
  const [records, setRecords] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [displayName, setDisplayName] = useState(user?.name || user?.email?.split('@')[0] || 'there');
  const [notificationCount, setNotificationCount] = useState(0);
  const handleBackClick = useNavigateBack('/lucid/', 600);

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    services.cases.listForRole({ role, userId }).then(result => {
      if (!active) return;
      setRecords(result.data || []);
      setLoadState(result.error ? 'error' : 'ready');
    }).catch(() => {
      if (active) setLoadState('error');
    });
    return () => { active = false; };
  }, [services, role, userId]);

  useEffect(() => {
    let active = true;
    if (!userId) return () => { active = false; };

    services.notifications.listForRole({ role, userId }).then(notificationResult => {
      if (!active) return;
      setDisplayName(user?.name || user?.email?.split('@')[0] || 'there');
      if (!notificationResult.error) setNotificationCount((notificationResult.data || []).filter(item => !item.read).length);
    }).catch(() => {
      // The authenticated Preview dashboard can still render if either auxiliary lookup fails.
    });

    return () => { active = false; };
  }, [services, role, userId, user]);

  const attentionCases = useMemo(() => records.filter(record => role === 'client' ? getCasePresentation(record.status).group === 'needs_action' : PROVIDER_PENDING.has(record.status) || PROVIDER_FOLLOW_UP.has(record.status)), [records, role]);
  const activeCases = useMemo(() => records.filter(record => role === 'client' ? !['completed', 'cancelled'].includes(record.status) : PROVIDER_ACTIVE.has(record.status)), [records, role]);
  const completedCases = useMemo(() => records.filter(record => ['completed', 'paid'].includes(record.status)), [records]);
  const totalDue = records.reduce((sum, record) => sum + (role === 'provider' && record.providerPayoutStatus === 'released' ? Number(record.providerPayoutAmount || 0) : 0), 0);
  const isClient = role === 'client';

  return (
    <main className="min-h-[75vh] bg-gray-50 dark:bg-[#0f1117]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white dark:border-[#1e293b] dark:bg-[#1a1f2e]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button onClick={handleBackClick} aria-label="Go back" className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#252b3b]">
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-slate-300" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
              <p className="truncate text-sm text-gray-600 dark:text-slate-400">Welcome back, {displayName}!</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link to="/lucid/notifications" aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`} className="relative rounded-lg bg-gray-100 p-3 transition-colors hover:bg-gray-200 dark:bg-[#252b3b] dark:hover:bg-[#303a4c]">
              <Bell className="h-5 w-5 text-gray-700 dark:text-slate-300" />
              {notificationCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-xs font-bold text-white dark:border-[#1a1f2e]">{notificationCount > 99 ? '99+' : notificationCount}</span>}
            </Link>
            <Link to="/lucid/account" aria-label="My account">
              <Avatar name={displayName} size="md" />
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-primary to-blue-800 p-6 text-white shadow-lg sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">{isClient ? 'Client workspace' : 'Provider workspace'}</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{isClient ? 'Your service requests' : 'Your assigned work'}</h1><p className="mt-2 max-w-2xl text-sm text-blue-50 sm:text-base">{isClient ? 'Follow each request with LUCID, review the next action, and keep your service history in one place.' : 'Review offers, manage active work, submit your bill, and track payment status.'}</p></div>
          <Link to={isClient ? '/lucid/services' : '/lucid/provider/work'} className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-blue-50">{isClient ? 'Request a service' : 'View assigned work'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Stat label={isClient ? 'Open requests' : 'Active assignments'} value={activeCases.length} helper="Across your current workspace" icon={ClipboardList} />
          <Stat label="Needs your attention" value={attentionCases.length} helper={isClient ? 'A reply, approval, or payment is due' : 'Offer or Client response pending'} icon={Clock3} tone="amber" />
          <Stat label={isClient ? 'Receipts and paid work' : 'Completed work'} value={completedCases.length} helper="Available in your history" icon={ReceiptText} tone="green" />
          <Stat label={isClient ? 'Messages' : 'Released earnings'} value={isClient ? 'Open inbox' : money(totalDue)} helper={isClient ? 'LUCID and assigned Inspector' : mode === 'preview' ? <span data-preview-disclosure>Preview ledger total</span> : 'Recorded payout total'} icon={isClient ? MessageSquareText : CircleDollarSign} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
          <WorkspacePanel title={isClient ? 'Needs your attention' : 'Offers and follow-up'} description={isClient ? 'These requests have a pending action or need LUCID support.' : 'Review new offers and work waiting for a Client decision.'} icon={Clock3} action={<Link to="/lucid/messages" className="text-sm font-semibold text-primary hover:underline">Messages</Link>}>
            {loadState === 'loading' ? <p role="status" className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-[#252b3b] dark:text-slate-400">Loading your cases…</p> : loadState === 'error' ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">Cases could not be loaded. Refresh the page or contact LUCID support.</p> : attentionCases.length ? <div className="space-y-3">{attentionCases.slice(0, 5).map(record => <CaseRow key={record.id} record={record} role={role} />)}</div> : <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">Nothing needs your attention right now.</div>}
          </WorkspacePanel>

          <div className="space-y-6">
            <WorkspacePanel title="Account shortcuts" description="Your profile and account tools" icon={UserRound}>
              <div className="grid gap-2">
                <Link to="/lucid/account" className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:bg-[#252b3b] dark:text-slate-200 dark:hover:bg-[#303a4c]">My account <ArrowRight className="h-4 w-4" /></Link>
                <Link to={isClient ? '/lucid/account/client-profile' : '/lucid/account/profile'} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:bg-[#252b3b] dark:text-slate-200 dark:hover:bg-[#303a4c]">View profile <UserRound className="h-4 w-4" /></Link>
                <Link to="/lucid/messages" className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:bg-[#252b3b] dark:text-slate-200 dark:hover:bg-[#303a4c]">Messages <MessageSquareText className="h-4 w-4" /></Link>
              </div>
            </WorkspacePanel>
          {mode === 'preview' && <p data-preview-disclosure className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100"><strong>Preview data.</strong> Requests, messages, receipts, and finance values are browser-local examples. The selected role is a simulated persona; no real account or payment is involved.</p>}
          </div>
        </div>

        <WorkspacePanel title={isClient ? 'Recent requests' : 'Assigned work'} description={isClient ? 'The same case records are reflected in your Messages and transaction views.' : 'Only the job details needed for your work are shown here.'} icon={isClient ? ClipboardList : BriefcaseBusiness} action={<Link to={isClient ? '/lucid/cases' : '/lucid/provider/work'} className="text-sm font-semibold text-primary hover:underline">View all</Link>}>
          {loadState === 'loading' ? <p role="status" className="text-sm text-gray-500 dark:text-slate-400">Loading…</p> : loadState === 'error' ? <p className="text-sm text-gray-500 dark:text-slate-400">Your case list is unavailable.</p> : records.length ? <div className="grid gap-3 lg:grid-cols-2">{records.slice(0, 8).map(record => <CaseRow key={record.id} record={record} role={role} />)}</div> : <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">{isClient ? 'Your service requests will appear here.' : 'Offers and assignments sent to you will appear here.'}</div>}
        </WorkspacePanel>
        <div className="flex justify-end"><Link to={isClient ? '/lucid/transactions' : '/lucid/transactions'} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Financial records <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </main>
  );
};

export const ClientWorkflowDashboard = () => <WorkflowRoleDashboard role="client" />;
export const ProviderWorkflowDashboard = () => <WorkflowRoleDashboard role="provider" />;
