---
Title: 「Blazor+ローコードで実現する.NET資産のモダナイズ」に参加しました。
Category:
- .NET
- Blazor
- イベント参加
- ローコード/ノーコード
Date: 2024-07-04T17:31:19+09:00
URL: https://blog.neko3cs.net/entry/join-report-of-codeer-lowcode-blazor
---

久しぶりにオフラインのセミナーに参加しました。 Microsoftへ訪問するのは [2019 年のイベント](/entry/dotnet-core-3-seminar-report) 以来ですね。

[https://codeer.connpass.com/event/319762/](https://codeer.connpass.com/event/319762/)

参加しましたブログとして気になった点をメモしておきます。

## セミナーメモ

### Keynote

- .NET 開発者はWebフロント苦手説
  - WebFormの存在など
- Blazorはいいぞ
- OSSも充実してきている
- ノーコード/ローコードが流行ってる
  - コロナの影響も（by ChatGPT-4o）
- フルスクラッチとローコード/ノーコードは両立が難しい
- LowCode.Blazorであれば両立できる

### Codeer.LowCode.Blazor

[2024/07/04 Blazor+ローコードで実現する.NET資産のモダナイズ](https://www.slideshare.net/slideshow/2024-07-04-blazor-net/270071419)

- ノーコード、ローコード、プロコード全部混ぜられる
- 全部ぽとぺたでいける
- 画面と ~EFのエンティティ~ DBのテーブルを結び付けて ~EF~ テーブルの定義からフォーム画面を作れる<sup id="fnref-d9d882b7"><a href="#fn-d9d882b7">\*1</a></sup>
- ExcelやPDFの帳票への出力もノーコードで出来る
- ノーコードでのCSS対応はまだ未対応（今後対応するかも...？）

### 空のプロジェクトから始める Blazor

<div class="embed"><iframe src="https://speakerdeck.com/player/65a4342cb7244496839dbe69c5d1db28" width="710" height="399" style="aspect-ratio: 710 / 399" loading="lazy" allowfullscreen></iframe></div>

- `TimeProvider.System`
  - `DateTime.Now` とかの依存をうまく駆逐してくれる（便利）
- 1つのアプリでWeb APIとBlazorを共存出来る
  - URLのパターンで分けられる
- Blazorのコードに色がついてくれなかったら開き直すと色が付く
- `onclick` イベントは `@using Microsoft.AspNetCore.Components.Web` が必要
- Blazorは認証認可やCookieの設定など個別にASP.NET機能の実装を覚える必要がない
  - 他のASP.NET Coreと同じ仕組みに乗っているため

### Ignite UI で実現する Blazor アプリ時短開発

- `HttpClientFactory` -> `HCF` でインテリセンスが効く
- Visual Studioのスニペット便利
- .NET 8 Auto Render 対応！
- .NET Maui Blazor 対応！
- App Builder の Design to Code tool
  - 簡単に IgniteUI のアプリが作れる
  - Blazor, React, Angular, WebComponentどれにでもExportできる
  - Exportする前のものをプロトタイプとして共有することも出来る（Adobe XDっぽい）
  - 結構綺麗なコードが生成できる
  - Figmaとかからインポートして編集も出来る

### Codeer.LowCode.Blazor & CData ADO .NET Provider でDynamics 365やSAP、Salesforceなど各種SaaS とアプリを連携してみよう！

- 杉本さんAPI中毒
  - TeslaがAPI公開している！
- ノーコード/ローコードに重要なもの = メタデータ
- CData ADO .NET Provider / CData Driver
  - SaaSへ接続できるコネクタライブラリ
  - サーバーエクスプローラーからデータ接続できる
- Dynamic 365 のデータもT-SQLでアクセスが可能！
- Codeer.LowCode.Blazor でもコネクタを使用可能
  - Data Sourceで指定出来る

### パネルディスカッション

- .NET 9 では Blazorに関するアップデートが多い
  - Blazor は Microsoft も力を入れている
- Blazor Wasmのネックポイント
  - wasmはブラウザ内インタプリタ
  - ファイルもでかい
  - 如何にチューニングして早くするかは課題
    - 初期ロードは遅いが技術として使い物にならないわけではない
  - Auto-Renderモードにより高速化
    - ただし、若干複雑度は上がる

## 所感など

今日のセミナーではBlazorに関するノーコード/ローコードツールとしてCodeer.LowCode.BlazorとInfragisticsのAppBuilderDesign to Codeが紹介されました。 どちらも Blazor 実装にできるツールですが、前者はプロコードもサポートしている、後者はIgniteUIに特化していて、デザインの共有機能もあると特徴の違いを感じました。 個人的な感想ですが、後者は上流工程で、前者は下流工程で活躍しそうだなと思いました。 この辺りうまくAppBuilderで作ったプロジェクトをCodeer.LowCode.Blazorで編集できたりすると面白いなと思ったのでもう少し深掘りしてみたいです。 プロコードを書くプログラマーも楽したい時は楽したいのでこういうツールには今後も着目していきたいです。

---

<span id="fn-d9d882b7"></span>[*1](#fnref-d9d882b7): [EFではなく、DB直接見るそうです。認識間違ってました](https://x.com/StoneGuitar777/status/1808878753478758475)
