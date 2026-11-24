---
Title: 『C#エンジニアのための dockerコンテナ・kubernetesハンズオン (再)』に参加しました
Category:
- イベント参加
- Docker
- Kubernetes
- ASP.NET Core
Date: 2019-09-10T23:22:15+09:00
URL: https://blog.neko3cs.net/entry/docker-kubernetes-handson-for-csharp-engineers-report
---

『C#エンジニアのための dockerコンテナ・kubernetesハンズオン (再)』に参加しました。

[C#エンジニアのための dockerコンテナ・kubernetesハンズオン (再) (2019/09/10 19:00〜)](https://csharp-tokyo.connpass.com/event/142319/)

## やったこと

- ハンズオン
  - dockerによるaspnet coreアプリのホスト
  - kubernetesによるdockerコンテナの起動
- LTの聴講

## ハンズオン

ハンズオンは**Katacoda**というコンテナ技術の学習で推奨されているというオンライン上の開発環境で行いました。（Katacode知らなかった...）

[Katacoda - Interactive Learning Platform for Software Engineers](https://www.katacoda.com)

前半パートでdockerとkubernetesについて座学をおこない、 後半パートで実際にハンズオンをおこなうスタイルでした。

~（スライドは前回実施分のものですが、実際には少し説明スライドが追加されていました。）~

（最新のスライドが公開されましたので差し替えます。）

<div class="embed"><iframe src="https://www.slideshare.net/slideshow/embed_code/key/2pOPHN2zd6Wvc0" width="427" height="356" style="aspect-ratio: 427 / 356" loading="lazy" allowfullscreen></iframe></div>

<strong>[C#エンジニアのためのdocker kubernetesハンズオン （再）](https://www.slideshare.net/tanakata/cdocker-kubernetes-170605077 "C#エンジニアのためのdocker kubernetesハンズオン （再）")</strong> from <strong>[Takayoshi Tanaka](https://www.slideshare.net/tanakata)</strong>

私は最後の手動スケーリング以外は順調に進められ、概ねコンテナの舵を切る体験を得ることが出来ました。

本セミナー参加の目的はノータッチだったkubernetesの知見を得ることでしたが、どんなものか、どう操作するかの基本は理解出来たと思います。

筆者dockerもまだまだ知見が浅いので、行き着く先はAKSとかでkubernetes扱えるようになるまで、コンテナ技術のスキルが身につけられるように頑張りたいと思います。

## LTの聴講

### ふるかわ([@futa\_ttjh](https://twitter.com/futa_ttjh))さんのコンソールアプリのススメな話

<div class="embed"><iframe src="https://speakerdeck.com/player/f76be3606b2543e4bf9c9a964c9c931b" width="710" height="399" style="aspect-ratio: 710 / 399" loading="lazy" allowfullscreen></iframe></div>

XamarinとかASP.NETとかやってみたけど、やっぱりC#の勉強するならコンソールアプリからだよねっていう体験談を話して頂きました。 テストを書きたかったそうですが、フレームワークが絡むと難しい...、 コンソールアプリならシンプルでC#自身の学習とテストコードの記述がスッキリしました！とのことです。素晴らしい✨

### Tomohiro Suzuki([@hiro128\_777](https://twitter.com/hiro128_777))さんのSORACOM Buttonのお話

（資料が公開されたらここに貼ります）

SORACOM ButtonというIoTデバイスに関するお話。

[LTE-M Button - IoT プラットフォーム 株式会社ソラコム](https://soracom.jp/products/gadgets/)

...とここでハプニング！

肝心なSORACOM Buttonを忘れてしまったそうです...。 正直、これにより笑いがおき、内容が記憶から吹き飛んでしまいましたので**資料が公開されることを**期待しましょう！

確か、Azure Functionsと組み合わせてIoTなことをしてみたみたいな話だったと思います。(多分)
