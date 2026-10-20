const at = (hoursAgo = 0) => new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

const bill = (providerAmount, commissionRate = 10) => {
  const commissionAmount = Math.round(providerAmount * commissionRate) / 100;
  return {
    providerAmount,
    clientPurchasedMaterialsAmount: 0,
    commissionRate,
    commissionAmount,
    payableAmount: providerAmount + commissionAmount,
    note: 'Sample work bill for the interactive preview.',
    submittedAt: at(3),
  };
};

const makeCase = (id, status, overrides = {}) => ({
  id,
  service: 'Electrical repairs',
  category: 'Home repairs',
  scope: 'Inspect and repair intermittent power to the kitchen outlets.',
  locationSummary: 'Osu, Accra',
  clientRoleId: 'demo-client',
  assignedInspectorId: '',
  assignedProviderId: '',
  clientRange: { min: 450, max: 900, currency: 'GHS' },
  status,
  inspection: null,
  confirmedScope: '',
  providerAcceptedAt: null,
  workStartedAt: null,
  pendingPriceChange: null,
  approvedWorkAmount: null,
  providerBill: null,
  clientSatisfied: false,
  commissionRate: 10,
  paymentStatus: 'unpaid',
  paymentReference: '',
  providerPayoutStatus: 'not_released',
  providerPayoutAmount: 0,
  cancellationFeeDue: 0,
  cancellationFeePaid: false,
  featuresBlocked: false,
  dispute: null,
  refundRequest: null,
  history: [{ id: `${id}-created`, actorRole: 'client', action: 'submit_request', label: 'Client submitted a service request', at: at(12) }],
  ...overrides,
});

export const createWorkflowPreviewSeed = () => {
  const cases = [
    makeCase('LUCID-DEMO-1042', 'submitted'),
    makeCase('LUCID-DEMO-1043', 'needs_information', { informationRequest: 'Please add a photo of the affected area.' }),
    makeCase('LUCID-DEMO-1044', 'inspector_assigned', { assignedInspectorId: 'demo-inspector' }),
    makeCase('LUCID-DEMO-1045', 'inspection_reported', {
      assignedInspectorId: 'demo-inspector',
      inspection: { findings: 'Outlet circuit has intermittent power.', scope: 'Inspect wiring and replace damaged outlet.', submittedAt: at(6) },
      confirmedScope: 'Inspect wiring and replace damaged outlet.',
    }),
    makeCase('LUCID-DEMO-1046', 'offer_sent', { assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider' }),
    makeCase('LUCID-DEMO-1047', 'work_in_progress', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(5), workStartedAt: at(4),
    }),
    makeCase('LUCID-DEMO-1048', 'price_change_pending', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(5), workStartedAt: at(4),
      pendingPriceChange: { amount: 780, reason: 'A damaged junction box was found.', requestedAt: at(2) },
    }),
    makeCase('LUCID-DEMO-1049', 'awaiting_client_approval', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(8), providerBill: bill(600),
    }),
    makeCase('LUCID-DEMO-1050', 'payment_delayed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(10), providerBill: bill(600), clientSatisfied: true,
      paymentStatus: 'delayed',
    }),
    makeCase('LUCID-DEMO-1051', 'payment_failed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(10), providerBill: bill(420), clientSatisfied: true,
      paymentStatus: 'failed',
    }),
    makeCase('LUCID-DEMO-1052', 'disputed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(24), providerBill: bill(950), clientSatisfied: false,
      dispute: { status: 'pending', reason: 'Please explain the additional work charge.', openedAt: at(1) },
    }),
    makeCase('LUCID-DEMO-1053', 'refund_pending', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(36), providerBill: bill(500), clientSatisfied: true,
      paymentStatus: 'confirmed', paymentReference: 'PREVIEW-1043',
      providerPayoutStatus: 'released', providerPayoutAmount: 500,
      refundRequest: { status: 'pending', reason: 'The repaired outlet stopped working.', openedAt: at(1) },
    }),
    makeCase('LUCID-DEMO-1054', 'cancelled', { cancelledAt: at(8), cancellationFeeDue: 0 }),
    makeCase('LUCID-DEMO-1055', 'cancelled_fee_due', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(12), cancelledAt: at(3), cancellationFeeDue: 75,
      featuresBlocked: true,
    }),
    makeCase('LUCID-DEMO-1056', 'completed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(48), providerBill: bill(720), clientSatisfied: true,
      paymentStatus: 'confirmed', paymentReference: 'PREVIEW-1044',
      providerPayoutStatus: 'released', providerPayoutAmount: 720, completedAt: at(1),
    }),
  ];

  const messages = [];
  for (const record of cases) {
    const threadTypes = ['client-admin'];
    if (record.assignedInspectorId) threadTypes.push('client-inspector', 'inspector-admin');
    if (record.assignedProviderId) threadTypes.push('provider-admin', 'provider-inspector');
    for (const audience of threadTypes) {
      const threadId = `${audience}:${record.id}`;
      messages.push({
        id: `${threadId}-seed`,
        threadId,
        caseId: record.id,
        audience,
        senderRole: audience.split('-')[0],
        body: 'This is a sample case conversation in Preview mode.',
        at: at(2),
        read: false,
      });
    }
  }

  return {
    version: 3,
    cases,
    messages,
    paymentMethods: [],
    notifications: [
      { id: 'notice-client-1', role: 'client', caseId: 'LUCID-DEMO-1049', message: 'A Provider bill is ready for your review.', at: at(1), read: false },
      { id: 'notice-provider-1', role: 'provider', caseId: 'LUCID-DEMO-1046', message: 'A new managed service offer is available.', at: at(2), read: false },
      { id: 'notice-inspector-1', role: 'inspector', caseId: 'LUCID-DEMO-1047', message: 'Payment status needs follow-up before completion.', at: at(1), read: false },
      { id: 'notice-admin-1', role: 'admin', caseId: 'LUCID-DEMO-1052', message: 'A Client dispute needs a decision.', at: at(1), read: false },
    ],
    financeEntries: cases.flatMap(record => {
      const entries = [];
      if (record.providerBill) {
        entries.push({ id: `${record.id}-client-charge`, caseId: record.id, role: 'client', type: 'client_total', amount: record.providerBill.payableAmount, status: record.paymentStatus, at: record.providerBill.submittedAt });
        entries.push({ id: `${record.id}-provider-payout`, caseId: record.id, role: 'provider', type: 'provider_payout', amount: record.providerBill.providerAmount, status: record.providerPayoutStatus, at: record.providerBill.submittedAt });
        entries.push({ id: `${record.id}-commission`, caseId: record.id, role: 'admin', type: 'platform_charge', amount: record.providerBill.commissionAmount, status: record.paymentStatus, at: record.providerBill.submittedAt });
      }
      if (record.paymentStatus === 'confirmed') {
        entries.push({ id: `${record.id}-inspector-compensation`, caseId: record.id, role: 'inspector', type: 'sample_compensation', amount: 45, status: 'sample', at: record.completedAt || record.providerBill?.submittedAt || at(1) });
      }
      return entries;
    }),
  };
};
