import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeScoutUrl, insertScoutFindings, normalizeScoutFinding, scoutResultId } from './scoutIngest.js';

const listing = {
  source: 'Rakuten', model: 'iPad Air 3', title: 'iPad Air 3 64GB',
  priceJpy: 15000, url: 'https://item.rakuten.co.jp/shop/ipad-1/?utm_source=search'
};

test('canonical URL produces the same ID for tracked and untracked links', () => {
  const canonical = 'https://item.rakuten.co.jp/shop/ipad-1/';
  assert.equal(canonicalizeScoutUrl(listing.url), canonical);
  assert.equal(scoutResultId(listing.url), scoutResultId(canonical));
  assert.equal(canonicalizeScoutUrl('https://example.com/item?id=7&utm_source=ad#details'), 'https://example.com/item?id=7');
});

test('validates externally supplied findings and marks them for review', () => {
  const item = normalizeScoutFinding(listing);
  assert.equal(item.status, 'needs_review');
  assert.equal(item.url, 'https://item.rakuten.co.jp/shop/ipad-1/');
  assert.throws(() => normalizeScoutFinding({ ...listing, priceJpy: -1 }));
  assert.throws(() => normalizeScoutFinding({ ...listing, url: 'http://example.com/item/1' }));
  assert.throws(() => normalizeScoutFinding({ ...listing, title: '' }));
});

test('creates and notifies once when a listing is submitted twice', async () => {
  const stored = new Set();
  const notifications = [];
  const collection = {
    doc(id) {
      return {
        async create() {
          if (stored.has(id)) throw Object.assign(new Error('Already exists'), { code: 6 });
          stored.add(id);
        }
      };
    }
  };
  const notify = async (items) => {
    notifications.push(items);
    return { configured: true, sent: items.length, errors: [] };
  };
  const first = await insertScoutFindings([normalizeScoutFinding(listing)], collection, notify);
  const second = await insertScoutFindings([normalizeScoutFinding({ ...listing, url: 'https://item.rakuten.co.jp/shop/ipad-1/' })], collection, notify);
  assert.equal(first.created.length, 1);
  assert.equal(first.notification.sent, 1);
  assert.equal(second.created.length, 0);
  assert.equal(second.duplicates, 1);
  assert.deepEqual(notifications.map((items) => items.length), [1, 0]);
});

test('notifies already-created findings when a later write fails', async () => {
  let calls = 0;
  let notified = 0;
  const collection = {
    doc() {
      return { async create() { if (++calls === 2) throw new Error('Firestore unavailable'); } };
    }
  };
  await assert.rejects(
    insertScoutFindings([normalizeScoutFinding(listing), normalizeScoutFinding({ ...listing, url: 'https://item.rakuten.co.jp/shop/ipad-2/' })], collection, async (items) => {
      notified = items.length;
      return { configured: true, sent: items.length, errors: [] };
    }),
    /Firestore unavailable/
  );
  assert.equal(notified, 1);
});
