// ビルド時（Node）に content/entry/ の記事を読み込む。
// プリレンダーするルートの列挙（vite.config.ts）と、フィード・sitemap（Nitro のサーバールート）で使う。
// ブラウザ向けのコードからは import しないこと（node:fs を使うため）。

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import fm from 'front-matter';

import type { EntryAttributes } from '../app/entry-attributes';
// vite.config.ts から読み込まれるため、拡張子を付ける（Vite の設定ファイルの読み込みで必要）
import { archiveKey, categoryPath } from '../lib/site.ts';

export interface EntryMeta {
  /** /entry/2020/03/30/002449 */
  path: string;
  title: string;
  date: Date;
  categories: string[];
  /** frontmatter を除いた Markdown 本文 */
  body: string;
}

const ENTRY_DIR = join(process.cwd(), 'content/entry');

/** 公開する記事を新しい順に返す */
export function readEntries(): EntryMeta[] {
  return readdirSync(ENTRY_DIR, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.md'))
    .map((file) => fm<EntryAttributes>(readFileSync(join(ENTRY_DIR, file), 'utf8')))
    .filter(({ attributes }) => !attributes.Draft)
    .map(({ attributes, body }) => ({
      path: new URL(attributes.URL).pathname,
      title: attributes.Title,
      date: new Date(attributes.Date),
      categories: attributes.Category ?? [],
      body,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** 記事から作られる一覧ページのパス（年別・月別・日別・カテゴリ別） */
export function archivePaths(entries: EntryMeta[]): string[] {
  const paths = new Set<string>();
  for (const entry of entries) {
    const { year, month, day } = archiveKey(entry.date);
    paths.add(`/archive/${year}`);
    paths.add(`/archive/${year}/${month}`);
    paths.add(`/archive/${year}/${month}/${day}`);
    for (const category of entry.categories) {
      paths.add(categoryPath(category));
    }
  }
  return [...paths].sort();
}
