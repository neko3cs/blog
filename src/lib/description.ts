/**
 * はてなブログと同じく、本文の先頭から meta description を作る。
 * Markdown の記号を取り除き、空白をまとめて指定文字数で切り詰める。
 */
export function toDescription(markdown: string, maxLength = 120): string {
  const text = markdown
    .replace(/```[^\n]*\n/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
