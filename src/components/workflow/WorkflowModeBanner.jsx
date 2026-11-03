// @backend-handoff-delete Local Preview notice, persona switcher, and sample-data reset controls.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext.jsx';

const WorkflowModeBanner = () => {
  const { mode, role, user, canEnablePreview, enablePreview, setPreviewRole, resetPreviewData } = useWorkflowMode();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [resetting, setResetting] = useState(false);

  if (!user || !canEnablePreview) return null;

  const handleReset = async () => {
    if (!window.confirm('Reset the local sample workflow data? This will not affect your account or backend records.')) return;
    setResetting(true);
    const result = await resetPreviewData();
    setResetting(false);
    if (result.error) showNotification(result.error.message, 'error');
    else showNotification('Sample workflow data reset.', 'success');
  };

  const handleRoleChange = event => {
    const nextRole = event.target.value;
    if (!setPreviewRole(nextRole)) return;
    const nextPath = {
      client: '/lucid/dashboard',
      provider: '/lucid/dashboard',
      inspector: '/lucid/inspector/visits',
      admin: '/lucid/admin/workflow',
    }[nextRole];
    navigate(nextPath, { replace: true });
  };

  return mode === 'preview' ? (
    <aside data-preview-disclosure className="border-b border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100" aria-live="polite">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex min-w-0 items-center gap-2 text-sm"><FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" /><span><strong>Local Preview.</strong> Authenticated pages use sample accounts and workflow data stored in this browser; no login or workflow data is sent to the backend.</span></p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold">View as
            <select aria-label="Preview role" value={role || 'client'} onChange={handleRoleChange} className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-[#1a1f2e] dark:text-amber-100">
              <option value="client">Client</option><option value="provider">Provider</option><option value="inspector">Inspector</option><option value="admin">LUCID Admin</option>
            </select>
          </label>
          <button type="button" onClick={handleReset} disabled={resetting} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:hover:bg-amber-900/40"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />{resetting ? 'Resetting…' : 'Reset sample data'}</button>
        </div>
      </div>
    </aside>
  ) : (
    <aside className="border-b border-blue-100 bg-blue-50/80 text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <p className="flex items-center gap-2 text-xs sm:text-sm"><FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />Walk through the planned service workflow using local sample data.</p>
        <button type="button" onClick={enablePreview} className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400">Enable Preview mode</button>
      </div>
    </aside>
  );
};

export default WorkflowModeBanner;
