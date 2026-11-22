// 記事ごとの OGP 画像（X などで共有したときのカード画像）を作る。
// pnpm build の最後に実行され、dist/analog/public/og/ に PNG を書き出す。
//   - 記事: /og/entry/<記事のパス>.png
//   - それ以外のページ: /og/default.png

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { readEntries } from '../src/server/entries.ts';
import { OG_IMAGE_SIZE, SITE_TITLE, formatDate, ogImagePath } from '../src/lib/site.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = join(ROOT, 'dist/analog/public');
const FONT_DIR = join(ROOT, 'node_modules/@fontsource/noto-sans-jp/files');

// サイトと同じ Noto Sans JP（太字）。日本語と英字のファイルを分けて読み込み、足りない文字は次のフォントで補う
const fonts = await Promise.all(
  ['japanese', 'latin'].map(async (subset) => ({
    name: 'Noto Sans JP',
    data: await readFile(join(FONT_DIR, `noto-sans-jp-${subset}-700-normal.woff`)),
    weight: 700,
    style: 'normal',
  })),
);

// サイトのデザイントークン（src/styles.css）と同じ色
const COLOR = { base: '#f5f5f7', card: '#ffffff', main: '#1d1d1f', sub: '#6e6e73' };

/** satori に渡す要素を作る（JSX を使わずに書くための小さな関数） */
function h(type, style, ...children) {
  return { type, props: { style: { display: 'flex', ...style }, children } };
}

const MARGIN = 56;

function card({ eyebrow, title, footerLeft, footerRight }) {
  return h(
    'div',
    {
      position: 'relative',
      width: OG_IMAGE_SIZE.width,
      height: OG_IMAGE_SIZE.height,
      backgroundColor: COLOR.base,
      fontFamily: 'Noto Sans JP',
    },
    h(
      'div',
      {
        // satori は余白（padding）を使った配置が期待どおりにならないため、上下左右からの位置でカードを置く
        position: 'absolute',
        top: MARGIN,
        right: MARGIN,
        bottom: MARGIN,
        left: MARGIN,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        borderRadius: 40,
        backgroundColor: COLOR.card,
      },
      h(
        'div',
        { flexDirection: 'column' },
        h('div', { fontSize: 28, color: COLOR.sub }, eyebrow),
        h('div', { marginTop: 24, fontSize: 60, lineHeight: 1.35, color: COLOR.main, lineClamp: 3 }, title),
      ),
      h(
        'div',
        { justifyContent: 'space-between', alignItems: 'flex-end' },
        h('div', { fontSize: 34, color: COLOR.main }, footerLeft),
        h('div', { fontSize: 28, color: COLOR.sub }, footerRight),
      ),
    ),
  );
}

async function render(element, outputPath) {
  const svg = await satori(element, { ...OG_IMAGE_SIZE, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_IMAGE_SIZE.width } }).render().asPng();
  const filePath = join(OUTPUT_DIR, outputPath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, png);
}

const entries = readEntries();

await render(
  card({ eyebrow: 'Blog', title: SITE_TITLE, footerLeft: 'neko3cs の技術ブログ', footerRight: 'blog.neko3cs.net' }),
  ogImagePath(),
);
for (const entry of entries) {
  await render(
    card({
      eyebrow: entry.categories.join(' · '),
      title: entry.title,
      footerLeft: SITE_TITLE,
      footerRight: formatDate(entry.date),
    }),
    ogImagePath(entry.path),
  );
}

console.log(`OGP 画像を ${entries.length + 1} 枚作りました（dist/analog/public/og/）`);
