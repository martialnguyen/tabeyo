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

function fakeCollection() {
  const stored = new Map();
  const collection = {
    doc(id) { return { id }; },
    firestore: {
      async runTransaction(callback) {
        const writes = [];
        const result = await callback({
          async get(ref) {
            return { exists: stored.has(ref.id), data: () => stored.get(ref.id) };
          },
          create(ref, value) { writes.push(() => stored.set(ref.id, value)); },
          update(ref, value) { writes.push(() => stored.set(ref.id, { ...stored.get(ref.id), ...value })); }
        });
        for (const write of writes) write();
        return result;
      }
    }
  };
  return { collection, stored };
}

test('creates and notifies once when a listing is submitted twice', async () => {
  const { collection } = fakeCollection();
  const notifications = [];
  const notify = async (items) => {
    notifications.push(items);
    return { configured: true, sent: items.length, errors: [] };
  };
  const first = await insertScoutFindings([normalizeScoutFinding(listing)], collection, notify);
  const second = await insertScoutFindings([normalizeScoutFinding({ ...listing, url: 'https://item.rakuten.co.jp/shop/ipad-1/' })], collection, notify);
  assert.equal(first.created.length, 1);
  assert.equal(first.notification.sent, 1);
  assert.equal(second.created.length, 0);
  assert.equal(second.updated.length, 0);
  assert.equal(second.duplicates, 1);
  assert.deepEqual(notifications.map((items) => items.length), [1, 0]);
});

test('updates a saved listing after a price cut, preserves admin state, and notifies again', async () => {
  const { collection, stored } = fakeCollection();
  const notifications = [];
  const notify = async (items) => { notifications.push(items); return { sent: items.length }; };
  const first = normalizeScoutFinding({ ...listing, configuration: '64GB Wi-Fi', defects: 'No visible defects' });
  await insertScoutFindings([first], collection, notify);
  const id = scoutResultId(listing.url);
  stored.set(id, { ...stored.get(id), status: 'saved', ruleId: 'rule-1' });

  const change = normalizeScoutFinding({ ...listing, priceJpy: 12000, title: 'iPad Air 3 64GB - sale', configuration: '64GB Wi-Fi, blue' });
  const result = await insertScoutFindings([change], collection, notify);
  assert.equal(result.created.length, 0);
  assert.equal(result.updated.length, 1);
  assert.equal(result.duplicates, 0);
  assert.equal(result.notification.sent, 1);
  assert.equal(stored.get(id).priceJpy, 12000);
  assert.equal(stored.get(id).configuration, '64GB Wi-Fi, blue');
  assert.equal(stored.get(id).defects, 'No visible defects');
  assert.equal(stored.get(id).status, 'saved');
  assert.equal(stored.get(id).ruleId, 'rule-1');
  assert.equal(stored.get(id).foundAt, first.foundAt);
  assert.ok(stored.get(id).updatedAt instanceof Date);
  assert.equal(notifications[1][0].previousPriceJpy, 15000);
  assert.equal(notifications[1][0].changeType, 'updated');

  const again = await insertScoutFindings([change], collection, notify);
  assert.equal(again.duplicates, 1);
  assert.equal(notifications[2].length, 0);
});

test('updates details without a price change and supports explicitly clearing an optional field', async () => {
  const { collection, stored } = fakeCollection();
  const notify = async (items) => ({ sent: items.length });
  await insertScoutFindings([normalizeScoutFinding({ ...listing, defects: 'scratched' })], collection, notify);
  const result = await insertScoutFindings([normalizeScoutFinding({ ...listing, defects: '', reason: 'New description' })], collection, notify);
  assert.equal(result.updated.length, 1);
  assert.equal(stored.get(scoutResultId(listing.url)).defects, '');
  assert.equal(stored.get(scoutResultId(listing.url)).reason, 'New description');
});

test('notifies already-created findings when a later write fails', async () => {
  const { collection } = fakeCollection();
  let calls = 0;
  let notified = 0;
  const runTransaction = collection.firestore.runTransaction;
  collection.firestore.runTransaction = (...args) => {
    if (++calls === 2) throw new Error('Firestore unavailable');
    return runTransaction(...args);
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
