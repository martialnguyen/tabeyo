import { createHash } from 'node:crypto';

const QUERYLESS_HOSTS = new Set([
  'item.rakuten.co.jp',
  'paypayfleamarket.yahoo.co.jp',
  'jp.mercari.com',
  'store.shopping.yahoo.co.jp'
]);

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
  const imageUrl = textField(input.imageUrl, 'Link ảnh', 2048);
  if (imageUrl) canonicalizeScoutUrl(imageUrl);
  return {
    source: textField(input.source, 'Nguồn tin', 80, true),
    model: textField(input.model, 'Tên máy cần tìm', 120, true),
    title: textField(input.title, 'Tên tin đăng', 240, true),
    configuration: textField(input.configuration, 'Cấu hình', 300),
    defects: textField(input.defects, 'Lỗi / lưu ý', 300),
    reason: textField(input.reason, 'Lý do', 400),
    priceJpy, url, imageUrl,
    status: 'needs_review',
    origin: 'external',
    foundAt: new Date()
  };
}

export async function insertScoutFindings(items, resultsCollection, notify) {
  const created = [];
  let duplicates = 0;
  let writeError;
  for (const item of items) {
    const id = scoutResultId(item.url);
    try {
      await resultsCollection.doc(id).create(item);
      created.push({ _id: id, ...item });
    } catch (error) {
      if (error.code === 6 || error.code === 'already-exists') duplicates++;
      else {
        writeError = error;
        break;
      }
    }
  }
  const notification = await notify(created);
  if (writeError) throw writeError;
  return { created, duplicates, notification };
}
