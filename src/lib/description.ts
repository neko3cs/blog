// はてなブログと同じく、本文の先頭から meta description やフィードの要約を作る。

function truncate(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
}

/** HTML のタグを取り除いて要約を作る */
export function toDescriptionFromHtml(html: string, maxLength = 120): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
  return truncate(text, maxLength);
}

/** Markdown の記号を取り除いて要約を作る */
export function toDescriptionFromMarkdown(markdown: string, maxLength = 120): string {
  const text = markdown
    .replace(/```[^\n]*\n/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/[#>*_`]/g, '');
  return truncate(text, maxLength);
}
