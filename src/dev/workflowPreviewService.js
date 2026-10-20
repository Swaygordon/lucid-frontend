import { applyWorkflowAction } from './workflowTransitions.js';
import { createWorkflowPreviewSeed } from './workflowPreviewSeed.js';
import { createPreviewStore } from './workflowPreviewStore.js';
import { normalizeWorkflowRole } from '../services/workflow/workflowRoles.js';

const clone = value => JSON.parse(JSON.stringify(value));
const resultError = (code, message) => ({ data: null, error: { code, message } });
const actorKey = { client: 'demo-client', provider: 'demo-provider', inspector: 'demo-inspector' };

const canAccessCase = (record, role) => {
  if (role === 'admin') return true;
  if (role === 'client') return record.clientRoleId === actorKey.client;
  if (role === 'provider') return record.assignedProviderId === actorKey.provider;
  if (role === 'inspector') return record.assignedInspectorId === actorKey.inspector;
  return false;
};

const roleCanSeeAudience = (role, audience) => {
  const normalized = normalizeWorkflowRole(role);
  if (normalized === 'admin') return true;
  if (normalized === 'client') return ['client-admin', 'client-inspector'].includes(audience);
  if (normalized === 'provider') return ['provider-admin', 'provider-inspector'].includes(audience);
  if (normalized === 'inspector') return ['client-inspector', 'provider-inspector', 'inspector-admin'].includes(audience);
  return false;
};

const audienceIsValid = audience => [
  'client-admin', 'client-inspector', 'provider-admin', 'provider-inspector', 'inspector-admin',
].includes(audience);

const caseForActor = (storeData, caseId, role, userId) => {
  const record = storeData.cases.find(item => item.id === caseId);
  if (!record) return { error: { code: 'CASE_NOT_FOUND', message: 'This preview case could not be found.' } };
  const normalizedRole = normalizeWorkflowRole(role);
  if (!userId || !canAccessCase(record, normalizedRole)) {
    return { error: { code: 'NOT_AUTHORIZED', message: 'This role is not assigned to the preview case.' } };
  }
  if (normalizedRole === 'client' && record.status !== 'cancelled_fee_due' && storeData.cases.some(item => item.featuresBlocked)) {
    return { error: { code: 'ACCOUNT_RESTRICTED', message: 'Pay the simulated cancellation fee or contact LUCID to restore Client access.' } };
  }
  return { record, role: normalizedRole };
};

const addNotification = (data, role, caseId, message, at) => {
  data.notifications.unshift({
    id: `preview-notice-${Date.now()}-${data.notifications.length}`,
    role,
    caseId,
    message,
    at,
    read: false,
  });
  data.notifications = data.notifications.slice(0, 100);
};

const addFinanceEntries = (data, record, at) => {
  if (record.paymentStatus !== 'confirmed' || !record.providerBill) return;
  const bill = record.providerBill;
  const entries = [
    { id: `${record.id}-preview-client-charge`, caseId: record.id, role: 'client', type: 'client_total', amount: bill.payableAmount, status: 'confirmed', at },
    { id: `${record.id}-preview-provider-payout`, caseId: record.id, role: 'provider', type: 'provider_payout', amount: bill.providerAmount, status: 'released', at },
    { id: `${record.id}-preview-platform-charge`, caseId: record.id, role: 'admin', type: 'platform_charge', amount: bill.commissionAmount, status: 'confirmed', at },
  ];
  data.financeEntries = [
    ...data.financeEntries.filter(entry => !entries.some(candidate => candidate.id === entry.id)),
    ...entries,
  ];
};

const defaultStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    return {
      getItem() { throw new Error('Local storage is unavailable.'); },
      setItem() { throw new Error('Local storage is unavailable.'); },
      removeItem() { throw new Error('Local storage is unavailable.'); },
    };
  }
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};

export const createPreviewWorkflowService = ({ storage = defaultStorage(), seedData = createWorkflowPreviewSeed(), clock = () => new Date().toISOString() } = {}) => {
  const store = createPreviewStore({ storage, seedData });

  const applyAction = async (caseId, { role, userId, action, payload = {} }, { systemAction = false } = {}) => {
    const loaded = store.read();
    if (loaded.error) return loaded;
    const access = caseForActor(loaded.data, caseId, role, userId);
    if (access.error) return resultError(access.error.code, access.error.message);

    const timestamp = clock();
    const applied = applyWorkflowAction(access.record, {
      role: systemAction ? 'system' : access.role,
      action,
      payload,
      at: timestamp,
    });
    if (applied.error) return resultError(applied.error.code, applied.error.message);

    const next = clone(loaded.data);
    next.cases = next.cases.map(item => item.id === caseId ? applied.caseRecord : item);
    const otherRoles = ['client', 'admin', ...(applied.caseRecord.assignedInspectorId ? ['inspector'] : []), ...(applied.caseRecord.assignedProviderId ? ['provider'] : [])];
    for (const recipient of new Set(otherRoles.filter(item => item !== access.role))) {
      addNotification(next, recipient, caseId, `${applied.caseRecord.service || 'Service request'}: ${action.replaceAll('_', ' ')}`, timestamp);
    }
    if (action === 'payment_result' || action === 'confirm_delayed_payment') addFinanceEntries(next, applied.caseRecord, timestamp);
    if (action === 'cancel_case' && applied.caseRecord.cancellationFeeDue > 0) {
      next.financeEntries.push({ id: `${caseId}-cancellation-fee`, caseId, role: 'client', type: 'cancellation_fee_recovery', amount: applied.caseRecord.cancellationFeeDue, status: 'due', at: timestamp });
    }
    if (action === 'pay_cancellation_fee') {
      next.financeEntries = next.financeEntries.map(entry => entry.id === `${caseId}-cancellation-fee` ? { ...entry, status: 'paid', paidAt: timestamp } : entry);
    }
    const saved = store.write(next);
    return saved.error ? saved : { data: clone(applied.caseRecord), error: null };
  };

  const cases = {
    async create(payload, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'client') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Client can submit a preview request.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      if (loaded.data.cases.some(item => item.featuresBlocked)) return resultError('ACCOUNT_RESTRICTED', 'Recover the simulated cancellation fee before submitting a request.');
      const timestamp = clock();
      const id = `LUCID-PREVIEW-${Date.now()}-${loaded.data.cases.length + 1}`;
      const record = {
        id, service: payload.service || payload.service_name || 'Service request', category: payload.category || '',
        scope: payload.scope || payload.description || '', description: payload.description || payload.scope || '',
        locationSummary: payload.locationSummary || '', clientRoleId: actorKey.client,
        assignedInspectorId: '', assignedProviderId: '',
        clientRange: payload.clientRange || { min: Number(payload.budget_min || 0), max: Number(payload.budget_max || 0), currency: payload.currency || 'GHS' },
        status: 'submitted', inspection: null, confirmedScope: '', providerAcceptedAt: null, workStartedAt: null,
        pendingPriceChange: null, approvedWorkAmount: null, providerBill: null, clientSatisfied: false,
        commissionRate: 10, paymentStatus: 'unpaid', paymentReference: '', providerPayoutStatus: 'not_released',
        providerPayoutAmount: 0, cancellationFeeDue: 0, cancellationFeePaid: false, featuresBlocked: false,
        dispute: null, refundRequest: null,
        history: [{ id: `${id}-created`, actorRole: 'client', action: 'submit_request', label: 'Client submitted a preview request', at: timestamp }],
      };
      const next = clone(loaded.data);
      next.cases.unshift(record);
      const threadId = `client-admin:${id}`;
      next.messages.push({ id: `${threadId}-welcome`, threadId, caseId: id, audience: 'client-admin', senderRole: 'admin', body: 'LUCID received your preview request. This is a simulated conversation.', at: timestamp, read: false });
      addNotification(next, 'admin', id, 'A new preview request needs review.', timestamp);
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(record), error: null };
    },
    async listForRole({ role, userId, filters = {} }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in with an authorized account to view preview cases.');
      let records = loaded.data.cases.filter(record => canAccessCase(record, normalized));
      if (normalized === 'client' && loaded.data.cases.some(item => item.featuresBlocked)) records = records.filter(record => record.status === 'cancelled_fee_due');
      if (filters.status) records = records.filter(record => record.status === filters.status);
      if (filters.statuses) records = records.filter(record => filters.statuses.includes(record.status));
      return { data: clone(records), error: null };
    },
    async get(caseId, { role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const access = caseForActor(loaded.data, caseId, role, userId);
      return access.error ? resultError(access.error.code, access.error.message) : { data: clone(access.record), error: null };
    },
    apply: applyAction,
  };

  const messages = {
    async listConversations({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId) return resultError('NOT_AUTHORIZED', 'Sign in to view messages.');
      if (normalized === 'client' && loaded.data.cases.some(item => item.featuresBlocked)) return resultError('ACCOUNT_RESTRICTED', 'Client messaging is restricted until the cancellation fee is recovered.');
      const grouped = new Map();
      for (const message of loaded.data.messages) {
        const audience = message.audience || message.threadId?.split(':')[0];
        if (!audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience)) continue;
        const record = message.caseId ? loaded.data.cases.find(item => item.id === message.caseId) : null;
        if (message.caseId && (!record || !canAccessCase(record, normalized))) continue;
        const prior = grouped.get(message.threadId) || {
          id: message.threadId,
          caseId: message.caseId || null,
          serviceName: record?.service || 'LUCID support',
          audience,
          participantRole: message.senderRole,
          lastMessage: message.body,
          lastMessageAt: message.at,
          unreadCount: 0,
          preview: true,
        };
        prior.lastMessage = message.body;
        prior.lastMessageAt = message.at;
        if (!message.read && message.senderRole !== normalized) prior.unreadCount += 1;
        grouped.set(message.threadId, prior);
      }
      return { data: [...grouped.values()].sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt))), error: null };
    },
    async listMessages(threadId, { role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const matching = loaded.data.messages.filter(message => message.threadId === threadId);
      const first = matching[0];
      if (!first || !userId) return resultError('NOT_AUTHORIZED', 'This message thread is not available.');
      const normalized = normalizeWorkflowRole(role);
      if (normalized === 'client' && loaded.data.cases.some(item => item.featuresBlocked)) return resultError('ACCOUNT_RESTRICTED', 'Client messaging is restricted until the cancellation fee is recovered.');
      const audience = first.audience || first.threadId?.split(':')[0];
      const record = first.caseId ? loaded.data.cases.find(item => item.id === first.caseId) : null;
      if (!audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience) || (first.caseId && (!record || !canAccessCase(record, normalized)))) {
        return resultError('NOT_AUTHORIZED', 'This role is not allowed to view this message thread.');
      }
      return { data: clone(matching), error: null };
    },
    async sendMessage(threadId, { role, userId, body }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const matching = loaded.data.messages.filter(message => message.threadId === threadId);
      const first = matching[0];
      if (!first || !userId) return resultError('NOT_AUTHORIZED', 'This message thread is not available.');
      const normalized = normalizeWorkflowRole(role);
      if (normalized === 'client' && loaded.data.cases.some(item => item.featuresBlocked)) return resultError('ACCOUNT_RESTRICTED', 'Client messaging is restricted until the cancellation fee is recovered.');
      const audience = first.audience || first.threadId?.split(':')[0];
      const record = first.caseId ? loaded.data.cases.find(item => item.id === first.caseId) : null;
      if (!audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience) || (first.caseId && (!record || !canAccessCase(record, normalized)))) {
        return resultError('NOT_AUTHORIZED', 'This role is not allowed to send to this message thread.');
      }
      const cleanBody = String(body || '').trim();
      if (!cleanBody) return resultError('MESSAGE_REQUIRED', 'Write a message before sending.');
      const timestamp = clock();
      const sent = { id: `preview-message-${Date.now()}-${matching.length}`, threadId, caseId: first.caseId || null, audience, senderRole: normalized, body: cleanBody, at: timestamp, read: true };
      const next = clone(loaded.data);
      next.messages.push(sent);
      for (const recipient of audience.split('-')) {
        if (recipient !== normalized) addNotification(next, recipient, first.caseId || null, `New ${normalized} message in ${first.caseId || 'LUCID support'}.`, timestamp);
      }
      const saved = store.write(next);
      return saved.error ? saved : { data: sent, error: null };
    },
  };

  const finance = {
    async listEntries({ role, userId, filters = {} }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in with an authorized account to view preview finance.');
      let entries = loaded.data.financeEntries.filter(entry => normalized === 'admin' || entry.role === normalized);
      if (normalized === 'client' && loaded.data.cases.some(item => item.featuresBlocked)) entries = loaded.data.financeEntries.filter(entry => entry.role === 'client' && entry.type === 'cancellation_fee_recovery' && entry.status === 'due');
      if (filters.caseId) entries = entries.filter(entry => entry.caseId === filters.caseId);
      return { data: clone(entries), error: null };
    },
    async listPaymentMethods({ role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can view payout methods in Preview.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      return { data: clone(loaded.data.paymentMethods.filter(method => method.role === normalized)), error: null };
    },
    async savePaymentMethod(method, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can edit payout methods in Preview.');
      if (!method || !['mobile-money', 'bank'].includes(method.type) || !String(method.name || '').trim() || !String(method.number || '').trim()) {
        return resultError('INVALID_PAYMENT_METHOD', 'Enter a payout method type, provider/bank, and account number.');
      }
      const loaded = store.read();
      if (loaded.error) return loaded;
      const next = clone(loaded.data);
      const id = method.id || `preview-method-${Date.now()}-${next.paymentMethods.length}`;
      const isPrimary = Boolean(method.isPrimary) || !next.paymentMethods.some(item => item.role === 'provider');
      next.paymentMethods = next.paymentMethods
        .filter(item => item.id !== id)
        .map(item => ({ ...item, isPrimary: isPrimary ? false : item.isPrimary }));
      next.paymentMethods.push({ ...clone(method), id, role: normalized, name: String(method.name).trim(), number: String(method.number).trim(), isPrimary });
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(next.paymentMethods.find(item => item.id === id)), error: null };
    },
    async removePaymentMethod(id, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can edit payout methods in Preview.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const next = clone(loaded.data);
      const method = next.paymentMethods.find(item => item.id === id && item.role === normalized);
      if (!method) return resultError('PAYMENT_METHOD_NOT_FOUND', 'This payout method is not available in Preview.');
      next.paymentMethods = next.paymentMethods.filter(item => item.id !== id);
      const saved = store.write(next);
      return saved.error ? saved : { data: { removed: id }, error: null };
    },
    async requestWithdrawal(amount, paymentMethodId, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can preview a withdrawal.');
      const requestedAmount = Number(amount);
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) return resultError('INVALID_WITHDRAWAL_AMOUNT', 'Enter a valid simulated withdrawal amount.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const method = loaded.data.paymentMethods.find(item => item.id === paymentMethodId && item.role === normalized);
      if (!method) return resultError('PAYMENT_METHOD_REQUIRED', 'Choose a saved payout method before simulating a withdrawal.');
      const providerEntries = loaded.data.financeEntries.filter(entry => entry.role === normalized);
      const available = providerEntries.reduce((total, entry) => {
        if (entry.type === 'provider_payout' && ['released', 'paid', 'confirmed', 'completed'].includes(String(entry.status).toLowerCase())) return total + Math.abs(Number(entry.amount) || 0);
        if (entry.type === 'provider_withdrawal') return total - Math.abs(Number(entry.amount) || 0);
        return total;
      }, 0);
      if (requestedAmount > Math.max(0, available)) return resultError('INSUFFICIENT_PREVIEW_BALANCE', 'The simulated withdrawal exceeds the Provider’s available preview balance.');
      const next = clone(loaded.data);
      const entry = {
        id: `preview-withdrawal-${Date.now()}-${next.financeEntries.length}`,
        role: normalized,
        type: 'provider_withdrawal',
        amount: -requestedAmount,
        status: 'simulated',
        method: method.name,
        paymentMethodId,
        at: clock(),
      };
      next.financeEntries.unshift(entry);
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(entry), error: null };
    },
    async simulatePayment(caseId, { role, userId, outcome }) {
      if (normalizeWorkflowRole(role) !== 'client') return resultError('ROLE_NOT_ALLOWED', 'Only the Client can simulate payment for this case.');
      return applyAction(caseId, { role, userId, action: 'payment_result', payload: { outcome } }, { systemAction: true });
    },
    async decideRefund(caseId, { role, userId, decision, reason }) {
      if (normalizeWorkflowRole(role) !== 'admin') return resultError('ROLE_NOT_ALLOWED', 'Only LUCID Admin can decide a refund request.');
      return applyAction(caseId, { role, userId, action: 'decide_refund', payload: { decision, reason } });
    },
  };

  const notifications = {
    async listForRole({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId) return resultError('NOT_AUTHORIZED', 'Sign in to view notifications.');
      return { data: clone(loaded.data.notifications.filter(item => item.role === normalized || normalized === 'admin')), error: null };
    },
    async markRead(notificationId, { role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId) return resultError('NOT_AUTHORIZED', 'Sign in to update notifications.');
      const next = clone(loaded.data);
      const item = next.notifications.find(notification => notification.id === notificationId && (notification.role === normalized || normalized === 'admin'));
      if (!item) return resultError('NOT_AUTHORIZED', 'This notification is not available to this role.');
      item.read = true;
      return store.write(next);
    },
  };

  const profiles = {
    async getForRole({ role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in with an authorized account to view this profile.');
      return { data: { role: normalized, preview: true, editable: false }, error: null };
    },
  };

  const reset = async () => store.reset();
  return { cases, messages, finance, notifications, profiles, reset };
};
