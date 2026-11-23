# blog

[ねこさんのぶろぐ](https://blog.neko3cs.net) のソースコードです。

はてなブログPro から、URL を変えずに Cloudflare へ移行する作業を進めています。経緯と手順は [docs/migration-plan.md](docs/migration-plan.md) にまとめています。

## 技術構成

- [Analog](https://analogjs.org)（Angular 22）による静的サイト生成
- Tailwind CSS 4（デザインはポートフォリオサイトと共通）
- Cloudflare Workers（Static Assets）で配信

## 開発

```bash
pnpm install
```

```bash
pnpm dev
```

## ビルドと確認

Cloudflare と同じ配信ルールで確認するときは、ビルドしてから wrangler で配信します。

```bash
pnpm preview
```

`http://localhost:8787/entry/how-to-disconnect-sql-server-db-connection` で記事ページを確認できます。

## 記事の置き場所

記事は `content/entry/` に、はてなブログの URL パスと同じパスで置きます。

| はてなブログの URL | ファイル |
| --- | --- |
| `/entry/2020/03/30/002449` | `content/entry/2020/03/30/002449.md` |
| `/entry/how-to-disconnect-sql-server-db-connection` | `content/entry/how-to-disconnect-sql-server-db-connection.md` |

`src/content/` には置かないでください。Analog が Markdown を自動でルートとして登録し、記事ページより優先されてしまいます。

画像は `public/images/<日付>/` に置き、本文からは `/images/<日付>/<ファイル名>` で参照します。

### 埋め込み

YouTube・SlideShare・Speaker Deck は、各サービスの「埋め込む」でコピーした `<iframe>` の HTML を、Markdown にそのまま貼ります。スマホでは画面幅に縮み、YouTube は 16:9 の比率を保ちます。

### リンクカード

段落にリンクを1つだけ置くと、リンク先のタイトル・説明・画像入りのカードで表示されます。カードのタイトルには、リンクの文字が使われます。

```markdown
[GitHub - neko3cs/PSSQLBulkCopy](https://github.com/neko3cs/PSSQLBulkCopy)
```

リンク先の情報は `content/link-cards.json` に、サムネイルは `public/images/link-cards/` に保存してあり、ビルドではリンク先にアクセスしません。新しいリンクを書いたら、次のコマンドで情報を取得します（情報は、はてなブログのリンクカードと同じ hatenablog-parts.com から取ります）。

```bash
pnpm fetch:link-cards
```

情報を取得できなかったリンクは、普通のリンクのまま表示されます。このサイトの記事へのリンク（`/entry/…`）は、取得しなくても記事のタイトルと冒頭の文からカードを作ります。

### X の投稿

X の投稿の「埋め込む」でコピーした `<blockquote>` を、Markdown の引用にして貼ります。最後の段落を「— 名前 (@ID) [日付](投稿のURL)」にすると、カードで表示されます。X の JavaScript は読み込みません。

```markdown
> 投稿の文章
>
> — ねこ (@neko3cs) [2019年4月10日](https://twitter.com/neko3cs/status/1115953437726740481)
```

### 下書き

公開しない下書きは `content/drafts/` に置きます。`content/entry/` の外なので、ビルドの対象にならず、サイトにも sitemap にも出ません。

公開するときは、frontmatter に `Date` と `URL` を足し、`Draft: true` を消して、URL と同じパスで `content/entry/` に移します。本文の見出しは `##` から始めます（`#` は記事タイトルに使われるため）。

## 移行用のスクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm import:hatena` | はてなブログの公開ページから全記事を取り込み、`content/entry/` に Markdown で書き出す。画像も `public/images/` にダウンロードする |
| `pnpm baseline` | はてなブログの全URLのステータス・title・canonical を `migration/baseline.csv` に記録する |
| `pnpm check:urls <URL>` | 記録した全URLを新サイトに問い合わせ、はてなと同じ title・canonical で返るかを確認する |
| `pnpm check:content` | ビルドした記事の本文に、はてなの本文の文がすべて含まれているかを確認する |
| `pnpm fetch:link-cards` | リンクカードに出すリンク先の情報を取得し、`content/link-cards.json` に保存する。`--refresh` で取得し直す |

```bash
pnpm preview
```

```bash
pnpm check:urls http://localhost:8787
```
