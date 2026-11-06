import test from 'node:test';
import assert from 'node:assert/strict';
import { isCurrentVerifiedCredential, rankCredentialMatch, projectClientCredential, normalizeCredentialForSave } from '../../src/utils/catalog/credentialRules.js';

const verified = { credentialTypeId: 'ctvet-proficiency-ii', serviceId: 'electrical', verificationStatus: 'verified', expiresAt: null, documentObjectKey: 'private/doc.pdf', certificateNumber: 'SECRET', issuer: 'CTVET' };

test('only an active verified credential linked to the requested service is a match', () => {
  assert.equal(isCurrentVerifiedCredential(verified, 'electrical'), true);
  assert.equal(isCurrentVerifiedCredential({ ...verified, expiresAt: '2020-01-01' }, 'electrical'), false);
  assert.equal(isCurrentVerifiedCredential({ ...verified, verificationStatus: 'document_uploaded' }, 'electrical'), false);
  assert.equal(isCurrentVerifiedCredential(verified, 'plumbing'), false);
});

test('credential preference ranks matching suitable candidates but never filters non-matches', () => {
  const people = [{ id: 'plain', credentials: [] }, { id: 'match', credentials: [verified] }];
  assert.deepEqual(rankCredentialMatch(people, 'electrical', true).map(person => person.id), ['match', 'plain']);
  assert.deepEqual(rankCredentialMatch(people, 'electrical', false).map(person => person.id), ['plain', 'match']);
  assert.equal(rankCredentialMatch([{ id: 'plain', credentials: [] }], 'electrical', true).length, 1);
});

test('client credential projection reveals only the relevant verified title and badge', () => {
  assert.deepEqual(projectClientCredential(verified, 'electrical'), { title: 'CTVET National Proficiency II', badge: 'Verified by LUCID' });
  assert.equal(projectClientCredential({ ...verified, serviceId: 'plumbing' }, 'electrical'), null);
});

test('credential form strings are normalized into an API-ready optional record', () => {
  assert.deepEqual(normalizeCredentialForSave({ id: 'c1', credentialTypeId: 'nvti-trade-test', serviceId: 'electrical', issuer: ' NVTI ', level: ' Grade as printed ', issuedYear: '2022', certificateNumber: ' 123 ', verificationStatus: 'self_declared' }), {
    id: 'c1', credentialTypeId: 'nvti-trade-test', otherTypeLabel: null, serviceId: 'electrical', issuer: 'NVTI', level: 'Grade as printed', certificateNumber: '123', issuedYear: 2022, expiresAt: null, evidenceObjectKey: null,
  });
  assert.equal(normalizeCredentialForSave({ id: 'c2' }).credentialTypeId, null);
  assert.equal('verificationStatus' in normalizeCredentialForSave({ id: 'c3', verificationStatus: 'verified' }), false);
});
