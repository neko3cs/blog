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
