import test from 'node:test';
import assert from 'node:assert/strict';
import { hasObviousDefect, parseRakutenDetail, parseRakutenSearch } from './rakutenCrawler.js';

test('reads public Rakuten listings and enforces the yen price limit', () => {
  const html = `<article class="searchresultitem"><a data-link="item" title="中古 iPad Air 3" href="https://item.rakuten.co.jp/shop/ipad/?tracking=1">iPad Air 3</a><div class="price--abc">15,000円</div><img src="https://example.com/ipad.jpg"></article>
    <article class="searchresultitem"><a data-link="item" title="中古 iPad Air 3" href="https://item.rakuten.co.jp/shop/expensive/">iPad Air 3</a><div class="price--abc">18,000円</div></article>`;
  const items = parseRakutenSearch(html, 16000);
  assert.equal(items.length, 1);
  assert.equal(items[0].priceJpy, 15000);
  assert.equal(items[0].url, 'https://item.rakuten.co.jp/shop/ipad/');
});

test('extracts seller condition notes and flags obvious defects', () => {
  const description = parseRakutenDetail('<table><tr><th>特記事項</th><td>液晶縁に黄ばみがございます。</td></tr></table>');
  assert.match(description, /黄ばみ/);
  assert.equal(hasObviousDefect({ title: 'iPad Air 3', description }), true);
  assert.equal(hasObviousDefect({ title: 'iPad Air 3', description: '動作確認済み' }), false);
});
