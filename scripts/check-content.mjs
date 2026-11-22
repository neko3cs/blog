// 取り込んだ記事の本文に、はてなブログの本文の文章がすべて含まれているかを確かめる（Issue #4）。
// はてなの本文（migration/.cache/html/）を文に区切り、ビルドした新サイトの記事ページ（dist/）に
// 同じ文があるかを調べる。空白の違いは無視する。
//
// 使い方: pnpm build && pnpm check:content

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'migration/.cache/html');
const DIST_DIR = join(ROOT, 'dist/analog/public');

/** 短すぎる断片（記号だけ、数文字の語など）は照合しない */
const MIN_LENGTH = 6;

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', middot: '·', hellip: '…', laquo: '«', raquo: '»',
  times: '×', copy: '©', reg: '®', trade: '™', yen: '¥',
  larr: '←', rarr: '→', uarr: '↑', darr: '↓',
};
function toText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<br\s*\/?>|<\/(p|li|h\d|pre|tr|td|th|blockquote|div|figcaption)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code) =>
      code[0] === '#'
        ? String.fromCodePoint(code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10))
        : (ENTITIES[code] ?? match),
    );
}

const normalize = (text) => text.replace(/\s+/g, '');

function hatenaBody(html) {
  const body = html.match(/<div class="entry-content hatenablog-entry">([\s\S]*?)<footer class="entry-footer"/)?.[1] ?? '';
  return body
    // 取り込みで意図して取り除いたもの（目次、リンクカードの引用元表記、脚注の番号）は照合から外す
    .replace(/<ul class="table-of-contents">[\s\S]*?<\/ul>/g, '')
    .replace(/<cite class="hatena-citation">[\s\S]*?<\/cite>/g, '')
    .replace(/<a[^>]*class="footnote-number"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<span class="footnote-delimiter">:<\/span>/g, '');
}

const files = (await readdir(CACHE_DIR)).filter((file) => file.endsWith('.html')).sort();
let missingTotal = 0;
for (const file of files) {
  const path = `/entry/${file.replace(/\.html$/, '').replace(/__/g, '/')}`;
  const hatena = toText(hatenaBody(await readFile(join(CACHE_DIR, file), 'utf8')));
  let ours;
  try {
    const html = await readFile(join(DIST_DIR, `${path}.html`), 'utf8');
    ours = normalize(toText(html.match(/<article[\s\S]*<\/article>/)?.[0] ?? ''));
  } catch {
    console.log(`✗ ${path}\n    新サイトの記事ページがありません`);
    missingTotal++;
    continue;
  }
  // 文の区切り（句点・改行など）で分け、それぞれが新サイトの本文にあるかを調べる
  const missing = hatena
    .split(/[。！？!?\n]/)
    .map(normalize)
    .filter((sentence) => sentence.length >= MIN_LENGTH && !ours.includes(sentence));
  if (missing.length > 0) {
    missingTotal += missing.length;
    console.log(`✗ ${path}（${missing.length} 件）`);
    for (const sentence of missing.slice(0, 5)) {
      console.log(`    ${sentence.slice(0, 80)}`);
    }
  }
}
console.log(`\n${files.length} 記事を照合しました（見つからない文: ${missingTotal} 件）`);
process.exit(missingTotal > 0 ? 1 : 0);
