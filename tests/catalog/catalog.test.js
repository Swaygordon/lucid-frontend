import test from 'node:test';
import assert from 'node:assert/strict';
import { LAUNCH_CATEGORIES, CONSTRUCTION_WORK_TYPES, getLaunchService, resolveLaunchSearch } from '../../src/data/catalog/launchServices.js';

test('launch catalog contains exactly four approved categories and seven services', () => {
  assert.deepEqual(LAUNCH_CATEGORIES.map(({ slug }) => slug), ['home-repairs', 'auto-repairs', 'cleaning', 'construction']);
  assert.deepEqual(LAUNCH_CATEGORIES.flatMap(category => category.services.map(service => service.slug)), [
    'plumbing', 'electrical', 'carpentry', 'handyman', 'auto-mechanic', 'cleaner', 'construction-worker',
  ]);
});

test('each launch service has a distinct service-card icon', () => {
  const iconKeys = LAUNCH_CATEGORIES.flatMap(category => category.services.map(service => service.iconKey));
  assert.equal(iconKeys.length, 7);
  assert.equal(new Set(iconKeys).size, 7);
});

test('approved trade names resolve to their canonical launch service', () => {
  for (const [term, slug] of Object.entries({ plumber: 'plumbing', electrician: 'electrical', 'auto mechanic': 'auto-mechanic', cleaner: 'cleaner', carpenter: 'carpentry', 'construction worker': 'construction-worker', handyman: 'handyman' })) {
    assert.equal(resolveLaunchSearch(term)?.serviceSlug, slug, term);
  }
});

test('construction work types are limited to the Construction worker service', () => {
  assert.ok(CONSTRUCTION_WORK_TYPES.length > 0);
  assert.deepEqual(LAUNCH_CATEGORIES.flatMap(category => category.services.filter(service => service.workTypes?.length).map(service => service.slug)), ['construction-worker']);
  assert.equal(getLaunchService('construction', 'construction-worker')?.workTypes.length, CONSTRUCTION_WORK_TYPES.length);
});

test('retired offers do not resolve as active launch services', () => {
  for (const term of ['event planning', 'tutoring', 'moving', 'makeup', 'IT support', 'welding', 'vulcanizing']) {
    assert.equal(resolveLaunchSearch(term), null, term);
  }
});
