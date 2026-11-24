// sitemap（/sitemap.xml）。トップ・about・一覧ページと全記事を載せる。

import { defineEventHandler, setResponseHeader } from 'h3';

import { SITE_URL } from '../../lib/site';
import { archivePaths, readEntries } from '../entries';
import { escapeXml } from '../xml';

export default defineEventHandler((event) => {
  const entries = readEntries();
  const pages = ['/', '/about', '/archive', ...archivePaths(entries)].map((path) => ({ path, lastmod: undefined }));
  const articles = entries.map((entry) => ({ path: entry.path, lastmod: entry.date.toISOString() }));

  const urls = [...pages, ...articles]
    .map(
      ({ path, lastmod }) =>
        `  <url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n');

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
});
