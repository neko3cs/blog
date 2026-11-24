// 構造化データ（schema.org の JSON-LD）を組み立てる。
// 検索エンジンに「ブログ記事であること」「公開日」「著者」「パンくずリスト」などを伝える。

import { SITE_AUTHOR, SITE_TITLE, SITE_URL, categoryPath, ogImagePath } from './site';

const AUTHOR = {
  '@type': 'Person',
  name: SITE_AUTHOR,
  url: 'https://portfolio.neko3cs.net/',
};

/** トップページ用。サイトの名前とURL */
export function websiteJsonLd(): object {
  return { '@type': 'WebSite', name: SITE_TITLE, url: `${SITE_URL}/` };
}

/** 記事ページ用。タイトル・公開日・著者・OGP 画像 */
export function blogPostingJsonLd(entry: {
  title: string;
  path: string;
  description: string;
  publishedTime: Date;
  categories: string[];
}): object {
  const url = `${SITE_URL}${entry.path}`;
  return {
    '@type': 'BlogPosting',
    headline: entry.title,
    description: entry.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: entry.publishedTime.toISOString(),
    image: [`${SITE_URL}${ogImagePath(entry.path)}`],
    author: AUTHOR,
    keywords: entry.categories,
    isPartOf: { '@type': 'Blog', name: SITE_TITLE, url: `${SITE_URL}/` },
  };
}

/** 記事ページ用のパンくずリスト（トップ > 最初のカテゴリ > 記事）。はてなブログと同じ構成 */
export function breadcrumbJsonLd(entry: { title: string; path: string; categories: string[] }): object {
  const items = [
    { name: SITE_TITLE, url: `${SITE_URL}/` },
    ...entry.categories.slice(0, 1).map((name) => ({ name, url: `${SITE_URL}${categoryPath(name)}` })),
    { name: entry.title, url: `${SITE_URL}${entry.path}` },
  ];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
