import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScoutRule } from './ipadScout.js';

test('normalizes a valid buying rule', () => {
  assert.deepEqual(normalizeScoutRule({ model: ' iPad mini 6 ', maxPriceJpy: 25000, avoidDefects: 'iCloud lock', active: false }), {
    model: 'iPad mini 6', query: 'iPad mini 6', avoidDefects: 'iCloud lock', maxPriceJpy: 25000, active: false
  });
});

test('rejects an invalid price or missing model', () => {
  assert.throws(() => normalizeScoutRule({ model: 'iPad', maxPriceJpy: -1 }));
  assert.throws(() => normalizeScoutRule({ model: '', maxPriceJpy: 20000 }));
});
