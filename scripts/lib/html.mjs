// HTML から文字を取り出すときに共通で使う処理

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** 文字参照（&amp; &#39; &#x27; など）を文字に戻す */
export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code) => {
    if (code[0] === '#') {
      return String.fromCodePoint(code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10));
    }
    return ENTITIES[code] ?? match;
  });
}
