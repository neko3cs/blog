/**
 * はてなブログと同じく、本文の先頭から meta description を作る。
 * HTML のタグを取り除き、空白をまとめて指定文字数で切り詰める。
 */
export function toDescriptionFromHtml(html: string, maxLength = 120): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
