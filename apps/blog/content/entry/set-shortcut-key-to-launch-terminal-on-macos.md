---
Title: macOSでTerminalを起動するショートカットキーを設定する
Category:
- macOS
Date: 2019-02-17T23:42:15+09:00
URL: https://blog.neko3cs.net/entry/set-shortcut-key-to-launch-terminal-on-macos
---

macOSでCLIをよく使うとターミナルをショートカットキーですぐに起動したい時があると思います。

なので、その設定方法を記載します。

ちなみに環境は以下です。

- MacBook Pro 2018
- macOS Mojave 10.14.3

## 手順

1. Automatorでサービスを登録しておく
2. 作成したサービスとショートカットキーの割り当て

## Automatorでサービスを登録しておく

ターミナルを起動するサービスは標準ではないみたいです。

なので、事前にターミナルを起動するサービスを作成します。

適当にSpotlightとかで**Automator.app**と検索するとAutomatorアプリが出ますので起動します。

<figure><img src="/images/20190217/20190217232956.png" alt="f:id:neko3cs:20190217232956p:plain" loading="lazy"></figure>

画像の**クイックアクション**を選択します。

<figure><img src="/images/20190217/20190217233208.png" alt="f:id:neko3cs:20190217233208p:plain" loading="lazy"></figure>

すると上記のような画面が出るので検索バーに「アプリ」とでも入力し、**アプリケーションを起動**を選択します。

ドロップダウンリストから起動したいアプリを選択します。最初は「連絡先.app」とかが設定されてると思います。

設定出来たら<strong>⌘ + S</strong>を押して保存します。保存名は自分がわかるもので。

## 作成したサービスとショートカットキーの割り当て

**システム環境設定 > キーボード > ショートカット**を開きます。

<figure><img src="/images/20190217/20190217233748.png" alt="f:id:neko3cs:20190217233748p:plain" loading="lazy"></figure>

上記の画面が開けたら、**サービス > 一般**に自分のつけた名前のサービスがあるはずです。

それに好みのショートカットキーを割り当ててください。

私はUbuntuに合わせてCtrl+Alt+Tにしようとしましたが、競合してしまったので**Ctrl+Alt+⌘+T**にしました。
