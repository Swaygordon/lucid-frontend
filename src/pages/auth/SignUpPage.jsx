// Register public account roles through Supabase Auth; Admin access is provisioned by IT.
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext.jsx';
import AuthPageLayout from './AuthPageLayout.jsx';

const roleRoutes = { client: '/lucid/client/profile/setup', provider: '/lucid/account/profile/setup', inspector: '/lucid/inspector/profile' };
export default function SignUpPage() {
  const { signUp } = useWorkflowMode(); const navigate = useNavigate(); const location = useLocation();
  const requestedRole = new URLSearchParams(location.search).get('role');
  const initialRole = ['client', 'provider', 'inspector'].includes(requestedRole) ? requestedRole : location.pathname === '/lucid/become-provider' ? 'provider' : 'client';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: initialRole }); const [error, setError] = useState(''); const [confirmationEmail, setConfirmationEmail] = useState(''); const [submitting, setSubmitting] = useState(false);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async event => { event.preventDefault(); setError(''); setConfirmationEmail(''); setSubmitting(true); if (form.password.length < 8) { setError('Use at least 8 characters for your password.'); setSubmitting(false); return; } let result; try { result = await signUp(form); } catch (cause) { setError(cause.message || 'Account creation could not be completed.'); setSubmitting(false); return; } setSubmitting(false); if (result.error) { setError(result.error); return; } if (result.data?.confirmationRequired) { setConfirmationEmail(result.data.email); return; } navigate(roleRoutes[form.role], { replace: true }); };
  return (
    <AuthPageLayout
      eyebrow="Get started"
      title="Create an account"
      description="You can finish your role-specific profile after signup."
      footer={<>Already registered? <Link to="/lucid/signin" className="font-semibold text-primary">Sign in</Link></>}
    >
      <form onSubmit={submit} className="mt-5 space-y-3.5 sm:mt-7 sm:space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">I am joining as<select name="role" value={form.role} onChange={update} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-[#394458] dark:bg-[#252b3b]"><option value="client">Client</option><option value="provider">Service provider</option><option value="inspector">Inspector</option></select></label>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Full name<input required name="name" value={form.name} onChange={update} autoComplete="name" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-[#394458] dark:bg-[#252b3b]" /></label>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Email<input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-[#394458] dark:bg-[#252b3b]" /></label>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Password<input required minLength={8} type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-[#394458] dark:bg-[#252b3b]" /><span className="mt-1 block text-xs font-normal text-gray-500">Use at least 8 characters.</span></label>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-slate-400">Admin accounts are created separately by LUCID IT and are not available in public sign-up.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {confirmationEmail && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Check {confirmationEmail} for the verification link before signing in.</p>}
        <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={18} /></button>
      </form>
    </AuthPageLayout>
  );
}
