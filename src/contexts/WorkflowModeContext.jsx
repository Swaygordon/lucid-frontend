// @backend-handoff-delete Entire local identity/session implementation; preserve the hook shape only if useful to the new auth provider.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getWorkflowServices } from '../services/workflow/workflowService.js';

const AUTH_KEY = 'lucid:preview-session';
const ROLE_KEY = 'lucid:workflow-preview-role';
const INSPECTOR_KEY = 'lucid:workflow-preview-inspector';
const ROLES = ['client', 'provider', 'inspector', 'admin'];
const Context = createContext(null);

const readSession = () => {
  try { return JSON.parse(window.localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
};
const readRole = () => {
  try { const role = window.localStorage.getItem(ROLE_KEY); return ROLES.includes(role) ? role : null; } catch { return null; }
};
const idForEmail = email => `preview-${String(email).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export const WorkflowModeProvider = ({ children }) => {
  const [user, setUser] = useState(readSession);
  const [accountRole, setAccountRole] = useState(() => readSession()?.role || null);
  const [role, setRole] = useState(readRole);
  const [previewInspectorId, setPreviewInspectorIdState] = useState(() => {
    try { return window.localStorage.getItem(INSPECTOR_KEY) || 'demo-inspector'; } catch { return 'demo-inspector'; }
  });

  const signIn = useCallback(({ email, role: selectedRole }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !ROLES.includes(selectedRole)) return { error: 'Enter an email and choose one of the four Preview roles.' };
    const nextUser = { id: idForEmail(normalizedEmail), email: normalizedEmail, role: selectedRole };
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));
    window.localStorage.setItem(ROLE_KEY, selectedRole);
    setUser(nextUser); setAccountRole(selectedRole); setRole(selectedRole);
    return { data: nextUser, error: null };
  }, []);

  const signUp = useCallback(({ email, role: selectedRole, name }) => {
    const result = signIn({ email, role: selectedRole });
    if (result.error) return result;
    const nextUser = { ...result.data, name: String(name || '').trim() };
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return { data: nextUser, error: null };
  }, [signIn]);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(AUTH_KEY); window.localStorage.removeItem(ROLE_KEY); window.localStorage.removeItem(INSPECTOR_KEY);
    setUser(null); setAccountRole(null); setRole(null); setPreviewInspectorIdState('demo-inspector');
  }, []);
  const setPreviewRole = useCallback(nextRole => {
    if (!ROLES.includes(nextRole)) return false;
    window.localStorage.setItem(ROLE_KEY, nextRole); setRole(nextRole); return true;
  }, []);
  const setPreviewInspector = useCallback(nextId => {
    if (!String(nextId || '').startsWith('demo-inspector')) return false;
    window.localStorage.setItem(INSPECTOR_KEY, nextId); setPreviewInspectorIdState(nextId); return true;
  }, []);
  const resetPreviewData = useCallback(async () => {
    if (!user) return { data: null, error: { code: 'PREVIEW_SIGNIN_REQUIRED', message: 'Sign in to reset Preview data.' } };
    const result = await getWorkflowServices({ mode: 'preview' }).reset();
    if (!result.error) window.dispatchEvent(new Event('lucid:workflow-preview-reset'));
    return result;
  }, [user]);

  const value = useMemo(() => ({ mode: 'preview', user, role, accountRole, previewRole: role, canEnablePreview: true, previewInspectorId, enablePreview: () => true, setPreviewRole, setPreviewInspectorId: setPreviewInspector, disablePreview: () => {}, resetPreviewData, signIn, signUp, signOut }), [user, role, accountRole, previewInspectorId, setPreviewRole, setPreviewInspector, resetPreviewData, signIn, signUp, signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkflowMode = () => {
  const context = useContext(Context);
  if (!context) throw new Error('WorkflowModeProvider is missing from the app tree.');
  return context;
};
export const useWorkflowServices = () => {
  const { user, role } = useWorkflowMode();
  return useMemo(() => getWorkflowServices({ mode: 'preview', user: user ? { id: user.id, role } : null }), [user, role]);
};
export const useWorkflowActor = () => {
  const { mode, user, role, previewInspectorId } = useWorkflowMode();
  const userId = role === 'client' ? 'demo-client' : role === 'provider' ? 'demo-provider' : role === 'admin' ? 'demo-admin' : role === 'inspector' ? previewInspectorId : user?.id || null;
  return { mode, role, userId, isAuthenticated: Boolean(user) };
};
