// RSS 2.0 フィード（/rss）。はてなブログと同じURLで提供し、購読を引き継ぐ。
// プリレンダーで静的ファイルになり、Content-Type は public/_headers で指定する。

import { defineEventHandler, setResponseHeader } from 'h3';

import { SITE_TITLE, SITE_URL } from '../../lib/site';
import { readEntries } from '../entries';
import { FEED_ENTRY_COUNT, entrySummary, entryUrl, escapeXml } from '../xml';

export default defineEventHandler((event) => {
  const entries = readEntries().slice(0, FEED_ENTRY_COUNT);
  const lastBuildDate = (entries[0]?.date ?? new Date()).toUTCString();

  const items = entries
    .map(
      (entry) => `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${entryUrl(entry)}</link>
      <guid isPermaLink="true">${entryUrl(entry)}</guid>
      <pubDate>${entry.date.toUTCString()}</pubDate>
      <description>${escapeXml(entrySummary(entry))}</description>
${entry.categories.map((category) => `      <category>${escapeXml(category)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');

  setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>
    <description>neko3cs の技術ブログ</description>
    <language>ja</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;
});
