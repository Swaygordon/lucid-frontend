import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { getWorkflowServices } from '../services/workflow/workflowService.js';

const MODE_KEY = 'lucid:workflow-mode';
const ROLE_KEY = 'lucid:workflow-preview-role';
const PREVIEW_ROLES = ['client', 'provider', 'inspector', 'admin'];
const WorkflowModeContext = createContext(null);
const previewBuildEnabled = import.meta.env.DEV && import.meta.env.VITE_WORKFLOW_PREVIEW === 'true';

const readInitialMode = () => {
  if (!previewBuildEnabled || typeof window === 'undefined') return 'live';
  try {
    return window.sessionStorage.getItem(MODE_KEY) === 'preview' ? 'preview' : 'live';
  } catch {
    return 'live';
  }
};

const readInitialPreviewRole = () => {
  if (!previewBuildEnabled || typeof window === 'undefined') return null;
  try {
    const role = window.sessionStorage.getItem(ROLE_KEY);
    return PREVIEW_ROLES.includes(role) ? role : null;
  } catch {
    return null;
  }
};

const previewRoleForAccountRole = role => {
  if (role === 'service_provider') return 'provider';
  if (role === 'inspector') return 'inspector';
  if (['admin', 'hr', 'operations_admin', 'super_admin'].includes(role)) return 'admin';
  return role === 'client' ? 'client' : null;
};

export const WorkflowModeProvider = ({ children }) => {
  const [mode, setMode] = useState(readInitialMode);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [previewRole, setPreviewRoleState] = useState(readInitialPreviewRole);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user || null);
    }).catch(() => {
      if (active) setUser(null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        setMode('live');
        setPreviewRoleState(null);
        try { window.sessionStorage.removeItem(ROLE_KEY); } catch { /* Ignore unavailable session storage. */ }
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const enablePreview = useCallback(() => {
    if (!previewBuildEnabled || !user) return false;
    try { window.sessionStorage.setItem(MODE_KEY, 'preview'); } catch { /* Current tab can still use the mode. */ }
    const initialRole = previewRoleForAccountRole(role);
    if (initialRole) {
      setPreviewRoleState(initialRole);
      try { window.sessionStorage.setItem(ROLE_KEY, initialRole); } catch { /* Current tab can still use the role. */ }
    }
    setMode('preview');
    return true;
  }, [user, role]);

  const setPreviewRole = useCallback(nextRole => {
    if (!previewBuildEnabled || mode !== 'preview' || !PREVIEW_ROLES.includes(nextRole)) return false;
    setPreviewRoleState(nextRole);
    try { window.sessionStorage.setItem(ROLE_KEY, nextRole); } catch { /* Current tab can still use the role. */ }
    return true;
  }, [mode]);

  const disablePreview = useCallback(() => {
    try { window.sessionStorage.removeItem(MODE_KEY); } catch { /* Live mode is still selected in memory. */ }
    try { window.sessionStorage.removeItem(ROLE_KEY); } catch { /* Live mode is still selected in memory. */ }
    setPreviewRoleState(null);
    setMode('live');
  }, []);

  const resetPreviewData = useCallback(async () => {
    if (mode !== 'preview' || !user) return { data: null, error: { code: 'PREVIEW_MODE_DISABLED', message: 'Sign in and enable Preview mode before resetting demo data.' } };
    return getWorkflowServices({ mode: 'preview' }).reset();
  }, [mode, user]);

  useEffect(() => {
    let active = true;
    setRole(null);
    if (!user) return () => { active = false; };
    (async () => {
      const [profileResult, membershipResult] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('lucid_staff_memberships').select('role').eq('user_id', user.id).eq('is_active', true),
      ]);
      const memberships = membershipResult.data || [];
      const staffRole = memberships.find(item => ['super_admin', 'operations_admin', 'hr', 'inspector'].includes(item.role))?.role;
      const resolved = staffRole || profileResult.data?.role || memberships[0]?.role || null;
      if (active) setRole(resolved);
    })().catch(() => { if (active) setRole(null); });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (mode !== 'preview' || previewRole || !role) return;
    const initialRole = previewRoleForAccountRole(role);
    if (initialRole) setPreviewRole(initialRole);
  }, [mode, role, previewRole, setPreviewRole]);

  const effectiveRole = mode === 'preview' && previewRole ? previewRole : role;

  const value = useMemo(() => ({
    mode,
    user,
    role: effectiveRole,
    accountRole: role,
    previewRole,
    canEnablePreview: previewBuildEnabled,
    enablePreview,
    setPreviewRole,
    disablePreview,
    resetPreviewData,
  }), [mode, user, role, effectiveRole, previewRole, enablePreview, setPreviewRole, disablePreview, resetPreviewData]);

  return <WorkflowModeContext.Provider value={value}>{children}</WorkflowModeContext.Provider>;
};

export const useWorkflowMode = () => {
  const context = useContext(WorkflowModeContext);
  if (!context) throw new Error('WorkflowModeProvider is missing from the app tree.');
  return context;
};

export const useWorkflowServices = () => {
  const { mode, user, role } = useWorkflowMode();
  return useMemo(() => getWorkflowServices({ mode, user: user ? { id: user.id, role } : null }), [mode, user, role]);
};

export const useWorkflowActor = () => {
  const { mode, user, role } = useWorkflowMode();
  return { mode, role, userId: user?.id || null, isAuthenticated: Boolean(user) };
};
