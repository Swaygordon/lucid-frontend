// Keep authenticated accounts moving through required onboarding; the profile service supplies readiness.
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const setupPathForRole = role => ({ inspector: '/lucid/inspector/profile', client: '/lucid/client/profile/setup', provider: '/lucid/account/profile/setup' })[role];
const incompleteSetupAllowedPaths = new Set([
  '/lucid/account/settings',
  '/lucid/notifications',
  '/lucid/notifications/settings',
]);

const AccountSetupGate = ({ children }) => {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState({ status: 'loading', error: '' });
  const role = actor.role === 'service_provider' ? 'provider' : actor.role;
  const setupPath = setupPathForRole(role);
  const setupRoute = location.pathname === setupPath;
  const needsSetup = actor.isAuthenticated && Boolean(setupPath) && !setupRoute && !incompleteSetupAllowedPaths.has(location.pathname);

  useEffect(() => {
    if (!needsSetup) { setState({ status: 'ready', error: '' }); return undefined; }
    let active = true;
    setState({ status: 'loading', error: '' });
    services.profiles.getForRole({ role, userId: actor.userId }).then(result => {
      if (!active) return;
      if (result.error) setState({ status: 'error', error: result.error.message });
      else setState({ status: result.data?.profileComplete ? 'ready' : 'incomplete', error: '' });
    }).catch(error => { if (active) setState({ status: 'error', error: error.message || 'Account setup could not be checked.' }); });
    return () => { active = false; };
  }, [needsSetup, services, role, actor.userId, refreshKey]);

  useEffect(() => {
    const refresh = event => {
      if (event.type === 'lucid:workflow-profile-updated' && event.detail?.role && event.detail.role !== role) return;
      setRefreshKey(current => current + 1);
    };
    window.addEventListener('lucid:workflow-profile-updated', refresh);
    return () => {
      window.removeEventListener('lucid:workflow-profile-updated', refresh);
    };
  }, [role]);

  if (!needsSetup || state.status === 'ready') return children;
  if (state.status === 'incomplete') return <Navigate to={setupPath} replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  if (state.status === 'error') return <main className="min-h-[55vh] bg-gray-50 px-4 py-12 dark:bg-[#0f1117]"><section role="alert" className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><h1 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Account setup needs attention</h1><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{state.error}</p><Link to={setupPath} className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open profile setup</Link></section></main>;
  return <main role="status" className="min-h-[55vh] bg-gray-50 px-4 py-12 text-center text-sm text-gray-600 dark:bg-[#0f1117] dark:text-slate-300">Checking account setup…</main>;
};

export default AccountSetupGate;
