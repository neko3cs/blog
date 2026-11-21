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
| SSG | **Astro**（推奨）または Angular SSG | Astro は Markdown ブログ向けの Content Collections、RSS、sitemap が揃っており、記事98件規模では最も手間が少ないため。ポートフォリオと技術を揃えたい場合は Angular でも実現できる |
| ホスティング | **Cloudflare Workers (Static Assets)** または Pages | 新規なら Workers を推奨（Pages は Workers への統合が進んでいる）。どちらでも無料枠に収まる |
| 画像 | リポジトリ同梱（`public/images/`）または R2 | 98記事分なら同梱で十分。容量が大きくなったら R2 |
| ソース管理 | このリポジトリ（`neko3cs/blog`） | GitHub 連携で push 時に自動デプロイ |

### URL維持のための設定（最重要）

はてなのURLは末尾スラッシュなしです。Cloudflare の静的配信は既定で `/foo/index.html` を `/foo/` へ 308 リダイレクトするため、**そのままではURLが変わってしまいます**。次のいずれかで回避します。

- **案1（推奨）**: Astro を `build.format: 'file'` と `trailingSlash: 'never'` に設定し、`entry/2020/03/30/002449.html` の形で出力する。Cloudflare は `/entry/2020/03/30/002449` へのリクエストに `.html` を補って返す。
- **案2**: ディレクトリ形式で出力し、Workers の `assets.html_handling = "drop-trailing-slash"` を設定する。

`povo2.0` のように `.` を含む slug が拡張子と誤認されないかは、**プレビュー環境で必ず実機確認**します（第6章の検証スクリプトの対象）。誤認される場合は、該当パスだけ Worker でルーティングします。

## 4. URL マッピング方針

| 旧URL | 新サイトでの扱い |
| --- | --- |
| `/entry/...`（98件） | **完全に同一パスで 200**。ここは妥協しない |
| `/` | トップ（記事一覧） |
| `/about` | 同一パスで再現 |
| `/archive`, `/archive/YYYY`, `/archive/YYYY/MM` | 同一パスで生成（静的に生成できる） |
| `/archive/category/<名前>` | 原則は同一パスで生成。ただし `ローコード/ノーコード` は名前に `/` を含み、静的ファイルにできない → このカテゴリだけ Worker で処理するか、新パスへ 301 |
| `/feed`, `/rss` | **同一パスで維持**（購読者が離れないように）。拡張子のないファイルになるため、`_headers` で `Content-Type` を明示する |
| `/sitemap.xml` | 新サイトで生成し、全記事URLを含める |
| `?page=N` などのクエリ | 一覧のページ送りなので SEO 上の重要度は低い。無視してトップを返す |
| `/entry/amp/...` | 現状でも 404 なので対応不要 |

カテゴリページと日付アーカイブは検索流入がほぼないはずです。再現が面倒なものは 301 で逃がしても問題ありません。**記事URLだけは100%維持します。**

## 5. 記事データの取り出しと変換

### 5.1 エクスポート

- **第一候補: [blogsync](https://github.com/x-motemen/blogsync)**（はてなブログ AtomPub API のクライアント）
  - 記事を**書いたときの記法のまま**（Markdown / はてな記法）取得できる
  - frontmatter に `URL`、`Date`、`Category`、`Draft`、`EditURL` が入る。**URL の情報をそのまま新サイトのパスに使える**
  - 出力されるファイルパスがURL構造と一致する（`entry/2020/03/30/002449.md`）
- 補助: 管理画面の「エクスポート」（Movable Type 形式）。HTML 本文とコメントを含むので、バックアップとして必ず取っておく。

### 5.2 記法の変換（スクリプトで一括処理）

| はてな独自の記法 | 変換後 |
| --- | --- |
| `[f:id:neko3cs:20240806155326p:plain]` | `![](/images/20240806/20240806155326.png)` |
| `[https://...:embed:cite]` | リンクカードのコンポーネント、または通常のリンク |
| `[:contents]` | 目次コンポーネント（Astro なら `remark-toc` など） |
| `((脚注))` | Markdown の脚注 `[^1]` |
| はてな記法（`>|cs|...||<` など） | Markdown のコードブロック。古い記事に多いので重点的に確認する |
| 「見たまま」モードの記事 | 公開済み HTML から本文を抽出し、Markdown に変換する（turndown など） |

各記事で**変換前後の本文テキストの差分**を機械的にチェックし、文章が消えていないことを確認します。

### 5.3 画像

1. 全記事から fotolife の URL を抽出してダウンロードする
2. `public/images/YYYYMMDD/<id>.<ext>` に配置し、本文の参照を書き換える
3. はてなが生成していた OGP 画像の代わりに、記事ごとの OGP 画像を自前で生成する（`astro-og-canvas` など）か、共通画像を使う

### 5.4 SEO メタ情報の引き継ぎ

- `<title>`、`meta description`、`canonical`、`og:*` を各記事で**旧サイトと同じ値**にする
- 公開日時（`Date`）を維持し、構造化データ（`BlogPosting`）に入れる
- Google Analytics / Search Console の計測タグを使っていれば、同じ ID を埋め込む

### 5.5 失うもの（あらかじめ受け入れる）

- はてなスター、はてなブックマーク数の表示（ブクマ自体はURLが同じなので残る）
- 読者登録（はてなの購読機能）。RSS 購読は `/feed`、`/rss` を維持すれば続く
- コメント。MT エクスポートから静的 HTML として残すか、捨てるかを決める

## 6. 移行手順

### Phase 0: 棚卸し（ベースラインの記録）

- [ ] sitemap から全URLのリストを `migration/urls.txt` に保存する（今回の調査で取得済み: 98件と記事以外のページ）
- [ ] 各URLの `title` / `canonical` / ステータスコードを CSV に記録する（切り替え後の比較用）
- [ ] Search Console で流入の多い上位ページを確認し、重点確認リストを作る
- [ ] MT 形式のエクスポートを取得し、バックアップとして保存する

### Phase 1: エクスポートと変換

- [ ] blogsync で全記事を取得する
- [ ] 変換スクリプトで記法を変換し、画像をダウンロードする
- [ ] Astro の Content Collection に取り込む（記事のパスは frontmatter の `URL` から決める）

### Phase 2: サイト構築

- [ ] Astro のプロジェクトを作成する（記事ページ、一覧、アーカイブ、カテゴリ、about、feed、rss、sitemap）
- [ ] デザイン（ポートフォリオとトーンを揃える）
- [ ] Cloudflare Workers に `*.workers.dev` でデプロイする（この時点では本番ドメインに触れない）

### Phase 3: 検証（切り替え前）

- [ ] **URL 検証スクリプト**: `urls.txt` の全パスを `*.workers.dev` に投げて、次の4点を確認する
  - ステータスが 200 であること（301/308/404 は不合格）
  - 最終URLのパスが元と完全に一致すること
  - `canonical` が `https://blog.neko3cs.net/<同じパス>` であること
  - `title` が Phase 0 の記録と一致すること
- [ ] `.` を含む slug、日本語カテゴリ、`/feed`、`/rss` の Content-Type を個別に確認する
- [ ] 重点確認リストの記事を目視で確認する（コードブロック、画像、埋め込み）
- [ ] プレビュー環境は `noindex` にして、重複コンテンツとしてクロールされないようにする

### Phase 4: 切り替え（DNS スイッチ）

1. DNS の TTL がすでに 300 秒であることを確認する（現状 300 のため変更不要）
2. Cloudflare ダッシュボードで、既存の `blog` CNAME（→ `hatenablog.com`）を削除し、すぐに Worker のカスタムドメインに `blog.neko3cs.net` を追加する
3. 本番ドメインに対して Phase 3 の検証スクリプトを再実行する
4. プレビュー用の `noindex` が本番に残っていないことを確認する

切り替え中は、旧サイトも新サイトも同じURLで同じ内容を返します。**ダウンタイムも 404 も発生しません。**

### Phase 5: はてな側の後処理

- [ ] 新サイトが1〜2週間安定してから、はてなブログを**「非公開」**にする
  - 独自ドメインの設定を外すだけだと、はてなのサブドメイン（`*.hatenablog.com` など）で同じ記事が公開されてしまい、**重複コンテンツになる**。必ず非公開にする
- [ ] はてなブログProの**自動更新を停止**する（解約は契約期間の満了時に効く。切り替えとPro期限が重ならないよう、余裕をもって進める）
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
| 末尾スラッシュへのリダイレクトでURLが変わる | 大 | `build.format: 'file'` または `drop-trailing-slash` を使い、検証スクリプトで 30x を不合格にする |
| `.` を含む slug が正しく配信されない | 大（該当2記事） | プレビューで実機確認する。だめなら Worker でルーティング |
| はてな記法の変換漏れで本文が崩れる | 中 | 本文テキストの差分チェックと、重点記事の目視確認 |
| はてなを非公開にし忘れ、サブドメインで重複公開される | 中 | Phase 5 のチェックリストに入れる |
| 画像の取りこぼし（fotolife の参照が残る） | 中 | ビルド時に `st-hatena.com` への参照が残っていたら失敗させる |
| `/` を含むカテゴリURL | 小 | Worker で処理するか、301 で逃がす |
| RSS 購読者が離れる | 小 | `/feed`、`/rss` を同じパスで維持する |

## 8. 次にやること

1. SSG を Astro と Angular のどちらにするか決める
2. blogsync でエクスポートを試し、記法の分布（Markdown / はてな記法 / 見たまま）を把握する
3. Phase 0 のベースライン記録スクリプトを作成する
