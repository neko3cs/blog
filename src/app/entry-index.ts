import { EntryAttributes } from './entry-attributes';
import { archiveKey } from '../lib/site';

/** 一覧ページに表示する記事の情報 */
export interface EntrySummary {
  /** /entry/2020/03/30/002449 */
  path: string;
  title: string;
  date: Date;
  categories: string[];
  year: string;
  month: string;
}

// ?analog-content-list=true を付けると、Analog がビルド時に frontmatter だけを読み込む（本文は含まない）。
// このモジュールは一覧ページの @defer (hydrate never) の中でだけ使うので、ブラウザには送られない。
const attributes = import.meta.glob<EntryAttributes>('/content/entry/**/*.md', {
  query: '?analog-content-list=true',
  import: 'default',
  eager: true,
});

/** 公開する記事を新しい順に並べたもの */
export const entrySummaries: EntrySummary[] = Object.values(attributes)
  .filter((entry) => !entry.Draft)
  .map((entry) => {
    const date = new Date(entry.Date);
    return {
      path: new URL(entry.URL).pathname,
      title: entry.Title,
      date,
      categories: entry.Category ?? [],
      ...archiveKey(date),
    };
  })
  .sort((a, b) => b.date.getTime() - a.date.getTime());
