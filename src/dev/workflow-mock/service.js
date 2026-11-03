// @backend-handoff-delete Complete local simulated workflow service; replace at the workflow service boundary.
import { applyWorkflowAction } from './transitions.js';
import { createWorkflowPreviewSeed } from './seed.js';
import { createPreviewStore } from './store.js';
import { normalizeWorkflowRole } from '../../services/workflow/workflowRoles.js';

const clone = value => JSON.parse(JSON.stringify(value));
const MAX_PREVIEW_VOICE_NOTE_BYTES = 1024 * 1024;
const resultError = (code, message) => ({ data: null, error: { code, message } });
const actorKey = { client: 'demo-client', provider: 'demo-provider', inspector: 'demo-inspector' };
const normalizedText = value => String(value || '').trim().toLocaleLowerCase();
const inspectorDistanceKm = (record, inspector) => {
  const caseLocation = normalizedText([record.city, record.locationSummary, record.region].join(' '));
  if (caseLocation.includes(normalizedText(inspector.homeCity))) return 3.5;
  if (normalizedText(record.region) && normalizedText(record.region) === normalizedText(inspector.region)) return inspector.region === 'Greater Accra' ? 22 : 34;
  return 220;
};
const inspectorSupportsCase = (inspector, record) => inspector.active && inspector.assignmentCapacity !== 'paused' && inspector.assignmentCapacity !== 'full'
  && inspector.scheduleStatus !== 'off_shift' && inspector.scheduleStatus !== 'leave'
  && !['suspended', 'closed'].includes(inspector.accountStatus)
  && inspector.categories.some(category => normalizedText(category) === normalizedText(record.category));
const providerDistanceKm = (record, provider) => {
  const caseLocation = normalizedText([record.city, record.locationSummary, record.region].join(' '));
  const providerCity = normalizedText(provider.homeCity || (provider.id === 'demo-provider' ? 'Accra' : ''));
  const providerRegion = normalizedText(provider.region || (provider.id === 'demo-provider' ? 'Greater Accra' : ''));
  if (providerCity && caseLocation.includes(providerCity)) return 3.5;
  if (normalizedText(record.region) && normalizedText(record.region) === providerRegion) return providerRegion === 'greater accra' ? 22 : 34;
  return 220;
};
const providerCategories = provider => (provider.categories?.length ? provider.categories : provider.id === 'demo-provider' ? ['Home Repairs & Maintenance'] : []);
const providerActiveCount = (data, providerId) => data.cases.filter(record => record.assignedProviderId === providerId && !['completed', 'cancelled', 'provider_declined', 'not_feasible'].includes(record.status)).length;
const providerSupportsCase = (provider, record) => provider.payoutSetup !== false && provider.assignmentCapacity !== 'paused' && provider.assignmentCapacity !== 'full'
  && provider.scheduleStatus !== 'off_shift' && provider.scheduleStatus !== 'leave'
  && !['suspended', 'closed'].includes(provider.accountStatus)
  && providerCategories(provider).some(category => normalizedText(category) === normalizedText(record.category));

const canAccessCase = (record, role, userId) => {
  if (role === 'admin') return true;
  if (role === 'client') return record.clientRoleId === actorKey.client;
  if (role === 'provider') return record.assignedProviderId === actorKey.provider;
  if (role === 'inspector') return record.assignedInspectorId === userId;
  return false;
};

const accountStatusForActor = (data, role, userId) => {
  if (role === 'client') return data.clientProfiles?.find(item => item.id === userId)?.accountStatus || 'active';
  if (role === 'provider') return data.providerProfiles?.find(item => item.id === userId)?.accountStatus || 'active';
  if (role === 'inspector') {
    const inspector = data.inspectors?.find(item => item.id === userId);
    return inspector?.accountStatus || (inspector?.active ? 'active' : 'suspended');
  }
  return 'active';
};

const accountStatusError = status => status === 'closed'
  ? { code: 'ACCOUNT_CLOSED', message: 'This account is closed and cannot perform workflow actions.' }
  : status === 'suspended'
    ? { code: 'ACCOUNT_SUSPENDED', message: 'This account is suspended and cannot perform workflow actions. Contact LUCID to request a review.' }
    : null;

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
  if (!userId || (normalizedRole === 'inspector' && !storeData.inspectors.some(item => item.id === userId)) || !canAccessCase(record, normalizedRole, userId)) {
    return { error: { code: 'NOT_AUTHORIZED', message: 'This role is not assigned to the preview case.' } };
  }
  return { record, role: normalizedRole };
};

const addNotification = (data, role, caseId, message, at) => {
  const separator = String(message).indexOf(':');
  const title = separator > 0 ? String(message).slice(0, separator).trim() : 'LUCID workflow update';
  const body = separator > 0 ? String(message).slice(separator + 1).trim() : String(message);
  data.notifications.unshift({
    id: `preview-notice-${Date.now()}-${data.notifications.length}`,
    role,
    caseId,
    title,
    body,
    message: String(message),
    createdAt: at,
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
    ...(record.assignedInspectorId ? [{ id: `${record.id}-preview-inspector-payout`, caseId: record.id, role: 'inspector', type: 'inspector_payout', amount: bill.inspectorAmount || 0, status: 'released', at }] : []),
    { id: `${record.id}-preview-platform-charge`, caseId: record.id, role: 'admin', type: 'platform_charge', amount: bill.commissionAmount, status: 'confirmed', at },
  ];
  data.financeEntries = [
    ...data.financeEntries.filter(entry => !entries.some(candidate => candidate.caseId === entry.caseId && candidate.role === entry.role && candidate.type === entry.type)),
    ...entries.map(candidate => {
      const existing = data.financeEntries.find(entry => entry.caseId === candidate.caseId && entry.role === candidate.role && entry.type === candidate.type);
      return existing ? { ...candidate, id: existing.id } : candidate;
    }),
  ];
};

const ensureCaseThreads = (data, record, at) => {
  const threads = [
    ...(record.assignedInspectorId ? [
      ['client-inspector', 'A LUCID Inspector has been assigned to this request. Use this thread to coordinate the inspection.'],
      ['inspector-admin', 'An Inspector has been assigned. Use this thread to coordinate the request with LUCID.'],
    ] : []),
    ...(record.assignedProviderId ? [
      ['provider-admin', 'LUCID sent you an offer for this request. Use this thread to coordinate with the LUCID team.'],
      ...(record.assignedInspectorId ? [['provider-inspector', 'Use this thread to coordinate the work with the assigned Inspector.']] : []),
    ] : []),
  ];
  let changed = false;
  for (const [audience, body] of threads) {
    const threadId = `${audience}:${record.id}`;
    if (data.messages.some(message => message.threadId === threadId)) continue;
    data.messages.push({ id: `${threadId}-ready`, threadId, caseId: record.id, audience, senderRole: 'admin', body: `Preview: ${body}`, at, read: false });
    changed = true;
  }
  return changed;
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

export const createMockWorkflowService = ({ storage = defaultStorage(), seedData = createWorkflowPreviewSeed(), clock = () => new Date().toISOString() } = {}) => {
  const store = createPreviewStore({ storage, seedData });

  const applyAction = async (caseId, { role, userId, action, payload = {} }, { systemAction = false } = {}) => {
    const loaded = store.read();
    if (loaded.error) return loaded;
    const actorRole = normalizeWorkflowRole(role);
    if (actorRole !== 'admin') {
      const statusError = accountStatusError(accountStatusForActor(loaded.data, actorRole, userId));
      if (statusError && action !== 'pay_cancellation_fee') return resultError(statusError.code, statusError.message);
    }
    const access = caseForActor(loaded.data, caseId, role, userId);
    if (access.error) return resultError(access.error.code, access.error.message);

    if (action === 'accept_offer' && actorRole === 'provider') {
      const provider = loaded.data.providerProfiles?.find(item => item.id === userId);
      if (!provider?.payoutSetup) return resultError('PAYOUT_ONBOARDING_REQUIRED', 'Complete secure payout onboarding in Profile setup before accepting an assignment.');
      if (provider.scheduleStatus === 'off_shift' || provider.scheduleStatus === 'leave' || provider.assignmentCapacity === 'paused' || provider.assignmentCapacity === 'full') return resultError('ASSIGNMENT_UNAVAILABLE', 'Update your schedule or assignment capacity before accepting this offer.');
      if (providerActiveCount(loaded.data, userId) >= Number(provider.maxActiveAssignments || 3)) return resultError('ASSIGNMENT_CAPACITY_REACHED', 'You have reached your active assignment limit. Complete or close work before accepting another offer.');
    }

    const timestamp = clock();
    let actionPayload = payload;
    if (action === 'assign_inspector') {
      const candidate = loaded.data.inspectors.find(item => item.id === payload.inspectorId);
      if (!candidate || !inspectorSupportsCase(candidate, access.record)) return resultError('INSPECTOR_NOT_ELIGIBLE', 'Choose an active Inspector who supports this request category.');
      if ((loaded.data.inspectorProfiles || []).find(profile => profile.id === candidate.id)?.payoutSetup === false) return resultError('PAYOUT_ONBOARDING_REQUIRED', 'The Inspector must complete secure payout onboarding before receiving an assignment.');
      const previousInspector = loaded.data.inspectors.find(item => item.id === access.record.assignedInspectorId);
      const isReassignment = Boolean(access.record.assignedInspectorId);
      const previousUnavailable = previousInspector ? !inspectorSupportsCase(previousInspector, access.record) : isReassignment;
      if (isReassignment && !previousUnavailable) return resultError('INSPECTOR_ALREADY_ASSIGNED', 'This request already has an available Inspector. Reassignment is only available when the assigned Inspector is unavailable.');
      if (isReassignment && !String(payload.reassignmentReason || '').trim()) return resultError('REASSIGNMENT_REASON_REQUIRED', 'Explain why the assigned Inspector needs to be replaced.');
      const distanceKm = inspectorDistanceKm(access.record, candidate);
      const overrideReason = String(payload.overrideReason || '').trim();
      if (distanceKm > 25 && !overrideReason) return resultError('OVERRIDE_REASON_REQUIRED', 'Add a reason when assigning an Inspector outside the 25 km proximity search.');
      actionPayload = { ...payload, inspectorName: candidate.displayName, distanceKm, previousInspectorId: access.record.assignedInspectorId || '', isReassignment, previousUnavailable };
    }
    if (action === 'offer_provider') {
      const candidate = loaded.data.providerProfiles.find(item => item.id === payload.providerId);
      if (!candidate || !providerSupportsCase(candidate, access.record)) return resultError('PROVIDER_NOT_ELIGIBLE', 'Choose an available Preview Provider whose profile includes this request category.');
      const distanceKm = providerDistanceKm(access.record, candidate);
      const overrideReason = String(payload.overrideReason || '').trim();
      if (distanceKm > 25 && !overrideReason) return resultError('OVERRIDE_REASON_REQUIRED', 'Add a reason when assigning a Provider outside the 25 km proximity search.');
      actionPayload = { ...payload, providerName: candidate.fullName || candidate.displayName || 'Provider', adminName: 'LUCID Admin/HR', distanceKm, overrideReason };
    }

    const applied = applyWorkflowAction(access.record, {
      role: systemAction ? 'system' : access.role,
      action,
      payload: actionPayload,
      at: timestamp,
    });
    if (applied.error) return resultError(applied.error.code, applied.error.message);

    const next = clone(loaded.data);
    next.cases = next.cases.map(item => item.id === caseId ? applied.caseRecord : item);
    ensureCaseThreads(next, applied.caseRecord, timestamp);
    if (['payment_result', 'confirm_delayed_payment'].includes(action) && applied.caseRecord.status === 'completed' && applied.caseRecord.paymentStatus === 'confirmed') {
      const record = applied.caseRecord;
      const existingReceipt = (next.receipts || []).find(item => item.caseId === caseId);
      if (!existingReceipt) {
      const receiptRoles = ['client', 'provider', ...(record.assignedInspectorId ? ['inspector'] : []), 'admin'];
      next.receipts = [...(next.receipts || []).filter(item => item.caseId !== caseId), ...receiptRoles.map(recipientRole => ({
        id: `${caseId}-receipt-${recipientRole}`, caseId, recipientRole,
        recipientId: ({ client: record.clientRoleId, provider: record.assignedProviderId, inspector: record.assignedInspectorId, admin: 'demo-admin' })[recipientRole],
        issuedAt: timestamp, currency: record.clientRange?.currency || 'GHS',
        providerAmount: record.providerBill?.providerAmount || 0,
        inspectorAmount: record.providerBill?.inspectorAmount || 0,
        platformAmount: record.providerBill?.commissionAmount || 0,
        totalAmount: record.providerBill?.payableAmount || 0,
        paymentReference: record.paymentReference || `PREVIEW-${record.id}`,
      }))];
      }
    }
    if (action === 'leave_review') {
      const review = { id: `${caseId}-review`, caseId, rating: applied.caseRecord.review.rating, comment: applied.caseRecord.review.comment, submittedAt: timestamp };
      next.providerProfiles = (next.providerProfiles || []).map(profile => {
        if (profile.id !== applied.caseRecord.assignedProviderId) return profile;
        const reviews = [...(profile.reviews || []).filter(item => item.caseId !== caseId), review];
        return { ...profile, reviews, averageRating: Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)), reviewCount: reviews.length };
      });
    }
    const otherRoles = ['client', 'admin', ...(applied.caseRecord.assignedInspectorId ? ['inspector'] : []), ...(applied.caseRecord.assignedProviderId ? ['provider'] : [])];
    const workflowNotices = {
      submit_work_estimate: 'The Provider shared the work and estimate for your approval.',
      approve_work_estimate: 'The Client approved the work estimate. The Provider can begin the agreed work.',
      request_work_estimate_revision: 'The Client asked for a change or explanation to the estimate.',
      request_price_change: 'The Provider requested approval for additional work. Work is paused until you respond.',
      approve_price_change: 'The Client approved the additional work and cost.',
      reject_price_change: 'The Client declined the additional work. The Provider can continue only with the approved work.',
      initiate_payment: 'The Inspector confirmed satisfactory completion. Provider billing is now open.',
      submit_bill: 'The Provider submitted an itemized charge for Client review.',
      approve_bill: 'The Client approved the bill and is continuing to secure payment.',
      reject_bill: 'The Client requested a bill revision through LUCID or the Inspector.',
      payment_result: payload.outcome === 'confirmed' ? 'Payment was confirmed. The case is complete and receipts are available.' : `Payment confirmation is ${payload.outcome}. The Provider payout remains unreleased.`,
      confirm_delayed_payment: 'Delayed payment was confirmed. The case is complete and receipts are available.',
      leave_review: 'The Client left a review for the Provider’s work.',
    };
    for (const recipient of new Set(otherRoles.filter(item => item !== access.role))) {
      addNotification(next, recipient, caseId, `${applied.caseRecord.service || 'Service request'}: ${workflowNotices[action] || action.replaceAll('_', ' ')}`, timestamp);
    }
    if (action === 'assign_inspector' && actionPayload.isReassignment && actionPayload.previousInspectorId) {
      addNotification(next, 'inspector', caseId, `${applied.caseRecord.service || 'Service request'}: Inspector assignment changed. You are no longer assigned to this request.`, timestamp);
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
      const statusError = accountStatusError(accountStatusForActor(loaded.data, normalized, userId));
      if (statusError) return resultError(statusError.code, statusError.message);
      const timestamp = clock();
      const id = `LUCID-PREVIEW-${Date.now()}-${loaded.data.cases.length + 1}`;
      const rangeInput = payload.clientRange || {};
      const rangeMinValue = rangeInput.min ?? payload.budget_min;
      const rangeMaxValue = rangeInput.max ?? payload.budget_max;
      const hasRangeMin = rangeMinValue !== undefined && rangeMinValue !== null && String(rangeMinValue).trim() !== '';
      const hasRangeMax = rangeMaxValue !== undefined && rangeMaxValue !== null && String(rangeMaxValue).trim() !== '';
      if (hasRangeMin !== hasRangeMax) return resultError('INCOMPLETE_BUDGET_GUIDANCE', 'Enter both ends of the optional budget range, or leave both blank.');
      let clientRange = null;
      if (hasRangeMin && hasRangeMax) {
        const min = Number(rangeMinValue);
        const max = Number(rangeMaxValue);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return resultError('INVALID_BUDGET_GUIDANCE', 'Enter a valid optional budget range. The maximum must be at least the minimum.');
        clientRange = { min, max, currency: rangeInput.currency || payload.currency || 'GHS', binding: false };
      }
      const record = {
        id, service: payload.service || payload.service_name || 'Service request', category: payload.category || '',
        scope: payload.scope || payload.description || '', description: payload.description || payload.scope || '',
        locationSummary: payload.locationSummary || '', clientRoleId: actorKey.client,
        urgency: ['normal', 'urgent'].includes(payload.urgency) ? payload.urgency : 'normal',
        preferredDate: payload.preferredDate || null, preferredTime: payload.preferredTime || null,
        alternateDate: payload.alternateDate || null, alternateTime: payload.alternateTime || null,
        // Keep the mock record intentionally free of contact and street-level data.
        region: payload.region || '', city: payload.city || '',
        assignedInspectorId: '', assignedProviderId: '',
        clientRange,
        status: 'submitted', inspection: null, confirmedScope: '', providerAcceptedAt: null, workStartedAt: null,
        pendingWorkEstimate: null, approvedWorkEstimate: null, workEstimateHistory: [], estimateRevisionRequest: null,
        pendingPriceChange: null, changeOrders: [], approvedWorkAmount: null, providerBill: null, providerBillHistory: [], clientSatisfied: false,
        commissionRate: 10, inspectorRate: 10, paymentStatus: 'unpaid', paymentReference: '', providerPayoutStatus: 'not_released',
        providerPayoutAmount: 0, cancellationFeeDue: 0, cancellationFeePaid: false, featuresBlocked: false,
        dispute: null, refundRequest: null, review: null,
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
      if (normalized === 'inspector' && !loaded.data.inspectors.some(item => item.id === userId)) return resultError('NOT_AUTHORIZED', 'Choose a valid preview Inspector account.');
      let records = loaded.data.cases.filter(record => canAccessCase(record, normalized, userId));
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

  const assignments = {
    async listInspectorPrincipals({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      if (!userId || normalizeWorkflowRole(role) !== 'inspector' || !loaded.data.inspectors.some(item => item.id === userId)) {
        return resultError('NOT_AUTHORIZED', 'Only an authorized preview Inspector can select a demo account.');
      }
      const principals = loaded.data.inspectors.map(({ id, displayName, homeCity, region, active }) => ({ id, displayName, homeCity, region, active }));
      return { data: clone(principals), error: null };
    },
    async searchEligible({ caseId, role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const access = caseForActor(loaded.data, caseId, role, userId);
      if (access.error) return resultError(access.error.code, access.error.message);
      if (normalizeWorkflowRole(role) !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can search Inspector candidates.');
      const candidates = loaded.data.inspectors
        .filter(item => {
          const profile = (loaded.data.inspectorProfiles || []).find(entry => entry.id === item.id) || {};
          const activeCount = loaded.data.cases.filter(record => record.assignedInspectorId === item.id && !['completed', 'cancelled', 'not_feasible'].includes(record.status)).length;
          return inspectorSupportsCase(item, access.record) && profile.payoutSetup !== false && activeCount < Number(profile.maxActiveAssignments || 3);
        })
        .map(item => { const profile = (loaded.data.inspectorProfiles || []).find(entry => entry.id === item.id) || {}; return { ...item, presenceStatus: profile.presenceStatus || 'offline', scheduleStatus: profile.scheduleStatus || item.scheduleStatus || 'on_shift', assignmentCapacity: profile.assignmentCapacity || item.assignmentCapacity || 'open', distanceKm: inspectorDistanceKm(access.record, item), withinDefaultRadius: inspectorDistanceKm(access.record, item) <= 25 }; })
        .sort((left, right) => left.distanceKm - right.distanceKm);
      return { data: clone(candidates), error: null };
    },
    async searchProviderCandidates({ caseId, role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const access = caseForActor(loaded.data, caseId, role, userId);
      if (access.error) return resultError(access.error.code, access.error.message);
      if (normalizeWorkflowRole(role) !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can search Provider candidates.');
      if (!['scope_confirmed', 'provider_declined'].includes(access.record.status)) return resultError('SCOPE_NOT_CONFIRMED', 'Confirm the inspected scope before searching for a Provider.');
      const candidates = (loaded.data.providerProfiles || [])
        .filter(item => providerSupportsCase(item, access.record) && providerActiveCount(loaded.data, item.id) < Number(item.maxActiveAssignments || 3))
        .map(item => ({ id: item.id, displayName: item.fullName || item.displayName || 'Preview Provider', homeCity: item.homeCity, region: item.region, categories: providerCategories(item), presenceStatus: item.presenceStatus || 'offline', scheduleStatus: item.scheduleStatus || 'on_shift', assignmentCapacity: item.assignmentCapacity || 'open', availability: item.assignmentCapacity === 'limited' ? 'Limited availability' : 'Available', payoutReady: item.payoutSetup !== false, profileComplete: Boolean(item.profileComplete), distanceKm: providerDistanceKm(access.record, item), withinDefaultRadius: providerDistanceKm(access.record, item) <= 25, reviewCount: item.reviewCount || item.reviews?.length || 0, averageRating: item.averageRating || 0 }))
        .sort((left, right) => left.distanceKm - right.distanceKm);
      return { data: clone(candidates), error: null };
    },
  };

  const messages = {
    async listConversations({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId) return resultError('NOT_AUTHORIZED', 'Sign in to view messages.');
      const data = clone(loaded.data);
      const timestamp = clock();
      const threadsChanged = data.cases.reduce((changed, record) => ensureCaseThreads(data, record, timestamp) || changed, false);
      if (threadsChanged) {
        const saved = store.write(data);
        if (saved.error) return saved;
      }
      const grouped = new Map();
      for (const message of data.messages) {
        const audience = message.audience || message.threadId?.split(':')[0];
        if (!audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience)) continue;
        const record = message.caseId ? data.cases.find(item => item.id === message.caseId) : null;
        if (message.caseId && (!record || !canAccessCase(record, normalized, userId))) continue;
        const prior = grouped.get(message.threadId) || {
          id: message.threadId,
          caseId: message.caseId || null,
          serviceName: record?.service || 'LUCID support',
          caseStatus: record?.status || 'open',
          audience,
          participantRole: message.senderRole,
          lastMessage: message.body || (message.attachment ? `Attachment: ${message.attachment.name}` : ''),
          lastMessageAt: message.at,
          unreadCount: 0,
          preview: true,
        };
        prior.lastMessage = message.body || (message.attachment ? `Attachment: ${message.attachment.name}` : '');
        prior.lastMessageAt = message.at;
        prior.caseStatus = record?.status || 'open';
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
      const audience = first.audience || first.threadId?.split(':')[0];
      const record = first.caseId ? loaded.data.cases.find(item => item.id === first.caseId) : null;
      if (!audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience) || (first.caseId && (!record || !canAccessCase(record, normalized, userId)))) {
        return resultError('NOT_AUTHORIZED', 'This role is not allowed to view this message thread.');
      }
      return { data: clone(matching), error: null };
    },
    async sendMessage(threadId, { role, userId, body, attachment = null, replyToId = null }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const matching = loaded.data.messages.filter(message => message.threadId === threadId);
      const first = matching[0];
      if (!first || !userId) return resultError('NOT_AUTHORIZED', 'This message thread is not available.');
      const normalized = normalizeWorkflowRole(role);
      const audience = first.audience || first.threadId?.split(':')[0];
      const record = first.caseId ? loaded.data.cases.find(item => item.id === first.caseId) : null;
      if (!audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience) || (first.caseId && (!record || !canAccessCase(record, normalized, userId)))) {
        return resultError('NOT_AUTHORIZED', 'This role is not allowed to send to this message thread.');
      }
      const cleanBody = String(body || '').trim();
      const quoted = replyToId ? matching.find(message => message.id === replyToId) : null;
      if (replyToId && !quoted) return resultError('MESSAGE_NOT_FOUND', 'The message you are replying to is no longer in this conversation.');
      const replyTo = quoted ? { messageId: quoted.id, senderRole: quoted.senderRole, excerpt: String(quoted.body || '').slice(0, 180) } : null;
      const attachmentType = String(attachment?.type || 'application/octet-stream').slice(0, 120);
      const attachmentSize = Math.max(0, Number(attachment?.size) || 0);
      const isAudio = attachmentType.toLowerCase().startsWith('audio/');
      const audioDataUrl = typeof attachment?.dataUrl === 'string' ? attachment.dataUrl : '';
      if (isAudio && audioDataUrl && (attachmentSize > MAX_PREVIEW_VOICE_NOTE_BYTES || audioDataUrl.length > MAX_PREVIEW_VOICE_NOTE_BYTES * 1.4)) {
        return resultError('ATTACHMENT_TOO_LARGE', 'Keep voice notes under 1 MB in Preview.');
      }
      if (isAudio && audioDataUrl && !/^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=._+-]+)*;base64,[a-z0-9+/]+={0,2}$/i.test(audioDataUrl)) {
        return resultError('INVALID_AUDIO_ATTACHMENT', 'The voice note could not be prepared. Record it again and retry.');
      }
      const safeAttachment = attachment && typeof attachment.name === 'string'
        ? { name: attachment.name.slice(0, 180), type: attachmentType, size: attachmentSize, ...(isAudio && audioDataUrl ? { dataUrl: audioDataUrl } : {}) }
        : null;
      if (!cleanBody && !safeAttachment) return resultError('MESSAGE_REQUIRED', 'Write a message or attach a file before sending.');
      const timestamp = clock();
      const sent = { id: `preview-message-${Date.now()}-${matching.length}`, threadId, caseId: first.caseId || null, audience, senderRole: normalized, body: cleanBody, attachment: safeAttachment, replyTo, at: timestamp, read: true, editHistory: [] };
      const next = clone(loaded.data);
      next.messages.push(sent);
      for (const recipient of audience.split('-')) {
        if (recipient !== normalized) addNotification(next, recipient, first.caseId || null, `New ${normalized} message in ${first.caseId || 'LUCID support'}.`, timestamp);
      }
      const saved = store.write(next);
      return saved.error ? saved : { data: sent, error: null };
    },
    async editMessage(messageId, { role, userId, body }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      const next = clone(loaded.data);
      const message = next.messages.find(item => item.id === messageId);
      if (!message || !userId || message.senderRole !== normalized) return resultError('MESSAGE_EDIT_NOT_ALLOWED', 'You can edit only your own message.');
      const matching = next.messages.filter(item => item.threadId === message.threadId);
      const first = matching[0];
      const record = first?.caseId ? next.cases.find(item => item.id === first.caseId) : null;
      const audience = first?.audience || first?.threadId?.split(':')[0];
      if (!first || !audienceIsValid(audience) || !roleCanSeeAudience(normalized, audience) || (first.caseId && (!record || !canAccessCase(record, normalized, userId)))) return resultError('NOT_AUTHORIZED', 'This role cannot edit a message in this thread.');
      if (Date.now() - new Date(message.at).getTime() > 2 * 60 * 1000) return resultError('MESSAGE_EDIT_WINDOW_CLOSED', 'Messages can be edited for two minutes after sending. Send a correction instead.');
      const cleanBody = String(body || '').trim();
      if (!cleanBody || cleanBody.length > 4000) return resultError('INVALID_MESSAGE', 'Enter a message under 4,000 characters.');
      const timestamp = clock();
      message.editHistory = [...(message.editHistory || []), { body: message.body, editedAt: timestamp, editedBy: normalized }];
      message.body = cleanBody;
      message.editedAt = timestamp;
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(message), error: null };
    },
  };

  const finance = {
    async listEntries({ role, userId, filters = {} }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in with an authorized account to view preview finance.');
      let entries = loaded.data.financeEntries.filter(entry => normalized === 'admin' || entry.role === normalized);
      if (filters.caseId) entries = entries.filter(entry => entry.caseId === filters.caseId);
      return { data: clone(entries), error: null };
    },
    async listPaymentMethods({ role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can view payout methods in Preview.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const statusError = accountStatusError(accountStatusForActor(loaded.data, normalized, userId));
      if (statusError) return resultError(statusError.code, statusError.message);
      return { data: clone(loaded.data.paymentMethods.filter(method => method.role === normalized)), error: null };
    },
    async savePaymentMethod(_method, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can edit payout methods in Preview.');
      return resultError('GATEWAY_ONBOARDING_REQUIRED', 'Payout details are collected only through the payment provider’s secure onboarding. Preview never stores account numbers.');
    },
    async removePaymentMethod(_id, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can edit payout methods in Preview.');
      return resultError('GATEWAY_ONBOARDING_REQUIRED', 'Payout destinations are managed through the payment provider’s secure onboarding, not this Preview.');
    },
    async requestWithdrawal(amount, paymentMethodId, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'provider') return resultError('ROLE_NOT_ALLOWED', 'Only a signed-in Provider can preview a withdrawal.');
      const requestedAmount = Number(amount);
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) return resultError('INVALID_WITHDRAWAL_AMOUNT', 'Enter a valid simulated withdrawal amount.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const statusError = accountStatusError(accountStatusForActor(loaded.data, normalized, userId));
      if (statusError) return resultError(statusError.code, statusError.message);
      const method = loaded.data.paymentMethods.find(item => item.id === paymentMethodId && item.role === normalized && item.gatewayRecipientReference);
      if (!method) return resultError('GATEWAY_ONBOARDING_REQUIRED', 'Preview does not store payout details or simulate withdrawals to a destination.');
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
      return { data: clone(loaded.data.notifications.filter(item => item.role === normalized)), error: null };
    },
    async markRead(notificationId, { role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId) return resultError('NOT_AUTHORIZED', 'Sign in to update notifications.');
      const next = clone(loaded.data);
      const item = next.notifications.find(notification => notification.id === notificationId && notification.role === normalized);
      if (!item) return resultError('NOT_AUTHORIZED', 'This notification is not available to this role.');
      item.read = true;
      return store.write(next);
    },
    async markAllRead({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId) return resultError('NOT_AUTHORIZED', 'Sign in to update notifications.');
      const next = clone(loaded.data);
      next.notifications = next.notifications.map(item => item.role === normalized ? { ...item, read: true } : item);
      return store.write(next);
    },
    async getPreferences({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in to view notification preferences.');
      return { data: clone(loaded.data.notificationPreferences?.[normalized] || { inApp: true, email: true, sms: false, pushEnabled: false, pushPermission: 'default' }), error: null };
    },
    async savePreferences(preferences, { role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in to update notification preferences.');
      if (!preferences || ['inApp', 'email', 'sms', 'pushEnabled'].some(key => typeof preferences[key] !== 'boolean') || !['default', 'granted', 'denied', 'unsupported'].includes(preferences.pushPermission || 'default')) return resultError('INVALID_PREFERENCES', 'Choose valid notification preferences.');
      const next = clone(loaded.data);
      next.notificationPreferences = { ...(next.notificationPreferences || {}), [normalized]: { inApp: preferences.inApp, email: preferences.email, sms: preferences.sms, pushEnabled: preferences.pushEnabled, pushPermission: preferences.pushPermission || 'default' } };
      return store.write(next);
    },
  };

  const receipts = {
    async listForRole({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in to view receipts.');
      return { data: clone((loaded.data.receipts || []).filter(item => normalized === 'admin' || (item.recipientRole === normalized && item.recipientId === userId))), error: null };
    },
  };

  const operations = {
    async listDirectory({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      if (!userId || normalizeWorkflowRole(role) !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can view the operations directory.');
      const data = loaded.data;
      const records = [
        ...(data.clientProfiles || []).map(profile => ({ id: profile.id, role: 'client', name: profile.fullName || 'Preview Client', email: profile.email || profile.contactEmail || '', phone: profile.phone || '', city: profile.homeCity, region: profile.region, categories: [], profileComplete: Boolean(profile.profileComplete), accountStatus: profile.accountStatus || 'active' })),
        ...(data.providerProfiles || []).map(profile => ({ id: profile.id, role: 'provider', name: profile.fullName || profile.displayName || 'Preview Provider', email: profile.email || profile.contactEmail || '', phone: profile.phone || '', city: profile.homeCity, region: profile.region, categories: profile.categories || [], qualifications: profile.qualifications || [], availability: profile.availability || 'Unspecified', presenceStatus: profile.presenceStatus || 'offline', scheduleStatus: profile.scheduleStatus || 'unspecified', assignmentCapacity: profile.assignmentCapacity || 'unspecified', payoutSetup: Boolean(profile.payoutSetup), averageRating: profile.averageRating || 0, reviewCount: profile.reviewCount || profile.reviews?.length || 0, profileComplete: Boolean(profile.profileComplete), accountStatus: profile.accountStatus || 'active' })),
        ...(data.inspectors || []).map(profile => { const details = (data.inspectorProfiles || []).find(item => item.id === profile.id) || {}; return { id: profile.id, role: 'inspector', name: profile.displayName, email: details.email || details.contactEmail || '', phone: details.phone || profile.phone || '', city: profile.homeCity, region: profile.region, categories: profile.categories || [], qualifications: details.qualifications || [], availability: profile.availability || details.availability || 'Unspecified', presenceStatus: profile.presenceStatus || details.presenceStatus || 'offline', scheduleStatus: profile.scheduleStatus || details.scheduleStatus || 'unspecified', assignmentCapacity: profile.assignmentCapacity || details.assignmentCapacity || 'unspecified', payoutSetup: Boolean(details.payoutSetup), profileComplete: Boolean(details.profileComplete), accountStatus: profile.accountStatus || (profile.active ? 'active' : 'suspended') }; }),
        { id: 'demo-admin', role: 'admin', name: 'LUCID Operations', city: '', region: '', categories: [], profileComplete: true, accountStatus: 'active' },
      ].map(profile => {
        const related = data.cases.filter(record => record.clientRoleId === profile.id || record.assignedProviderId === profile.id || record.assignedInspectorId === profile.id);
        return { ...profile, caseCount: related.length, caseIds: related.map(record => record.id) };
      });
      return { data: clone(records), error: null };
    },
    async listPolicyActions({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      if (!userId || normalizeWorkflowRole(role) !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can view account policy history.');
      return { data: clone(loaded.data.accountPolicies || []), error: null };
    },
    async submitAccountAppeal(payload, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in with the affected account to submit an appeal.');
      const reason = String(payload?.reason || '').trim();
      if (reason.length < 10) return resultError('APPEAL_REASON_REQUIRED', 'Explain why the account decision should be reviewed (at least 10 characters).');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const directoryKey = normalized === 'client' ? 'clientProfiles' : normalized === 'provider' ? 'providerProfiles' : 'inspectors';
      const subject = (loaded.data[directoryKey] || []).find(item => item.id === userId);
      if (!subject) return resultError('ACCOUNT_NOT_FOUND', 'This Preview account is not available.');
      if (!['suspended', 'closed'].includes(subject.accountStatus)) return resultError('APPEAL_NOT_AVAILABLE', 'Only a suspended or closed account can appeal a policy action.');
      const existing = (loaded.data.accountAppeals || []).find(item => item.subjectId === userId && item.status === 'pending');
      if (existing) return resultError('APPEAL_ALREADY_PENDING', 'An appeal for this account is already awaiting review.');
      const policy = (loaded.data.accountPolicies || []).find(item => item.subjectId === userId && item.subjectRole === normalized);
      if (!policy) return resultError('POLICY_RECORD_NOT_FOUND', 'There is no recorded policy action to appeal.');
      const timestamp = clock();
      const appeal = { id: `preview-appeal-${Date.now()}-${(loaded.data.accountAppeals || []).length + 1}`, subjectId: userId, subjectRole: normalized, subjectName: subject.fullName || subject.displayName || 'Preview account', policyActionId: policy.id, reason, status: 'pending', submittedAt: timestamp };
      const next = clone(loaded.data);
      next.accountAppeals = [appeal, ...(next.accountAppeals || [])];
      addNotification(next, 'admin', null, `Account appeal: ${appeal.subjectName} requested a policy review.`, timestamp);
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(appeal), error: null };
    },
    async listAccountAppeals({ role, userId }) {
      const loaded = store.read();
      if (loaded.error) return loaded;
      if (!userId || normalizeWorkflowRole(role) !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can review account appeals.');
      return { data: clone(loaded.data.accountAppeals || []), error: null };
    },
    async listMyAccountAppeals({ role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in to view your account appeals.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      return { data: clone((loaded.data.accountAppeals || []).filter(item => item.subjectId === userId && item.subjectRole === normalized)), error: null };
    },
    async decideAccountAppeal(appealId, { decision, reason }, { role, userId }) {
      if (!userId || normalizeWorkflowRole(role) !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can decide an account appeal.');
      const explanation = String(reason || '').trim();
      if (!['reinstate', 'uphold'].includes(decision) || explanation.length < 10) return resultError('APPEAL_DECISION_INVALID', 'Choose reinstate or uphold and enter an explanation of at least 10 characters.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const next = clone(loaded.data);
      const appeal = next.accountAppeals.find(item => item.id === appealId);
      if (!appeal || appeal.status !== 'pending') return resultError('APPEAL_NOT_PENDING', 'This appeal is unavailable or has already been decided.');
      const timestamp = clock();
      appeal.status = decision === 'reinstate' ? 'reinstated' : 'upheld';
      appeal.decision = decision;
      appeal.decisionReason = explanation;
      appeal.reviewerId = userId;
      appeal.decidedAt = timestamp;
      if (decision === 'reinstate') {
        const profileKey = appeal.subjectRole === 'client' ? 'clientProfiles' : appeal.subjectRole === 'provider' ? 'providerProfiles' : 'inspectors';
        next[profileKey] = next[profileKey].map(item => item.id === appeal.subjectId ? { ...item, accountStatus: 'active' } : item);
      }
      addNotification(next, appeal.subjectRole, null, `Appeal update: LUCID ${decision === 'reinstate' ? 'reinstated your account' : 'upheld the account restriction'} after review.`, timestamp);
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(appeal), error: null };
    },
    async applyAccountPolicy(payload, { role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'admin') return resultError('NOT_AUTHORIZED', 'Only LUCID Admin can record an account policy action.');
      const policyCategory = String(payload?.policyCategory || '').trim();
      const facts = String(payload?.facts || '').trim();
      const policyReference = String(payload?.policyReference || '').trim();
      const action = String(payload?.action || '');
      if (!policyCategory || !facts || !policyReference || !['suspend', 'close'].includes(action)) return resultError('POLICY_FORM_INCOMPLETE', 'Complete the policy category, facts, policy reference, and proposed action.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const directory = [
        ...(loaded.data.clientProfiles || []).map(item => ({ ...item, role: 'client' })),
        ...(loaded.data.providerProfiles || []).map(item => ({ ...item, role: 'provider' })),
        ...(loaded.data.inspectors || []).map(item => ({ ...item, role: 'inspector' })),
      ];
      const subject = directory.find(item => item.id === payload.subjectId && item.role === payload.subjectRole);
      if (!subject) return resultError('ACCOUNT_NOT_FOUND', 'Choose an account from the Preview directory.');
      const at = clock();
      const policyRecord = {
        id: `preview-policy-${Date.now()}-${(loaded.data.accountPolicies || []).length + 1}`,
        subjectId: subject.id, subjectRole: subject.role,
        subjectName: subject.fullName || subject.displayName || 'Preview account',
        policyCategory, facts, policyReference, action,
        notificationChannel: ['email', 'sms', 'both'].includes(payload.notificationChannel) ? payload.notificationChannel : 'email',
        notificationStatus: 'simulated', reviewerId: userId, createdAt: at,
      };
      const next = clone(loaded.data);
      next.accountPolicies = [policyRecord, ...(next.accountPolicies || [])];
      const profileKey = subject.role === 'client' ? 'clientProfiles' : subject.role === 'provider' ? 'providerProfiles' : 'inspectors';
      next[profileKey] = next[profileKey].map(item => item.id === subject.id ? { ...item, accountStatus: action === 'close' ? 'closed' : 'suspended' } : item);
      addNotification(next, subject.role, null, `Preview account notice: LUCID recorded a policy review (${action}). Notification delivery is simulated.`, at);
      const saved = store.write(next);
      return saved.error ? saved : { data: clone(policyRecord), error: null };
    },
  };

  const profiles = {
    async getForRole({ role, userId }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider', 'inspector', 'admin'].includes(normalized)) return resultError('NOT_AUTHORIZED', 'Sign in with an authorized account to view this profile.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      if (normalized === 'client' || normalized === 'provider') {
        const key = normalized === 'client' ? 'clientProfiles' : 'providerProfiles';
        const profile = (loaded.data[key] || []).find(item => item.id === userId);
        if (!profile) return resultError('NOT_AUTHORIZED', `This ${normalized} profile is not available in the Preview account set.`);
        return { data: { ...clone(profile), role: normalized, preview: true, editable: true }, error: null };
      }
      if (normalized !== 'inspector') return { data: { role: normalized, preview: true, editable: false }, error: null };
      const inspector = loaded.data.inspectors.find(item => item.id === userId);
      if (!inspector) return resultError('NOT_AUTHORIZED', 'This Inspector profile is not available in the preview roster.');
      const saved = (loaded.data.inspectorProfiles || []).find(item => item.id === userId);
      const profile = saved || {
        id: inspector.id, displayName: inspector.displayName, homeCity: inspector.homeCity, region: inspector.region,
        categories: inspector.categories, qualifications: [], availability: inspector.availability,
        presenceStatus: 'offline', scheduleStatus: 'on_shift', assignmentCapacity: 'open', maxActiveAssignments: 3,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '09:00', endTime: '17:00', profileComplete: false,
      };
      return { data: { ...clone(profile), accountStatus: inspector.accountStatus || (inspector.active ? 'active' : 'suspended'), role: normalized, preview: true, editable: true }, error: null };
    },
    async updateInspectorWorkProfile({ role, userId, profile }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || normalized !== 'inspector') return resultError('ROLE_NOT_ALLOWED', 'Only the selected preview Inspector can edit this work profile.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const inspector = loaded.data.inspectors.find(item => item.id === userId);
      if (!inspector) return resultError('NOT_AUTHORIZED', 'This Inspector profile is not available in the preview roster.');
      const homeCity = String(profile?.homeCity || '').trim();
      const region = String(profile?.region || '').trim();
      const categories = [...new Set((Array.isArray(profile?.categories) ? profile.categories : []).map(item => String(item).trim()).filter(Boolean))];
      const qualifications = [...new Set((Array.isArray(profile?.qualifications) ? profile.qualifications : []).map(item => String(item).trim()).filter(Boolean))];
      const availableDays = [...new Set((Array.isArray(profile?.availableDays) ? profile.availableDays : []).filter(item => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(item)))];
      const startTime = String(profile?.startTime || '').trim();
      const endTime = String(profile?.endTime || '').trim();
      const availability = profile?.assignmentCapacity === 'limited' ? 'Limited availability' : 'Available';
      const presenceStatus = ['online', 'away', 'offline'].includes(profile?.presenceStatus) ? profile.presenceStatus : 'offline';
      const scheduleStatus = ['on_shift', 'off_shift', 'leave'].includes(profile?.scheduleStatus) ? profile.scheduleStatus : 'on_shift';
      const assignmentCapacity = ['open', 'limited', 'full', 'paused'].includes(profile?.assignmentCapacity) ? profile.assignmentCapacity : 'open';
      const maxActiveAssignments = Math.max(1, Math.min(20, Number(profile?.maxActiveAssignments) || 3));
      if (!homeCity || !region || !categories.length || !qualifications.length || !availableDays.length || !startTime || !endTime || startTime >= endTime) {
        return resultError('INSPECTOR_PROFILE_INCOMPLETE', 'Add a home location, at least one service category and qualification, and valid availability to complete this profile.');
      }
      const savedProfile = {
        id: inspector.id, displayName: inspector.displayName, homeCity, region, categories, qualifications,
        availableDays, startTime, endTime, availability, presenceStatus, scheduleStatus, assignmentCapacity, maxActiveAssignments, payoutSetup: Boolean(profile?.payoutSetup), profileComplete: true, updatedAt: clock(),
      };
      const next = clone(loaded.data);
      next.inspectors = next.inspectors.map(item => item.id === userId ? { ...item, homeCity, region, categories, availability, scheduleStatus, assignmentCapacity, maxActiveAssignments } : item);
      next.inspectorProfiles = [...(next.inspectorProfiles || []).filter(item => item.id !== userId), savedProfile];
      const saved = store.write(next);
      return saved.error ? saved : { data: { ...clone(savedProfile), accountStatus: inspector.accountStatus || (inspector.active ? 'active' : 'suspended'), role: normalized, preview: true, editable: true }, error: null };
    },
    async updateAccountSetup({ role, userId, profile }) {
      const normalized = normalizeWorkflowRole(role);
      if (!userId || !['client', 'provider'].includes(normalized)) return resultError('ROLE_NOT_ALLOWED', 'Choose a Client or Provider Preview persona to edit this profile.');
      const loaded = store.read();
      if (loaded.error) return loaded;
      const key = normalized === 'client' ? 'clientProfiles' : 'providerProfiles';
      const existing = (loaded.data[key] || []).find(item => item.id === userId);
      if (!existing) return resultError('NOT_AUTHORIZED', `This ${normalized} profile is not available in the Preview account set.`);
      const fullName = String(profile?.fullName || '').trim();
      const phone = String(profile?.phone || '').trim();
      const homeCity = String(profile?.homeCity || '').trim();
      const region = String(profile?.region || '').trim();
      const categories = [...new Set((Array.isArray(profile?.categories) ? profile.categories : []).map(item => String(item).trim()).filter(Boolean))];
      const qualifications = [...new Set((Array.isArray(profile?.qualifications) ? profile.qualifications : []).map(item => String(item).trim()).filter(Boolean))];
      if (!fullName || !phone || !homeCity || !region) return resultError('PROFILE_INCOMPLETE', 'Add your name, phone number, region, and city or town to continue.');
      if (normalized === 'provider' && (!categories.length || !qualifications.length)) return resultError('PROFILE_INCOMPLETE', 'Add at least one service category and qualification to complete Provider setup.');
      const presenceStatus = ['online', 'away', 'offline'].includes(profile?.presenceStatus) ? profile.presenceStatus : 'offline';
      const scheduleStatus = ['on_shift', 'off_shift', 'leave'].includes(profile?.scheduleStatus) ? profile.scheduleStatus : 'on_shift';
      const assignmentCapacity = ['open', 'limited', 'full', 'paused'].includes(profile?.assignmentCapacity) ? profile.assignmentCapacity : 'open';
      const maxActiveAssignments = Math.max(1, Math.min(20, Number(profile?.maxActiveAssignments) || 3));
      const existingProfile = Object.fromEntries(Object.entries(existing).filter(([key]) => key !== 'paymentPreference'));
      const savedProfile = { ...existingProfile, fullName, phone, homeCity, region, categories, qualifications, presenceStatus: normalized === 'provider' ? presenceStatus : undefined, scheduleStatus: normalized === 'provider' ? scheduleStatus : undefined, assignmentCapacity: normalized === 'provider' ? assignmentCapacity : undefined, maxActiveAssignments: normalized === 'provider' ? maxActiveAssignments : undefined, payoutSetup: normalized === 'provider' && Boolean(profile?.payoutSetup), profileComplete: true, updatedAt: clock() };
      const next = clone(loaded.data);
      next[key] = [...(next[key] || []).filter(item => item.id !== userId), savedProfile];
      const saved = store.write(next);
      return saved.error ? saved : { data: { ...clone(savedProfile), role: normalized, preview: true, editable: true }, error: null };
    },
  };

  const reset = async () => store.reset();
  return { cases, assignments, messages, finance, notifications, receipts, profiles, operations, reset };
};
