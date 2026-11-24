import fm from 'front-matter';

import { EntryAttributes } from './entry-attributes';

export interface Entry {
  attributes: EntryAttributes;
  /** Markdown をビルド時に変換・ハイライトした HTML */
  html: string;
}

// src/content/ に置くと Analog が Markdown を自動でルート登録し、/entry/** のページより優先されてしまう。
// そのため content/entry/ に置き、ファイルパスを はてなのURLパスと一致させて読み込む。
// ?analog-content-file=true を付けると、Analog がビルド時に Markdown を HTML に変換（Shiki でハイライト）する。
const entryFiles = import.meta.glob<string>('/content/entry/**/*.md', {
  query: '?analog-content-file=true',
  import: 'default',
});

/** "2020/03/30/002449" のような URL パスから記事を読み込む */
export async function loadEntry(path: string): Promise<Entry | undefined> {
  const load = entryFiles[`/content/entry/${path}.md`];
  if (!load) {
    return undefined;
  }
  const { attributes, body } = fm<EntryAttributes>(await load());
  return { attributes, html: body };
}
