import React, { useEffect, useState } from 'react';
import { ExternalLink, Wallet } from 'lucide-react';

const labelFor = status => ({
  not_started: 'Not set up',
  onboarding: 'Setup in progress',
  verification_pending: 'Verification pending',
  active: 'Ready to receive payouts',
  failed: 'Needs attention',
}[status] || 'Status unavailable');

/** Payout credentials are collected only by the payment provider, never by this app. */
export default function PayoutSetupPanel({ services, role, userId, compact = false }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    const result = await services.finance.getPayoutStatus({ role, userId });
    if (result.error) setError(result.error.message);
    else setStatus(result.data || { status: 'not_started' });
  };

  useEffect(() => { let active = true; services.finance.getPayoutStatus({ role, userId }).then(result => {
    if (!active) return;
    if (result.error) setError(result.error.message);
    else setStatus(result.data || { status: 'not_started' });
  }).catch(cause => active && setError(cause.message || 'Payout status could not be loaded.'));
  return () => { active = false; }; }, [services, role, userId]);

  const begin = async () => {
    setBusy(true); setError('');
    try {
      const result = await services.finance.createPayoutOnboardingLink({ role, userId });
      if (result.error) setError(result.error.message);
      else if (result.data?.url) window.location.assign(result.data.url);
      else setError('The payout provider did not return a secure setup link.');
    } catch (cause) { setError(cause.message || 'Payout setup could not be started.'); }
    finally { setBusy(false); }
  };

  return <section className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#303a4c] dark:bg-[#1a1f2e] ${compact ? '' : 'sm:p-6'}`}>
    <div className="flex items-start gap-3"><Wallet className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true"/><div className="min-w-0 flex-1">
      <h2 className="font-semibold text-gray-950 dark:text-slate-100">Payout account</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{status ? labelFor(status.status) : 'Loading status…'}{status?.maskedDestination ? ` · ${status.maskedDestination}` : ''}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Your bank or mobile money details are entered securely with our payout provider and are never stored in this form.</p>
      <button type="button" onClick={begin} disabled={busy} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
        {busy ? 'Opening secure setup…' : status?.status === 'active' ? 'Manage payout account' : status?.status === 'failed' ? 'Retry payout setup' : 'Set up payout account'} <ExternalLink size={15} aria-hidden="true"/>
      </button>
      <button type="button" onClick={refresh} className="ml-3 min-h-10 px-2 text-sm font-semibold text-primary hover:underline">Refresh status</button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div></div>
  </section>;
}
