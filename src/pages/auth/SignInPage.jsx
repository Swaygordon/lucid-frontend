// Sign in through Supabase Auth; the role is resolved from server-owned account records.
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext.jsx';
import AuthPageLayout from './AuthPageLayout.jsx';

const roleRoutes = { client: '/lucid/dashboard', provider: '/lucid/dashboard', inspector: '/lucid/inspector/visits', admin: '/lucid/admin/workflow' };

export default function SignInPage() {
  const { signIn } = useWorkflowMode();
  const navigate = useNavigate(); const location = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  const submit = async event => {
    event.preventDefault(); setError(''); setSubmitting(true);
    if (!password.trim()) { setError('Enter a password to continue.'); setSubmitting(false); return; }
    let result;
    try { result = await signIn({ email, password }); }
    catch (cause) { setError(cause.message || 'Sign in could not be completed.'); setSubmitting(false); return; }
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    const from = location.state?.from;
    navigate(from?.pathname || roleRoutes[result.data.role], { replace: true });
  };
  return (
    <AuthPageLayout
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Enter your email and password. LUCID will open the workspace linked to your account."
      footer={<>New to LUCID? <Link to="/lucid/signup" className="font-semibold text-primary">Create an account</Link></>}
    >
      <form onSubmit={submit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-[#394458] dark:bg-[#1a1f2e]" /></label>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Password<span className="relative mt-2 block"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 dark:border-[#394458] dark:bg-[#1a1f2e]" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-3 text-gray-500">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <p className="text-xs leading-relaxed text-gray-600 dark:text-slate-400">Admin accounts are provisioned separately by LUCID IT and cannot be created through public sign-up.</p>
        <button disabled={submitting} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{submitting ? 'Signing in…' : 'Continue'} <ArrowRight size={18} /></button>
      </form>
    </AuthPageLayout>
  );
}
