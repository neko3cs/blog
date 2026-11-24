---
Title: TypeScript+Express+Viteを用いたモダン(？)なWeb APIアプリのボイラーテンプレートを作ってみました。
Category:
- TypeScript
- Vite
- expressjs
Date: 2023-03-09T08:00:00+09:00
URL: https://blog.neko3cs.net/entry/express-ts-with-vite-template
---

普段からTypeScriptを書いているとフロントエンドだけではなく、バックエンドもTypeScriptで書きたくなってきます。 なので、TypeScriptとExpressとViteを用いてボイラーテンプレートを作成してみました。

リンクは以下になります。

[GitHub - neko3cs/express-web-api-template: Template of express web api](https://github.com/neko3cs/express-web-api-template)

## 使い方

以下のツールがインストール済みなことが前提条件です。

- [Node.js](https://nodejs.org/ja/download/)
- [Yarn](https://yarnpkg.com/getting-started/install)

githubのREADMEにも記載しましたが、リポジトリ右上の「Use this template」からリポジトリを作成して使用します。

リポジトリを作成してクローンしたら、 `yarn install` でパッケージを取得します。

パッケージの取得が終わったら `yarn vite dev` などして動作確認してみてください。

## 内容について

### デフォルトのソースコード

デフォルトで一応動くアプリが展開される様にしています。

アプリは `http://{host_name}:3000/` で「Hello Express with TypeScript!」というメッセージを取得するAPIを用意しています。

また、 `http://{host_name}:3000/coffee/all` で JSON 形式でデータを取得するAPIを用意しています。

適宜、 `main.ts` と `routes/coffee.ts` を修正、削除するなりして使ってください。

### デフォルトで追加しているパッケージ

以下のパッケージが追加されています。

| パッケージ名 | 目的 |
| --- | --- |
| [express](https://github.com/expressjs/express) | Webアプリケーションフレームワークとして利用するため |
| [cors](https://github.com/expressjs/cors) | CORS対策のため |
| [express-validator](https://github.com/express-validator/express-validator) | バリデーションチェックのため |
| [node-fetch](https://github.com/node-fetch/node-fetch) | サンプルAPI呼出のため |
| [typescript](https://github.com/microsoft/TypeScript) | 開発言語として利用するため |
| [vite](https://github.com/vitejs/vite) | ビルドツールとして利用するため |
| [vite-plugin-node](https://github.com/axe-me/vite-plugin-node) | viteを用いてNode.jsアプリケーションをホストするため |

また、その他型情報（ `@types/*` ）も追加しています。

## 作ってみた感想など

Viteはフロントエンド向けのビルドツールだからかデフォルトではExpressはサポートされていない様です。

なので、今回は [axe-me/vite-plugin-node](https://github.com/axe-me/vite-plugin-node) というライブラリを用いて、Vite で Express アプリをビルド、実行出来るテンプレートを作成してみました。

よく使う、特殊な構成のアプリケーションはテンプレート化しておくと後で開発効率が上がるので今後も必要に応じてボイラーテンプレートを作ってみようと思います。

今回作ったものは割と深夜テンションで一気に作ったので粗があるかもしれません。

また、時間を見て見直したいと思います。
