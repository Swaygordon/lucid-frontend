// @backend-handoff-delete Preview-only account settings; replace with authenticated account services.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BriefcaseBusiness, LockKeyhole, UserRound, Wallet } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const Card = ({ to, icon: Icon, title, copy }) => <Link to={to} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-primary/50 hover:shadow-sm dark:border-[#303a4c] dark:bg-[#1a1f2e]"><span className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl bg-blue-50 text-primary dark:bg-blue-950/40"><Icon size={20}/></span><span className="min-w-0"><strong className="block text-gray-900 dark:text-slate-100">{title}</strong><span className="mt-1 block text-sm text-gray-600 dark:text-slate-400">{copy}</span></span></Link>;

export default function PreviewAccountSettingsPage() {
  const actor = useWorkflowActor(); const { role } = actor; const services = useWorkflowServices();
  const [accountStatus, setAccountStatus] = useState('active'); const [appeals, setAppeals] = useState([]); const [appealReason, setAppealReason] = useState(''); const [appealError, setAppealError] = useState(''); const [appealNotice, setAppealNotice] = useState(''); const [submittingAppeal, setSubmittingAppeal] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([services.profiles.getForRole({ role, userId: actor.userId }), services.operations.listMyAccountAppeals({ role, userId: actor.userId })]).then(([profile, appealResult]) => {
      if (!active) return;
      setAccountStatus(profile.data?.accountStatus || 'active'); setAppeals(appealResult.data || []);
    });
    return () => { active = false; };
  }, [services, role, actor.userId]);
  const submitAppeal = async event => {
    event.preventDefault(); setSubmittingAppeal(true); setAppealError(''); setAppealNotice('');
    const result = await services.operations.submitAccountAppeal({ reason: appealReason }, { role, userId: actor.userId });
    setSubmittingAppeal(false);
    if (result.error) { setAppealError(result.error.message); return; }
    setAppeals(current => [result.data, ...current]); setAppealReason(''); setAppealNotice('Your appeal was added to the Preview Admin review queue.');
  };
  const profilePath = role === 'client' ? '/lucid/client/profile/setup' : role === 'provider' ? '/lucid/account/profile/setup' : role === 'inspector' ? '/lucid/inspector/profile' : '/lucid/admin/workflow';
  const identityTitle = role === 'admin' ? 'Operations workspace' : role === 'inspector' ? 'Inspector profile' : 'Profile and setup';
  const identityCopy = role === 'admin' ? 'Open the Admin workspace and role-specific operational records.' : role === 'inspector' ? 'Review your Inspector identity, availability and readiness details.' : 'Review your account details and complete the setup relevant to your role.';
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6"><div className="mx-auto max-w-3xl space-y-5"><header className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><p data-preview-disclosure className="text-sm font-semibold uppercase tracking-wide text-primary">{role} workspace · Preview</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">Account settings</h1><p data-preview-disclosure className="mt-2 text-sm text-gray-600 dark:text-slate-400">Role-specific account links and preferences. Changes are simulated in this browser.</p></header>
    {['suspended', 'closed'].includes(accountStatus) && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20"><h2 className="font-semibold text-amber-950 dark:text-amber-100">Account decision review</h2><p data-preview-disclosure className="mt-1 text-sm text-amber-900 dark:text-amber-200">Your Preview account is {accountStatus}. Submit an appeal for Admin review. Delivery is simulated; no email or SMS is sent.</p>{appeals.some(item => item.status === 'pending') ? <p className="mt-4 rounded-lg bg-white p-3 text-sm text-gray-800 dark:bg-[#252b3b] dark:text-slate-100">Your appeal is awaiting review.</p> : <form onSubmit={submitAppeal} className="mt-4 space-y-3"><label className="block text-sm font-medium text-gray-800 dark:text-slate-200">Why should this decision be reviewed?<textarea required minLength={10} maxLength={2000} rows={4} value={appealReason} onChange={event => setAppealReason(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-[#394458] dark:bg-[#252b3b]"/></label>{appealError && <p role="alert" className="text-sm text-red-700">{appealError}</p>}{appealNotice && <p role="status" className="text-sm text-emerald-800">{appealNotice}</p>}<button disabled={submittingAppeal || appealReason.trim().length < 10} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submittingAppeal ? 'Submitting…' : 'Submit appeal'}</button></form>}{appeals.filter(item => item.status !== 'pending').map(item => <article key={item.id} className="mt-3 rounded-lg bg-white p-3 text-sm dark:bg-[#252b3b]"><p className="font-semibold">Appeal {item.status}</p><p className="mt-1 text-gray-700 dark:text-slate-200">{item.decisionReason}</p></article>)}</section>}
    <div className="grid gap-3"><Card to={profilePath} icon={role === 'admin' ? BriefcaseBusiness : UserRound} title={identityTitle} copy={identityCopy}/><Card to="/lucid/notifications/settings" icon={Bell} title="Notification preferences" copy="Choose the channels represented in your Preview preferences."/>{['provider','inspector'].includes(role) && <Card to={role === 'inspector' ? '/lucid/inspector/finance' : '/lucid/earnings'} icon={Wallet} title="Financial activity" copy="Review role-appropriate simulated transactions and payout readiness."/>}{role === 'admin' && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-300"/><div><h2 className="font-semibold text-amber-950 dark:text-amber-200">Admin security controls are not simulated</h2><p data-preview-disclosure className="mt-1 text-sm text-amber-900 dark:text-amber-100">Authentication, access management and security settings must be implemented by the backend and identity provider. This Preview page does not change account security.</p></div></div></section>}</div>
  </div></main>;
}
