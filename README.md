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

## デプロイ

`main` に push（マージ）すると、GitHub Actions（`.github/workflows/deploy.yml`）がビルドして Cloudflare Workers にデプロイします。Pull request では、ビルドが通ることだけを確かめます。手動で動かすときは、GitHub の Actions 画面から `Deploy` の「Run workflow」を実行します。

デプロイには、リポジトリの Secrets に次の2つが必要です。

| Secret | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Workers の編集権限だけを付けた API トークン（Cloudflare の「API トークン」で、テンプレート「Edit Cloudflare Workers」から作る） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare のアカウント ID（Workers & Pages の画面の右側に出る） |

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

手元から直接デプロイするときは、これまでどおり `pnpm build && pnpm exec wrangler deploy` を実行します。

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

段落にリンクを1つだけ置くと、リンク先のタイトル・説明・ドメインを並べたカードで表示されます。カードのタイトルには、リンクの文字が使われます。

```markdown
[GitHub - neko3cs/PSSQLBulkCopy](https://github.com/neko3cs/PSSQLBulkCopy)
```

リンク先の情報は `content/link-cards.json` に保存してあり、ビルドではリンク先にアクセスしません。他のサイトの画像を管理しないよう、サムネイルは出しません。新しいリンクを書いたら、次のコマンドで情報を取得します（情報は、はてなブログのリンクカードと同じ hatenablog-parts.com から取ります）。

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

公開しない下書きは、`content/entry/` に置き、frontmatter に `Draft: true` を付けます。サイトにも、sitemap にも、フィードにも出ません。frontmatter の `Date` と `URL` は、下書きでも入れておきます（`URL` は、ファイルの場所と合わせます）。

公開するときは、`Draft: true` を消します（管理画面では、「下書き」をオフにして保存します）。本文の見出しは `##` から始めます（`#` は記事タイトルに使われるため）。

下書きの本文・タイトル・URL は、ビルドの出力に含まれません（`src/server/exclude-drafts.ts` が取り除きます）。ただし、ファイル名（スラッグ）は、出力の JavaScript に残ります。公開前の記事の名前を知られたくないときは、スラッグに内容が分からない名前を使ってください。

frontmatter とファイルの場所の間違いは、`pnpm check:frontmatter` で確かめられます。デプロイの前にも自動で実行され、通らないと公開されません。

## 記事をブラウザから書く

`https://blog.neko3cs.net/admin/` の管理画面（[Sveltia CMS](https://github.com/sveltia/sveltia-cms)）から、記事を書けます。GitHub でログインし、保存すると、`main` にコミットされます。コミットされると自動でデプロイされ、1〜2分ほどで公開されます。

- **ログインできるのは、`neko3cs` だけ。** 受け口の Worker（`workers/cms-auth`）が、ログインしたユーザー名を確かめ、`neko3cs` 以外にはトークンを渡しません。トークンの権限は `public_repo` に固定しています。
- **新しい記事。** タイトル、URL、本文を入れます。URL は、初めから入っている `https://blog.neko3cs.net/entry/` の後ろに、記事の名前（スラッグ。英小文字・数字・ハイフンで、ドットも使えます）を足します。スラッグがそのままファイル名（`content/entry/<スラッグ>.md`）になるため、保存したあとは変えないでください。「下書き」は、初めはオンです。公開するときにオフにして保存します。
- **本文は、Markdown のまま編集します。** リッチテキストに切り替えると、`<iframe>` の埋め込みやリンクカードなどが書き換わることがあります。
- **一覧は2つに分かれます。** 「記事」は URL が `/entry/<スラッグ>` の記事です。「はてなブログ時代の記事」は `/entry/2020/03/30/002449` 形式の記事で、新規作成と URL の変更はできません（URL を作り直すと、ファイルの場所と合わなくなるため）。
- **画像。** `public/images/uploads/` に保存され、本文からは `/images/uploads/<ファイル名>` で参照します。
- **自動保存はありません。** 保存せずにタブを閉じると、書きかけは消えます。

### 初めて使うときの準備

一度だけ、次の3つを行います。

1. **GitHub の OAuth App を作ります。** GitHub の Settings → Developer settings → OAuth Apps → New OAuth App で、次のように入れます。
   - Homepage URL: `https://blog.neko3cs.net`
   - Authorization callback URL: `https://neko3cs-blog-cms-auth.neko3cs.workers.dev/callback`

   作ったら、Client ID と、「Generate a new client secret」の Client secret を控えます。
2. **受け口の Worker に、Client ID と Client secret を登録します。** Worker は `main` へのマージで自動デプロイされるので、デプロイされたあとに実行します（コマンドの実行中に、値を入力します）。

   ```bash
   pnpm exec wrangler secret put GITHUB_CLIENT_ID --config workers/cms-auth/wrangler.jsonc
   ```

   ```bash
   pnpm exec wrangler secret put GITHUB_CLIENT_SECRET --config workers/cms-auth/wrangler.jsonc
   ```
3. **`main` のルールセットに、自分を例外として足します。** `main` は「PR 必須」のため、このままだと、管理画面から直接コミットできません。GitHub の Settings → Rules → Rulesets → 「Protect main branch」→ Bypass list → Add bypass で、「Repository admin」を「Always」で足します。ブランチの削除と強制 push の禁止は、そのまま全員に効きます。

### Sveltia CMS を更新するとき

`public/admin/index.html` で、バージョンと `integrity` を一緒に変えます。公開から2週間ほど経ったバージョンを選びます。

```bash
curl -sL https://unpkg.com/@sveltia/cms@<バージョン>/dist/sveltia-cms.js | openssl dgst -sha384 -binary | openssl base64 -A
```

出てきた値の先頭に `sha384-` を付けたものが、`integrity` です。管理画面を更新したら、ログインと保存ができることを確かめてください。

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
