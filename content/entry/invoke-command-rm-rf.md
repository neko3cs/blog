---
Title: Invoke-Commandで rm -rf / した話
Category:
- PowerShell
- PowerShell Core
- WinRM
- 備忘録
Date: 2023-03-18T17:15:04+09:00
URL: https://blog.neko3cs.net/entry/invoke-command-rm-rf
---

社内のテスト用サーバーを `rm -rf /` して吹き飛ばしました。

今回は社内ですみましたが、本番環境でやっていたらと思うと恐ろしいです。

同じミスを起こさない様にブログに記録しておこうと思います。

## 経緯

私はとある担当システムでパフォーマンスの分析のために毎月初営業日にインターネットに接続していない本番環境からパフォーマンスを図るためのデータを取得しています。

現在その作業がすべて手作業で毎回2時間くらいかかるため、PowerShellで自動化しようと考えました。

処理の仕組みとしては複数あるサーバーのうち、特定のサーバーから各サーバーへWinRMを用いてPowerShellでデータを採取します。

が、作ったスクリプトを社内のテスト用サーバーで実行したところOSが吹き飛びました。

ちょっとずつ、いろんな機能が削除されて使えなくなっていく光景は恐ろしかったです。

## 記述したコードと起こったこと

PowerShellにはInvoke\-Commandというコマンドレットがあります。

サーバー間でWindows Remote Managementを有効にしておくことで、 各サーバーへリモートデスクトップ接続することなくPowerShellコマンドを実行出来ます。

実際に記述したコードは以下の様なものでした。

```powershell
$DeletePath = "hoge\fuga\"
$Cred = Get-Credential -UserName "UserName"
Invoke-Command `
  -ComputerName "HogeServer" `
  -Credential $Cred `
  -ScriptBlock { Remove-Item -Path "C:\$DeletePath -Recurse" }
```

上記のコードには問題がありました。

Invoke\-CommandのScriptBlockオプションに設定するコマンドはリモート接続先サーバー上で実行されるコマンドです。

そのため、リモート接続先サーバー上では$DeletePathは宣言されておらず、Remove-Itemコマンドが実際に指定しているパスは C:\\ になります。 つまり、OSの入ったドライブ以下すべて削除です。

恐ろしいです。

## どうするべきだったか

対策としては2つあると思います。

1. 変数に `using` キーワードをつけてScriptBlock内でも変数が使える様にする
2. パスは極力フルパスを渡す用意にする、または、C:\\ 直下から変数でパスを可変としない

PowerShellのInvoke\-CommandにはScriptBlockへ変数を渡す方法がいくつか提供されています。

その中で最も簡単なのは `using` キーワードをつけることだと思います。

```powershell
Invoke-Command `
  -ComputerName "HogeServer" `
  -Credential $Cred `
  -ScriptBlock { Remove-Item -Path "C:\$using:DeletePath -Recurse" }
```

こうすることで変数の情報もリモート接続先へ渡して実行することが出来ます。

もう一つは `"C:\$using:DeletePath` という書き方に問題があります。

これ、`DeletePath` が空文字かnullの場合、C:\\ となってしまい、危険です。

出来るだけ避け、 `"$using:DeletePath` の様にフルパスを代入しておいて渡す様にしたほうがいいと思います。
