// @backend-handoff-delete Tests for client-side demo transitions; replace with backend-authoritative workflow tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyWorkflowAction } from '../../src/dev/workflow-mock/transitions.js';

const baseCase = overrides => ({
  id: 'CASE-TEST-1',
  status: 'offer_sent',
  assignedInspectorId: 'demo-inspector',
  assignedProviderId: 'demo-provider',
  providerAcceptedAt: null,
  pendingPriceChange: null,
  providerBill: null,
  clientSatisfied: false,
  paymentStatus: 'unpaid',
  providerPayoutStatus: 'not_released',
  commissionRate: 10,
  inspectorRate: 10,
  history: [],
  ...overrides,
});

test('Provider cannot start work before recording offer acceptance', () => {
  const record = baseCase({ status: 'offer_sent' });
  const result = applyWorkflowAction(record, {
    role: 'provider',
    action: 'start_work',
    payload: {},
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error.code, 'PROVIDER_ACCEPTANCE_REQUIRED');
  assert.equal(result.caseRecord.status, 'offer_sent');
  assert.equal(record.status, 'offer_sent');
});

test('an unresolved added-work request prevents completion and bill submission without blocking original work status', () => {
  const record = baseCase({
    status: 'work_in_progress',
    providerAcceptedAt: '2026-10-16T09:00:00.000Z',
    workStartedAt: '2026-10-16T09:30:00.000Z',
    pendingPriceChange: { amount: 800, reason: 'Additional wiring required' },
  });
  const result = applyWorkflowAction(record, {
    role: 'provider',
    action: 'submit_bill',
    payload: { amount: 800 },
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error.code, 'PRICE_CHANGE_APPROVAL_REQUIRED');
  assert.equal(result.caseRecord.providerBill, null);
  const complete = applyWorkflowAction(record, { role: 'provider', action: 'complete_work', payload: {}, at: '2026-10-16T10:01:00.000Z' });
  assert.equal(complete.error.code, 'PRICE_CHANGE_APPROVAL_REQUIRED');
  assert.equal(complete.caseRecord.status, 'work_in_progress');
});

test('only the Client can approve a pending price change', () => {
  const record = baseCase({
    status: 'work_in_progress',
    pendingPriceChange: { amount: 800, reason: 'Additional wiring required' },
  });
  const result = applyWorkflowAction(record, {
    role: 'provider',
    action: 'approve_price_change',
    payload: {},
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error.code, 'ROLE_NOT_ALLOWED');
  assert.equal(result.caseRecord.status, 'work_in_progress');
});

test('a Client reply returns a request awaiting information to the Admin queue', () => {
  const record = baseCase({ status: 'needs_information' });
  const result = applyWorkflowAction(record, {
    role: 'client',
    action: 'provide_information',
    payload: { message: 'I added the requested details.' },
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error, null);
  assert.equal(result.caseRecord.status, 'submitted');
});

test('client-purchased materials are recorded but excluded from the app bill', () => {
  const record = baseCase({ status: 'awaiting_provider_bill', clientSatisfied: true, providerAcceptedAt: '2026-10-16T09:00:00.000Z' });
  const result = applyWorkflowAction(record, {
    role: 'provider',
    action: 'submit_bill',
    payload: { amount: 600, clientPurchasedMaterialsAmount: 120, note: 'Labor and provider-supplied parts' },
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error, null);
  assert.equal(result.caseRecord.providerBill.providerAmount, 600);
  assert.equal(result.caseRecord.providerBill.clientPurchasedMaterialsAmount, 120);
  assert.equal(result.caseRecord.providerBill.payableAmount, 720);
});

test('delayed or failed payment does not release the Provider payout', () => {
  for (const outcome of ['delayed', 'failed']) {
    const record = baseCase({
      status: 'awaiting_payment',
      providerAcceptedAt: '2026-10-16T09:00:00.000Z',
      providerBill: { providerAmount: 600, inspectorAmount: 60, commissionAmount: 60, payableAmount: 720 },
      clientSatisfied: true,
      clientPaymentAcceptedAt: '2026-10-16T09:30:00.000Z',
    });
    const result = applyWorkflowAction(record, {
      role: 'system',
      action: 'payment_result',
      payload: { outcome },
      at: '2026-10-16T10:00:00.000Z',
    });

    assert.equal(result.error, null);
    assert.equal(result.caseRecord.paymentStatus, outcome);
    assert.equal(result.caseRecord.providerPayoutStatus, 'not_released');
  }
});

test('confirmed Client payment releases the simulated Provider share', () => {
  const record = baseCase({
    status: 'awaiting_payment',
    providerBill: { providerAmount: 600, inspectorAmount: 60, commissionAmount: 60, payableAmount: 720 },
    clientSatisfied: true,
    clientPaymentAcceptedAt: '2026-10-16T09:30:00.000Z',
  });
  const result = applyWorkflowAction(record, {
    role: 'system',
    action: 'payment_result',
    payload: { outcome: 'confirmed' },
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error, null);
  assert.equal(result.caseRecord.paymentStatus, 'confirmed');
  assert.equal(result.caseRecord.providerPayoutStatus, 'released');
  assert.equal(result.caseRecord.providerPayoutAmount, 600);
});

test('a failed payment can be retried without bypassing the Client approval gate', () => {
  const record = baseCase({
    status: 'payment_failed',
    providerBill: { providerAmount: 600, commissionAmount: 60, payableAmount: 660 },
    clientSatisfied: true,
    clientPaymentAcceptedAt: '2026-10-16T09:30:00.000Z',
    paymentStatus: 'failed',
  });
  const result = applyWorkflowAction(record, {
    role: 'system',
    action: 'payment_result',
    payload: { outcome: 'confirmed' },
    at: '2026-10-16T11:00:00.000Z',
  });

  assert.equal(result.error, null);
  assert.equal(result.caseRecord.paymentStatus, 'confirmed');
  assert.equal(result.caseRecord.providerPayoutStatus, 'released');
});

test('cancellation is free before assignment and fee-bearing once a Provider has been assigned', () => {
  const beforeAssignment = applyWorkflowAction(baseCase({ status: 'submitted', assignedProviderId: '', assignedInspectorId: '' }), {
    role: 'client',
    action: 'cancel_case',
    payload: { feeAmount: 75 },
    at: '2026-10-16T10:00:00.000Z',
  });
  const afterAssignmentBeforeAcceptance = applyWorkflowAction(baseCase({ status: 'offer_sent' }), {
    role: 'client', action: 'cancel_case', payload: { feeAmount: 75 }, at: '2026-10-16T10:00:00.000Z',
  });
  const afterAcceptance = applyWorkflowAction(baseCase({
    status: 'accepted',
    providerAcceptedAt: '2026-10-16T09:00:00.000Z',
  }), {
    role: 'client',
    action: 'cancel_case',
    payload: { feeAmount: 75 },
    at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(beforeAssignment.error, null);
  assert.equal(beforeAssignment.caseRecord.cancellationFeeDue, 0);
  assert.equal(afterAssignmentBeforeAcceptance.error, null);
  assert.equal(afterAssignmentBeforeAcceptance.caseRecord.cancellationFeeDue, 75);
  assert.equal(afterAcceptance.error, null);
  assert.equal(afterAcceptance.caseRecord.cancellationFeeDue, 75);
  assert.equal(afterAcceptance.caseRecord.featuresBlocked, true);
});

test('Client can clear the simulated account restriction by recovering the cancellation fee', () => {
  const record = baseCase({ status: 'cancelled_fee_due', cancellationFeeDue: 75, featuresBlocked: true });
  const result = applyWorkflowAction(record, {
    role: 'client',
    action: 'pay_cancellation_fee',
    payload: {},
    at: '2026-10-16T11:00:00.000Z',
  });

  assert.equal(result.error, null);
  assert.equal(result.caseRecord.cancellationFeePaid, true);
  assert.equal(result.caseRecord.featuresBlocked, false);
});

test('Admin can change the editable placeholder commission and it recalculates the client total', () => {
  const result = applyWorkflowAction({ ...baseCase({ status: 'awaiting_client_approval' }), providerBill: { providerAmount: 500, commissionRate: 10, commissionAmount: 50, payableAmount: 550 } }, { role: 'admin', action: 'set_commission_rate', payload: { rate: 8 }, at: '2026-10-16T10:00:00.000Z' });
  assert.equal(result.error, null);
  assert.equal(result.caseRecord.providerBill.commissionAmount, 40);
  assert.equal(result.caseRecord.providerBill.payableAmount, 540);
  assert.equal(result.caseRecord.providerBill.commissionRate, 8);
});


test('Admin cannot offer a Provider the case until scope has been confirmed', () => {
  const result = applyWorkflowAction(baseCase({ status: 'inspection_reported' }), {
    role: 'admin', action: 'offer_provider', payload: { providerId: 'demo-provider' }, at: '2026-10-16T10:00:00.000Z',
  });
  assert.equal(result.error.code, 'SCOPE_NOT_CONFIRMED');
  assert.equal(result.caseRecord.status, 'inspection_reported');
});

test('Admin cannot send a Provider offer without a selected Provider', () => {
  const result = applyWorkflowAction(baseCase({ status: 'scope_confirmed', assignedProviderId: '' }), {
    role: 'admin', action: 'offer_provider', payload: { providerId: '  ' }, at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error.code, 'PROVIDER_REQUIRED');
  assert.equal(result.caseRecord.status, 'scope_confirmed');
  assert.equal(result.caseRecord.assignedProviderId, '');
});

test('Inspector cannot initiate payment or bill approval', () => {
  const record = baseCase({
    status: 'refund_pending',
    clientSatisfied: true,
    paymentStatus: 'confirmed',
    refundRequest: { status: 'pending', reason: 'Service issue' },
  });
  const result = applyWorkflowAction(record, {
    role: 'inspector', action: 'initiate_payment', payload: { clientSatisfied: true }, at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error.code, 'ROLE_NOT_ALLOWED');
  assert.equal(result.caseRecord.status, 'refund_pending');
});

test('Admin cannot reassign an active or completed case', () => {
  for (const status of ['work_in_progress', 'completed']) {
    const record = baseCase({ status });
    const result = applyWorkflowAction(record, {
      role: 'admin', action: 'assign_inspector', payload: { inspectorId: 'another-inspector' }, at: '2026-10-16T10:00:00.000Z',
    });

    assert.equal(result.error.code, 'INSPECTOR_ASSIGNMENT_NOT_AVAILABLE');
    assert.equal(result.caseRecord.status, status);
    assert.equal(result.caseRecord.assignedInspectorId, 'demo-inspector');
  }
});

test('Admin cannot assign an Inspector while Client information is still outstanding', () => {
  const record = baseCase({ status: 'needs_information', assignedInspectorId: '' });
  const result = applyWorkflowAction(record, {
    role: 'admin', action: 'assign_inspector', payload: { inspectorId: 'demo-inspector' }, at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(result.error.code, 'INSPECTOR_ASSIGNMENT_NOT_AVAILABLE');
  assert.equal(result.caseRecord.status, 'needs_information');
  assert.equal(result.caseRecord.assignedInspectorId, '');
});

test('Admin cannot request information on a paid, completed, or cancelled case', () => {
  for (const status of ['paid', 'completed', 'cancelled']) {
    const result = applyWorkflowAction(baseCase({ status }), {
      role: 'admin', action: 'request_information', payload: { message: 'Please clarify.' }, at: '2026-10-16T10:00:00.000Z',
    });

    assert.equal(result.error.code, 'INFORMATION_REQUEST_NOT_AVAILABLE');
    assert.equal(result.caseRecord.status, status);
  }
});

test('Admin workflow assignments require a selectable preview account', () => {
  const assignBlank = applyWorkflowAction(baseCase({ status: 'submitted' }), {
    role: 'admin', action: 'assign_inspector', payload: { inspectorId: '  ' }, at: '2026-10-16T10:00:00.000Z',
  });
  const assignUnknown = applyWorkflowAction(baseCase({ status: 'submitted' }), {
    role: 'admin', action: 'assign_inspector', payload: { inspectorId: 'unknown-inspector' }, at: '2026-10-16T10:00:00.000Z',
  });
  const request = applyWorkflowAction(baseCase({ status: 'submitted' }), {
    role: 'admin', action: 'request_information', payload: { message: '  ' }, at: '2026-10-16T10:00:00.000Z',
  });

  assert.equal(assignBlank.error.code, 'INSPECTOR_REQUIRED');
  assert.equal(assignUnknown.error.code, 'INSPECTOR_NOT_AVAILABLE');
  assert.equal(request.error.code, 'INFORMATION_REQUEST_REQUIRED');
});

test('workflow transition accepts a selected Provider ID; roster eligibility is checked by the service boundary', () => {
  const result = applyWorkflowAction(baseCase({ status: 'scope_confirmed', assignedProviderId: '' }), {
    role: 'admin', action: 'offer_provider', payload: { providerId: 'unknown-provider' }, at: '2026-10-16T10:00:00.000Z',
  });
  assert.equal(result.error, null);
  assert.equal(result.caseRecord.assignedProviderId, 'unknown-provider');
});
