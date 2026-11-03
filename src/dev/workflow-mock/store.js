// @backend-handoff-delete Browser-local persistence and migration for simulated data; remove with the mock adapter.
import { isWorkflowMockDatabase, WORKFLOW_MOCK_SCHEMA_VERSION } from './schema.js';

export const WORKFLOW_PREVIEW_STORAGE_KEY = `lucid-workflow-preview-v${WORKFLOW_MOCK_SCHEMA_VERSION}`;
export const LEGACY_WORKFLOW_PREVIEW_STORAGE_KEY = 'lucid-managed-workflow-preview-v2';
export const PREVIOUS_WORKFLOW_PREVIEW_STORAGE_KEY = 'lucid-workflow-preview-v8';
export const OLDER_WORKFLOW_PREVIEW_STORAGE_KEY = 'lucid-workflow-preview-v7';
export const OLDER_WORKFLOW_PREVIEW_STORAGE_KEY_2 = 'lucid-workflow-preview-v6';
export const OLDEST_WORKFLOW_PREVIEW_STORAGE_KEY = 'lucid-workflow-preview-v5';
export const WORKFLOW_PREVIEW_VERSION = WORKFLOW_MOCK_SCHEMA_VERSION;

const clone = value => JSON.parse(JSON.stringify(value));
const stripClientPaymentPreferences = data => ({
  ...data,
  clientProfiles: (data.clientProfiles || []).map(profile => Object.fromEntries(
    Object.entries(profile).filter(([key]) => key !== 'paymentPreference'),
  )),
});

const validStore = isWorkflowMockDatabase;

const errorResult = (code, message) => ({ data: null, error: { code, message } });

const migrateLegacyPreview = (legacy, seedData) => {
  if (!legacy || typeof legacy !== 'object' || !legacy.caseId || !legacy.status) return null;
  const legacyCase = {
    ...seedData.cases.find(record => record.id === legacy.caseId),
    id: legacy.caseId,
    service: legacy.service || 'Electrical repairs',
    category: legacy.category || 'Home repairs',
    scope: legacy.issue || 'Sample managed service request',
    locationSummary: legacy.location || 'Preview location',
    clientRoleId: 'demo-client',
    assignedInspectorId: legacy.assignedInspector ? 'demo-inspector' : '',
    assignedProviderId: legacy.assignedProvider ? 'demo-provider' : '',
    clientRange: { min: legacy.clientRange?.min || 0, max: legacy.clientRange?.max || 0, currency: legacy.clientRange?.currency || 'GHS' },
    status: legacy.status === 'draft' ? 'submitted' : legacy.status,
    inspection: legacy.inspection || null,
    confirmedScope: legacy.inspection?.scope || '',
    providerAcceptedAt: legacy.providerAcceptedAt || null,
    pendingPriceChange: legacy.pendingPriceChange || null,
    providerBill: legacy.providerBillAmount == null ? null : {
      providerAmount: Number(legacy.providerBillAmount),
      clientPurchasedMaterialsAmount: 0,
      commissionRate: Number(legacy.commissionRate || 0),
      commissionAmount: Number(legacy.commissionAmount || 0),
      payableAmount: Number(legacy.providerBillAmount) + Number(legacy.commissionAmount || 0),
      note: legacy.providerBillNote || '',
      submittedAt: new Date().toISOString(),
    },
    clientSatisfied: Boolean(legacy.clientSatisfied),
    commissionRate: Number(legacy.commissionRate || 0),
    paymentStatus: legacy.paymentStatus || 'unpaid',
    paymentReference: legacy.paymentReference || '',
    providerPayoutStatus: legacy.providerPayoutStatus || 'not_released',
    providerPayoutAmount: Number(legacy.providerPayoutAmount || 0),
    cancellationFeeDue: Number(legacy.cancellationFee || 0),
    cancellationFeePaid: Boolean(legacy.cancellationFeePaid),
    dispute: legacy.dispute || null,
    refundRequest: legacy.refundRequest || null,
    history: Array.isArray(legacy.history) ? legacy.history : [],
  };

  const oldThreads = legacy.threads && typeof legacy.threads === 'object' ? legacy.threads : {};
  const audienceMap = {
    clientAdmin: 'client-admin', clientInspector: 'client-inspector',
    providerAdmin: 'provider-admin', providerInspector: 'provider-inspector',
    inspectorAdmin: 'inspector-admin',
  };
  const messages = Object.entries(audienceMap).flatMap(([oldKey, audience]) => (Array.isArray(oldThreads[oldKey]) ? oldThreads[oldKey] : []).map((message, index) => ({
    id: message.id || `${legacy.caseId}-${audience}-${index}`,
    threadId: `${audience}:${legacy.caseId}`,
    caseId: legacy.caseId,
    audience,
    senderRole: String(message.sender || '').toLowerCase().includes('provider') ? 'provider' : String(message.sender || '').toLowerCase().includes('inspector') ? 'inspector' : String(message.sender || '').toLowerCase().includes('admin') ? 'admin' : 'client',
    body: String(message.body || ''),
    at: message.at || new Date().toISOString(),
    read: true,
  })));

  return {
    ...clone(seedData),
    version: WORKFLOW_PREVIEW_VERSION,
    cases: [legacyCase, ...seedData.cases.filter(record => record.id !== legacy.caseId)],
    messages: [...messages, ...seedData.messages],
    notifications: [...(Array.isArray(legacy.notifications) ? legacy.notifications.map((item, index) => ({ id: item.id || `legacy-notice-${index}`, role: 'client', caseId: legacy.caseId, message: item.message || '', at: item.at || new Date().toISOString(), read: Boolean(item.read) })) : []), ...seedData.notifications],
    financeEntries: clone(seedData.financeEntries),
  };
};

export const createPreviewStore = ({ storage, seedData, key = WORKFLOW_PREVIEW_STORAGE_KEY, legacyKey = LEGACY_WORKFLOW_PREVIEW_STORAGE_KEY }) => {
  const safeSeed = stripClientPaymentPreferences({ ...clone(seedData), paymentMethods: Array.isArray(seedData.paymentMethods) ? clone(seedData.paymentMethods) : [], notificationPreferences: clone(seedData.notificationPreferences || {}) });

  const read = () => {
    let serialized;
    try {
      serialized = storage.getItem(key);
    } catch {
      return errorResult('PREVIEW_STORAGE_UNAVAILABLE', 'Preview storage cannot be read in this browser.');
    }

    if (serialized == null) {
      let previousSerialized;
      try { previousSerialized = storage.getItem(PREVIOUS_WORKFLOW_PREVIEW_STORAGE_KEY) || storage.getItem(OLDER_WORKFLOW_PREVIEW_STORAGE_KEY) || storage.getItem(OLDER_WORKFLOW_PREVIEW_STORAGE_KEY_2) || storage.getItem(OLDEST_WORKFLOW_PREVIEW_STORAGE_KEY); } catch {
        return errorResult('PREVIEW_STORAGE_UNAVAILABLE', 'Preview storage cannot be read in this browser.');
      }
      if (previousSerialized != null) {
        try {
          const previous = JSON.parse(previousSerialized);
          if ([5, 6, 7, 8].includes(previous?.version) && Array.isArray(previous.cases) && Array.isArray(previous.inspectors)) {
            const migrated = { ...clone(seedData), ...previous, version: WORKFLOW_MOCK_SCHEMA_VERSION };
            const previousCaseIds = new Set(previous.cases.map(record => record.id));
            const addedSeedCases = seedData.cases.filter(record => !previousCaseIds.has(record.id));
            const addedSeedCaseIds = new Set(addedSeedCases.map(record => record.id));
            migrated.cases = [
              ...previous.cases.map(record => ({ ...record, inspectionVisit: record.inspectionVisit || null, providerVisit: record.providerVisit || null })),
              ...addedSeedCases,
            ];
            migrated.messages = [
              ...(Array.isArray(previous.messages) ? previous.messages : []),
              ...(seedData.messages || []).filter(message => addedSeedCaseIds.has(message.caseId)),
            ];
            migrated.receipts = Array.isArray(previous.receipts) ? previous.receipts : clone(seedData.receipts || []);
            migrated.providerProfiles = Array.isArray(previous.providerProfiles) ? previous.providerProfiles.map(profile => ({ ...profile, reviews: profile.reviews || [] })) : clone(seedData.providerProfiles || []);
            migrated.clientProfiles = Array.isArray(previous.clientProfiles) ? previous.clientProfiles : clone(seedData.clientProfiles || []);
            const saved = write(migrated);
            if (saved.error) return saved;
            return saved;
          }
        } catch {
          return errorResult('PREVIEW_DATA_CORRUPT', 'Saved preview data is unreadable. Reset Preview mode to restore the sample journey.');
        }
      }
      let legacySerialized;
      try {
        legacySerialized = storage.getItem(legacyKey);
      } catch {
        return errorResult('PREVIEW_STORAGE_UNAVAILABLE', 'Preview storage cannot be read in this browser.');
      }
      if (legacySerialized == null) return { data: clone(safeSeed), error: null };
      let legacy;
      try {
        legacy = JSON.parse(legacySerialized);
      } catch {
        return errorResult('PREVIEW_DATA_CORRUPT', 'Saved preview data is unreadable. Reset Preview mode to restore the sample journey.');
      }
      const migrated = migrateLegacyPreview(legacy, safeSeed);
      if (!migrated) return errorResult('PREVIEW_DATA_UNSUPPORTED', 'Saved preview data cannot be migrated. Reset Preview mode to restore the sample journey.');
      const saved = write(migrated);
      if (saved.error) return saved;
      try { storage.removeItem(legacyKey); } catch { /* The new copy is safe; stale legacy data can remain. */ }
      return saved;
    }

    let parsed;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      return errorResult('PREVIEW_DATA_CORRUPT', 'Saved preview data is unreadable. Reset Preview mode to restore the sample journey.');
    }
    if (!validStore(parsed)) return errorResult('PREVIEW_DATA_UNSUPPORTED', 'Saved preview data has an unsupported version or shape. Reset Preview mode to restore the sample journey.');
    const normalized = stripClientPaymentPreferences({ ...parsed, paymentMethods: Array.isArray(parsed.paymentMethods) ? parsed.paymentMethods : [], notificationPreferences: { ...clone(safeSeed.notificationPreferences), ...(parsed.notificationPreferences || {}) } });
    const hasOldClientPreferences = (parsed.clientProfiles || []).some(profile => Object.hasOwn(profile, 'paymentPreference'));
    return hasOldClientPreferences ? write(normalized) : { data: normalized, error: null };
  };

  const write = data => {
    if (!validStore(data)) return errorResult('PREVIEW_DATA_INVALID', 'Preview data is incomplete and was not saved.');
    try {
      const sanitized = stripClientPaymentPreferences(data);
      storage.setItem(key, JSON.stringify(sanitized));
      return { data: clone(sanitized), error: null };
    } catch {
      return errorResult('PREVIEW_STORAGE_UNAVAILABLE', 'Preview changes could not be saved in this browser.');
    }
  };

  const reset = () => write(safeSeed);

  return { read, write, reset };
};
