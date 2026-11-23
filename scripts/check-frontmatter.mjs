// content/entry/ の記事の frontmatter と、ファイルの置き場所を確かめる（Issue #20）。
// 管理画面（Sveltia CMS）で書いた記事は、保存すると main に入り、そのままデプロイされる。
// 入力の間違いを公開する前に見つけるため、デプロイの前（.github/workflows/deploy.yml）で実行する。
//
// 使い方: pnpm check:frontmatter

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import fm from 'front-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY_DIR = join(ROOT, 'content/entry');
const URL_PREFIX = 'https://blog.neko3cs.net/entry/';

const errors = [];
const seenUrls = new Map();

const files = readdirSync(ENTRY_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.md'))
  .sort();

for (const file of files) {
  const fail = (message) => errors.push(`content/entry/${file}: ${message}`);

  let attributes;
  let body;
  try {
    ({ attributes, body } = fm(readFileSync(join(ENTRY_DIR, file), 'utf8')));
  } catch (error) {
    fail(`frontmatter を読めません（${error.message.split('\n')[0]}）`);
    continue;
  }

  if (typeof attributes.Title !== 'string' || attributes.Title.trim() === '') {
    fail('Title（タイトル）がありません');
  }

  const date = new Date(attributes.Date);
  if (attributes.Date === undefined || Number.isNaN(date.getTime())) {
    fail(`Date（公開日時）が日時として読めません: ${JSON.stringify(attributes.Date)}`);
  }

  if (attributes.Category !== undefined) {
    const valid =
      Array.isArray(attributes.Category) &&
      attributes.Category.every((name) => typeof name === 'string' && name.trim() !== '');
    if (!valid) {
      fail('Category（カテゴリ）は、空でない文字の一覧にしてください');
    }
  }

  if (attributes.Draft !== undefined && typeof attributes.Draft !== 'boolean') {
    fail(`Draft（下書き）は true か false にしてください: ${JSON.stringify(attributes.Draft)}`);
  }

  // 記事のファイルのパスが、そのまま記事の URL のパスになる（src/app/entries.ts の loadEntry）。
  // ずれると、記事のページが作られない
  const url = attributes.URL;
  if (typeof url !== 'string' || !url.startsWith(URL_PREFIX)) {
    fail(`URL は ${URL_PREFIX} で始めてください: ${JSON.stringify(url)}`);
  } else {
    const expected = `${URL_PREFIX}${file.replace(/\.md$/, '')}`;
    if (url !== expected) {
      fail(`URL がファイルの場所と合いません（${expected} にしてください）: ${url}`);
    }
    if (seenUrls.has(url)) {
      fail(`URL が ${seenUrls.get(url)} と重複しています: ${url}`);
    } else {
      seenUrls.set(url, `content/entry/${file}`);
    }
  }

  // 記事のタイトルが <h1> になるため、本文の見出しは ## から始める（README の「記事の置き場所」）。
  // コードブロックの中の # は、見出しではない。書きかけの下書きは、公開するときに直せばよいので対象にしない
  let inFence = false;
  for (const line of attributes.Draft === true ? [] : body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence && /^# /.test(line)) {
      fail(`本文の見出しは ## から始めてください: ${line.trim()}`);
      break;
    }
  }
}

if (errors.length > 0) {
  console.error(`✘ ${errors.length} 件の問題があります\n\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`✔ ${files.length} 件の記事の frontmatter と置き場所に問題はありません`);
