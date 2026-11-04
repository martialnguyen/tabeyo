import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScoutRule, notifyNewFinds } from './ipadScout.js';

test('normalizes a valid buying rule', () => {
  assert.deepEqual(normalizeScoutRule({ model: ' iPad mini 6 ', maxPriceJpy: 25000, avoidDefects: 'iCloud lock', active: false }), {
    model: 'iPad mini 6', query: 'iPad mini 6', avoidDefects: 'iCloud lock', maxPriceJpy: 25000, active: false
  });
});

test('rejects an invalid price or missing model', () => {
  assert.throws(() => normalizeScoutRule({ model: 'iPad', maxPriceJpy: -1 }));
  assert.throws(() => normalizeScoutRule({ model: '', maxPriceJpy: 20000 }));
});

test('sends scout alerts only to the dedicated webhook', async () => {
  const previousOrder = process.env.DISCORD_WEBHOOK_URL;
  const previousScout = process.env.DISCORD_SCOUT_WEBHOOK_URL;
  const previousFetch = globalThis.fetch;
  const requests = [];
  try {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.example/orders';
    process.env.DISCORD_SCOUT_WEBHOOK_URL = 'https://discord.example/scout';
    globalThis.fetch = async (url, options) => { requests.push({ url, payload: JSON.parse(options.body) }); return { ok: true }; };
    const finding = { title: 'iPad Air 3', url: 'https://example.com/item/1', priceJpy: 15000, model: 'iPad Air 3', status: 'needs_review' };
    assert.deepEqual(await notifyNewFinds([finding]), { configured: true, sent: 1, errors: [] });
    delete process.env.DISCORD_SCOUT_WEBHOOK_URL;
    assert.deepEqual(await notifyNewFinds([finding]), { configured: false, sent: 0, errors: [] });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://discord.example/scout');
    assert.equal(requests[0].payload.embeds[0].url, finding.url);
    assert.match(requests[0].payload.embeds[0].description, /Tin gốc: https:\/\/example\.com\/item\/1/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrder === undefined) delete process.env.DISCORD_WEBHOOK_URL;
    else process.env.DISCORD_WEBHOOK_URL = previousOrder;
    if (previousScout === undefined) delete process.env.DISCORD_SCOUT_WEBHOOK_URL;
    else process.env.DISCORD_SCOUT_WEBHOOK_URL = previousScout;
  }
});
