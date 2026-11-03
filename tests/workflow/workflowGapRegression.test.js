// @backend-handoff-delete Tests for the local mock adapter; replace with backend service tests during integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockWorkflowService } from '../../src/dev/workflow-mock/service.js';
import { createWorkflowPreviewSeed } from '../../src/dev/workflow-mock/seed.js';

const makeStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
const makeService = () => createMockWorkflowService({ storage: makeStorage(), seedData: createWorkflowPreviewSeed(), clock: () => '2026-11-02T12:00:00.000Z' });
const admin = { role: 'admin', userId: 'demo-admin' };
const client = { role: 'client', userId: 'demo-client' };

test('Admin can reassign a request from an Inspector who has been suspended, preserving history and notifying participants', async () => {
  const service = makeService();
  const suspension = await service.operations.applyAccountPolicy({ subjectId: 'demo-inspector', subjectRole: 'inspector', policyCategory: 'Safety concern', facts: 'QA test suspension', policyReference: 'QA-1', action: 'suspend' }, admin);
  assert.equal(suspension.error, null);

  const candidates = await service.assignments.searchEligible({ caseId: 'LUCID-DEMO-1044', ...admin });
  assert.ok(candidates.data.some(item => item.id === 'demo-inspector-kumasi'));
  assert.ok(!candidates.data.some(item => item.id === 'demo-inspector'));
  const result = await service.cases.apply('LUCID-DEMO-1044', { ...admin, action: 'assign_inspector', payload: { inspectorId: 'demo-inspector-kumasi', overrideReason: 'Outside the default radius', reassignmentReason: 'Assigned Inspector suspended' } });
  assert.equal(result.error, null);
  assert.equal(result.data.assignedInspectorId, 'demo-inspector-kumasi');
  assert.equal(result.data.history.at(-1).details.previousInspectorId, 'demo-inspector');
  const notices = await service.notifications.listForRole({ role: 'inspector', userId: 'demo-inspector' });
  assert.ok(notices.data.some(item => item.caseId === 'LUCID-DEMO-1044'));
  const originalNotices = await service.notifications.listForRole({ role: 'inspector', userId: 'demo-inspector' });
  assert.ok(originalNotices.data.some(item => item.caseId === 'LUCID-DEMO-1044' && item.message.includes('no longer assigned')));
});

test('Inspector profile surfaces the account restriction needed for appeal access', async () => {
  const service = makeService();
  await service.operations.applyAccountPolicy({ subjectId: 'demo-inspector', subjectRole: 'inspector', policyCategory: 'Safety concern', facts: 'QA test suspension', policyReference: 'QA-4', action: 'suspend' }, admin);
  const profile = await service.profiles.getForRole({ role: 'inspector', userId: 'demo-inspector' });
  assert.equal(profile.data.accountStatus, 'suspended');
});

test('one unpaid cancellation fee leaves other Client cases, messages, finance history, and new requests available', async () => {
  const service = makeService();
  const cases = await service.cases.listForRole(client);
  assert.ok(cases.data.some(item => item.id === 'LUCID-DEMO-1042'));
  assert.ok(cases.data.some(item => item.status === 'cancelled_fee_due'));
  const messages = await service.messages.listMessages('client-admin:LUCID-DEMO-1042', client);
  assert.equal(messages.error, null);
  const entries = await service.finance.listEntries(client);
  assert.ok(entries.data.some(item => item.role === 'client' && item.type === 'client_total'));
  assert.ok(entries.data.some(item => item.type === 'cancellation_fee_recovery' && item.status === 'due'));
  const created = await service.cases.create({ service: 'Plumbing', category: 'Home Repairs & Maintenance', scope: 'Fix a leak' }, client);
  assert.equal(created.error, null);
});

test('account holder can appeal a policy action and Admin reinstatement restores the account with an audit trail', async () => {
  const service = makeService();
  await service.operations.applyAccountPolicy({ subjectId: 'demo-provider', subjectRole: 'provider', policyCategory: 'Safety concern', facts: 'QA test suspension', policyReference: 'QA-2', action: 'suspend' }, admin);
  const appeal = await service.operations.submitAccountAppeal({ reason: 'I have provided updated safety documentation.' }, { role: 'provider', userId: 'demo-provider' });
  assert.equal(appeal.error, null);
  const pending = await service.operations.listAccountAppeals(admin);
  assert.equal(pending.data[0].status, 'pending');
  const decision = await service.operations.decideAccountAppeal(appeal.data.id, { decision: 'reinstate', reason: 'Review completed.' }, admin);
  assert.equal(decision.error, null);
  assert.equal(decision.data.status, 'reinstated');
  const profile = await service.profiles.getForRole({ role: 'provider', userId: 'demo-provider' });
  assert.equal(profile.data.accountStatus, 'active');
});

test('Admin can uphold a policy action after an appeal with a recorded explanation', async () => {
  const service = makeService();
  await service.operations.applyAccountPolicy({ subjectId: 'demo-client', subjectRole: 'client', policyCategory: 'Other', facts: 'QA test suspension', policyReference: 'QA-3', action: 'suspend' }, admin);
  const appeal = await service.operations.submitAccountAppeal({ reason: 'Please review this decision.' }, client);
  const decision = await service.operations.decideAccountAppeal(appeal.data.id, { decision: 'uphold', reason: 'The original policy decision remains in effect.' }, admin);
  assert.equal(decision.error, null);
  assert.equal(decision.data.status, 'upheld');
  const profile = await service.profiles.getForRole(client);
  assert.equal(profile.data.accountStatus, 'suspended');
});

test('Admin cannot assign a Provider absent from the eligible Preview roster', async () => {
  const service = makeService();
  const scope = await service.cases.apply('LUCID-DEMO-1045', { ...admin, action: 'confirm_scope', payload: { scope: 'Repair the unsafe outlet.' } });
  assert.equal(scope.error, null);
  const offer = await service.cases.apply('LUCID-DEMO-1045', { ...admin, action: 'offer_provider', payload: { providerId: 'provider-not-in-roster' } });
  assert.equal(offer.error.code, 'PROVIDER_NOT_ELIGIBLE');
  const record = await service.cases.get('LUCID-DEMO-1045', admin);
  assert.equal(record.data.status, 'scope_confirmed');
  assert.equal(record.data.assignedProviderId, '');
});
