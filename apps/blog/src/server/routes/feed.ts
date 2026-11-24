// Atom フィード（/feed）。はてなブログと同じURLで提供し、購読を引き継ぐ。
// プリレンダーで静的ファイルになり、Content-Type は public/_headers で指定する。

import { defineEventHandler, setResponseHeader } from 'h3';

import { SITE_AUTHOR, SITE_TITLE, SITE_URL } from '../../lib/site';
import { readEntries } from '../entries';
import { FEED_ENTRY_COUNT, entrySummary, entryUrl, escapeXml } from '../xml';

export default defineEventHandler((event) => {
  const entries = readEntries().slice(0, FEED_ENTRY_COUNT);
  const updated = (entries[0]?.date ?? new Date()).toISOString();

  const items = entries
    .map(
      (entry) => `  <entry>
    <title>${escapeXml(entry.title)}</title>
    <link href="${entryUrl(entry)}"/>
    <id>${entryUrl(entry)}</id>
    <published>${entry.date.toISOString()}</published>
    <updated>${entry.date.toISOString()}</updated>
    <summary>${escapeXml(entrySummary(entry))}</summary>
${entry.categories.map((category) => `    <category term="${escapeXml(category)}" label="${escapeXml(category)}"/>`).join('\n')}
  </entry>`,
    )
    .join('\n');

  setResponseHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">
  <title>${escapeXml(SITE_TITLE)}</title>
  <link href="${SITE_URL}/"/>
  <link rel="self" type="application/atom+xml" href="${SITE_URL}/feed"/>
  <id>${SITE_URL}/</id>
  <updated>${updated}</updated>
  <author><name>${SITE_AUTHOR}</name></author>
${items}
</feed>
`;
});
