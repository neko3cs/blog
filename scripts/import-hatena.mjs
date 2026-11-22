// はてなブログの公開ページの HTML から記事を取り込み、content/entry/ に Markdown で書き出す（Issue #4）。
// どの書き方（Markdown・はてな記法・見たまま）で書いた記事も公開ページの HTML は同じ形式なので、1つの変換で全記事を扱える。
//
// 使い方:
//   pnpm import:hatena            取得済みの HTML（migration/.cache/html/）があれば使い、なければ取得する
//   pnpm import:hatena --refresh  HTML を取得し直す
//
// 対象の記事は migration/baseline.csv（sitemap から記録した全記事）から決める。
// 画像（はてなフォトライフ）は public/images/<日付>/ にダウンロードする。

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

import { SITE_URL } from '../src/lib/site.ts';
import { mapWithLimit, parseCsv } from './lib/page-info.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'migration/.cache/html');
const ENTRY_DIR = join(ROOT, 'content/entry');
const IMAGE_DIR = join(ROOT, 'public/images');

const { values } = parseArgs({ options: { refresh: { type: 'boolean', default: false } } });

// はてなのコードブロックの言語名 → Shiki の言語名（vite.config.ts の additionalLangs と揃える）
const LANGUAGES = {
  sh: 'shellscript', bash: 'shellscript', zsh: 'shellscript',
  cs: 'csharp', cpp: 'cpp', java: 'java', javascript: 'javascript',
  py: 'python', python: 'python', sql: 'sql', json: 'json',
  pwsh: 'powershell', powershell: 'powershell', '.ps1': 'powershell',
  '.csproj': 'xml', xml: 'xml', cmake: 'cmake', qml: 'qml', bicep: 'bicep',
  vimrc: 'viml', latex: 'latex', html: 'html', csv: 'csv', yaml: 'yaml',
  txt: 'text', '': 'text',
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code) => {
    if (code[0] === '#') {
      return String.fromCodePoint(code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10));
    }
    return ENTITIES[code] ?? match;
  });
}

/** 日本時間の ISO 8601 文字列（2023-01-19T19:46:26+09:00） */
function toJstIso(date) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.toISOString().slice(0, 19)}+09:00`;
}

async function loadHtml(path) {
  const cacheFile = join(CACHE_DIR, `${path.replace(/^\/entry\//, '').replace(/\//g, '__')}.html`);
  if (!values.refresh && existsSync(cacheFile)) {
    return readFile(cacheFile, 'utf8');
  }
  const res = await fetch(`${SITE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${path} の取得に失敗しました: ${res.status}`);
  }
  const html = await res.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, html);
  return html;
}

function parseMeta(html, path) {
  const header = html.match(/<header class="entry-header">([\s\S]*?)<\/header>/)?.[1] ?? '';
  const title = header.match(/<h1 class="entry-title">\s*<a[^>]*>([\s\S]*?)<\/a>/)?.[1];
  const published = html.match(/<meta property="article:published_time" content="([^"]+)"/)?.[1];
  const categories = [...header.matchAll(/class="entry-category-link[^"]*">([^<]*)<\/a>/g)].map((m) => decodeEntities(m[1]));
  const body = html.match(/<div class="entry-content hatenablog-entry">([\s\S]*?)<footer class="entry-footer"/)?.[1];
  if (!title || !published || !body) {
    throw new Error(`${path} のタイトル・公開日時・本文のいずれかが見つかりません`);
  }
  // タイトルの前後の空白も残す。はてなの title と完全に一致させるため（末尾に空白がある記事がある）
  return { title: decodeEntities(title), published: new Date(published), categories, body };
}

/** はてなフォトライフの画像URL → サイト内のパス（/images/20240806/20240806155326.png） */
function localImagePath(src) {
  const m = src.match(/\/fotolife\/n\/neko3cs\/(\d{8})\/(\d+\.[a-z]+)/);
  return m ? `/images/${m[1]}/${m[2]}` : undefined;
}

function createTurndown(images, footnotes) {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  turndown.use(gfm);

  // 注意: turndown は後から追加したルールを優先する。ルールどうしの対象が重ならないよう、filter で絞り込んでいる

  // 本文の文字のうち、Markdown として解釈されてしまうものをエスケープする。
  //   < : IEnumerable<T> の <T> が HTML のタグとして消えてしまう
  //   ~ : はてなでは「~です~」がそのまま表示されていたが、取り消し線になってしまう
  const escape = turndown.escape.bind(turndown);
  turndown.escape = (text) => escape(text).replace(/</g, '\\<').replace(/~/g, '\\~');

  // 太字と斜体。Markdown の仕様では、**『…』**です のように記号の内側で閉じると太字にならないため、
  // 内側の端が記号のときだけ HTML のタグを使う
  const PUNCTUATION = /[\p{P}\p{S}]/u;
  const emphasis = (marker, tag) => (content) => {
    const text = content.trim();
    if (!text) {
      return '';
    }
    const edgeIsPunctuation = PUNCTUATION.test(text[0]) || PUNCTUATION.test(text[text.length - 1]);
    return edgeIsPunctuation ? `<${tag}>${text}</${tag}>` : `${marker}${text}${marker}`;
  };
  turndown.addRule('strong', { filter: ['strong', 'b'], replacement: emphasis('**', 'strong') });
  turndown.addRule('emphasis', { filter: ['em', 'i'], replacement: emphasis('*', 'em') });

  // 箇条書きの記号の後の空白を1つにする（turndown の既定は3つ）。2行目以降は記号の幅だけ字下げする
  turndown.addRule('list-item', {
    filter: 'li',
    replacement: (content, node) => {
      const parent = node.parentNode;
      let prefix = '- ';
      if (parent.nodeName === 'OL') {
        const start = Number(parent.getAttribute('start') ?? 1);
        prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
      }
      const body = content.replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n/gm, `\n${' '.repeat(prefix.length)}`);
      return prefix + body + (node.nextSibling && !/\n$/.test(body) ? '\n' : '');
    },
  });

  // はてなキーワードの自動リンクは文字だけ残す
  turndown.addRule('hatena-keyword', {
    filter: (node) => node.nodeName === 'A' && node.classList.contains('keyword'),
    replacement: (content) => content,
  });

  // リンクカードの直後の引用元表記、目次、はてなが入れるスクリプトは取り除く
  turndown.addRule('hatena-noise', {
    filter: (node) =>
      (node.nodeName === 'CITE' && node.classList.contains('hatena-citation')) ||
      (node.nodeName === 'UL' && node.classList.contains('table-of-contents')) ||
      (node.nodeName === 'SCRIPT' && !/gist\.github\.com/.test(node.getAttribute('src') ?? '')) ||
      node.nodeName === 'STYLE',
    replacement: () => '',
  });

  // Gist の埋め込みは Gist へのリンクにする
  turndown.addRule('gist', {
    filter: (node) => node.nodeName === 'SCRIPT' && /gist\.github\.com/.test(node.getAttribute('src') ?? ''),
    replacement: (_, node) => {
      const url = node.getAttribute('src').replace(/\.js$/, '');
      return `\n\n[Gist: ${url.replace('https://gist.github.com/', '')}](${url})\n\n`;
    },
  });

  // コードブロック。ハイライト用の span を除いた文字だけを、言語付きのコードブロックにする
  turndown.addRule('hatena-code', {
    filter: (node) => node.nodeName === 'PRE',
    replacement: (_, node) => {
      const lang = LANGUAGES[node.getAttribute('data-lang') ?? ''] ?? 'text';
      const code = node.textContent.replace(/\n$/, '');
      const fence = '`'.repeat(Math.max(3, ...[...code.matchAll(/`+/g)].map((m) => m[0].length + 1)));
      return `\n\n${fence}${lang}\n${code}\n${fence}\n\n`;
    },
  });

  // 画像。キャプション付き（figure）はキャプションごと HTML で残す
  const imageMarkdown = (img) => {
    const src = img.getAttribute('src');
    const local = localImagePath(src);
    if (local) {
      images.set(src, local);
    }
    return { src: local ?? src, alt: img.getAttribute('alt') ?? '' };
  };
  turndown.addRule('hatena-figure', {
    filter: (node) => node.nodeName === 'FIGURE' && node.querySelector('img'),
    replacement: (_, node) => {
      const { src, alt } = imageMarkdown(node.querySelector('img'));
      const caption = node.querySelector('figcaption')?.textContent.trim() || node.getAttribute('title') || '';
      return `\n\n<figure><img src="${src}" alt="${alt || caption}" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>\n\n`;
    },
  });
  turndown.addRule('hatena-image', {
    filter: 'img',
    replacement: (_, node) => {
      const { src, alt } = imageMarkdown(node);
      return `![${alt}](${src})`;
    },
  });

  // はてなのリンクカード → 記事タイトル付きのリンク
  turndown.addRule('embed-card', {
    filter: (node) => node.nodeName === 'IFRAME' && node.classList.contains('embed-card'),
    replacement: (_, node) => {
      const url = new URL(node.getAttribute('src')).searchParams.get('url');
      const title = node.getAttribute('title') || url;
      return `\n\n[${title}](${url})\n\n`;
    },
  });

  // SlideShare・Speaker Deck などの埋め込みは、そのまま残す
  turndown.addRule('iframe', {
    filter: (node) => node.nodeName === 'IFRAME' && !node.classList.contains('embed-card'),
    replacement: (_, node) => {
      // プロトコルを省いた URL（//speakerdeck.com/…）は https に揃える
      const src = node.getAttribute('src').replace(/^\/\//, 'https://');
      const width = node.getAttribute('width') ?? '560';
      const height = node.getAttribute('height') ?? '315';
      // スマホでは画面幅に縮めるため、元の縦横比を style で残す
      return `\n\n<div class="embed"><iframe src="${src}" width="${width}" height="${height}" style="aspect-ratio: ${width} / ${height}" loading="lazy" allowfullscreen></iframe></div>\n\n`;
    },
  });

  // 脚注の参照（本文中の *1）
  turndown.addRule('footnote-ref', {
    filter: (node) => node.nodeName === 'A' && /^#f-/.test(node.getAttribute('href') ?? ''),
    replacement: (content, node) => {
      const id = node.getAttribute('href').slice(3);
      return `<sup id="fnref-${id}"><a href="#fn-${id}">${content}</a></sup>`;
    },
  });

  // 脚注の本文。はてなと同じく「*1: 注の文」を並べ、本文の参照へ戻れるようにする
  turndown.addRule('footnotes', {
    filter: (node) => node.nodeName === 'DIV' && node.classList.contains('footnote'),
    replacement: (_, node) => {
      for (const p of node.querySelectorAll('p.footnote')) {
        const number = p.querySelector('.footnote-number');
        const id = number.getAttribute('href').slice(4);
        const text = turndown.turndown(p.querySelector('.footnote-text')?.innerHTML ?? '');
        footnotes.push(`<span id="fn-${id}"></span>[${number.textContent}](#fnref-${id}): ${text}`);
      }
      return '';
    },
  });

  return turndown;
}

/** 本文に h1 がある記事は、記事タイトル（ページの h1）と重ならないよう見出しを1段ずつ下げる */
function shiftHeadings(body) {
  if (!/<h1[\s>]/.test(body)) {
    return body;
  }
  return body.replace(/<(\/?)h([1-5])(?=[\s>])/g, (_, slash, level) => `<${slash}h${Number(level) + 1}`);
}

/** 自分のブログへの絶対URLを、サイト内のパスにする */
function relativizeLinks(markdown) {
  return markdown.replace(/\]\(https?:\/\/blog\.neko3cs\.net\//g, '](/');
}

/** YAML の値として、そのままでは誤解される文字列だけを引用符で囲む */
function yamlString(value) {
  const needsQuote = /: | #|^[-?[\]{}!&*|>'"%@`,#]|^\s|\s$|^(true|false|null|yes|no|on|off|~|[\d.]+)$/i.test(value);
  return needsQuote ? JSON.stringify(value) : value;
}

function frontmatter({ title, categories, published, url }) {
  const lines = ['---', `Title: ${yamlString(title)}`];
  if (categories.length > 0) {
    lines.push('Category:', ...categories.map((c) => `- ${yamlString(c)}`));
  }
  lines.push(`Date: ${toJstIso(published)}`, `URL: ${url}`, '---');
  return lines.join('\n');
}

async function downloadImage(src, localPath) {
  const filePath = join(ROOT, 'public', localPath);
  if (existsSync(filePath)) {
    return;
  }
  const res = await fetch(src);
  if (!res.ok) {
    throw new Error(`画像の取得に失敗しました: ${src} (${res.status})`);
  }
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
}

const baseline = parseCsv(await readFile(join(ROOT, 'migration/baseline.csv'), 'utf8'));
const paths = baseline.map((row) => row.path).filter((path) => path.startsWith('/entry/'));

const images = new Map();
const results = await mapWithLimit(paths, 2, async (path) => {
  const meta = parseMeta(await loadHtml(path), path);
  const footnotes = [];
  const turndown = createTurndown(images, footnotes);
  let markdown = turndown.turndown(shiftHeadings(meta.body));
  if (footnotes.length > 0) {
    markdown += `\n\n---\n\n${footnotes.join('\n\n')}`;
  }
  markdown = relativizeLinks(markdown).replace(/\n{3,}/g, '\n\n').trim();

  const file = join(ENTRY_DIR, `${path.replace(/^\/entry\//, '')}.md`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${frontmatter({ ...meta, url: `${SITE_URL}${path}` })}\n\n${markdown}\n`);
  return { path, footnotes: footnotes.length };
});

await mapWithLimit([...images], 2, ([src, local]) => downloadImage(src, local));

console.log(`${results.length} 件の記事を content/entry/ に書き出しました`);
console.log(`画像 ${images.size} 枚を public/images/ に置きました`);
