// リンクカードに出すリンク先の情報（タイトル・説明・ドメイン）を取得し、content/link-cards.json に保存する（Issue #6）。
// ビルドはこのファイルを読むだけで、リンク先にはアクセスしない。リンク先のページが消えてもカードを表示できる。
//
// 使い方:
//   pnpm fetch:link-cards            まだ情報のないリンクだけ取得する
//   pnpm fetch:link-cards --refresh  すべてのリンクを取得し直す
//
// 情報は、はてなブログのリンクカード（hatenablog-parts.com）から取る。
// はてなのころと同じ内容で表示でき、はてなが保存した内容を返すため、消えたページの情報も取れる。
// サムネイルは使わない。他のサイトの画像をリポジトリで管理せず、閲覧時に外部のサイトへアクセスもしないため。

import { readdirSync, readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import fm from 'front-matter';
import { marked } from 'marked';

import { internalPath, LINK_CARDS_FILE, standaloneLink } from '../src/server/link-cards.ts';
import { decodeEntities } from './lib/html.mjs';
import { mapWithLimit } from './lib/page-info.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const { values } = parseArgs({ options: { refresh: { type: 'boolean', default: false } } });

/** 記事（下書きも含む）で、段落にリンクを1つだけ置いたリンク先 */
function collectUrls() {
  const urls = new Set();
  for (const dir of ['content/entry', 'content/drafts']) {
    for (const file of readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })) {
      if (!file.endsWith('.md')) {
        continue;
      }
      const { body } = fm(readFileSync(join(ROOT, dir, file), 'utf8'));
      marked.walkTokens(marked.lexer(body), (token) => {
        const link = token.type === 'paragraph' ? standaloneLink(token) : undefined;
        if (link && /^https?:\/\//.test(link.href) && !internalPath(link.href)) {
          urls.add(link.href);
        }
      });
    }
  }
  return [...urls];
}

const textOf = (html) => decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

async function fetchCard(url) {
  const res = await fetch(`https://hatenablog-parts.com/embed?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    throw new Error(`情報を取得できませんでした (${res.status})`);
  }
  const html = await res.text();
  const title = textOf(html.match(/<h2 class="entry-title">([\s\S]*?)<\/h2>/)?.[1] ?? '');
  if (!title) {
    throw new Error('リンク先のタイトルがありません');
  }
  return {
    title,
    description: textOf(html.match(/<div class="entry-content">([\s\S]*?)<\/div>/)?.[1] ?? ''),
    domain: new URL(url).host,
  };
}

let cards = {};
try {
  cards = JSON.parse(await readFile(LINK_CARDS_FILE, 'utf8'));
} catch {
  // まだファイルがない
}

const targets = collectUrls().filter((url) => values.refresh || !cards[url]);
const failures = [];
await mapWithLimit(targets, 2, async (url) => {
  try {
    cards[url] = await fetchCard(url);
  } catch (error) {
    failures.push(`${url}\n    ${error.message}`);
  }
});

const sorted = Object.fromEntries(Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(LINK_CARDS_FILE, `${JSON.stringify(sorted, null, 2)}\n`);

console.log(`${targets.length - failures.length} 件のリンク先の情報を取得しました（保存済み: ${Object.keys(sorted).length} 件）`);
if (failures.length > 0) {
  console.log(`\n取得できなかったリンク（普通のリンクとして表示されます）:\n${failures.map((f) => `  ${f}`).join('\n')}`);
}
