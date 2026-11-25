import { supabase } from '../supabaseClient.js';
import { normalizeWorkflowRole } from './workflowRoles.js';

const unsupported = feature => ({
  data: null,
  error: { code: 'BACKEND_OPERATION_NOT_IMPLEMENTED', message: `${feature} is not connected to Supabase yet.` },
});

const normalizeRole = normalizeWorkflowRole;

const uploadBase64Image = async (base64Str, bucket, userId) => {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
  try {
    const res = await fetch(base64Str);
    const blob = await res.blob();
    const fileExt = blob.type.split('/')[1] || 'jpeg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, blob, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Image upload failed:', err);
    return base64Str;
  }
};

export const createLiveWorkflowService = () => {
  const cases = {
    async create(payload, { role, userId }) {
      if (!userId) return { data: null, error: { message: 'You must be signed in to submit a request.' } };

      try {
        const { data: caseData, error: caseError } = await supabase
          .from('managed_service_cases')
          .insert({
            client_id: userId,
            service_name: payload.service,
            description: payload.description,
            status: 'submitted', 
            preferred_date: payload.preferredDate || null,
            preferred_time: payload.preferredTime || null,
            suggested_range_min: payload.clientRange?.min || null,
            suggested_range_max: payload.clientRange?.max || null,
            currency: payload.clientRange?.currency || 'GHS',
          })
          .select('id')
          .single();

        if (caseError) throw caseError;

        try {
          const { error: privateError } = await supabase
            .from('request_private_details')
            .insert({
              request_id: caseData.id,
              region: payload.region,
              city: payload.city,
              area: payload.serviceLocation?.area,
              street_address: payload.serviceLocation?.address,
              landmark: payload.serviceLocation?.landmark,
              postal_code: payload.serviceLocation?.postalCode,
              access_notes: payload.serviceLocation?.accessNotes,
              contact_name: payload.requestContact?.name,
              contact_phone: payload.requestContact?.phone,
              contact_email: payload.requestContact?.email,
              contact_preference: payload.requestContact?.preference
            });
          if (privateError) console.warn("Could not save private details:", privateError);
        } catch (privateCatch) {
          console.warn("Failed to insert private details:", privateCatch);
        }

        try {
          const { data: threadData, error: threadError } = await supabase
            .from('case_threads')
            .insert({ case_id: caseData.id, client_id: userId })
            .select('id')
            .single();

          if (!threadError && threadData) {
            await supabase.from('case_messages').insert({
              thread_id: threadData.id,
              sender_id: userId, 
              sender_role: 'admin',
              body: `Hello! We have received your request for a ${payload.service}. A member of our LUCID team is reviewing the details and will reach out shortly to coordinate the next steps. You can reply to this message if you need to add anything.`,
            });
          }
        } catch (msgCatch) {
          console.warn("Failed to create auto-message thread:", msgCatch);
        }

        return { data: { id: caseData.id }, error: null };

      } catch (error) {
        console.error("Case creation failed:", error);
        return { data: null, error: { message: error.message || 'Failed to submit the request.' } };
      }
    },
    
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

      if (normalized === 'provider') return { data: [], error: null };
      const { data, error } = await query;
      return { data, error };
    },
    
    async get(caseId, { role, userId }) {
      const normalized = normalizeRole(role);
      if (normalized === 'provider') return unsupported('Provider case details');
      if (!['client', 'inspector', 'admin'].includes(normalized) || !userId) return { data: null, error: { code: 'NOT_AUTHORIZED', message: 'This case is not available to this account.' } };
      
      let query = supabase.from('managed_service_cases').select('*').eq('id', caseId);
      if (normalized === 'client') query = query.eq('client_id', userId);
      const { data, error } = await query.single();
      return { data, error };
    },
    
    // ... (keep imports and other functions the same up to `cases`)

    async apply(caseId, { role, userId, action, payload }) {
      try {
        if (action === 'offer_provider') {
          const { error: updateError } = await supabase
            .from('managed_service_cases')
            .update({ 
              status: 'offer_sent',
              assigned_provider_id: payload.providerId 
            })
            .eq('id', caseId);

          if (updateError) throw updateError;

          const { data: caseDetails } = await supabase
            .from('managed_service_cases')
            .select('service_name, description')
            .eq('id', caseId)
            .single();

          const serviceName = caseDetails?.service_name || 'Service';
          const jobDescription = caseDetails?.description || 'No description provided.';

          // CRITICAL FIX: Find an existing thread for this Admin/Provider relationship
          // Instead of creating a new one, we look for ANY thread where the provider is the client_id.
          let { data: existingThread } = await supabase
            .from('case_threads')
            .select('id')
            .eq('client_id', payload.providerId)
            .limit(1)
            .maybeSingle();

          let threadId = existingThread?.id;

          // If no thread exists (first time chatting), create one
          if (!threadId) {
            const { data: newThread, error: threadError } = await supabase
              .from('case_threads')
              .insert({ 
                case_id: caseId, 
                client_id: payload.providerId 
              })
              .select('id')
              .single();

            if (threadError) throw threadError;
            threadId = newThread.id;
          }

          // Send the automated message to the (now existing) thread
          if (threadId) {
            const jobDetailsMessage = `**New Job Assignment**\n\n**Service:** ${serviceName}\n**Scope of Work:** ${jobDescription}\n\nPlease review these details. You can reply to this message if you need more information, or call LUCID Admin directly to discuss.`;
            
            await supabase.from('case_messages').insert({
              thread_id: threadId,
              sender_id: userId, 
              sender_role: 'admin',
              body: jobDetailsMessage
            });
          }

          return { data: { id: caseId, status: 'offer_sent' }, error: null };
        }

        return unsupported(`Workflow action: ${action}`);
      } catch (error) {
        console.error("Apply action failed:", error);
        return { data: null, error };
      }
    },

// ... (keep the rest of the file the same)
    
    async searchProviderCandidates({ caseId, role, userId }) {
      const { data: providers, error: provError } = await supabase
        .from('profiles')
        .select(`
          *,
          provider_profiles (*)
        `)
        .eq('role', 'provider')
        .eq('is_active', true);

      if (provError) return { data: null, error: provError };

      const formattedProviders = (providers || []).map(p => {
        const profile = p.provider_profiles || {};
        return {
          id: p.id,
          displayName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Provider',
          email: p.email || '',
          phone: p.phone_number || profile.phone_number || '',
          homeCity: p.city || profile.location || '',
          region: p.state || profile.region || '',
          categories: profile.categories || [],
          serviceIds: profile.categories || [],
          availability: profile.schedule_status || 'Available',
          assignmentCapacity: profile.assignment_capacity || 'Open',
          distanceKm: 10, 
          withinDefaultRadius: true,
          averageRating: 5.0, 
          reviewCount: 0,
          credentials: []
        };
      });

      return { data: formattedProviders, error: null };
    },
    
    async listInspectorPrincipals() { return unsupported('Inspector assignments'); },
    async searchEligible() { return unsupported('Inspector search and assignment'); },
  };

  const messages = {
    async listConversations({ role, userId }) {
      if (!userId) return { data: [], error: null };
      const normalized = normalizeRole(role);

      let query = supabase
        .from('case_threads')
        .select(`
          id, 
          case_id, 
          client_id,
          created_at,
          managed_service_cases ( service_name ),
          case_messages ( body, created_at, sender_role )
        `)
        .order('created_at', { ascending: false });

      if (normalized !== 'admin') {
        query = query.eq('client_id', userId);
      }

      const { data: threads, error } = await query;
      if (error) return { data: null, error };

      const clientIds = [...new Set((threads || []).map(t => t.client_id).filter(Boolean))];
      let profilesMap = {};
      
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role')
          .in('id', clientIds);
          
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      const formatted = (threads || []).map(thread => {
        const threadMessages = thread.case_messages || [];
        threadMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const lastMsg = threadMessages[0];
        
        const profile = profilesMap[thread.client_id] || {};
        const actualName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'User';

        return {
          id: thread.id,
          caseId: thread.case_id,
          clientId: thread.client_id,
          serviceName: thread.managed_service_cases?.service_name || 'General Support',
          audience: 'client-admin',
          participantRole: normalized === 'admin' ? (profile.role || 'client') : 'admin',
          otherUserName: actualName,
          otherUserAvatar: profile.avatar_url || null,
          lastMessage: lastMsg ? lastMsg.body : 'No messages yet',
          lastMessageAt: lastMsg ? lastMsg.created_at : thread.created_at,
          unreadCount: 0, 
          status: 'active',
        };
      });

      return { data: formatted, error: null };
    },

    async listMessages(threadId, { role, userId }) {
      if (!threadId || !userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('case_messages')
        .select('id, sender_role, body, created_at, sender_id')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) return { data: null, error };

      const formatted = (data || []).map(msg => ({
        id: msg.id,
        threadId: threadId,
        caseId: threadId,
        audience: 'client-admin',
        senderRole: msg.sender_role,
        body: msg.body,
        at: msg.created_at,
        read: true,
      }));

      return { data: formatted, error: null };
    },

    async sendMessage(threadId, { role, userId, body }) {
      if (!threadId || !userId || !body.trim()) return { data: null, error: { message: 'Missing data' } };
      const normalized = normalizeRole(role);

      const { data, error } = await supabase
        .from('case_messages')
        .insert({
          thread_id: threadId,
          sender_id: userId,
          sender_role: normalized === 'admin' ? 'admin' : normalized,
          body: body.trim()
        })
        .select()
        .single();

      if (error) return { data: null, error };
      return { data: { sent: true, message: data }, error: null };
    },

    async editMessage() { return unsupported('Message editing history'); },
  };

  const finance = {
    async listEntries({ role, userId }) {
      if (!userId) return { data: [], error: null };
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('id, case_id, type, amount, currency, status, reference, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error };

      const formatted = (data || []).map(entry => ({
        id: entry.id,
        caseId: entry.case_id,
        type: entry.type,
        amount: entry.amount,
        currency: entry.currency,
        status: entry.status,
        reference: entry.reference,
        at: entry.created_at
      }));

      return { data: formatted, error: null };
    },

    async getEarningsSummary({ role, userId }) {
      if (!userId) return { data: { thisMonth: 0, pending: 0, available: 0, paidOut: 0 }, error: null };
      const { data, error } = await supabase.from('ledger_entries').select('amount, status, created_at').eq('user_id', userId);
      if (error) return { data: null, error };

      let thisMonth = 0, pending = 0, available = 0, paidOut = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      (data || []).forEach(entry => {
        const amount = Number(entry.amount) || 0;
        const isThisMonth = new Date(entry.created_at).getTime() >= startOfMonth;
        if (isThisMonth && entry.status === 'completed') thisMonth += amount;
        if (entry.status === 'pending') pending += amount;
        if (entry.status === 'available') available += amount;
        if (entry.status === 'completed' && entry.type === 'payout') paidOut += amount;
      });

      return { data: { thisMonth, pending, available, paidOut }, error: null };
    },

    async decideRefund() { return unsupported('refund decisions'); },
    async listPaymentMethods() { return unsupported('payout methods'); },
    async savePaymentMethod() { return unsupported('payout method updates'); },
    async removePaymentMethod() { return unsupported('payout method removal'); },
    async requestWithdrawal() { return unsupported('withdrawals'); },
    async createPaymentCheckout() { return unsupported('Secure payment checkout'); },

    async getPayoutStatus({ userId }) {
      if (!userId) return { data: { status: 'not_started' }, error: null };
      const { data, error } = await supabase.from('payout_accounts').select('status, masked_destination').eq('user_id', userId).maybeSingle();
      if (error) return { data: null, error };
      return { data: data ? { status: data.status, maskedDestination: data.masked_destination } : { status: 'not_started' }, error: null };
    },

    async createPayoutOnboardingLink({ userId }) {
      if (!userId) return { data: null, error: { message: 'Sign in required' } };
      try {
        const { error } = await supabase.from('payout_accounts').upsert({
          user_id: userId,
          status: 'verification_pending',
          masked_destination: 'Bank ending in 1234',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) throw error;
        return { data: null, error: { message: 'Payout setup is currently in test mode. Connect Paystack to enable real onboarding.' } };
      } catch (err) {
        return { data: null, error: err };
      }
    },
  };

  const notifications = {
    async listForRole({ userId }) {
      if (!userId) return { data: [], error: null };
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return { data: data || [], error };
    },
    async markRead({ notificationId, userId }) {
      if (!userId || !notificationId) return { data: null, error: { message: 'Missing ID' } };
      const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', userId);
      return { data, error };
    },
    async markAllRead({ userId }) {
      if (!userId) return { data: null, error: { message: 'Missing ID' } };
      const { data, error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      return { data, error };
    },

    async getPreferences({ userId }) {
      if (!userId) return { data: null, error: null };
      const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle();

      if (error) return { data: null, error };

      if (!data) {
        return {
          data: {
            inApp: true,
            email: true,
            sms: false,
            categories: { requests: true, messages: true, payments: true, account: true, marketing: false }
          },
          error: null
        };
      }

      return {
        data: {
          inApp: data.in_app,
          email: data.email,
          sms: data.sms,
          categories: {
            requests: data.service_updates,
            messages: data.messages,
            payments: data.bills_payments,
            account: data.account_security,
            marketing: data.marketing
          }
        },
        error: null
      };
    },

    async savePreferences(preferences, context) {
      const userId = context?.userId || preferences?.userId;
      if (!userId) return { data: null, error: { message: 'Missing ID' } };

      const dbPayload = {
        user_id: userId,
        in_app: preferences.inApp ?? true,
        email: preferences.email ?? true,
        sms: preferences.sms ?? false,
        service_updates: preferences.categories?.requests ?? true,
        messages: preferences.categories?.messages ?? true,
        bills_payments: preferences.categories?.payments ?? true,
        account_security: preferences.categories?.account ?? true,
        marketing: preferences.categories?.marketing ?? false,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(dbPayload, { onConflict: 'user_id' });

      return { data, error };
    },

    async listConsentHistory({ userId }) { return { data: [], error: null }; },
  };

  const assignments = {
    async listInspectorPrincipals() { return unsupported('Inspector assignments'); },
    async searchEligible() { return unsupported('Inspector search'); },
    async searchProviderCandidates(args) { return cases.searchProviderCandidates(args); },
  };

  const receipts = {
    async listForRole({ role, userId }) {
      if (!userId) return { data: [], error: null };

      let query = supabase
        .from('receipts')
        .select(`
          *,
          managed_service_cases ( service_name, status )
        `)
        .order('issued_at', { ascending: false });

      if (role === 'client') {
        query = query.eq('client_id', userId);
      }

      const { data, error } = await query;
      if (error) return { data: null, error };

      const formatted = (data || []).map(receipt => ({
        id: receipt.id,
        caseId: receipt.case_id,
        paymentReference: receipt.payment_reference,
        totalAmount: receipt.total_amount,
        currency: receipt.currency,
        providerAmount: receipt.provider_amount,
        inspectorAmount: receipt.inspector_amount,
        platformAmount: receipt.platform_amount,
        issuedAt: receipt.issued_at,
        status: 'issued',
        client: 'Client',
        provider: 'Provider',
        caseRecord: receipt.managed_service_cases
      }));

      return { data: formatted, error: null };
    },
  };

  const credentials = {
    async listTypes() {
      return { data: [], error: null };
    },
    async uploadEvidence({ file, credentialId, userId }) {
      if (!file || !userId) return { data: null, error: { message: 'Missing file or user.' } };
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${credentialId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('credential-evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        return { data: { objectKey: filePath, fileName: file.name }, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    },

    async createEvidenceLink({ accountId, credentialId }) {
      if (!accountId || !credentialId) return { data: null, error: { message: 'Missing account or credential.' } };

      const { data: cred, error } = await supabase
        .from('credentials')
        .select('evidence_object_key')
        .eq('id', credentialId)
        .eq('user_id', accountId)
        .single();

      if (error || !cred?.evidence_object_key) {
        return { data: null, error: error || { message: 'No evidence file on this credential.' } };
      }

      const { data, error: signError } = await supabase.storage
        .from('credential-evidence')
        .createSignedUrl(cred.evidence_object_key, 300); 

      if (signError) return { data: null, error: signError };
      return { data: { url: data.signedUrl }, error: null };
    },
  };

  const operations = {
    async listDirectory({ role, userId }) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) return { data: null, error: profileError };

      const { data: providerProfiles } = await supabase.from('provider_profiles').select('*');
      const { data: credentials } = await supabase.from('credentials').select('*');

      const formatted = (profiles || []).map(p => {
        const roleProfile = (providerProfiles || []).find(pp => pp.user_id === p.id);
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ')
                      || [roleProfile?.first_name, roleProfile?.last_name].filter(Boolean).join(' ')
                      || p.email
                      || 'Unnamed User';

        const userCredentials = (credentials || []).filter(c => c.user_id === p.id).map(c => ({
          id: c.id,
          credentialTypeId: c.credential_type_id,
          serviceId: c.service_id,
          issuer: c.issuer,
          level: c.level,
          certificateNumber: c.certificate_number,
          issuedYear: c.issued_year,
          expiresAt: c.expires_at,
          evidenceObjectKey: c.evidence_object_key,
          verificationStatus: c.verification_status
        }));

        return {
          id: p.id,
          name: fullName,
          email: p.email || '',
          phone: p.phone_number || roleProfile?.phone_number || '',
          role: p.role,
          accountStatus: p.is_active === false ? 'suspended' : 'active',
          city: p.city || roleProfile?.location || '',
          region: p.state || roleProfile?.region || '',
          profileComplete: Boolean(p.profile_complete || roleProfile?.is_profile_complete),
          categories: roleProfile?.categories || [],
          yearsExperience: roleProfile?.work_experience || 0,
          serviceRadiusKm: roleProfile?.service_radius_km || 0,
          skills: roleProfile?.skills || [],
          languages: roleProfile?.languages || [],
          qualifications: roleProfile?.qualifications || [],
          portfolioItems: roleProfile?.portfolio_items || [],
          availability: roleProfile?.schedule_status || 'Not set',
          assignmentCapacity: roleProfile?.assignment_capacity || 'Not specified',
          credentials: userCredentials,
          caseIds: [],
          caseCount: 0,
          payoutStatus: 'not_started',
          savedLocationCount: 0
        };
      });

      return { data: formatted, error: null };
    },

    async listPolicyActions() {
      const { data, error } = await supabase
        .from('policy_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { data: null, error };

      return {
        data: (data || []).map(item => ({
          id: item.id,
          subjectId: item.subject_id,
          subjectName: item.subject_name || 'Unknown User',
          subjectRole: item.subject_role || 'unknown',
          action: item.action,
          policyCategory: item.policy_category,
          facts: item.facts,
          policyReference: item.policy_reference,
          notificationChannel: item.notification_channel,
          notificationStatus: item.notification_status,
          createdAt: item.created_at
        })),
        error: null
      };
    },

    async applyAccountPolicy(data, { role, userId }) {
      const { error } = await supabase.from('policy_actions').insert({
        subject_id: data.subjectId,
        subject_name: data.subjectName,
        subject_role: data.subjectRole,
        action: data.action,
        policy_category: data.policyCategory,
        facts: data.facts,
        policy_reference: data.policyReference,
        notification_channel: data.notificationChannel,
        notification_status: 'sent'
      });

      if (error) return { data: null, error };

      if (data.action === 'suspend' || data.action === 'close') {
        await supabase.from('profiles').update({ is_active: false }).eq('id', data.subjectId);
      }

      return { data: { success: true }, error: null };
    },

    async listAccountAppeals() {
      return { data: [], error: null };
    },

    async decideAccountAppeal(appealId, { decision, reason }, { role, userId }) {
      return unsupported('appeal decisions');
    },

    async submitAccountAppeal({ reason }, { role, userId }) {
      return unsupported('account appeals');
    },

    async listMyAccountAppeals() {
      return { data: [], error: null };
    },

    async reviewCredential({ accountId, credentialId, decision, reason }, { role, userId }) {
      try {
        const { error: credError } = await supabase
          .from('credentials')
          .update({ verification_status: decision })
          .eq('id', credentialId)
          .eq('user_id', accountId);

        if (credError) throw credError;

        try {
            await supabase.from('credential_reviews').insert({
              credential_id: credentialId,
              reviewer_id: userId,
              decision: decision,
              notes: reason,
              created_at: new Date().toISOString()
            });
        } catch (auditError) {
            console.warn("Audit log failed:", auditError);
        }

        return { data: { success: true }, error: null };
      } catch (error) {
        console.error("Credential review failed:", error);
        return { data: null, error: { message: error.message } };
      }
    },
    
    async listReviewFlags() { return unsupported('review moderation'); },
    async decideReviewFlag() { return unsupported('review moderation'); },
  };

  const profiles = {
    async getForRole({ role, userId }) {
      if (!userId) return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Sign in to view this profile.' } };
      const normalized = normalizeRole(role);

      const { data: baseProfile, error: baseError } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (baseError) return { data: null, error: baseError };

      let roleProfile = null;
      let savedAddresses = [];
      let credentialsList = [];

      if (normalized === 'client') {
        const { data } = await supabase.from('client_profiles').select('*').eq('user_id', userId).maybeSingle();
        roleProfile = data;
        const { data: addresses } = await supabase.from('saved_addresses').select('*').eq('user_id', userId);
        savedAddresses = addresses || [];
      } else if (normalized === 'provider') {
        const { data } = await supabase.from('provider_profiles').select('*').eq('user_id', userId).maybeSingle();
        roleProfile = data;
        const { data: creds } = await supabase.from('credentials').select('*').eq('user_id', userId);
        credentialsList = creds || [];
      }

      const fullName = [baseProfile.first_name, baseProfile.last_name].filter(Boolean).join(' ') || roleProfile?.first_name || '';

      const formattedData = {
        id: userId,
        role: normalized,
        fullName: fullName,
        phone: baseProfile.phone_number || roleProfile?.phone_number || '',
        homeCity: baseProfile.city || roleProfile?.location || '',
        region: baseProfile.state || roleProfile?.region || '',
        profilePhoto: roleProfile?.avatar_url || baseProfile.avatar_url || '',
        profileComplete: Boolean(roleProfile?.profile_complete || roleProfile?.is_profile_complete || baseProfile.profile_complete),
        bio: roleProfile?.bio || roleProfile?.description || baseProfile.bio || '',

        serviceLocations: savedAddresses.map(addr => ({
          id: addr.id,
          label: addr.label || '',
          region: addr.region || addr.state || '',
          city: addr.city || '',
          area: addr.area || '',
          address: addr.address || '',
          accessNotes: addr.access_notes || '',
          isDefault: addr.is_default
        })),

        credentials: credentialsList.map(c => ({
          id: c.id,
          credentialTypeId: c.credential_type_id,
          serviceId: c.service_id,
          issuer: c.issuer,
          level: c.level,
          certificateNumber: c.certificate_number,
          issuedYear: c.issued_year,
          expiresAt: c.expires_at,
          evidenceObjectKey: c.evidence_object_key,
          verificationStatus: c.verification_status
        })),

        ...(normalized === 'provider' && {
          categories: roleProfile?.categories || [],
          serviceIds: roleProfile?.categories || [],
          skills: roleProfile?.skills || [],
          languages: roleProfile?.languages || [],
          qualifications: roleProfile?.qualifications || [],
          yearsExperience: roleProfile?.work_experience || 0,
          serviceRadiusKm: roleProfile?.service_radius_km || 25,
          portfolioItems: roleProfile?.portfolio_items || [],
          constructionWorkTypeIds: roleProfile?.construction_work_types || [],
          presenceStatus: roleProfile?.presence_status || 'offline',
          scheduleStatus: roleProfile?.schedule_status || 'on_shift',
          assignmentCapacity: roleProfile?.assignment_capacity || 'open',
          maxActiveAssignments: roleProfile?.max_active_assignments || 3,
        })
      };

      return { data: formattedData, error: null };
    },

    async updateAccountSetup({ role, userId, profile }) {
      if (!userId) return { data: null, error: { code: 'AUTH_REQUIRED', message: 'Sign in to save.' } };
      const normalized = normalizeRole(role);

      try {
        let avatarUrl = profile.profilePhoto;
        if (avatarUrl && avatarUrl.startsWith('data:image')) {
          avatarUrl = await uploadBase64Image(avatarUrl, 'avatars', userId);
        }

        let portfolioItems = profile.portfolioItems || [];
        if (normalized === 'provider' && portfolioItems.length > 0) {
          portfolioItems = await Promise.all(portfolioItems.map(async (item) => {
            if (item.imageData && item.imageData.startsWith('data:image')) {
              const uploadedUrl = await uploadBase64Image(item.imageData, 'service-images', userId);
              return { ...item, imageData: uploadedUrl };
            }
            return item;
          }));
        }

        const nameParts = (profile.fullName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await supabase.from('profiles').update({
          first_name: firstName,
          last_name: lastName,
          phone_number: profile.phone,
          city: profile.homeCity,
          state: profile.region,
          avatar_url: avatarUrl,
          profile_complete: true,
        }).eq('id', userId);

        if (normalized === 'client') {
          await supabase.from('client_profiles').upsert({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone_number: profile.phone,
            location: profile.homeCity,
            region: profile.region,
            avatar_url: avatarUrl,
            profile_complete: true,
          }, { onConflict: 'user_id' });

          await supabase.from('saved_addresses').delete().eq('user_id', userId);
          if (profile.serviceLocations?.length > 0) {
            await supabase.from('saved_addresses').insert(
              profile.serviceLocations.map(loc => ({
                user_id: userId,
                label: loc.label,
                region: loc.region,
                city: loc.city,
                area: loc.area,
                address: loc.address,
                access_notes: loc.accessNotes,
                is_default: loc.isDefault
              }))
            );
          }
        }

        if (normalized === 'provider') {
          const { error: providerError } = await supabase.from('provider_profiles').upsert({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            location: profile.homeCity,
            region: profile.region,
            avatar_url: avatarUrl,
            is_profile_complete: true,
            description: profile.bio,
            categories: profile.categories,
            skills: profile.skills,
            languages: profile.languages,
            qualifications: profile.qualifications,
            work_experience: profile.yearsExperience,
            service_radius_km: profile.serviceRadiusKm,
            portfolio_items: portfolioItems,
            construction_work_types: profile.constructionWorkTypeIds,
            presence_status: profile.presenceStatus,
            schedule_status: profile.scheduleStatus,
            assignment_capacity: profile.assignmentCapacity,
            max_active_assignments: profile.maxActiveAssignments
          }, { onConflict: 'user_id' });

          if (providerError) throw providerError;

          await supabase.from('credentials').delete().eq('user_id', userId);

          if (profile.credentials?.length > 0) {
            const credsToInsert = profile.credentials.map(cred => {
              return {
                id: cred.id,
                user_id: userId,
                credential_type_id: cred.credentialTypeId,
                service_id: cred.serviceId || null,
                issuer: cred.issuer,
                level: cred.level,
                certificate_number: cred.certificateNumber,
                issued_year: cred.issuedYear,
                expires_at: cred.expiresAt || null,
                evidence_object_key: cred.evidenceObjectKey || null,
                verification_status: cred.verificationStatus
              };
            });

            const { error: credError } = await supabase.from('credentials').insert(credsToInsert);
            if (credError) throw credError;
          }
        }

        return { data: { success: true }, error: null };
      } catch (err) {
        console.error('Save error details:', err);
        return { data: null, error: { message: err.message || 'Failed to save profile.' } };
      }
    },

    async updateInspectorWorkProfile() { return unsupported('Inspector profile updates'); },
    async updatePayoutOnboardingState() { return unsupported('payout onboarding state changes'); },
    async listMyPrivacyRequests() { return unsupported('privacy requests'); },
    async submitPrivacyRequest() { return unsupported('privacy requests'); },
    async replyToReview() { return unsupported('Provider review responses'); },
    async flagReview() { return unsupported('review reports'); },
  };

  const publicReviews = {
    async listForProvider() { return unsupported('public Provider reviews'); },
  };

  const auth = {
    async sendPasswordReset({ email }) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/lucid/update-password`,
      });
      return { data: { sent: !error }, error };
    },
    async updatePassword({ newPassword }) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { data: { updated: !error }, error };
    },
    async updateEmail({ newEmail }) {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      return { data: { updated: !error }, error };
    }
  };

  return { cases, assignments, messages, finance, notifications, receipts, profiles, credentials, operations, reviews: publicReviews, auth };
};