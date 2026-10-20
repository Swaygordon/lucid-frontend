import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeProviderEarnings, toProviderTransactions } from '../../src/dev/workflowFinancePresentation.js';

test('empty earnings are finite zeros and produce no NaN chart values', () => {
  const summary = summarizeProviderEarnings([], new Date('2026-10-17T12:00:00.000Z'));
  assert.equal(summary.thisWeek, 0);
  assert.equal(summary.available, 0);
  assert.equal(Number.isFinite(summary.monthlyData.reduce((sum, item) => sum + item.earnings, 0) / summary.monthlyData.length), true);
});

test('provider earnings presentation filters other roles and maps payout statuses', () => {
  const entries = [
    { id: 'paid', role: 'provider', type: 'provider_payout', amount: 250, status: 'released', at: '2026-10-17T11:00:00.000Z' },
    { id: 'pending', role: 'provider', type: 'provider_payout', amount: 75, status: 'not_released', at: '2026-10-17T10:00:00.000Z' },
    { id: 'client', role: 'client', type: 'client_total', amount: 300, status: 'confirmed', at: '2026-10-17T10:00:00.000Z' },
  ];
  const transactions = toProviderTransactions(entries);
  const summary = summarizeProviderEarnings(entries, new Date('2026-10-17T12:00:00.000Z'));
  assert.deepEqual(transactions.map(item => item.status), ['completed', 'pending']);
  assert.equal(summary.thisWeek, 250);
  assert.equal(summary.pending, 75);
  assert.equal(summary.available, 250);
});
