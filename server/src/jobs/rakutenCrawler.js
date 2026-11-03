import * as cheerio from 'cheerio';

const SEARCH_ORIGIN = 'https://search.rakuten.co.jp';
const REJECTED_CONDITIONS = ['ジャンク', '白点', '黄ばみ', '色ムラ', '光漏れ', '液晶不良', '表示不良', 'タッチ不良', '画面割れ', 'ひび割れ', '起動不可', '電源入らない', '動作未確認', 'iCloudロック', 'アクティベーションロック'];

export function hasObviousDefect(item) {
  const text = `${item.title || ''} ${item.description || ''}`;
  return REJECTED_CONDITIONS.some((term) => text.includes(term));
}

export function parseRakutenSearch(html, maxPriceJpy, limit = 20) {
  const $ = cheerio.load(html);
  const products = [];
  const seen = new Set();
  const add = (item) => {
    const priceJpy = Number(item.priceJpy);
    let url;
    try {
      url = new URL(item.url);
      if (url.protocol !== 'https:' || url.hostname !== 'item.rakuten.co.jp') return;
    } catch { return; }
    if (!item.title || !Number.isFinite(priceJpy) || priceJpy <= 0 || priceJpy > maxPriceJpy) return;
    url.search = '';
    url.hash = '';
    const canonicalUrl = url.toString();
    if (seen.has(canonicalUrl)) return;
    seen.add(canonicalUrl);
    products.push({ source: 'Rakuten', title: String(item.title).slice(0, 240), description: String(item.description || '').slice(0, 1200), priceJpy, url: canonicalUrl, imageUrl: item.imageUrl || '' });
  };
  $('.searchresultitem').each((_, card) => {
    const link = $(card).find('a[data-link="item"]').first();
    const priceText = $(card).find('[class^="price--"]').first().text().trim();
    if (!/^\s*[\d,]+\s*円\s*$/.test(priceText)) return;
    add({ title: link.attr('title') || link.text().trim(), url: link.attr('href'), priceJpy: Number(priceText.replace(/[^\d]/g, '')), imageUrl: $(card).find('img').first().attr('src') });
  });
  $('script[type="application/ld+json"]').each((_, script) => {
    let data;
    try { data = JSON.parse($(script).text()); } catch { return; }
    if (data['@type'] !== 'ItemList') return;
    for (const entry of data.itemListElement || []) {
      const item = entry.item || {};
      add({ title: item.name, description: item.description, priceJpy: item.offers?.price, url: item.url, imageUrl: Array.isArray(item.image) ? item.image[0] : item.image });
    }
  });
  return products.slice(0, limit);
}

export function parseRakutenDetail(html) {
  const $ = cheerio.load(html);
  const details = [];
  $('tr').each((_, row) => {
    const label = $(row).children('th').first().text().replace(/\s+/g, '').trim();
    if (!['特記事項', '商品説明', '商品状態'].includes(label)) return;
    const value = $(row).children('td').first().text().replace(/\s+/g, ' ').trim();
    if (value) details.push(`${label}: ${value}`);
  });
  return details.join('\n').slice(0, 1600) || $('meta[name="description"]').attr('content')?.slice(0, 1200) || '';
}

async function enrichDetail(item) {
  try {
    const response = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnipadScout/1.0)' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return item;
    const charset = response.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1] || 'utf-8';
    const html = new TextDecoder(charset).decode(await response.arrayBuffer());
    return { ...item, description: parseRakutenDetail(html) || item.description };
  } catch { return item; }
}

export async function searchRakuten(rule, limit = 20) {
  const query = rule.query.includes('中古') ? rule.query : `${rule.query} 中古`;
  const url = `${SEARCH_ORIGIN}/search/mall/${encodeURIComponent(query)}/`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnipadScout/1.0)' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Rakuten search: HTTP ${response.status}`);
  const html = await response.text();
  const tokens = rule.model.normalize('NFKC').toLowerCase().match(/[a-z0-9]+/g) || [];
  const matches = parseRakutenSearch(html, rule.maxPriceJpy, limit * 3)
    .filter((item) => tokens.length && tokens.every((token) => item.title.normalize('NFKC').toLowerCase().includes(token)))
    .slice(0, limit);
  const enriched = [];
  for (let offset = 0; offset < matches.length; offset += 3) {
    enriched.push(...await Promise.all(matches.slice(offset, offset + 3).map(enrichDetail)));
  }
  return enriched.filter((item) => !hasObviousDefect(item));
}
