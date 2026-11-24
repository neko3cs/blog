// フィードと sitemap で使う XML の組み立て

import { toDescriptionFromMarkdown } from '../lib/description';
import { SITE_URL } from '../lib/site';
import type { EntryMeta } from './entries';

/** フィードに載せる記事の数（はてなブログのフィードと同程度） */
export const FEED_ENTRY_COUNT = 30;

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function entryUrl(entry: EntryMeta): string {
  return `${SITE_URL}${entry.path}`;
}

export function entrySummary(entry: EntryMeta): string {
  return toDescriptionFromMarkdown(entry.body, 200);
}
