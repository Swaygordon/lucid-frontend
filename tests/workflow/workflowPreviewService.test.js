import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewWorkflowService } from '../../src/dev/workflowPreviewService.js';

const makeStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    raw: key => values.get(key),
  };
};

const createSeed = () => ({
  version: 3,
  cases: [{
    id: 'CASE-PREVIEW-1', status: 'offer_sent', clientRoleId: 'demo-client',
    assignedInspectorId: 'demo-inspector', assignedProviderId: 'demo-provider',
    providerAcceptedAt: null, pendingPriceChange: null, providerBill: null,
    clientSatisfied: false, paymentStatus: 'unpaid', providerPayoutStatus: 'not_released',
    history: [],
  }],
  messages: [{ id: 'MSG-1', caseId: 'CASE-PREVIEW-1', threadId: 'client-admin', audience: 'client-admin', body: 'Request received', senderRole: 'admin', at: '2026-10-16T09:00:00.000Z' }],
  notifications: [],
  financeEntries: [],
});

test('an empty preview store returns seed data and changes persist between service instances', async () => {
  const storage = makeStorage();
  const seedData = createSeed();
  const firstService = createPreviewWorkflowService({ storage, seedData, clock: () => '2026-10-16T10:00:00.000Z' });
  const initial = await firstService.cases.listForRole({ role: 'provider', userId: 'existing-provider-account' });

  assert.equal(initial.error, null);
  assert.equal(initial.data.length, 1);

  const accepted = await firstService.cases.apply('CASE-PREVIEW-1', {
    role: 'provider', userId: 'existing-provider-account', action: 'accept_offer', payload: {},
  });
  const secondService = createPreviewWorkflowService({ storage, seedData, clock: () => '2026-10-16T10:00:00.000Z' });
  const reloaded = await secondService.cases.get('CASE-PREVIEW-1', { role: 'provider', userId: 'existing-provider-account' });

  assert.equal(accepted.error, null);
  assert.equal(reloaded.data.status, 'accepted');
});

test('malformed preview data returns a recoverable error without deleting the stored value', async () => {
  const oldValue = '{not-json';
  const storage = makeStorage({ 'lucid-workflow-preview-v3': oldValue });
  const service = createPreviewWorkflowService({ storage, seedData: createSeed() });
  const result = await service.cases.listForRole({ role: 'client', userId: 'existing-client-account' });

  assert.equal(result.error.code, 'PREVIEW_DATA_CORRUPT');
  assert.equal(storage.raw('lucid-workflow-preview-v3'), oldValue);
});

test('reset restores all seeded scenarios', async () => {
  const storage = makeStorage();
  const seedData = createSeed();
  seedData.cases.push({ ...seedData.cases[0], id: 'CASE-PREVIEW-2', status: 'completed' });
  const service = createPreviewWorkflowService({ storage, seedData });
  await service.cases.apply('CASE-PREVIEW-1', {
    role: 'provider', userId: 'existing-provider-account', action: 'accept_offer', payload: {},
  });
  const reset = await service.reset();

  assert.equal(reset.error, null);
  assert.deepEqual(reset.data.cases.map(record => record.status), ['offer_sent', 'completed']);
});

test('wrong role cannot mutate a case or send into a private thread', async () => {
  const storage = makeStorage();
  const service = createPreviewWorkflowService({ storage, seedData: createSeed() });
  const deniedAction = await service.cases.apply('CASE-PREVIEW-1', {
    role: 'client', userId: 'existing-client-account', action: 'accept_offer', payload: {},
  });
  const deniedMessage = await service.messages.sendMessage('client-admin', {
    role: 'provider', userId: 'existing-provider-account', body: 'Private client message',
  });
  const clientCase = await service.cases.get('CASE-PREVIEW-1', { role: 'client', userId: 'existing-client-account' });
  const messages = await service.messages.listMessages('client-admin', { role: 'client', userId: 'existing-client-account' });

  assert.equal(deniedAction.error.code, 'ROLE_NOT_ALLOWED');
  assert.equal(deniedMessage.error.code, 'NOT_AUTHORIZED');
  assert.equal(clientCase.data.status, 'offer_sent');
  assert.equal(messages.data.length, 1);
});

test('client can submit a simulated request that appears in the shared case list', async () => {
  const storage = makeStorage();
  const service = createPreviewWorkflowService({ storage, seedData: createSeed(), clock: () => '2026-10-16T11:00:00.000Z' });
  const created = await service.cases.create({ service: 'Plumbing', category: 'Repairs', scope: 'Fix a leaking tap', clientRange: { min: 100, max: 250, currency: 'GHS' } }, { role: 'client', userId: 'existing-client-account' });
  const listed = await service.cases.listForRole({ role: 'client', userId: 'existing-client-account' });
  assert.equal(created.error, null);
  assert.equal(listed.data.some(item => item.id === created.data.id), true);
  assert.equal(created.data.status, 'submitted');
});

test('Provider payout methods persist in Preview storage and remain role-scoped', async () => {
  const storage = makeStorage();
  const service = createPreviewWorkflowService({ storage, seedData: createSeed(), clock: () => '2026-10-16T11:00:00.000Z' });
  const saved = await service.finance.savePaymentMethod({ type: 'mobile-money', bankCode: 'MTN', name: 'MTN Mobile Money', number: '0240000000', isPrimary: true }, { role: 'provider', userId: 'existing-provider-account' });
  const secondService = createPreviewWorkflowService({ storage, seedData: createSeed() });
  const listed = await secondService.finance.listPaymentMethods({ role: 'provider', userId: 'existing-provider-account' });
  const denied = await service.finance.listPaymentMethods({ role: 'client', userId: 'existing-client-account' });

  assert.equal(saved.error, null);
  assert.equal(listed.data[0].number, '0240000000');
  assert.equal(denied.error.code, 'ROLE_NOT_ALLOWED');
});

test('Provider Preview withdrawal is a local ledger entry and cannot exceed available simulated funds', async () => {
  const seedData = createSeed();
  seedData.financeEntries = [{ id: 'payout-1', role: 'provider', type: 'provider_payout', amount: 120, status: 'released', caseId: 'CASE-PREVIEW-1', at: '2026-10-16T09:00:00.000Z' }];
  seedData.paymentMethods = [{ id: 'method-1', role: 'provider', type: 'mobile-money', name: 'MTN Mobile Money', number: '0240000000', isPrimary: true }];
  const service = createPreviewWorkflowService({ storage: makeStorage(), seedData, clock: () => '2026-10-16T11:00:00.000Z' });
  const denied = await service.finance.requestWithdrawal(150, 'method-1', { role: 'provider', userId: 'existing-provider-account' });
  const accepted = await service.finance.requestWithdrawal(80, 'method-1', { role: 'provider', userId: 'existing-provider-account' });
  const entries = await service.finance.listEntries({ role: 'provider', userId: 'existing-provider-account' });

  assert.equal(denied.error.code, 'INSUFFICIENT_PREVIEW_BALANCE');
  assert.equal(accepted.error, null);
  assert.equal(accepted.data.status, 'simulated');
  assert.equal(entries.data.some(entry => entry.type === 'provider_withdrawal' && entry.amount === -80), true);
});
