// ベースライン記録とURL検証で共通に使う、ページ情報の取得処理

export const SITE_ORIGIN = 'https://blog.neko3cs.net';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'" };

function decodeEntities(text) {
  return text.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, name) => ENTITIES[name]);
}

/**
 * URL を取得し、ステータス・リダイレクト先・title・canonical を返す。
 * リダイレクトは追わない（URL が変わっていないかを確かめるため）。
 */
export async function fetchPageInfo(url) {
  const res = await fetch(url, { redirect: 'manual' });
  const info = {
    status: res.status,
    location: res.headers.get('location') ?? '',
    contentType: res.headers.get('content-type') ?? '',
    title: '',
    canonical: '',
  };
  if (res.status === 200 && info.contentType.includes('text/html')) {
    const html = await res.text();
    info.title = decodeEntities(html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '');
    info.canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? '';
  } else {
    await res.body?.cancel();
  }
  return info;
}

/** 配列を同時実行数を制限しながら処理する（相手のサーバーに負荷をかけないため） */
export async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

export function toCsv(rows, columns) {
  const escape = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((c) => escape(row[c])).join(','))].join('\n') + '\n';
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  const [header, ...body] = rows;
  return body.map((values) => Object.fromEntries(header.map((name, i) => [name, values[i] ?? ''])));
}
