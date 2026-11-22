import { DOCUMENT, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { OG_IMAGE_SIZE, SITE_TITLE, SITE_URL, ogImagePath } from '../lib/site';

export interface PageSeo {
  /** ページ固有のタイトル。省略するとサイト名だけになる（トップページ） */
  title?: string;
  /** /entry/foo のようなパス。canonical と og:url に使う */
  path: string;
  description?: string;
  type?: 'website' | 'article';
  publishedTime?: Date;
  /** OGP 画像のパス。省略するとサイト共通の画像 */
  image?: string;
  /** 構造化データ（JSON-LD）。検索エンジンにページの種類や公開日などを伝える */
  jsonLd?: object[];
  /** 検索結果に載せない（404 ページなど） */
  noindex?: boolean;
}

/**
 * title・description・canonical・OGP・構造化データを設定する関数を返す。
 * はてなブログと同じく、title は「ページ名 - サイト名」、canonical は末尾スラッシュなしのURLにする。
 */
export function injectSeo(): (seo: PageSeo) => void {
  const title = inject(Title);
  const meta = inject(Meta);
  const document = inject(DOCUMENT);

  return (seo) => {
    const fullTitle = seo.title ? `${seo.title} - ${SITE_TITLE}` : SITE_TITLE;
    const canonical = `${SITE_URL}${seo.path}`;
    const image = `${SITE_URL}${seo.image ?? ogImagePath()}`;

    title.setTitle(fullTitle);
    meta.updateTag({ property: 'og:title', content: fullTitle });
    meta.updateTag({ property: 'og:type', content: seo.type ?? 'website' });
    meta.updateTag({ property: 'og:url', content: canonical });
    meta.updateTag({ property: 'og:site_name', content: SITE_TITLE });
    meta.updateTag({ property: 'og:image', content: image });
    meta.updateTag({ property: 'og:image:width', content: String(OG_IMAGE_SIZE.width) });
    meta.updateTag({ property: 'og:image:height', content: String(OG_IMAGE_SIZE.height) });
    meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
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

    for (const data of seo.jsonLd ?? []) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      // 「</script>」で script 要素が途中で閉じないよう、< をエスケープする
      script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    }
  };
}
