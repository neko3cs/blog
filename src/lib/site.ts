// サイト全体で共通の定数と、URL・日付の組み立て。
// Angular のページ、Nitro のサーバールート（フィード・sitemap）、vite.config.ts のすべてから使う。

export const SITE_URL = 'https://blog.neko3cs.net';
export const SITE_TITLE = 'ねこさんのぶろぐ';
export const SITE_AUTHOR = 'neko3cs';

const TIME_ZONE = 'Asia/Tokyo';

/**
 * はてなブログと同じく、カテゴリ名をパーセントエンコードする（例: C# → /archive/category/C%23）。
 * ただし「/」を含むカテゴリ名（ローコード/ノーコード）は、「/」をパスの区切りのまま残す。
 * はてなの URL は「/」を %2F にしていたが、Cloudflare は %2F を「/」として扱い、区切った URL へリダイレクトするため。
 */
export function categoryPath(name: string): string {
  return `/archive/category/${name.split('/').map(encodeURIComponent).join('/')}`;
}

/** 日本時間での年・月・日（月と日は2桁）。はてなのアーカイブ（/archive/2024/08/15）と同じ区切り */
export function archiveKey(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** 2023年1月19日 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TIME_ZONE,
  });
}
