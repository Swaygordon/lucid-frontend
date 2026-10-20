import { supabase } from '../supabaseClient.js';
import { normalizeWorkflowRole } from './workflowRoles.js';

const unsupported = feature => ({
  data: null,
  error: { code: 'LIVE_FEATURE_NOT_AVAILABLE', message: `Live ${feature} is not connected yet. Enable Preview mode to walk through the simulated workflow.` },
});

const normalizeRole = normalizeWorkflowRole;

export const createLiveWorkflowService = () => {
  const cases = {
    async listForRole({ role, userId, filters = {} }) {
      const normalized = normalizeRole(role);
      let query = supabase
        .from('managed_service_cases')
        .select('id, service_name, description, status, budget_min, budget_max, currency, preferred_date, preferred_time, created_at, client_id')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (normalized === 'client') query = query.eq('client_id', userId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.statuses?.length) query = query.in('status', filters.statuses);

      if (normalized === 'inspector') {
        const { data: assignments, error: assignmentError } = await supabase
          .from('inspection_assignments')
          .select('case_id')
          .eq('inspector_user_id', userId)
          .neq('status', 'cancelled');
        if (assignmentError) return { data: null, error: assignmentError };
        const caseIds = (assignments || []).map(item => item.case_id);
        if (caseIds.length === 0) return { data: [], error: null };
        query = query.in('id', caseIds);
      }

      if (normalized === 'provider') return { data: [], error: null };
      const { data, error } = await query;
      return { data, error };
    },
    async get(caseId, { role, userId }) {
      const normalized = normalizeRole(role);
      if (normalized === 'provider') return unsupported('Provider case details');
      if (!['client', 'inspector', 'admin'].includes(normalized) || !userId) return { data: null, error: { code: 'NOT_AUTHORIZED', message: 'This case is not available to this account.' } };
      if (normalized === 'inspector') {
        const { data: assignments, error: assignmentError } = await supabase.from('inspection_assignments').select('case_id').eq('inspector_user_id', userId).eq('case_id', caseId).neq('status', 'cancelled').limit(1);
        if (assignmentError) return { data: null, error: assignmentError };
        if (!assignments?.length) return { data: null, error: { code: 'NOT_AUTHORIZED', message: 'This case is not assigned to this Inspector.' } };
      }
      let query = supabase.from('managed_service_cases').select('id, service_name, description, status, budget_min, budget_max, currency, preferred_date, preferred_time, created_at').eq('id', caseId);
      if (normalized === 'client') query = query.eq('client_id', userId);
      const { data, error } = await query.single();
      return { data, error };
    },
    async apply() {
      return unsupported('workflow actions');
    },
  };

  const messages = {
    async listConversations({ role, userId }) {
      const normalized = normalizeRole(role);
      if (!['client', 'admin'].includes(normalized)) return unsupported(`${normalized} messages`);
      let query = supabase
        .from('managed_service_cases')
        .select('id, service_name, status, created_at')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      if (normalized === 'client') query = query.eq('client_id', userId);
      const { data, error } = await query;
      if (error) return { data: null, error };
      return {
        data: (data || []).map(record => ({
          id: record.id,
          caseId: record.id,
          serviceName: record.service_name,
          audience: 'client-admin',
          participantRole: 'admin',
          lastMessage: null,
          lastMessageAt: record.created_at,
          unreadCount: 0,
          preview: false,
          status: record.status,
        })),
        error: null,
      };
    },
    async listMessages(caseId, { role }) {
      const normalized = normalizeRole(role);
      if (!['client', 'admin'].includes(normalized)) return unsupported('staff and Inspector messages');
      const { data, error } = await supabase
        .from('managed_case_messages')
        .select('id, sender_type, body, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
      if (!error) {
        return {
          data: (data || []).map(message => ({
            id: message.id,
            threadId: caseId,
            caseId,
            audience: 'client-admin',
            senderRole: message.sender_type === 'client' ? 'client' : 'admin',
            body: message.body,
            at: message.created_at,
            read: true,
          })),
          error: null,
        };
      }
      return { data: null, error };
    },
    async sendMessage(caseId, { role, body, requestMoreInfo = false }) {
      const normalized = normalizeRole(role);
      if (!['client', 'admin'].includes(normalized)) return unsupported('staff and Inspector messages');
      const { error } = await supabase.rpc('send_lucid_case_message', {
        p_case_id: caseId,
        p_body: String(body || '').trim(),
        p_request_more_info: normalized === 'admin' && requestMoreInfo,
      });
      return { data: error ? null : { sent: true }, error };
    },
  };

  const finance = {
    async listEntries() {
      return unsupported('finance history');
    },
    async simulatePayment() {
      return unsupported('payment');
    },
    async decideRefund() {
      return unsupported('refund decisions');
    },
    async listPaymentMethods() {
      return unsupported('payout methods');
    },
    async savePaymentMethod() {
      return unsupported('payout method updates');
    },
    async removePaymentMethod() {
      return unsupported('payout method removal');
    },
    async requestWithdrawal() {
      return unsupported('withdrawals');
    },
  };

  const notifications = {
    async listForRole() {
      return unsupported('workflow notifications');
    },
    async markRead() {
      return unsupported('workflow notification updates');
    },
  };

  const profiles = {
    async getForRole({ role, userId }) {
      if (!userId) return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Sign in to view this profile.' } };
      const normalized = normalizeRole(role);
      if (normalized === 'inspector' || normalized === 'admin') {
        const [profileResult, membershipResult] = await Promise.all([
          supabase.from('profiles').select('id, role, first_name, last_name, avatar_url').eq('id', userId).maybeSingle(),
          supabase.from('lucid_staff_memberships').select('role').eq('user_id', userId).eq('is_active', true),
        ]);
        if (profileResult.error) return { data: null, error: profileResult.error };
        if (membershipResult.error) return { data: null, error: membershipResult.error };
        const profileMatches = normalizeRole(profileResult.data?.role) === normalized;
        const membershipMatches = (membershipResult.data || []).some(item => normalizeRole(item.role) === normalized);
        if (!profileMatches && !membershipMatches) return { data: null, error: { code: 'ROLE_MISMATCH', message: 'The signed-in account does not have this staff role.' } };
        return { data: { ...(profileResult.data || {}), id: userId, role: normalized, editable: false, preview: false }, error: null };
      }
      const { data, error } = await supabase.from('profiles').select('id, role, first_name, last_name, avatar_url').eq('id', userId).single();
      if (error) return { data: null, error };
      if (normalizeRole(data.role) !== normalized) return { data: null, error: { code: 'ROLE_MISMATCH', message: 'The signed-in account does not match this profile role.' } };
      return { data, error: null };
    },
  };

  return { cases, messages, finance, notifications, profiles };
};
