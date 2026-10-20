export const WORKFLOW_PREVIEW_STORAGE_KEY = 'lucid-workflow-preview-v3';
export const LEGACY_WORKFLOW_PREVIEW_STORAGE_KEY = 'lucid-managed-workflow-preview-v2';
export const WORKFLOW_PREVIEW_VERSION = 3;

const clone = value => JSON.parse(JSON.stringify(value));

const validStore = value => value
  && value.version === WORKFLOW_PREVIEW_VERSION
  && Array.isArray(value.cases)
  && Array.isArray(value.messages)
  && Array.isArray(value.notifications)
  && Array.isArray(value.financeEntries);

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
  const safeSeed = { ...clone(seedData), paymentMethods: Array.isArray(seedData.paymentMethods) ? clone(seedData.paymentMethods) : [] };

  const read = () => {
    let serialized;
    try {
      serialized = storage.getItem(key);
    } catch {
      return errorResult('PREVIEW_STORAGE_UNAVAILABLE', 'Preview storage cannot be read in this browser.');
    }

    if (serialized == null) {
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
    return { data: { ...parsed, paymentMethods: Array.isArray(parsed.paymentMethods) ? parsed.paymentMethods : [] }, error: null };
  };

  const write = data => {
    if (!validStore(data)) return errorResult('PREVIEW_DATA_INVALID', 'Preview data is incomplete and was not saved.');
    try {
      storage.setItem(key, JSON.stringify(data));
      return { data: clone(data), error: null };
    } catch {
      return errorResult('PREVIEW_STORAGE_UNAVAILABLE', 'Preview changes could not be saved in this browser.');
    }
  };

  const reset = () => write(safeSeed);

  return { read, write, reset };
};
