import { DOCUMENT, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE_TITLE, SITE_URL } from '../lib/site';

export interface PageSeo {
  /** ページ固有のタイトル。省略するとサイト名だけになる（トップページ） */
  title?: string;
  /** /entry/foo のようなパス。canonical と og:url に使う */
  path: string;
  description?: string;
  type?: 'website' | 'article';
  publishedTime?: Date;
  /** 検索結果に載せない（404 ページなど） */
  noindex?: boolean;
}

/**
 * title・description・canonical・OGP を設定する関数を返す。
 * はてなブログと同じく、title は「ページ名 - サイト名」、canonical は末尾スラッシュなしのURLにする。
 */
export function injectSeo(): (seo: PageSeo) => void {
  const title = inject(Title);
  const meta = inject(Meta);
  const document = inject(DOCUMENT);

  return (seo) => {
    const fullTitle = seo.title ? `${seo.title} - ${SITE_TITLE}` : SITE_TITLE;
    const canonical = `${SITE_URL}${seo.path}`;

    title.setTitle(fullTitle);
    meta.updateTag({ property: 'og:title', content: fullTitle });
    meta.updateTag({ property: 'og:type', content: seo.type ?? 'website' });
    meta.updateTag({ property: 'og:url', content: canonical });
    meta.updateTag({ property: 'og:site_name', content: SITE_TITLE });
    meta.updateTag({ name: 'twitter:card', content: 'summary' });
    if (seo.description) {
      meta.updateTag({ name: 'description', content: seo.description });
      meta.updateTag({ property: 'og:description', content: seo.description });
    }
    if (seo.publishedTime) {
      meta.updateTag({ property: 'article:published_time', content: seo.publishedTime.toISOString() });
    }
    if (seo.noindex) {
      meta.updateTag({ name: 'robots', content: 'noindex' });
      return;
    }

    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonical;
    document.head.appendChild(link);
  };
}
