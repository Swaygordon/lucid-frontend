// Reads authenticated profile completion state and routes users to their role setup.
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const routes = { client: '/lucid/client/profile/setup', provider: '/lucid/account/profile/setup', inspector: '/lucid/inspector/profile' };
export default function ProfileSetupBanner() {
  const actor = useWorkflowActor(); const services = useWorkflowServices(); const navigate = useNavigate(); const { pathname } = useLocation();
  const [complete, setComplete] = useState(true); const [verified, setVerified] = useState(false);
  useEffect(() => {
    if (!actor.isAuthenticated || !routes[actor.role] || !actor.userId) { setComplete(true); setVerified(false); return undefined; }
    let active = true;
    services.profiles.getForRole({ role: actor.role, userId: actor.userId }).then(result => {
      if (active) { setComplete(Boolean(result.data?.profileComplete)); setVerified(!result.error); }
    }).catch(() => { if (active) { setComplete(false); setVerified(false); } });
    return () => { active = false; };
  }, [actor.isAuthenticated, actor.role, actor.userId, services]);
  useEffect(() => {
    const refresh = () => services.profiles.getForRole({ role: actor.role, userId: actor.userId }).then(result => { setComplete(Boolean(result.data?.profileComplete)); setVerified(!result.error); });
    window.addEventListener('lucid:workflow-profile-updated', refresh);
    return () => { window.removeEventListener('lucid:workflow-profile-updated', refresh); };
  }, [services, actor.role, actor.userId]);
  if (!verified || complete || !routes[actor.role] || pathname.startsWith(routes[actor.role])) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100" role="status"><div className="flex items-center gap-2"><AlertCircle className="h-4 w-4"/><span className="text-sm font-medium">Complete your {actor.role} profile setup to use all workspace features.</span></div><button type="button" onClick={() => navigate(routes[actor.role], { state: { from: pathname } })} className="rounded-lg bg-amber-200 px-3 py-1.5 text-sm font-semibold hover:bg-amber-300 dark:bg-amber-800/60">Complete setup</button></div>;
}
