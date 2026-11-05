import { createHash } from 'node:crypto';

const QUERYLESS_HOSTS = new Set([
  'item.rakuten.co.jp',
  'paypayfleamarket.yahoo.co.jp',
  'jp.mercari.com',
  'store.shopping.yahoo.co.jp'
]);
const FINDING_FIELDS = ['source', 'model', 'title', 'configuration', 'defects', 'reason', 'priceJpy', 'imageUrl'];

export function canonicalizeScoutUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Link tin đăng không hợp lệ.');
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('Link tin đăng không hợp lệ.'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error('Link tin đăng phải là HTTPS công khai.');
  }
  url.hash = '';
  if (QUERYLESS_HOSTS.has(url.hostname)) url.search = '';
  else {
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$|source$)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
  }
  if (url.hostname === 'item.rakuten.co.jp' && !url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

export function scoutResultId(url) {
  return createHash('sha256').update(canonicalizeScoutUrl(url)).digest('hex');
}

function textField(value, label, maxLength, required = false) {
  if (value == null && !required) return '';
  if (typeof value !== 'string') throw new Error(`${label} không hợp lệ.`);
  const text = value.trim();
  if ((required && !text) || text.length > maxLength) throw new Error(`${label} không hợp lệ.`);
  return text;
}

export function normalizeScoutFinding(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Tin đăng không hợp lệ.');
  const url = canonicalizeScoutUrl(input.url);
  const priceJpy = Number(input.priceJpy);
  if (!Number.isInteger(priceJpy) || priceJpy <= 0 || priceJpy > 10000000) {
    throw new Error('Giá JPY phải là số nguyên từ 1 đến 10.000.000.');
  }
  const optional = {};
  for (const [key, label, maxLength] of [
    ['configuration', 'Cấu hình', 300],
    ['defects', 'Lỗi / lưu ý', 300],
    ['reason', 'Lý do', 400],
    ['imageUrl', 'Link ảnh', 2048]
  ]) {
    if (Object.hasOwn(input, key)) optional[key] = textField(input[key], label, maxLength);
  }
  if (optional.imageUrl) canonicalizeScoutUrl(optional.imageUrl);
  return {
    source: textField(input.source, 'Nguồn tin', 80, true),
    model: textField(input.model, 'Tên máy cần tìm', 120, true),
    title: textField(input.title, 'Tên tin đăng', 240, true),
    ...optional, priceJpy, url,
    status: 'needs_review',
    origin: 'external',
    foundAt: new Date()
  };
}

export async function insertScoutFindings(items, resultsCollection, notify) {
  const created = [];
  const updated = [];
  let duplicates = 0;
  let writeError;
  for (const item of items) {
    const id = scoutResultId(item.url);
    const ref = resultsCollection.doc(id);
    try {
      const outcome = await resultsCollection.firestore.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) {
          tx.create(ref, item);
          return { kind: 'created', finding: { _id: id, ...item } };
        }
        const previous = snapshot.data();
        const changes = Object.fromEntries(FINDING_FIELDS
          .filter((field) => item[field] !== undefined && item[field] !== previous[field])
          .map((field) => [field, item[field]]));
        if (!Object.keys(changes).length) return { kind: 'duplicate' };
        tx.update(ref, { ...changes, updatedAt: new Date() });
        return {
          kind: 'updated',
          finding: { _id: id, ...previous, ...changes, changeType: 'updated', previousPriceJpy: previous.priceJpy }
        };
      });
      if (outcome.kind === 'created') created.push(outcome.finding);
      else if (outcome.kind === 'updated') updated.push(outcome.finding);
      else duplicates++;
    } catch (error) {
      writeError = error;
      break;
    }
  }
  const notification = await notify([...created, ...updated]);
  if (writeError) throw writeError;
  return { created, updated, duplicates, notification };
}
