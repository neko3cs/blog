// 下書き（Draft: true）の記事を、ビルドの出力に含めないための Vite プラグイン。
// 記事は import.meta.glob で読み込むため、下書きも本文のファイル（assets/<名前>-<ハッシュ>.js）や
// 一覧の frontmatter として出力され、誰でも取得できてしまう。下書きの本文とタイトル・URL を取り除く。
// 下書きの記事ページは作られない（プリレンダーの対象は readEntries() で絞っている）ので、
// 取り除いても、公開するページには影響しない。

import { readFileSync } from 'node:fs';

import fm from 'front-matter';
import type { Plugin } from 'vite';

import type { EntryAttributes } from '../app/entry-attributes';

/** 記事のファイルへの読み込み（?analog-content-file=true など）なら、ファイルのパスとクエリを返す */
function parseEntryId(id: string): { file: string; query: string } | undefined {
  const [file, query] = id.split('?');
  return query && /[\\/]content[\\/]entry[\\/].+\.md$/.test(file) ? { file, query } : undefined;
}

const isDraft = (file: string) => fm<EntryAttributes>(readFileSync(file, 'utf8')).attributes.Draft === true;

export function excludeDraftEntries(): Plugin[] {
  return [
    {
      // 記事の本文（?analog-content-file=true）。Analog の Markdown の変換より先に、空にして返す
      name: 'exclude-draft-entries:body',
      enforce: 'pre',
      load(id) {
        const entry = parseEntryId(id);
        return entry && entry.query.includes('analog-content-file') && isDraft(entry.file)
          ? 'export default "";'
          : null;
      },
    },
    {
      // 一覧用の frontmatter（?analog-content-list=true）。Analog が frontmatter を丸ごと書き出すので、
      // その後に、Draft だけを残して置き換える（一覧は Draft を見て取り除く）
      name: 'exclude-draft-entries:list',
      enforce: 'post',
      transform(_code, id) {
        const entry = parseEntryId(id);
        return entry && entry.query.includes('analog-content-list') && isDraft(entry.file)
          ? { code: 'export default {"Draft":true};', map: null }
          : null;
      },
    },
  ];
}
