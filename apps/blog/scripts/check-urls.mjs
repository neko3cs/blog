// 新サイトがはてなブログと同じURLで同じページを返すかを検証する（移行計画 Phase 3）。
// migration/baseline.csv（pnpm baseline で記録）の全URLについて、次を確認する。
//   - リダイレクトされずに 200 を返すこと
//     ただし public/_redirects で移転したURL（日付形式 → スラッグ形式）は、移転先へ 301 を返し、移転先が 200 で同じ title を返すこと
//   - HTML なら title がはてなと一致し、canonical が https://blog.neko3cs.net/<同じパス> であること
//   - フィードなら XML として返ること
//   - プレビュー（*.workers.dev）なら noindex が付き、それ以外（本番・ローカル）なら付いていないこと
//
// 使い方:
//   pnpm check:urls http://localhost:8787
//   pnpm check:urls http://localhost:8787 --filter '^/entry/'   （対象のパスを正規表現で絞り込む）

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { SITE_ORIGIN, fetchPageInfo, mapWithLimit, parseCsv } from './lib/page-info.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { filter: { type: 'string' } },
});
const base = positionals[0]?.replace(/\/$/, '');
if (!base) {
  console.error('使い方: pnpm check:urls <検証するサイトのURL> [--filter <正規表現>]');
  process.exit(2);
}

const baseline = parseCsv(await readFile(new URL('../migration/baseline.csv', import.meta.url), 'utf8'));
const filter = values.filter ? new RegExp(values.filter) : undefined;
// 日付形式のURLから、スラッグ形式のURLへの転送（public/_redirects）
const redirects = new Map(
  (await readFile(new URL('../public/_redirects', import.meta.url), 'utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => line.split(/\s+/))
    .map(([from, to]) => [from, to]),
);
const targets = baseline.filter((row) => row.status === '200' && (!filter || filter.test(row.path)));

// public/_headers で workers.dev のホストにだけ X-Robots-Tag: noindex を付けている
const expectNoindex = new URL(base).hostname.endsWith('.workers.dev');

const results = await mapWithLimit(targets, 4, async (expected) => {
  const moved = redirects.get(expected.path);
  const problems = [];
  if (moved) {
    const redirect = await fetchPageInfo(`${base}${expected.path}`);
    if (redirect.status !== 301) {
      problems.push(`ステータスが ${redirect.status}（301 で ${moved} へ転送するはず）`);
    } else if (new URL(redirect.location, base).pathname !== moved) {
      problems.push(`転送先が違う: ${redirect.location}（${moved} のはず）`);
    }
  }
  const finalPath = moved ?? expected.path;
  const actual = await fetchPageInfo(`${base}${finalPath}`);
  if (actual.noindex !== expectNoindex) {
    problems.push(expectNoindex ? 'noindex が付いていない（プレビューが検索に載る）' : 'noindex が付いている');
  }
  if (actual.status !== 200) {
    problems.push(`ステータスが ${actual.status}${actual.location ? `（→ ${actual.location}）` : ''}`);
  } else if (expected.contentType.includes('text/html')) {
    if (actual.title !== expected.title) {
      problems.push(`title が違う: 「${actual.title}」（はてな: 「${expected.title}」）`);
    }
    if (actual.canonical !== `${SITE_ORIGIN}${finalPath}`) {
      problems.push(`canonical が違う: ${actual.canonical || '（なし）'}`);
    }
  } else if (!actual.contentType.includes('xml')) {
    problems.push(`Content-Type が XML ではない: ${actual.contentType || '（なし）'}`);
  }
  return { path: expected.path, problems };
});

const failed = results.filter((result) => result.problems.length > 0);
for (const { path, problems } of failed) {
  console.log(`✗ ${path}`);
  for (const problem of problems) {
    console.log(`    ${problem}`);
  }
}
console.log(`\n${results.length} 件中 ${results.length - failed.length} 件が一致しました（不一致 ${failed.length} 件）`);
process.exit(failed.length > 0 ? 1 : 0);
