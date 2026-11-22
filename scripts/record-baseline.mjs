// 移行前のはてなブログの全URLについて、ステータス・title・canonical を記録する（移行計画 Phase 0）。
// 記録は移行後の検証（scripts/check-urls.mjs）の基準になる。
//
// 使い方: pnpm baseline

import { mkdir, writeFile } from 'node:fs/promises';

import { SITE_ORIGIN, fetchPageInfo, mapWithLimit, toCsv } from './lib/page-info.mjs';

const OUTPUT = new URL('../migration/baseline.csv', import.meta.url);

// sitemap に載らないが、移行後も維持したいページ
const EXTRA_PATHS = ['/archive', '/feed', '/rss'];

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url} の取得に失敗しました: ${res.status}`);
  }
  return res.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
}

async function collectPaths() {
  const sitemaps = extractLocs(await fetchText(`${SITE_ORIGIN}/sitemap.xml`));
  const pages = (await mapWithLimit(sitemaps, 2, async (url) => extractLocs(await fetchText(url)))).flat();
  const paths = pages.map((url) => new URL(url).pathname);
  return [...new Set([...paths, ...EXTRA_PATHS])].sort();
}

const paths = await collectPaths();
console.log(`${paths.length} 件のURLを記録します`);

const rows = await mapWithLimit(paths, 2, async (path) => {
  const info = await fetchPageInfo(`${SITE_ORIGIN}${path}`);
  return { path, ...info };
});

await mkdir(new URL('.', OUTPUT), { recursive: true });
await writeFile(OUTPUT, toCsv(rows, ['path', 'status', 'contentType', 'title', 'canonical']));

const notOk = rows.filter((row) => row.status !== 200);
console.log(`記録しました: migration/baseline.csv（200 以外: ${notOk.length} 件）`);
for (const row of notOk) {
  console.log(`  ${row.status} ${row.path} ${row.location}`);
}
