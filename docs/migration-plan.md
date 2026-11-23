# はてなブログPro → Cloudflare 移行計画

`https://blog.neko3cs.net/` を、URL を一切変えずにはてなブログProから自作の静的サイト（Cloudflare）へ引っ越すための計画です。

## 1. 結論

**URL を完全に維持したまま移行できます。** 理由は次の2点です。

- `blog.neko3cs.net` は自分のドメインです。はてなのドメインを借りているわけではありません。
- `neko3cs.net` の DNS はすでに Cloudflare にあります（NS: `andronicus/bonnie.ns.cloudflare.com`）。

検索エンジンから見れば「同じURLで、同じ内容が、別のサーバーから返ってくる」だけになります。301リダイレクトも不要です。ドメインを変える移行とは違い、評価をリセットされる心配はほぼありません。

守ることは次の2つだけです。

1. **既存のURLすべてで同じパスのまま 200 を返す**（末尾スラッシュの有無、大文字小文字、`.` を含むパスまで完全に一致させる）
2. **切り替え前に新サイトで全URLを機械的に検証してから、DNS を切り替える**

## 2. 現状調査（2026-11-21 時点）

| 項目 | 内容 |
| --- | --- |
| DNS | `blog.neko3cs.net CNAME hatenablog.com`（TTL 300）、Cloudflare管理 |
| 記事数 | 98件（sitemap より） |
| 記事URL形式A | `/entry/YYYY/MM/DD/HHMMSS` … 55件（主に2018〜2020年） |
| 記事URL形式B | `/entry/<カスタムslug>` … 43件 |
| 要注意 slug | `.` を含むもの: `change-to-povo2.0-from-ahamo`, `publishing-pssqlbulkcopy-1.0.0.0` |
| 記事以外のページ | `/`, `/about`, `/archive`, `/archive/YYYY/MM`, `/archive/category/<名前>`, `/feed`(Atom), `/rss`(RSS2.0) |
| カテゴリ名 | 日本語、空白（`SQL Server`）、`#`（`C#`）、**`/`（`ローコード/ノーコード`）** を含む |
| 末尾スラッシュ | すべて**なし** |
| canonical | 記事URLそのまま（例: `https://blog.neko3cs.net/entry/change-to-povo2.0-from-ahamo`） |
| 画像 | はてなフォトライフ `cdn-ak.f.st-hatena.com/images/fotolife/n/neko3cs/...` |
| OGP画像 | はてなが自動生成したもの `ogimage.blog.st-hatena.com/...` |
| AMP | 無効（`/entry/amp/...` は 404） |

ポートフォリオサイト（`neko3cs/portfolio-site`）は Angular 21 の SSG（`outputMode: static`）を Cloudflare Pages で配信しています（`public/_redirects` あり）。

## 3. 技術構成

| 層 | 採用案 | 理由 |
| --- | --- | --- |
| SSG | **Analog 2.9（Angular 22）**（採用） | 作者が Angular を好んで書いており、技術者ブログとして「Angular で作ったブログ」であることに意味があるため。Astro と同じ記事ページを試作して比較したうえで決定した（3.1 参照） |
| ホスティング | **Cloudflare Workers (Static Assets)** | 静的ファイルだけを配信する。無料枠に収まる |
| 画像 | リポジトリ同梱（`public/images/`）または R2 | 98記事分なら同梱で十分。容量が大きくなったら R2 |
| ソース管理 | このリポジトリ（`neko3cs/blog`） | GitHub 連携で push 時に自動デプロイ |

### 3.1 SSG の選定（Astro と Analog の比較）

画像のない記事1件（`/entry/how-to-disconnect-sql-server-db-connection`）を題材に、Astro と Analog で同じ記事ページを試作して比較した。

| 観点 | Astro | Analog |
| --- | --- | --- |
| URL の維持 | ✅ | ✅（同じ挙動） |
| title / description / canonical | ✅ はてなと一致 | ✅ はてなと一致 |
| ブラウザに送る JS | ほぼ 0 | 約 300KB（転送量 約 94KB。Angular と Router の本体） |
| コード量（設定とページ部分） | 約 190 行 | 約 320 行 |
| 作者が読み書きしやすいか | × | ◎ |

Astro はブログ向けの機能が揃っていて手間が少ないが、作者にとって読みにくい。Analog は自分で書くコードが少し増えるものの、できないことはない。ブログを自分で育て続けることを重視し、Analog を採用した。

### 3.2 URL維持のための設定（最重要）

はてなのURLは末尾スラッシュなしです。Cloudflare の静的配信は既定で `/foo/index.html` を `/foo/` へリダイレクトするため、**そのままではURLが変わってしまいます**。

Analog（Nitro）のプリレンダー設定 `prerender.autoSubfolderIndex: false` で、`entry/2020/03/30/002449.html` の形で出力します。Workers の `assets.html_handling = "auto-trailing-slash"` により、`/entry/2020/03/30/002449` へのリクエストに `.html` を補って返します。

試作で確認した挙動は次のとおりです（`wrangler dev`）。

| リクエスト | 結果 |
| --- | --- |
| `/entry/<slug>` | 200 |
| `/entry/<slug>/`、`/entry/<slug>.html` | `/entry/<slug>` へ 307 |
| 存在しないURL | 404 |

`povo2.0` のように `.` を含む slug が拡張子と誤認されないかは、`change-to-povo2.0-from-ahamo` で `wrangler dev` 上は問題ないことを確認済みです。本番の Cloudflare でも、第6章の検証スクリプトで改めて確認します。

### 3.3 Analog の実装上の注意点（試作で判明）

| 注意点 | 対応 |
| --- | --- |
| `src/content/` 以下の Markdown は、同じパスのルートとして自動登録され、自作の `/entry/**` ページより優先される | 記事は `content/entry/` に置く。ファイルパスを はてなのURLパスと一致させる（blogsync の出力構造と同じ） |
| catch-all ルート（`[...path].page.ts`）は親子2段のルートとして登録され、ページ自身の `ActivatedRoute` からは URL のパスが取れない | `ActivatedRoute.pathFromRoot` のすべての URL 断片を連結する |
| Analog 2.9 は Markdown の変換とハイライトをビルド時に行い、実行時の `ContentRenderer` は何もしない。`MarkdownComponent` に Markdown を渡すと、変換前のテキストがそのまま出力される | `import.meta.glob` で `?analog-content-file=true` を付けて読み込み、ビルド時に変換済みの HTML を受け取る |
| プリレンダーは非同期の読み込みを待たない場合がある | 記事の読み込みを `PendingTasks.run()` で包む |
| 記事本文までハイドレーションすると、Markdown 処理や Shiki の JS（約 540KB）がブラウザに送られる | 記事を `@defer (hydrate never)` で囲み、ブラウザでは再実行しない（`withIncrementalHydration()` が必要） |
| `format: 'file'` 相当の出力では、canonical に `.html` が付く恐れがある（Astro の試作で発生） | canonical は記事のパスから組み立て、ビルド時の URL には頼らない |
| `prerender.routes` の `contentDir` は、既定でサブフォルダを探さない。日付形式の記事（`entry/2020/03/30/002449`）が漏れる | 記事を読み込んでプリレンダーするルートを自分で列挙する（`src/server/entries.ts`） |
| `@defer` で囲む部品と同じ `import` 文で型も読み込むと、その部品が遅延読み込みの対象から外れ、ブラウザに送られる | 型は `import type` で分けて読み込む |
| 404 ページはどのURLでも同じ HTML が返るため、ブラウザで Angular を起動するとハイドレーションが合わない | `postRenderingHooks` で 404.html から JS の読み込みを取り除く |
| Nitro は「#」などをエンコードしたままのファイル名（`C%23.html`）で書き出すが、Cloudflare はデコードした名前（`C#.html`）を探す | `postRenderingHooks` でファイル名をデコードしてから書き出す |
| プリレンダー時、Nitro は `C%23` をもう一度エンコードして（`C%2523`）リクエストするため、ページには `C%23` が届く | カテゴリページで、受け取った名前をもう一度デコードする |
| ビルドで出力フォルダが作り直されるため、起動中の `wrangler dev` は配信ファイルを見失う | ビルドのたびに `wrangler dev` を起動し直す（`pnpm preview` はビルドしてから起動する） |

## 4. URL マッピング方針

| 旧URL | 新サイトでの扱い |
| --- | --- |
| `/entry/...`（98件） | **完全に同一パスで 200**。ここは妥協しない |
| `/` | トップ（記事一覧） |
| `/about` | 同一パスで再現 |
| `/archive`, `/archive/YYYY`, `/archive/YYYY/MM`, `/archive/YYYY/MM/DD` | 同一パスで生成（静的に生成できる）。日別のアーカイブも Search Console の検索結果に載っていたため用意した |
| `/archive/category/<名前>` | 同一パスで生成（`C%23`、`SQL%20Server`、`.NET` も確認済み）。ただし `ローコード/ノーコード` は、はてなの `%2F` 付きURLを Cloudflare が `/` 区切りのURL（`/archive/category/ローコード/ノーコード`）へ 307 でリダイレクトする。そのため、このカテゴリだけはリンクと canonical を `/` 区切りのURLにした |
| `/feed`, `/rss` | **同一パスで維持**（購読者が離れないように）。拡張子のないファイルになるため、`_headers` で `Content-Type` を明示する（確認済み）。本文は要約のみで、全文は載せない |
| `/sitemap.xml` | 新サイトで生成し、トップ・about・一覧ページと全記事のURLを含める |
| 存在しないURL | 404 ページをステータス 404 で返す（`not_found_handling: "404-page"`） |
| `?page=N` などのクエリ | 一覧のページ送りなので SEO 上の重要度は低い。無視してトップを返す |
| `/entry/amp/...` | 現状でも 404 なので対応不要 |

カテゴリページと日付アーカイブは検索流入がほぼないはずです。再現が面倒なものは 301 で逃がしても問題ありません。**記事URLだけは100%維持します。**

## 5. 記事データの取り出しと変換

### 5.1 取り出し方（公開ページの HTML から変換）

当初は [blogsync](https://github.com/x-motemen/blogsync)（はてなの AtomPub API）で原稿を取得する予定だったが、**公開ページの HTML から変換する方法**に変更した（Issue #4）。

- はてなの API キーが不要
- Markdown・はてな記法・見たまま、どの書き方で書いた記事も公開ページの HTML は同じ形式なので、**1つの変換で全記事を扱える**
- 変換結果が「読者が見ていた内容」と一致するので、照合しやすい
- 代わりに、Markdown は HTML から作り直したものになり、元の原稿とは細部の書き方が変わる（表示の内容は同じ）
- 下書きと限定公開の記事は公開ページがないため取得できない（URL を維持する必要もない）

取得漏れがないことは、sitemap（98件）と、はてなの記事一覧ページ（`/archive?page=N`、98件）を照合して確認した。about ページの「ブログ投稿数 98 記事」とも一致する。

`pnpm import:hatena`（`scripts/import-hatena.mjs`）が、`migration/baseline.csv` の全記事の HTML を取得し（`migration/.cache/html/` に保存。Git の管理外）、`content/entry/<URLのパス>.md` に書き出す。frontmatter は blogsync と同じ形式（`Title`・`Category`・`Date`・`URL`）。

### 5.2 変換の規則

| はてなの HTML | 変換後 |
| --- | --- |
| はてなキーワードの自動リンク | 文字だけ残す |
| コードブロック（`pre.code`） | 言語付きのコードブロック。言語名は Shiki の名前に揃える（`sh`→`shellscript` など） |
| フォトライフの画像 | ダウンロードして `public/images/<日付>/` に置く。キャプション付き（`figure`）は HTML の `figure` で残す |
| はてなのリンクカード | 記事タイトル付きのリンク。直後の引用元表記（`hatena-citation`）は取り除く |
| SlideShare・Speaker Deck | iframe のまま残し、元の縦横比を `aspect-ratio` で指定する |
| X（Twitter）の埋め込み | 引用（blockquote）として本文を残す。読み込み用のスクリプトは取り除く |
| 脚注 | はてなと同じ「*1」形式で、本文の参照と注を相互にリンクする（marked が Markdown の脚注に対応していないため HTML で書く） |
| 目次 | 取り除く（1記事のみ） |
| Gist | Gist へのリンク（1記事のみ） |
| 見出し | 本文に h1 がある記事は、記事タイトル（ページの h1）と重ならないよう1段ずつ下げる |
| 自分のブログへのリンク | サイト内のパス（`/entry/…`） |
| 本文中の `<` と `~` | エスケープする（`IEnumerable<T>` の `<T>` がタグとして消える、`~です~` が取り消し線になるのを防ぐ） |
| 太字・斜体 | 内側の端が記号のときは HTML の `<strong>`・`<em>` にする（Markdown の仕様では `**『…』**です` が太字にならないため） |
| タイトル | 前後の空白も残す（末尾に空白のある記事があり、はてなの title と完全に一致させるため） |

`pnpm check:content`（`scripts/check-content.mjs`）で、**はてなの本文の文がすべて新サイトの本文にあるか**を全記事で照合する（98記事で見つからない文 0件を確認済み）。

### 5.3 画像

1. 本文のフォトライフの画像（91枚、約11MB）をダウンロードし、`public/images/YYYYMMDD/<id>.<ext>` に置いた（対応済み）
2. Zenn など外部に置いた画像（3枚）は、元のURLのまま参照する
3. はてなが生成していた OGP 画像の代わりに、記事ごとの OGP 画像をビルド時に生成する（対応済み。`scripts/generate-og-images.mjs` が satori と resvg で `/og/entry/<記事のパス>.png` を作る。それ以外のページは共通の `/og/default.png`）

### 5.4 SEO メタ情報の引き継ぎ

- `<title>`、`meta description`、`canonical`、`og:*` を各記事で**旧サイトと同じ値**にする
- 公開日時（`Date`）を維持し、構造化データ（`BlogPosting`）に入れる（対応済み。記事ページには `BlogPosting` と、はてなと同じ構成の `BreadcrumbList`、トップページには `WebSite` を入れた。Google のリッチリザルトテストは公開URLが必要なため、切り替え前の `*.workers.dev` で確認する）
- Google Analytics は、はてなブログの head に入れていた測定 ID（`G-55DR4SK29F`）をそのまま引き継ぎ、全ページに埋め込む（対応済み）
- 広告（Google アドセンス）は今は載せない。about の広告についての記載は、将来載せる可能性があるため残す。載せる場合は、はてなの head に入れていたアドセンスのタグを移す

### 5.5 失うもの（あらかじめ受け入れる）

- はてなスター、はてなブックマーク数の表示（ブクマ自体はURLが同じなので残る）
- 読者登録（はてなの購読機能）。RSS 購読は `/feed`、`/rss` を維持すれば続く
- コメント。移行しない（新サイトにコメント機能がないため）。必要なら MT エクスポートから静的 HTML として残す
- 表の列の揃え（中央揃えなど）。内容は同じだが、左揃えで表示される

## 6. 移行手順

### Phase 0: 棚卸し（ベースラインの記録）

- [x] sitemap の全URLと `/archive`、`/feed`、`/rss` の計103件について、ステータス・title・canonical を `migration/baseline.csv` に記録する（`pnpm baseline`。2026-11-22 に記録、すべて 200）
- [x] Search Console で流入の多い上位ページを確認し、重点確認リストを作る（`migration/search-console-pages.csv`。直近12か月の97件。クリックの約7割が `/entry/work-with-depression-2-times-2026` に集中）
- [x] Search Console のプロパティと所有権の確認方法を確認する（「ドメイン」プロパティ `blog.neko3cs.net` を DNS で確認済み。切り替えの対応は不要）
- [ ] MT 形式のエクスポートを取得し、バックアップとして保存する

### Phase 1: エクスポートと変換

- [x] 全98記事の公開ページの HTML を取得する（`pnpm import:hatena`）
- [x] 変換スクリプトで Markdown に変換し、画像をダウンロードする
- [x] `content/entry/<URLのパス>.md` として配置する
- [x] 本文の文章が欠けていないことを照合する（`pnpm check:content`。見つからない文 0件）
- [x] はてなの全URL（103件）が新サイトでも一致することを確認する（`pnpm check:urls`。title・canonical まで一致）
- [x] 全ページ（329件）がスマホ幅で横にはみ出さないことを確認する

### Phase 2: サイト構築

- [x] Analog のプロジェクトを作成し、記事ページを実装する（試作で1件分を実装済み）
- [x] トップ、記事一覧、年別・月別・カテゴリ別の一覧、about、404 を実装する
- [x] `/feed`（Atom）と `/rss`（RSS 2.0）を Nitro のサーバールートで実装し、プリレンダーで静的ファイルにする
- [x] sitemap を Nitro のサーバールートで生成する（載せるページを選び、記事に更新日時を付けるため、Analog の `prerender.sitemap` は使わない）
- [x] デザイン（ポートフォリオとトーンを揃える）
- [x] Cloudflare Workers に `*.workers.dev` でデプロイする（この時点では本番ドメインに触れない）。2026-11-23 に `pnpm build && pnpm exec wrangler deploy` で `https://neko3cs-blog.neko3cs.workers.dev` にデプロイした

### Phase 3: 検証（切り替え前）

- [x] **URL 検証スクリプト**（`pnpm check:urls <URL>`）: `migration/baseline.csv` の全パスを `*.workers.dev` に投げて、次の5点を確認する（2026-11-23、103件すべて一致）
  - ステータスが 200 であること（301/308/404 は不合格）
  - 最終URLのパスが元と完全に一致すること
  - `canonical` が `https://blog.neko3cs.net/<同じパス>` であること
  - `title` が Phase 0 の記録と一致すること
  - `noindex` が、`*.workers.dev` では付いていて、それ以外（本番・ローカル）では付いていないこと
- [x] `.` を含む slug、日本語カテゴリ、`/feed`、`/rss` の Content-Type を個別に確認する（`.` を含む2記事、`シェル`・`SQL Server`・`.NET`・`C#`・`ローコード/ノーコード`、日別アーカイブが 200。フィードは `application/atom+xml`・`application/rss+xml`）
- [x] 重点確認リストの記事を目視で確認する（コードブロック、画像、埋め込み）。2026-11-23 に `*.workers.dev` で確認した
  - Search Console の流入上位7記事: 画像（計5枚）がすべて 200 で表示され、コードブロックは Shiki でハイライトされ、Markdown の記号が本文に残っていない
  - Speaker Deck の埋め込みとリンクカードのある記事（`join-report-of-codeer-lowcode-blazor`）: 埋め込みが 16:9 で表示される
  - 流入1位の `work-with-depression-2-times-2026`: スマホ幅（375px）で横にはみ出さない
- [x] プレビュー環境は `noindex` にして、重複コンテンツとしてクロールされないようにする（`public/_headers` で `*.workers.dev` のホストにだけ `X-Robots-Tag: noindex` を付ける。本番のホストには付かないので、切り替え時に外す作業はない）
- [ ] Google のリッチリザルトテストで、記事ページの構造化データを確認する

> Node の `fetch` はプロキシの環境変数を見ないため、プロキシ越しに検証するときは `NODE_USE_ENV_PROXY=1 pnpm check:urls <URL>` とする。

### Phase 4: 切り替え（DNS スイッチ）

2026-11-23 に切り替えた。CNAME を削除してカスタムドメインを追加する方法だと、証明書の発行まで一時的につながらなくなる恐れがある。そのため、**既存の CNAME のプロキシをオンにし、Worker のルートで受ける方法**にした。`*.neko3cs.net` の証明書はすでにあるので、つながらない時間が出ない。

1. [x] `wrangler.jsonc` に `blog.neko3cs.net/*` のルートを追加してデプロイする（プロキシがオフのあいだは効かない。はてなが応答し続けることを確認した）
2. [x] Cloudflare ダッシュボードで、`blog` の CNAME（→ `hatenablog.com`）の **Proxy status をオン**にする。この時点から Worker が応答する
3. [x] 本番ドメインに対して Phase 3 の検証スクリプトを再実行する（`pnpm check:urls https://blog.neko3cs.net`。103件すべて一致）
4. [x] プレビュー用の `noindex` が本番に残っていないことを確認する（3. の検証スクリプトで確認した）
5. [x] そのほかに確認したこと：`/feed`・`/rss` の Content-Type、存在しないURLの 404、`http://` から `https://` への 301、`neko3cs.hatenablog.com` から新サイトへの 301
6. はてなの独自ドメインの設定は**外さない**。設定があるあいだ、はてなのサブドメイン（`neko3cs.hatenablog.com`）は `blog.neko3cs.net` へ 301 でリダイレクトする（2026-11-23 に確認）。DNS が新サイトを向けば、はてなには `blog.neko3cs.net` へのリクエストが届かないので、URL は衝突しない。外すとサブドメインで記事が公開され、重複コンテンツになる

切り替え中は、旧サイトも新サイトも同じURLで同じ内容を返します。**ダウンタイムも 404 も発生しません。**

**戻し方**: 問題があれば、`blog` の CNAME のプロキシをオフに戻す。すぐに、はてなからの配信に戻る。

**あとで片付けること**: CNAME の向き先として `hatenablog.com` が残っている（プロキシがオンなので、はてなにはアクセスが届かない）。はてなを非公開にしたあと、Worker のカスタムドメインに移すか、向き先をダミーのレコードに替える。`www.neko3cs.net` も `CNAME hatenablog.com` のまま使われていなかった。ほかの人がはてなで独自ドメインに設定すると乗っ取られる恐れがあるため、2026-11-23 に削除した。

### Phase 5: はてな側の後処理

- [ ] 新サイトが1〜2週間安定してから、はてなブログを**「非公開」**にする
  - 独自ドメインの設定を外すだけだと、はてなのサブドメイン（`*.hatenablog.com` など）で同じ記事が公開されてしまい、**重複コンテンツになる**。必ず非公開にする
  - Pro の期限が切れると独自ドメインの機能も止まり、サブドメインで記事が公開される恐れがある（未確認）。**Pro の期限（2027-08-02）より前に**非公開にする
- [x] はてなブログProの**自動更新を停止**する（2026-11-23 に解約手続きを済ませた。Pro の有効期限は 2027-08-02 で、この日の自動更新時に解約が完了する。期限までは Pro の機能を使える）
- [ ] はてなのアカウント自体はしばらく削除せず、保険として残す

### Phase 6: 切り替え後の監視

- [ ] Search Console に新しい `sitemap.xml` を送信する（プロパティは同じドメインなのでそのまま使える）
- [ ] 主要記事を「URL検査」でインデックス登録をリクエストする
- [ ] Search Console のカバレッジと、Cloudflare の 404 ログを2〜4週間監視する
- [ ] 検索順位と表示回数を切り替え前と比べる
- [ ] ポートフォリオサイトの「Blog」リンクの表記を「はてなブログ」から変更する

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 末尾スラッシュへのリダイレクトでURLが変わる | 大 | `prerender.autoSubfolderIndex: false` で `.html` 形式で出力し、検証スクリプトで 30x を不合格にする |
| Analog のバージョンアップで内部の挙動が変わる（3.3 の回避策が効かなくなる） | 中 | バージョンを固定し、更新時は検証スクリプトで全記事を確認する |
| `.` を含む slug が正しく配信されない | 小（該当2記事。`wrangler dev` では問題なし） | 本番でも検証スクリプトで確認する。だめなら Worker でルーティング |
| 変換漏れで本文が崩れる | 小（全98記事で照合済み） | `pnpm check:content` で本文の文を全記事照合し、重点記事を目視で確認した |
| はてなを非公開にし忘れ、サブドメインで重複公開される | 中 | Phase 5 のチェックリストに入れる |
| 画像の取りこぼし（fotolife の参照が残る） | 小（対応済み） | 取り込み後の Markdown に `st-hatena.com` への参照が0件であることを確認した |
| SlideShare・Speaker Deck の埋め込みが表示されない | 小（13件。確認済み） | 13件とも埋め込み先が 200 を返し、iframe での表示を禁止していないことを確認した。ローカルのプレビューでもスライドが表示された（`loading="lazy"` のため、画面に近づくまで読み込まれない） |
| `/` を含むカテゴリURL | 小 | Worker で処理するか、301 で逃がす |
| RSS 購読者が離れる | 小 | `/feed`、`/rss` を同じパスで維持する |

## 8. 次にやること

1. ~~Cloudflare Workers にデプロイして切り替える（#5）~~（2026-11-23 に切り替えた）
2. Search Console に sitemap を送信し、2〜4週間監視する（Phase 6）
3. 新サイトが1〜2週間安定したら、はてなブログを非公開にする（Phase 5。Pro の自動更新は停止済みで、期限は 2027-08-02）
4. 新サイトが1〜2週間安定したら、`blog` の CNAME の向き先（`hatenablog.com`）を片付ける

`.` を含む slug（`change-to-povo2.0-from-ahamo`）は取り込んで確認済み。拡張子と誤認されず、他の記事と同じく 200 を返し、末尾スラッシュ付きと `.html` 付きは本来のURLへリダイレクトされた。
