// Auth boundary: Supabase owns identity and role lookup. Authorization still belongs in RLS/RPCs.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { getWorkflowServices } from '../services/workflow/workflowService.js';
import { normalizeWorkflowRole } from '../services/workflow/workflowRoles.js';

const Context = createContext(null);
const publicRoles = new Set(['client', 'provider', 'inspector']);

async function resolvePrincipal(authUser) {
  const [profileResult, membershipResult] = await Promise.all([
    supabase.from('profiles').select('id, role, first_name, last_name, avatar_url').eq('id', authUser.id).maybeSingle(),
    supabase.from('lucid_staff_memberships').select('role').eq('user_id', authUser.id).eq('is_active', true),
  ]);
  if (profileResult.error) return { error: profileResult.error };
  if (membershipResult.error) return { error: membershipResult.error };

  const role = normalizeWorkflowRole(profileResult.data?.role)
    || normalizeWorkflowRole(membershipResult.data?.[0]?.role);
  if (!['client', 'provider', 'inspector', 'admin'].includes(role)) {
    return { error: { message: 'This account does not have an active LUCID role. Contact LUCID support.' } };
  }
  const fullName = [profileResult.data?.first_name, profileResult.data?.last_name].filter(Boolean).join(' ')
    || authUser.user_metadata?.full_name
    || '';
  return { data: { id: authUser.id, email: authUser.email || '', role, name: fullName, avatarUrl: profileResult.data?.avatar_url || '' } };
}

export const WorkflowModeProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const applySession = useCallback(async session => {
    if (!session?.user) { setUser(null); setRole(null); return; }
    const principal = await resolvePrincipal(session.user);
    if (principal.error) { setUser(null); setRole(null); return; }
    setUser(principal.data);
    setRole(principal.data.role);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.error('Could not restore the Supabase session.', error);
      if (active) await applySession(data?.session || null);
      if (active) setAuthLoading(false);
    }).catch(error => {
      console.error('Could not restore the Supabase session.', error);
      if (active) { setUser(null); setRole(null); setAuthLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) void applySession(session);
    });
    return () => { active = false; subscription?.unsubscribe(); };
  }, [applySession]);

  const signIn = useCallback(async ({ email, password }) => {
    const result = await supabase.auth.signInWithPassword({ email: String(email || '').trim(), password: String(password || '') });
    if (result.error) return { error: result.error.message };
    const principal = await resolvePrincipal(result.data.user);
    if (principal.error) {
      await supabase.auth.signOut();
      return { error: principal.error.message || 'Your account role could not be loaded.' };
    }
    setUser(principal.data); setRole(principal.data.role);
    return { data: principal.data, error: null };
  }, []);

  const signUp = useCallback(async ({ email, password, role: requestedRole, name }) => {
    if (!publicRoles.has(requestedRole)) return { error: 'Choose Client, Service provider, or Inspector. Admin access is provisioned by LUCID IT.' };
    const result = await supabase.auth.signUp({
      email: String(email || '').trim(),
      password: String(password || ''),
      options: { data: { signup_role: requestedRole, full_name: String(name || '').trim() } },
    });
    if (result.error) return { error: result.error.message };
    if (!result.data.session) return { data: { confirmationRequired: true, email: result.data.user?.email || email }, error: null };
    const principal = await resolvePrincipal(result.data.user);
    if (principal.error) return { error: 'Your account was created, but its role profile is not ready yet. Confirm your email and contact support if the problem continues.' };
    setUser(principal.data); setRole(principal.data.role);
    return { data: principal.data, error: null };
  }, []);

  const signOut = useCallback(async () => {
    const result = await supabase.auth.signOut();
    setUser(null); setRole(null);
    return result;
  }, []);

  const value = useMemo(() => ({ mode: 'live', user, role, accountRole: role, authLoading, signIn, signUp, signOut }), [user, role, authLoading, signIn, signUp, signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkflowMode = () => {
  const context = useContext(Context);
  if (!context) throw new Error('WorkflowModeProvider is missing from the app tree.');
  return context;
};

export const useWorkflowServices = () => {
  const { user, role } = useWorkflowMode();
  return useMemo(() => getWorkflowServices({ mode: 'live', user: user ? { id: user.id, role } : null }), [user, role]);
};

export const useWorkflowActor = () => {
  const { user, role } = useWorkflowMode();
  return { mode: 'live', role, userId: user?.id || null, isAuthenticated: Boolean(user) };
};
