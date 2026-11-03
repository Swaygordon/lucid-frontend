// @backend-handoff-delete Tests for local Preview bill and approval flow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyWorkflowAction } from '../../src/dev/workflow-mock/transitions.js';

const baseCase = overrides => ({
  id: 'CASE-BILL-1',
  status: 'accepted',
  assignedProviderId: 'demo-provider',
  assignedInspectorId: 'demo-inspector',
  providerAcceptedAt: '2026-11-01T10:00:00.000Z',
  clientRange: null,
  commissionRate: 10,
  inspectorRate: 10,
  approvedWorkEstimate: null,
  changeOrders: [],
  providerBillHistory: [],
  clientSatisfied: false,
  history: [],
  ...overrides,
});

test('Provider can start accepted work without an estimate, then submit a final bill after completion', () => {
  const record = baseCase();
  const prematureStart = applyWorkflowAction(record, { role: 'provider', action: 'start_work', at: '2026-11-02T10:00:00.000Z' });
  assert.equal(prematureStart.error, null);
  assert.equal(prematureStart.caseRecord.status, 'work_in_progress');
  const completed = applyWorkflowAction(prematureStart.caseRecord, { role: 'provider', action: 'complete_work', at: '2026-11-02T11:00:00.000Z' });
  assert.equal(completed.error, null);
  assert.equal(completed.caseRecord.status, 'awaiting_provider_bill');
  const bill = applyWorkflowAction(completed.caseRecord, { role: 'provider', action: 'submit_bill', payload: { amount: 900 }, at: '2026-11-02T12:00:00.000Z' });
  assert.equal(bill.error, null);
  assert.equal(bill.caseRecord.providerBill.providerAmount, 900);
});

test('Client may request an estimate revision with a reason and Provider resubmission preserves versions', () => {
  const first = applyWorkflowAction(baseCase(), {
    role: 'provider', action: 'submit_work_estimate',
    payload: { amount: 650, scope: 'Repair the affected outlets.' }, at: '2026-11-02T10:00:00.000Z',
  });
  const request = applyWorkflowAction(first.caseRecord, {
    role: 'client', action: 'request_work_estimate_revision',
    payload: { reason: 'Please explain the materials included.' }, at: '2026-11-02T11:00:00.000Z',
  });
  assert.equal(request.error, null);
  assert.equal(request.caseRecord.status, 'estimate_revision_requested');
  const revised = applyWorkflowAction(request.caseRecord, {
    role: 'provider', action: 'submit_work_estimate',
    payload: { amount: 620, scope: 'Repair outlets; includes standard wiring.' }, at: '2026-11-02T12:00:00.000Z',
  });
  assert.equal(revised.error, null);
  assert.equal(revised.caseRecord.workEstimateHistory.length, 2);
  assert.equal(revised.caseRecord.workEstimateHistory[1].version, 2);
  assert.equal(revised.caseRecord.workEstimateHistory[0].amount, 650);
});

test('approved extra work is recorded while the final bill is not capped by an estimate', () => {
  const inProgress = baseCase({
    status: 'work_in_progress',
    approvedWorkEstimate: { amount: 650, scope: 'Repair outlets.', approvedAt: '2026-11-02T09:00:00.000Z' },
  });
  const proposal = applyWorkflowAction(inProgress, {
    role: 'provider', action: 'request_price_change',
    payload: { amount: 120, scope: 'Replace damaged breaker', reason: 'The breaker is unsafe and must be replaced.' }, at: '2026-11-02T10:00:00.000Z',
  });
  assert.equal(proposal.error, null);
  assert.equal(proposal.caseRecord.status, 'price_change_pending');
  assert.equal(proposal.caseRecord.pendingPriceChange.amount, 120);

  const approved = applyWorkflowAction(proposal.caseRecord, { role: 'client', action: 'approve_price_change', at: '2026-11-02T11:00:00.000Z' });
  assert.equal(approved.error, null);
  assert.equal(approved.caseRecord.changeOrders.length, 1);
  assert.equal(approved.caseRecord.changeOrders[0].amount, 120);
  assert.equal(approved.caseRecord.changeOrders[0].approvedAt, '2026-11-02T11:00:00.000Z');

  const over = applyWorkflowAction({ ...approved.caseRecord, status: 'awaiting_provider_bill' }, {
    role: 'provider', action: 'submit_bill', payload: { amount: 800 }, at: '2026-11-02T12:00:00.000Z',
  });
  assert.equal(over.error, null);
  const within = applyWorkflowAction({ ...approved.caseRecord, status: 'awaiting_provider_bill' }, {
    role: 'provider', action: 'submit_bill', payload: { amount: 760 }, at: '2026-11-02T12:00:00.000Z',
  });
  assert.equal(within.error, null);
});

test('Provider bill revisions keep the previous bill and record the Client reason', () => {
  const ready = baseCase({ status: 'awaiting_provider_bill' });
  const first = applyWorkflowAction(ready, { role: 'provider', action: 'submit_bill', payload: { amount: 630, note: 'Completed outlet repair' }, at: '2026-11-02T10:00:00.000Z' });
  assert.equal(first.error, null);
  const revisionRequested = applyWorkflowAction(first.caseRecord, { role: 'client', action: 'reject_bill', payload: { note: 'Please explain the extra materials line.' }, at: '2026-11-02T11:00:00.000Z' });
  const revised = applyWorkflowAction(revisionRequested.caseRecord, { role: 'provider', action: 'submit_bill', payload: { amount: 600, note: 'Removed the disputed materials line' }, at: '2026-11-02T12:00:00.000Z' });
  assert.equal(revised.error, null);
  assert.equal(revised.caseRecord.providerBillHistory.length, 2);
  assert.equal(revised.caseRecord.providerBillHistory[0].status, 'revision_requested');
  assert.equal(revised.caseRecord.providerBillHistory[0].clientDecisionReason, 'Please explain the extra materials line.');
  assert.equal(revised.caseRecord.providerBill.version, 2);
});

test('Client may reject a bill without a note; acceptance needs no Inspector satisfaction flag', () => {
  const bill = applyWorkflowAction(baseCase({ status: 'awaiting_provider_bill' }), { role: 'provider', action: 'submit_bill', payload: { amount: 600 }, at: '2026-11-02T10:00:00.000Z' });
  const rejected = applyWorkflowAction(bill.caseRecord, { role: 'client', action: 'reject_bill', payload: {}, at: '2026-11-02T11:00:00.000Z' });
  assert.equal(rejected.error, null);
  assert.equal(rejected.caseRecord.status, 'bill_rejected');
  assert.equal(rejected.caseRecord.billRejection.note, '');
  const resubmitted = applyWorkflowAction(rejected.caseRecord, { role: 'provider', action: 'submit_bill', payload: { amount: 580 }, at: '2026-11-02T12:00:00.000Z' });
  const accepted = applyWorkflowAction(resubmitted.caseRecord, { role: 'client', action: 'approve_bill', at: '2026-11-02T13:00:00.000Z' });
  assert.equal(accepted.error, null);
  assert.equal(accepted.caseRecord.status, 'awaiting_payment');
});

test('Admin bypass consent is recorded and permits Provider assignment directly; material amendment invalidates consent', () => {
  const pending = applyWorkflowAction(baseCase({ status: 'submitted', assignedInspectorId: '' }), { role: 'admin', action: 'request_inspector_bypass', payload: {}, at: '2026-11-02T09:00:00.000Z' });
  assert.equal(pending.error, null);
  assert.equal(pending.caseRecord.status, 'inspector_bypass_pending');
  const approved = applyWorkflowAction(pending.caseRecord, { role: 'client', action: 'approve_inspector_bypass', at: '2026-11-02T10:00:00.000Z' });
  assert.equal(approved.error, null);
  assert.equal(approved.caseRecord.status, 'inspector_bypass_approved');
  assert.equal(approved.caseRecord.inspectionBypassConsent.requestRevision, 1);
  const amendment = applyWorkflowAction(approved.caseRecord, { role: 'admin', action: 'amend_request', payload: { patch: { scope: 'A materially different job' }, reason: 'Client requested change' }, at: '2026-11-02T11:00:00.000Z' });
  const amended = applyWorkflowAction(amendment.caseRecord, { role: 'client', action: 'accept_request_amendment', at: '2026-11-02T12:00:00.000Z' });
  assert.equal(amended.caseRecord.inspectionBypassConsent, null);
  assert.equal(amended.caseRecord.status, 'submitted');
  const reconfirmed = applyWorkflowAction(amended.caseRecord, { role: 'admin', action: 'request_inspector_bypass', payload: {}, at: '2026-11-02T13:00:00.000Z' });
  assert.equal(reconfirmed.error, null);
});

test('Inspector bypass requires Admin request and preserves an unavailable Inspector assignment history', () => {
  const record = baseCase({
    status: 'inspector_assigned', assignedInspectorId: 'suspended-inspector',
    inspectorAssignment: { inspectorName: 'Ama Ofori', assignedAt: '2026-11-01T10:00:00.000Z' },
    inspection: null,
  });
  const clientRequest = applyWorkflowAction(record, { role: 'client', action: 'request_inspector_bypass', at: '2026-11-02T09:00:00.000Z' });
  assert.equal(clientRequest.error.code, 'ROLE_NOT_ALLOWED');
  const requested = applyWorkflowAction(record, { role: 'admin', action: 'request_inspector_bypass', payload: { assignedInspectorUnavailable: true }, at: '2026-11-02T09:00:00.000Z' });
  const approved = applyWorkflowAction(requested.caseRecord, { role: 'client', action: 'approve_inspector_bypass', at: '2026-11-02T10:00:00.000Z' });
  assert.equal(approved.error, null);
  assert.equal(approved.caseRecord.assignedInspectorId, '');
  assert.equal(approved.caseRecord.inspectorBypassRequest.previousInspectorId, 'suspended-inspector');
  assert.equal(approved.caseRecord.inspectorAssignment.inspectorName, 'Ama Ofori');
});

test('Client decline keeps the request in the Inspector search queue and stale consent cannot offer a Provider', () => {
  const pending = applyWorkflowAction(baseCase({ status: 'submitted', assignedInspectorId: '' }), { role: 'admin', action: 'request_inspector_bypass', at: '2026-11-02T09:00:00.000Z' });
  const declined = applyWorkflowAction(pending.caseRecord, { role: 'client', action: 'decline_inspector_bypass', at: '2026-11-02T10:00:00.000Z' });
  assert.equal(declined.error, null);
  assert.equal(declined.caseRecord.status, 'submitted');
  assert.equal(declined.caseRecord.inspectorBypassDecision.decision, 'declined');

  const approved = applyWorkflowAction(pending.caseRecord, { role: 'client', action: 'approve_inspector_bypass', at: '2026-11-02T10:00:00.000Z' });
  const stale = { ...approved.caseRecord, locationSummary: 'Another location' };
  const offered = applyWorkflowAction(stale, { role: 'admin', action: 'offer_provider', payload: { providerId: 'demo-provider' }, at: '2026-11-02T11:00:00.000Z' });
  assert.equal(offered.error.code, 'BYPASS_CONSENT_STALE');
});

test('confirmed payment marks the current bill and its saved version as paid', () => {
  const record = baseCase({
    status: 'awaiting_payment',
    clientSatisfied: true,
    clientPaymentAcceptedAt: '2026-11-02T10:00:00.000Z',
    providerBill: { version: 1, providerAmount: 600, inspectorAmount: 60, commissionAmount: 60, payableAmount: 720, status: 'approved_for_payment' },
    providerBillHistory: [{ version: 1, providerAmount: 600, inspectorAmount: 60, commissionAmount: 60, payableAmount: 720, status: 'approved_for_payment' }],
  });
  const result = applyWorkflowAction(record, {
    role: 'system', action: 'payment_result', payload: { outcome: 'confirmed' }, at: '2026-11-02T12:00:00.000Z',
  });
  assert.equal(result.error, null);
  assert.equal(result.caseRecord.providerBill.status, 'paid');
  assert.equal(result.caseRecord.providerBillHistory[0].status, 'paid');
});
