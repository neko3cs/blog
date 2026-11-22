---
Title: "git で \"fatal: unsafe repository\" というエラーが出た"
Category:
- git
- Windows
- 備忘録
Date: 2022-06-21T18:08:04+09:00
URL: https://blog.neko3cs.net/entry/error-git-fatal-unsafe-repository
---

よく調べずに git のバージョンを更新してハマりました。

解決方法は単純だったので忘れないように備忘録しておこうと思います。

## 起こったこと

いつものように `git status` を実行したところ以下のようなエラーが表示されました。

```powershell
$ git status
fatal: unsafe repository ('C:/src/XXXXXXXXXXXXXXXXXX' is owned by someone else)
To add an exception for this directory, call:

        git config --global --add safe.directory C:/src/XXXXXXXXXXXXXXXXXX
```

![](/images/20220621/20220621175457.png)

## 原因

どうやらGitの脆弱性に対する対策アップデートにより、Gitリポジトリフォルダの所有者が実行ユーザーである必要があるっぽいです。

[Git security vulnerability announced | The GitHub Blog](https://github.blog/2022-04-12-git-security-vulnerability-announced/)

## 対処法

エラーメッセージにある通り、リポジトリフォルダに所有権がないため起こるようなので所有権を取得しましょう。

```powershell
$ takeown /r /s $env:COMPUTERNAME /u $env:USERNAME /f {リポジトリフォルダのパス}
```

![](/images/20220621/20220621180156.png)

なお、画像のようにCドライブ直下など自身のユーザーフォルダの下にないフォルダにGitリポジトリフォルダを置いている場合、管理者権限が必要になります。
