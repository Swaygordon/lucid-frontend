// @backend-handoff-delete Local Preview shell and role navigation; wire the production workspace shell to authenticated backend permissions.
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BriefcaseBusiness, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Menu, MessageCircle, Settings, UserRound, Wallet, X } from 'lucide-react';
import { useWorkflowActor, useWorkflowMode } from '../../contexts/WorkflowModeContext.jsx';
import ProfileSetupBanner from './ProfileSetupBanner.jsx';
import CancellationFeeRecoveryBanner from './CancellationFeeRecoveryBanner.jsx';
import WorkflowModeBanner from '../../components/workflow/WorkflowModeBanner.jsx';

const NAV = {
  client: [
    ['Overview', '/lucid/dashboard', LayoutDashboard], ['My requests', '/lucid/cases', ClipboardList],
    ['Messages', '/lucid/messages', MessageCircle], ['Notifications', '/lucid/notifications', Bell],
    ['My profile', '/lucid/account/profile', UserRound], ['Settings', '/lucid/account/settings', Settings],
  ],
  provider: [
    ['Overview', '/lucid/dashboard', LayoutDashboard], ['My work', '/lucid/provider/work', BriefcaseBusiness],
    ['Messages', '/lucid/messages', MessageCircle], ['Earnings', '/lucid/earnings', Wallet],
    ['Transactions', '/lucid/transactions', ClipboardList], ['My profile', '/lucid/account/profile', UserRound],
    ['Settings', '/lucid/account/settings', Settings],
  ],
  inspector: [
    ['My visits', '/lucid/inspector/visits', ClipboardList], ['Messages', '/lucid/messages', MessageCircle],
    ['Payouts', '/lucid/inspector/finance', Wallet], ['Work profile', '/lucid/inspector/profile', UserRound],
  ],
  admin: [
    ['Operations', '/lucid/admin/workflow', LayoutDashboard], ['Requests', '/lucid/cases', ClipboardList],
    ['Messages', '/lucid/messages', MessageCircle], ['Notifications', '/lucid/notifications', Bell],
    ['Transactions', '/lucid/transactions', Wallet],
  ],
};
const ROLE_NAME = { client: 'Client workspace', provider: 'Provider workspace', inspector: 'Inspector workspace', admin: 'LUCID operations' };

function NavItems({ role, onNavigate }) {
  return <nav aria-label="Workspace" className="space-y-1">{(NAV[role] || NAV.client).map(([label, to, Icon]) => <NavLink key={to} to={to} end={to === '/lucid/dashboard'} onClick={onNavigate} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-primary dark:bg-blue-950/40 dark:text-blue-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-slate-300 dark:hover:bg-[#252b3b]'}`}><Icon size={18} aria-hidden="true"/><span>{label}</span><ChevronRight className="ml-auto opacity-40" size={15} aria-hidden="true"/></NavLink>)}</nav>;
}

export default function WorkspaceShell({ children }) {
  const actor = useWorkflowActor();
  const { signOut, user } = useWorkflowMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = actor.role || 'client';
  const name = user?.name || user?.email?.split('@')[0] || 'Preview user';
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = event => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);
  const logout = () => { signOut(); navigate('/lucid/', { replace: true }); };
  return <div className="min-h-screen bg-[#f6f8fb] text-gray-900 dark:bg-[#10141c] dark:text-slate-100">
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur dark:border-[#293244] dark:bg-[#141923]/95">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open workspace navigation" aria-expanded={drawerOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200 md:hidden"><Menu size={19}/></button><Link to="/lucid/dashboard" className="text-xl font-extrabold tracking-tight text-primary">LUCID</Link><span className="hidden h-6 border-l border-gray-200 sm:block dark:border-[#394458]"/><span className="hidden text-sm font-semibold text-gray-600 sm:block dark:text-slate-300">{ROLE_NAME[role]}</span></div>
        <div className="flex items-center gap-3"><Link to="/lucid/notifications" aria-label="Notifications" className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-[#252b3b] sm:inline-flex"><Bell size={19}/></Link><div className="hidden text-right sm:block"><p className="max-w-48 truncate text-sm font-semibold">{name}</p><p className="text-xs capitalize text-gray-500 dark:text-slate-400">{role} account</p></div><button type="button" onClick={logout} className="hidden min-h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200 dark:hover:bg-[#252b3b] sm:inline-flex"><LogOut size={16}/> Sign out</button></div>
      </div>
    </header>
    <WorkflowModeBanner/><ProfileSetupBanner/><CancellationFeeRecoveryBanner/>
    <div className="mx-auto grid max-w-[1600px] md:grid-cols-[232px_minmax(0,1fr)] lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] border-r border-gray-200/80 bg-white px-4 py-6 dark:border-[#293244] dark:bg-[#141923] md:block"><p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Workspace</p><NavItems role={role}/><div className="mt-8 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950 dark:bg-blue-950/30 dark:text-blue-100"><p className="font-semibold">Need a hand?</p><p className="mt-1 text-xs leading-relaxed opacity-80">LUCID support can help with your request or account.</p><Link to="/lucid/help" className="mt-3 inline-flex font-semibold underline underline-offset-2">Get support</Link></div></aside>
      <main id="workspace-main" className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-8">{children}</main>
    </div>
    {drawerOpen && <div className="fixed inset-0 z-50 md:hidden" role="presentation"><button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-gray-950/40"/><section role="dialog" aria-modal="true" aria-label="Workspace navigation" className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col bg-white p-4 shadow-2xl dark:bg-[#141923]"><div className="mb-6 flex items-center justify-between"><Link to="/lucid/dashboard" className="text-xl font-extrabold tracking-tight text-primary">LUCID</Link><button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#252b3b]"><X size={20}/></button></div><div className="mb-5 rounded-xl bg-gray-50 p-3 dark:bg-[#1a1f2e]"><p className="truncate text-sm font-semibold">{name}</p><p className="mt-0.5 text-xs capitalize text-gray-500 dark:text-slate-400">{ROLE_NAME[role]}</p></div><NavItems role={role}/><div className="mt-auto border-t border-gray-100 pt-4 dark:border-[#303a4c]"><Link to="/lucid/help" onClick={() => setDrawerOpen(false)} className="mb-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium">Get support</Link><button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"><LogOut size={17}/>Sign out</button></div></section></div>}
  </div>;
}
