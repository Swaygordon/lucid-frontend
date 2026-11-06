import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLaunchServiceRequest, getHistoricalServiceLabel } from '../../src/data/catalog/launchServices.js';

test('active services allow optional best-effort credential preference', () => {
  assert.deepEqual(validateLaunchServiceRequest({ serviceId: 'plumbing' }), { valid: true, constructionWorkTypeId: null, preferVerifiedCredential: false });
  assert.equal(validateLaunchServiceRequest({ serviceId: 'electrical', preferVerifiedCredential: true }).preferVerifiedCredential, true);
});

test('construction requests require a current construction work type', () => {
  assert.equal(validateLaunchServiceRequest({ serviceId: 'construction-worker' }).valid, false);
  assert.equal(validateLaunchServiceRequest({ serviceId: 'construction-worker', constructionWorkTypeId: 'roofing' }).valid, true);
  assert.equal(validateLaunchServiceRequest({ serviceId: 'construction-worker', constructionWorkTypeId: 'retired-service' }).valid, false);
  assert.equal(validateLaunchServiceRequest({ serviceId: 'plumbing', constructionWorkTypeId: 'roofing' }).constructionWorkTypeId, null);
  assert.equal(validateLaunchServiceRequest({ serviceId: 'moving' }).valid, false);
});

test('historical service labels are retained when current catalog no longer contains the service', () => {
  assert.equal(getHistoricalServiceLabel({ serviceNameSnapshot: 'Furniture Moving' }), 'Furniture Moving');
  assert.equal(getHistoricalServiceLabel({ serviceId: 'unknown-retired' }), 'Unknown service');
});
