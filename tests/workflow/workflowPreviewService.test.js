// @backend-handoff-delete Tests for the local mock adapter; replace with backend service tests during integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockWorkflowService } from '../../src/dev/workflow-mock/service.js';
import { createWorkflowPreviewSeed } from '../../src/dev/workflow-mock/seed.js';
import { WORKFLOW_PREVIEW_STORAGE_KEY } from '../../src/dev/workflow-mock/store.js';

const makeStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    raw: key => values.get(key),
  };
};

const createSeed = () => {
  const seed = createWorkflowPreviewSeed();
  return {
    ...seed,
    cases: [{ ...seed.cases.find(record => record.id === 'LUCID-DEMO-1046'), id: 'CASE-PREVIEW-1' }],
    messages: [{ id: 'MSG-1', caseId: 'CASE-PREVIEW-1', threadId: 'client-admin:CASE-PREVIEW-1', audience: 'client-admin', body: 'Request received', senderRole: 'admin', at: '2026-11-02T09:00:00.000Z' }],
    notifications: [], receipts: [], financeEntries: [],
  };
};

test('an empty preview store returns seed data and changes persist between service instances', async () => {
  const storage = makeStorage();
  const seedData = createSeed();
  const firstService = createMockWorkflowService({ storage, seedData, clock: () => '2026-10-16T10:00:00.000Z' });
  const initial = await firstService.cases.listForRole({ role: 'provider', userId: 'demo-provider' });

  assert.equal(initial.error, null);
  assert.equal(initial.data.length, 1);

  const accepted = await firstService.cases.apply('CASE-PREVIEW-1', {
    role: 'provider', userId: 'demo-provider', action: 'accept_offer', payload: {},
  });
  const secondService = createMockWorkflowService({ storage, seedData, clock: () => '2026-10-16T10:00:00.000Z' });
  const reloaded = await secondService.cases.get('CASE-PREVIEW-1', { role: 'provider', userId: 'demo-provider' });

  assert.equal(accepted.error, null);
  assert.equal(reloaded.data.status, 'accepted');
});

test('malformed preview data returns a recoverable error without deleting the stored value', async () => {
  const oldValue = '{not-json';
  const storage = makeStorage({ [WORKFLOW_PREVIEW_STORAGE_KEY]: oldValue });
  const service = createMockWorkflowService({ storage, seedData: createSeed() });
  const result = await service.cases.listForRole({ role: 'client', userId: 'existing-client-account' });

  assert.equal(result.error.code, 'PREVIEW_DATA_CORRUPT');
  assert.equal(storage.raw(WORKFLOW_PREVIEW_STORAGE_KEY), oldValue);
});

test('schema v8 preview data migrates to v9 without discarding saved cases', async () => {
  const seedData = createSeed();
  const oldData = { ...seedData, version: 8, cases: [
    { ...seedData.cases[0], status: 'work_in_progress' },
    { ...seedData.cases[0], id: 'CASE-ESTIMATE-OLD', status: 'work_estimate_pending', pendingWorkEstimate: { amount: 500 } },
    { ...seedData.cases[0], id: 'CASE-CHANGE-OLD', status: 'price_change_pending', pendingPriceChange: { amount: 100 } },
  ] };
  const storage = makeStorage({ 'lucid-workflow-preview-v8': JSON.stringify(oldData) });
  const service = createMockWorkflowService({ storage, seedData });
  const cases = await service.cases.listForRole({ role: 'provider', userId: 'demo-provider' });
  assert.equal(cases.error, null);
  assert.equal(cases.data.some(item => item.id === 'CASE-PREVIEW-1'), true);
  const migrated = JSON.parse(storage.raw(WORKFLOW_PREVIEW_STORAGE_KEY));
  assert.equal(migrated.version, 9);
  assert.equal(migrated.cases.find(item => item.id === 'CASE-ESTIMATE-OLD').status, 'accepted');
  assert.equal(migrated.cases.find(item => item.id === 'CASE-CHANGE-OLD').status, 'work_in_progress');
});

test('Client profile setup requires no payment preference and removes legacy preference data', async () => {
  const storage = makeStorage();
  const seedData = createSeed();
  seedData.clientProfiles[0].paymentPreference = 'Mobile money';
  const service = createMockWorkflowService({ storage, seedData, clock: () => '2026-11-03T11:00:00.000Z' });
  const saved = await service.profiles.updateAccountSetup({
    role: 'client', userId: 'demo-client',
    profile: { fullName: 'Lena Addo', phone: '0500000000', homeCity: 'Accra', region: 'Greater Accra' },
  });
  const raw = storage.raw(WORKFLOW_PREVIEW_STORAGE_KEY);

  assert.equal(saved.error, null);
  assert.equal(Object.hasOwn(saved.data, 'paymentPreference'), false);
  assert.equal(JSON.parse(raw).clientProfiles[0].paymentPreference, undefined);
});

test('existing Client payment preferences are removed when Preview data is read', async () => {
  const seedData = createSeed();
  const persisted = { ...seedData, clientProfiles: [{ ...seedData.clientProfiles[0], paymentPreference: 'Card' }] };
  const storage = makeStorage({ [WORKFLOW_PREVIEW_STORAGE_KEY]: JSON.stringify(persisted) });
  const service = createMockWorkflowService({ storage, seedData });
  const profile = await service.profiles.getForRole({ role: 'client', userId: 'demo-client' });

  assert.equal(profile.error, null);
  assert.equal(Object.hasOwn(profile.data, 'paymentPreference'), false);
  assert.equal(Object.hasOwn(JSON.parse(storage.raw(WORKFLOW_PREVIEW_STORAGE_KEY)).clientProfiles[0], 'paymentPreference'), false);
});

test('reset restores all seeded scenarios', async () => {
  const storage = makeStorage();
  const seedData = createSeed();
  seedData.cases.push({ ...seedData.cases[0], id: 'CASE-PREVIEW-2', status: 'completed' });
  const service = createMockWorkflowService({ storage, seedData });
  await service.cases.apply('CASE-PREVIEW-1', {
    role: 'provider', userId: 'demo-provider', action: 'accept_offer', payload: {},
  });
  const reset = await service.reset();

  assert.equal(reset.error, null);
  assert.deepEqual(reset.data.cases.map(record => record.status), ['offer_sent', 'completed']);
});

test('wrong role cannot mutate a case or send into a private thread', async () => {
  const storage = makeStorage();
  const service = createMockWorkflowService({ storage, seedData: createSeed() });
  const deniedAction = await service.cases.apply('CASE-PREVIEW-1', {
    role: 'client', userId: 'demo-client', action: 'accept_offer', payload: {},
  });
  const deniedMessage = await service.messages.sendMessage('client-admin', {
    role: 'provider', userId: 'demo-provider', body: 'Private client message',
  });
  const clientCase = await service.cases.get('CASE-PREVIEW-1', { role: 'client', userId: 'demo-client' });
  const messages = await service.messages.listMessages('client-admin:CASE-PREVIEW-1', { role: 'client', userId: 'demo-client' });

  assert.equal(deniedAction.error.code, 'ROLE_NOT_ALLOWED');
  assert.equal(deniedMessage.error.code, 'NOT_AUTHORIZED');
  assert.equal(clientCase.data.status, 'offer_sent');
  assert.equal(messages.data.length, 1);
});

test('a different Client account cannot view or approve another Client case', async () => {
  const seedData = createSeed();
  seedData.cases[0] = { ...seedData.cases[0], status: 'inspector_bypass_pending', inspectorBypassRequest: { requestedAt: '2026-11-03T10:00:00.000Z', requestRevision: 1 } };
  const service = createMockWorkflowService({ storage: makeStorage(), seedData });
  const view = await service.cases.get('CASE-PREVIEW-1', { role: 'client', userId: 'another-client' });
  const approve = await service.cases.apply('CASE-PREVIEW-1', { role: 'client', userId: 'another-client', action: 'approve_inspector_bypass' });
  assert.equal(view.error.code, 'NOT_AUTHORIZED');
  assert.equal(approve.error.code, 'NOT_AUTHORIZED');
});

test('client can submit a simulated request that appears in the shared case list', async () => {
  const storage = makeStorage();
  const service = createMockWorkflowService({ storage, seedData: createSeed(), clock: () => '2026-10-16T11:00:00.000Z' });
  const created = await service.cases.create({ service: 'Plumbing', category: 'Repairs', scope: 'Fix a leaking tap', clientRange: { min: 100, max: 250, currency: 'GHS' } }, { role: 'client', userId: 'demo-client' });
  const listed = await service.cases.listForRole({ role: 'client', userId: 'demo-client' });
  assert.equal(created.error, null);
  assert.equal(listed.data.some(item => item.id === created.data.id), true);
  assert.equal(created.data.status, 'submitted');
});

test('Admin may request one Client bypass consent when no Inspector is eligible, then assign Provider immediately after approval', async () => {
  const seedData = createSeed();
  seedData.cases = [{ ...seedData.cases[0], status: 'submitted', assignedInspectorId: '', inspectorAssignment: null, inspection: null }];
  seedData.inspectors = seedData.inspectors.map(item => ({ ...item, active: false }));
  const service = createMockWorkflowService({ storage: makeStorage(), seedData, clock: () => '2026-11-03T10:00:00.000Z' });
  const requested = await service.cases.apply('CASE-PREVIEW-1', { role: 'admin', userId: 'demo-admin', action: 'request_inspector_bypass', payload: { reason: 'No qualified Inspector is available.' } });
  const clientNotices = await service.notifications.listForRole({ role: 'client', userId: 'demo-client' });
  const approved = await service.cases.apply('CASE-PREVIEW-1', { role: 'client', userId: 'demo-client', action: 'approve_inspector_bypass' });
  const candidates = await service.assignments.searchProviderCandidates({ caseId: 'CASE-PREVIEW-1', role: 'admin', userId: 'demo-admin' });
  const offered = await service.cases.apply('CASE-PREVIEW-1', { role: 'admin', userId: 'demo-admin', action: 'offer_provider', payload: { providerId: 'demo-provider' } });

  assert.equal(requested.error, null);
  assert.equal(requested.data.status, 'inspector_bypass_pending');
  assert.equal(clientNotices.data.some(item => item.message.includes('approval to continue without an Inspector')), true);
  assert.equal(approved.data.status, 'inspector_bypass_approved');
  assert.equal(candidates.error, null);
  assert.equal(candidates.data.some(item => item.id === 'demo-provider'), true);
  assert.equal(offered.data.status, 'offer_sent');
});

test('Admin cannot request Inspector bypass while an eligible Inspector or usable report exists', async () => {
  const seedData = createSeed();
  seedData.cases = [{ ...seedData.cases[0], status: 'submitted', assignedInspectorId: '', inspection: null }];
  const service = createMockWorkflowService({ storage: makeStorage(), seedData });
  const available = await service.cases.apply('CASE-PREVIEW-1', { role: 'admin', userId: 'demo-admin', action: 'request_inspector_bypass' });
  assert.equal(available.error.code, 'INSPECTOR_AVAILABLE');

  seedData.cases[0] = { ...seedData.cases[0], inspection: { findings: 'Assessment available', submittedAt: '2026-11-02T10:00:00.000Z' } };
  const withReport = createMockWorkflowService({ storage: makeStorage(), seedData });
  const reportResult = await withReport.cases.apply('CASE-PREVIEW-1', { role: 'admin', userId: 'demo-admin', action: 'request_inspector_bypass' });
  assert.equal(reportResult.error.code, 'INSPECTION_ALREADY_RECORDED');
});

test('Provider can finish, bill, revise, and receive payment without Inspector sign-off or a Client review', async () => {
  const service = createMockWorkflowService({ storage: makeStorage(), seedData: createSeed(), clock: () => '2026-11-03T12:00:00.000Z' });
  const act = (role, userId, action, payload = {}) => service.cases.apply('CASE-PREVIEW-1', { role, userId, action, payload });
  assert.equal((await act('provider', 'demo-provider', 'accept_offer')).error, null);
  assert.equal((await act('provider', 'demo-provider', 'start_work')).error, null);
  assert.equal((await act('provider', 'demo-provider', 'complete_work')).error, null);
  assert.equal((await act('provider', 'demo-provider', 'submit_bill', { amount: 500, note: 'Completed the outlet repair.' })).error, null);
  assert.equal((await act('client', 'demo-client', 'reject_bill')).error, null);
  assert.equal((await act('provider', 'demo-provider', 'submit_bill', { amount: 480 })).error, null);
  assert.equal((await act('client', 'demo-client', 'approve_bill')).error, null);
  assert.equal((await service.finance.simulatePayment('CASE-PREVIEW-1', { role: 'client', userId: 'demo-client', outcome: 'confirmed' })).error, null);
  const completed = await service.cases.get('CASE-PREVIEW-1', { role: 'client', userId: 'demo-client' });
  const clientNotices = await service.notifications.listForRole({ role: 'client', userId: 'demo-client' });
  assert.equal(completed.data.status, 'completed');
  assert.equal(completed.data.review, null);
  assert.equal(clientNotices.data.some(item => item.body.includes('final bill')), true);
});

test('message quotes retain the referenced excerpt and timed edits preserve the original', async () => {
  const storage = makeStorage();
  const service = createMockWorkflowService({ storage, seedData: createSeed(), clock: () => new Date().toISOString() });
  const sent = await service.messages.sendMessage('client-admin:CASE-PREVIEW-1', { role: 'client', userId: 'demo-client', body: 'The wall outlet is sparking.' });
  const reply = await service.messages.sendMessage('client-admin:CASE-PREVIEW-1', { role: 'client', userId: 'demo-client', body: 'It is near the kitchen sink.', replyToId: sent.data.id });
  const edited = await service.messages.editMessage(sent.data.id, { role: 'client', userId: 'demo-client', body: 'The kitchen wall outlet is sparking.' });
  assert.equal(reply.data.replyTo.excerpt, 'The wall outlet is sparking.');
  assert.equal(edited.error, null);
  assert.equal(edited.data.editHistory[0].body, 'The wall outlet is sparking.');
  const tooLate = await service.messages.editMessage('MSG-1', { role: 'admin', userId: 'demo-admin', body: 'Updated earlier note.' });
  assert.equal(tooLate.error.code, 'MESSAGE_EDIT_WINDOW_CLOSED');
});

test('Preview messages retain replayable voice-note audio within the local size limit', async () => {
  const storage = makeStorage();
  const service = createMockWorkflowService({ storage, seedData: createSeed(), clock: () => new Date().toISOString() });
  const audioDataUrl = 'data:audio/webm;base64,YWJj';
  const sent = await service.messages.sendMessage('client-admin:CASE-PREVIEW-1', {
    role: 'client', userId: 'demo-client', body: '',
    attachment: { name: 'Voice note', type: 'audio/webm', size: 3, dataUrl: audioDataUrl },
  });
  const messages = await service.messages.listMessages('client-admin:CASE-PREVIEW-1', { role: 'client', userId: 'demo-client' });
  const oversized = await service.messages.sendMessage('client-admin:CASE-PREVIEW-1', {
    role: 'client', userId: 'demo-client', body: '',
    attachment: { name: 'Voice note', type: 'audio/webm', size: 1024 * 1024 + 1, dataUrl: `data:audio/webm;base64,${'A'.repeat(1_500_000)}` },
  });

  assert.equal(sent.error, null);
  assert.equal(sent.data.attachment.dataUrl, audioDataUrl);
  assert.equal(messages.data.find(message => message.id === sent.data.id).attachment.dataUrl, audioDataUrl);
  assert.equal(oversized.error.code, 'ATTACHMENT_TOO_LARGE');
});

test('Preview payout onboarding never stores raw bank or mobile-money details', async () => {
  const storage = makeStorage();
  const service = createMockWorkflowService({ storage, seedData: createSeed(), clock: () => '2026-10-16T11:00:00.000Z' });
  const saved = await service.finance.savePaymentMethod({ type: 'mobile-money', bankCode: 'MTN', name: 'MTN Mobile Money', number: '0240000000', isPrimary: true }, { role: 'provider', userId: 'demo-provider' });
  const raw = storage.raw(WORKFLOW_PREVIEW_STORAGE_KEY);
  const denied = await service.finance.listPaymentMethods({ role: 'client', userId: 'demo-client' });

  assert.equal(saved.error.code, 'GATEWAY_ONBOARDING_REQUIRED');
  assert.equal(String(raw || '').includes('0240000000'), false);
  assert.equal(denied.error.code, 'ROLE_NOT_ALLOWED');
});

test('Preview does not simulate a withdrawal to an unverified payout destination', async () => {
  const seedData = createSeed();
  seedData.financeEntries = [{ id: 'payout-1', role: 'provider', type: 'provider_payout', amount: 120, status: 'released', caseId: 'CASE-PREVIEW-1', at: '2026-10-16T09:00:00.000Z' }];
  seedData.paymentMethods = [{ id: 'method-1', role: 'provider', type: 'mobile-money', name: 'MTN Mobile Money', number: '0240000000', isPrimary: true }];
  const service = createMockWorkflowService({ storage: makeStorage(), seedData, clock: () => '2026-10-16T11:00:00.000Z' });
  const result = await service.finance.requestWithdrawal(80, 'method-1', { role: 'provider', userId: 'demo-provider' });
  assert.equal(result.error.code, 'GATEWAY_ONBOARDING_REQUIRED');
});
