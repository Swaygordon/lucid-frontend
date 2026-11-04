// @backend-handoff-delete Fictional seed records only; remove this entire mock data module after backend cutover.
import { WORKFLOW_MOCK_SCHEMA_VERSION } from './schema.js';

const inspectors = [
  { id: 'demo-inspector', displayName: 'Ama Ofori', homeCity: 'Accra', region: 'Greater Accra', categories: ['Home Repairs & Maintenance', 'Moving & Relocation', 'Cleaning Services'], active: true, availability: 'Available' },
  { id: 'demo-inspector-tema', displayName: 'Kojo Mensah', homeCity: 'Tema', region: 'Greater Accra', categories: ['Home Repairs & Maintenance', 'Auto Repairs', 'Construction & Renovation'], active: true, availability: 'Available' },
  { id: 'demo-inspector-kumasi', displayName: 'Akua Owusu', homeCity: 'Kumasi', region: 'Ashanti', categories: ['Home Repairs & Maintenance', 'Moving & Relocation', 'Cleaning Services', 'Construction & Renovation'], active: true, availability: 'Available' },
  { id: 'demo-inspector-takoradi', displayName: 'Yaw Asante', homeCity: 'Takoradi', region: 'Western', categories: ['Home Repairs & Maintenance', 'Moving & Relocation', 'Auto Repairs'], active: true, availability: 'Limited availability' },
];

const at = (hoursAgo = 0) => new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

const bill = (providerAmount, commissionRate = 10, inspectorRate = 10) => {
  const commissionAmount = Math.round(providerAmount * commissionRate) / 100;
  const inspectorAmount = Math.round(providerAmount * inspectorRate) / 100;
  return {
    version: 1,
    providerAmount,
    clientPurchasedMaterialsAmount: 0,
    inspectorRate,
    inspectorAmount,
    commissionRate,
    commissionAmount,
    payableAmount: providerAmount + inspectorAmount + commissionAmount,
    note: 'Sample work bill for the interactive preview.',
    submittedAt: at(3),
    status: 'submitted',
  };
};

const makeCase = (id, status, overrides = {}) => ({
  id,
  service: 'Electrical repairs',
  category: 'Home Repairs & Maintenance',
  scope: 'Inspect and repair intermittent power to the kitchen outlets.',
  description: 'Inspect and repair intermittent power to the kitchen outlets.',
  locationSummary: 'Osu, Accra',
  region: 'Greater Accra',
  city: 'Accra',
  clientRoleId: 'demo-client',
  assignedInspectorId: '',
  inspectorAssignment: overrides.assignedInspectorId ? { inspectorName: 'Ama Ofori', distanceKm: 3.5, searchRadiusKm: 25, assignedAt: at(3) } : null,
  assignedProviderId: '',
  providerAssignment: overrides.assignedProviderId ? { providerName: 'Kwame Mensah', adminName: 'LUCID Admin/HR', distanceKm: 5.1, searchRadiusKm: 25, assignedAt: at(2) } : null,
  clientRange: { min: 450, max: 900, currency: 'GHS' },
  status,
  inspection: null,
  inspectionVisit: null,
  providerVisit: null,
  confirmedScope: '',
  providerAcceptedAt: null,
  workStartedAt: null,
  pendingWorkEstimate: null,
  approvedWorkEstimate: null,
  workEstimateHistory: [],
  estimateRevisionRequest: null,
  pendingPriceChange: null,
  changeOrders: [],
  approvedWorkAmount: null,
  providerBill: null,
  providerBillHistory: [],
  review: null,
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
    makeCase('LUCID-DEMO-1040', 'inspector_bypass_approved', {
      assignedInspectorId: '',
      inspectorWaived: true,
      inspectionBypassConsent: { approvedAt: at(2), requestRevision: 1, scope: 'Inspect and repair intermittent power to the kitchen outlets.', category: 'Home Repairs & Maintenance', locationSummary: 'Osu, Accra' },
      confirmedScope: 'Repair the identified kitchen outlet fault.',
    }),
    makeCase('LUCID-DEMO-1041', 'inspector_bypass_pending', {
      inspectorBypassRequest: { requestedAt: at(1), requestRevision: 1, reason: 'No eligible Inspector is available in the service area.', previousInspectorId: '', previousInspector: null },
    }),
    makeCase('LUCID-DEMO-1042', 'submitted'),
    makeCase('LUCID-DEMO-1043', 'needs_information', { informationRequest: 'Please add a photo of the affected area.' }),
    makeCase('LUCID-DEMO-1044', 'inspector_assigned', {
      assignedInspectorId: 'demo-inspector',
      inspectorAssignment: { inspectorName: 'Ama Ofori', distanceKm: 3.5, searchRadiusKm: 25, assignedAt: at(10) },
    }),
    makeCase('LUCID-DEMO-1045', 'inspection_reported', {
      assignedInspectorId: 'demo-inspector',
      inspectorAssignment: { inspectorName: 'Ama Ofori', distanceKm: 3.5, searchRadiusKm: 25, assignedAt: at(12) },
      inspection: {
        findings: 'Outlet circuit has intermittent power.',
        scope: 'Inspect wiring and replace damaged outlet.',
        feasibility: 'feasible',
        feasibilityNotes: '',
        safetyStatus: 'precautions_required',
        safetyNotes: 'Isolate the affected circuit before replacing the outlet.',
        checklist: ['access_reviewed', 'hazards_reviewed', 'qualifications_reviewed'],
        evidence: [],
        submittedAt: at(6),
      },
      confirmedScope: 'Inspect wiring and replace damaged outlet.',
    }),
    makeCase('LUCID-DEMO-1057', 'inspection_scheduled', {
      service: 'Plumbing inspection',
      category: 'Home Repairs & Maintenance',
      scope: 'Check a persistent leak beneath the kitchen sink.',
      description: 'Check a persistent leak beneath the kitchen sink.',
      assignedInspectorId: 'demo-inspector',
      inspectorAssignment: { inspectorName: 'Ama Ofori', distanceKm: 4.2, searchRadiusKm: 25, assignedAt: at(4) },
      inspectionVisit: { scheduledAt: at(-24), notes: 'Client prefers a morning visit.', updatedAt: at(1) },
    }),
    makeCase('LUCID-DEMO-1046', 'offer_sent', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      preferredDate: '2026-10-24', preferredTime: '09:00', alternateDate: '2026-10-25', alternateTime: '13:00',
      confirmedScope: 'Inspect wiring and replace the damaged kitchen outlet after isolating the circuit.',
      providerAssignment: { providerName: 'Kwame Mensah', adminName: 'LUCID Admin/HR', distanceKm: 5.1, searchRadiusKm: 25, assignedAt: at(2) },
      inspection: { findings: 'Intermittent power is isolated to the kitchen outlet circuit. The outlet shows heat damage; wiring should be checked before replacement.', scope: 'Inspect wiring and replace the damaged kitchen outlet after isolating the circuit.', feasibility: 'feasible_with_conditions', feasibilityNotes: 'Isolate the circuit and verify wiring condition before replacement.', safetyStatus: 'precautions_required', safetyNotes: 'Keep the affected circuit isolated until inspected.', checklist: ['access_reviewed', 'hazards_reviewed', 'qualifications_reviewed'], evidence: [], submittedAt: at(4) },
    }),
    makeCase('LUCID-DEMO-1047', 'work_in_progress', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(6) },
      providerAcceptedAt: at(5), workStartedAt: at(4),
      approvedWorkEstimate: { version: 1, amount: 600, scope: 'Inspect and repair the kitchen outlet circuit.', approvedAt: at(6), status: 'approved' }, approvedWorkAmount: 600,
      workEstimateHistory: [{ version: 1, amount: 600, scope: 'Inspect and repair the kitchen outlet circuit.', submittedAt: at(7), approvedAt: at(6), status: 'approved' }],
    }),
    makeCase('LUCID-DEMO-1048', 'work_in_progress', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(6) },
      providerVisit: { scheduledAt: at(-48), notes: 'Sample Provider work window.', updatedAt: at(1) },
      providerAcceptedAt: at(5), workStartedAt: at(4),
      approvedWorkEstimate: { version: 1, amount: 600, scope: 'Repair the intermittent kitchen circuit.', approvedAt: at(7), status: 'approved' }, approvedWorkAmount: 600,
      workEstimateHistory: [{ version: 1, amount: 600, scope: 'Repair the intermittent kitchen circuit.', submittedAt: at(8), approvedAt: at(7), status: 'approved' }],
      pendingPriceChange: { id: 'LUCID-DEMO-1048-change-1', amount: 180, scope: 'Replace the heat-damaged junction box.', reason: 'A damaged junction box was found during repair.', requestedAt: at(2), status: 'pending' },
    }),
    makeCase('LUCID-DEMO-1049', 'awaiting_client_approval', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(6) },
      providerAcceptedAt: at(8), approvedWorkEstimate: { version: 1, amount: 700, scope: 'Inspect and repair the kitchen outlet circuit.', approvedAt: at(9), status: 'approved' }, approvedWorkAmount: 700,
      providerBill: bill(600), providerBillHistory: [bill(600)], clientSatisfied: true,
    }),
    makeCase('LUCID-DEMO-1050', 'payment_delayed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(7) },
      providerAcceptedAt: at(10), providerBill: bill(600), clientSatisfied: true, clientPaymentAcceptedAt: at(2),
      paymentStatus: 'delayed',
    }),
    makeCase('LUCID-DEMO-1051', 'payment_failed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(9) },
      providerAcceptedAt: at(10), providerBill: bill(420), clientSatisfied: true, clientPaymentAcceptedAt: at(2),
      paymentStatus: 'failed',
    }),
    makeCase('LUCID-DEMO-1052', 'disputed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(23) },
      providerAcceptedAt: at(24), providerBill: bill(950), clientSatisfied: false,
      dispute: { status: 'pending', reason: 'Please explain the additional work charge.', openedAt: at(1) },
    }),
    makeCase('LUCID-DEMO-1053', 'refund_pending', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(35) },
      providerAcceptedAt: at(36), providerBill: bill(500), clientSatisfied: true,
      paymentStatus: 'confirmed', paymentReference: 'PREVIEW-1043',
      providerPayoutStatus: 'released', providerPayoutAmount: 500,
      refundRequest: { status: 'pending', reason: 'The repaired outlet stopped working.', openedAt: at(1) },
    }),
    makeCase('LUCID-DEMO-1054', 'cancelled', { cancelledAt: at(8), cancellationFeeDue: 0 }),
    makeCase('LUCID-DEMO-1055', 'cancelled_fee_due', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAssignment: { providerName: 'Kwame Mensah', distanceKm: 5.1, assignedAt: at(47) },
      providerAcceptedAt: at(12), cancelledAt: at(3), cancellationFeeDue: 75,
      featuresBlocked: true,
    }),
    makeCase('LUCID-DEMO-1056', 'completed', {
      assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
      providerAcceptedAt: at(48), providerBill: bill(720), clientSatisfied: true, clientPaymentAcceptedAt: at(3),
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
    version: WORKFLOW_MOCK_SCHEMA_VERSION,
    cases,
    inspectors,
    inspectorProfiles: inspectors.map(({ id, displayName, homeCity, region, categories, availability }) => ({
      id, displayName, homeCity, region, categories, qualifications: [], availability, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00', endTime: '17:00', presenceStatus: 'offline', scheduleStatus: 'on_shift', assignmentCapacity: 'open', maxActiveAssignments: 12, payoutSetup: true, profileComplete: false,
    })),
    clientProfiles: [{ id: 'demo-client', fullName: 'Lena Addo', phone: '', homeCity: '', region: '', profileComplete: false }],
    providerProfiles: [{ id: 'demo-provider', fullName: 'Kwame Mensah', phone: '', homeCity: 'Accra', region: 'Greater Accra', categories: ['Home Repairs & Maintenance'], qualifications: ['Preview service qualification'], availability: 'Available', presenceStatus: 'offline', scheduleStatus: 'on_shift', assignmentCapacity: 'open', maxActiveAssignments: 12, payoutSetup: true, profileComplete: false, reviews: [] }],
    accountPolicies: [],
    accountAppeals: [],
    receipts: cases.filter(record => record.paymentStatus === 'confirmed' && record.providerBill).flatMap(record => ['client', 'provider', ...(record.assignedInspectorId ? ['inspector'] : []), 'admin'].map(role => ({
      id: `${record.id}-receipt-${role}`, caseId: record.id, recipientRole: role,
      recipientId: ({ client: record.clientRoleId, provider: record.assignedProviderId, inspector: record.assignedInspectorId, admin: 'demo-admin' })[role],
      issuedAt: record.completedAt || at(1), currency: record.clientRange?.currency || 'GHS',
      providerAmount: record.providerBill.providerAmount, inspectorAmount: record.providerBill.inspectorAmount, platformAmount: record.providerBill.commissionAmount,
      totalAmount: record.providerBill.payableAmount, paymentReference: record.paymentReference || `PREVIEW-${record.id}`,
    }))),
    messages,
    paymentMethods: [],
    notificationPreferences: Object.fromEntries(['client', 'provider', 'inspector', 'admin'].map(role => [role, { inApp: true, email: true, sms: false }])),
    notifications: [
      { id: 'notice-client-1', role: 'client', caseId: 'LUCID-DEMO-1049', message: 'A Provider bill is ready for your review.', at: at(1), read: false },
      { id: 'notice-provider-1', role: 'provider', caseId: 'LUCID-DEMO-1046', message: 'A new managed service offer is available.', at: at(2), read: false },
      { id: 'notice-inspector-1', role: 'inspector', caseId: 'LUCID-DEMO-1047', message: 'Payment status needs follow-up before completion.', at: at(1), read: false },
      { id: 'notice-admin-1', role: 'admin', caseId: 'LUCID-DEMO-1052', message: 'A Client dispute needs a decision.', at: at(1), read: false },
    ],
    financeEntries: [...cases.flatMap(record => {
      const entries = [];
      if (record.providerBill) {
        entries.push({ id: `${record.id}-client-charge`, caseId: record.id, role: 'client', type: 'client_total', amount: record.providerBill.payableAmount, status: record.paymentStatus, at: record.providerBill.submittedAt });
        entries.push({ id: `${record.id}-provider-payout`, caseId: record.id, role: 'provider', type: 'provider_payout', amount: record.providerBill.providerAmount, status: record.providerPayoutStatus, at: record.providerBill.submittedAt });
        if (record.assignedInspectorId) entries.push({ id: `${record.id}-inspector-payout`, caseId: record.id, role: 'inspector', type: 'inspector_payout', amount: record.providerBill.inspectorAmount, status: record.providerPayoutStatus, at: record.providerBill.submittedAt });
        entries.push({ id: `${record.id}-commission`, caseId: record.id, role: 'admin', type: 'platform_charge', amount: record.providerBill.commissionAmount, status: record.paymentStatus, at: record.providerBill.submittedAt });
      }
      return entries;
    }), ...cases.filter(record => record.status === 'cancelled_fee_due' && !record.cancellationFeePaid).map(record => ({ id: `${record.id}-cancellation-fee`, caseId: record.id, role: 'client', type: 'cancellation_fee_recovery', amount: record.cancellationFeeDue, status: 'due', at: record.cancelledAt || at(2) }))],
  };
};
