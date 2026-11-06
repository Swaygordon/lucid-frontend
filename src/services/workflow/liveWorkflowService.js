import { supabase } from '../supabaseClient.js';
import { normalizeWorkflowRole } from './workflowRoles.js';

const unsupported = feature => ({
  data: null,
  error: { code: 'BACKEND_OPERATION_NOT_IMPLEMENTED', message: `${feature} is not connected to Supabase yet.` },
});

const normalizeRole = normalizeWorkflowRole;

export const createLiveWorkflowService = () => {
  const cases = {
    async create() { return unsupported('Service request submission'); },
    async listForRole({ role, userId, filters = {} }) {
      const normalized = normalizeRole(role);
      let query = supabase
        .from('managed_service_cases')
        .select('id, service_name, description, status, suggested_range_min, suggested_range_max, currency, preferred_date, preferred_time, created_at, client_id')
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
      let query = supabase.from('managed_service_cases').select('id, service_name, description, status, suggested_range_min, suggested_range_max, currency, preferred_date, preferred_time, created_at').eq('id', caseId);
      if (normalized === 'client') query = query.eq('client_id', userId);
      const { data, error } = await query.single();
      return { data, error };
    },
    async apply() {
      return unsupported('workflow actions');
    },
    async listInspectorPrincipals() { return unsupported('Inspector assignments'); },
    async searchEligible() { return unsupported('Inspector search and assignment'); },
    async searchProviderCandidates() { return unsupported('Provider search and assignment'); },
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
    async editMessage() { return unsupported('Message editing history'); },
  };

  const finance = {
    async listEntries() {
      return unsupported('finance history');
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
    async createPaymentCheckout() { return unsupported('Secure payment checkout'); },
    async createPayoutOnboardingLink() { return unsupported('Secure payout onboarding'); },
    async getPayoutStatus() { return unsupported('Payout account status'); },
    async getEarningsSummary() { return unsupported('Earnings summary'); },
  };

  const notifications = {
    async listForRole() {
      return unsupported('workflow notifications');
    },
    async markRead() {
      return unsupported('workflow notification updates');
    },
    async markAllRead() { return unsupported('notification updates'); },
    async getPreferences() { return unsupported('notification preferences'); },
    async savePreferences() { return unsupported('notification preferences'); },
    async listConsentHistory() { return unsupported('notification consent history'); },
  };

  const assignments = {
    async listInspectorPrincipals() { return unsupported('Inspector assignments'); },
    async searchEligible() { return unsupported('Inspector search'); },
    async searchProviderCandidates() { return unsupported('Provider search'); },
  };

  const receipts = {
    async listForRole() { return unsupported('receipts'); },
  };

  const credentials = {
    async listTypes() { return unsupported('credential type lookup'); },
    async uploadEvidence() { return unsupported('secure credential evidence uploads'); },
    async createEvidenceLink() { return unsupported('private credential evidence access'); },
  };

  const operations = {
    async listDirectory() { return unsupported('account directory'); },
    async reviewCredential() { return unsupported('credential review'); },
    async listPolicyActions() { return unsupported('policy history'); },
    async applyAccountPolicy() { return unsupported('account policy actions'); },
    async submitAccountAppeal() { return unsupported('account appeals'); },
    async listAccountAppeals() { return unsupported('appeal review'); },
    async listMyAccountAppeals() { return unsupported('account appeals'); },
    async decideAccountAppeal() { return unsupported('appeal decisions'); },
    async listReviewFlags() { return unsupported('review moderation'); },
    async decideReviewFlag() { return unsupported('review moderation'); },
  };

  const profiles = {
    async getForRole({ role, userId }) {
      if (!userId) return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Sign in to view this profile.' } };
      const normalized = normalizeRole(role);
      if (normalized === 'inspector' || normalized === 'admin') {
        const [profileResult, membershipResult] = await Promise.all([
          supabase.from('profiles').select('id, role, first_name, last_name, avatar_url, profile_complete').eq('id', userId).maybeSingle(),
          supabase.from('lucid_staff_memberships').select('role').eq('user_id', userId).eq('is_active', true),
        ]);
        if (profileResult.error) return { data: null, error: profileResult.error };
        if (membershipResult.error) return { data: null, error: membershipResult.error };
        const profileMatches = normalizeRole(profileResult.data?.role) === normalized;
        const membershipMatches = (membershipResult.data || []).some(item => normalizeRole(item.role) === normalized);
        if (!profileMatches && !membershipMatches) return { data: null, error: { code: 'ROLE_MISMATCH', message: 'The signed-in account does not have this staff role.' } };
        return { data: { ...(profileResult.data || {}), id: userId, role: normalized, editable: normalized === 'inspector', profileComplete: Boolean(profileResult.data?.profile_complete) }, error: null };
      }
      const { data, error } = await supabase.from('profiles').select('id, role, first_name, last_name, avatar_url, profile_complete').eq('id', userId).single();
      if (error) return { data: null, error };
      if (normalizeRole(data.role) !== normalized) return { data: null, error: { code: 'ROLE_MISMATCH', message: 'The signed-in account does not match this profile role.' } };
      return { data: { ...data, editable: true, profileComplete: Boolean(data.profile_complete) }, error: null };
    },
    async updateAccountSetup() { return unsupported('role profile updates'); },
    async updateInspectorWorkProfile() { return unsupported('Inspector profile updates'); },
    async updatePayoutOnboardingState() { return unsupported('payout onboarding state changes'); },
    async listMyPrivacyRequests() { return unsupported('privacy requests'); },
    async submitPrivacyRequest() { return unsupported('privacy requests'); },
    async replyToReview() { return unsupported('Provider review responses'); },
    async flagReview() { return unsupported('review reports'); },
  };

  const extendedOperations = {
    ...operations,
    async listReviewFlags() { return unsupported('review moderation'); },
  };

  const publicReviews = {
    async listForProvider() { return unsupported('public Provider reviews'); },
  };

  return { cases, assignments, messages, finance, notifications, receipts, profiles, credentials, operations: extendedOperations, reviews: publicReviews };
};
