---
Title: PowerShellのGet-ChildItemでFullNameが途切れちゃう場合の対処法
Category:
- PowerShell
- PowerShell Core
- 備忘録
Date: 2022-07-06T16:52:10+09:00
URL: https://blog.neko3cs.net/entry/powershell-how-to-run-get-childitem-with-all-fullname
---

作業の確認でファイルの一覧を取得したい場合などありますよね。 ですが、Get-ChildItemコマンドはパスが長すぎる場合、FullNameプロパティの値が途中で切れてしまうといったことが起こります。 その場合以下のコマンドを実行することで対処可能です。

## コマンド

```text
Get-ChildItem -Recurse -File | 
Select-Object -ExpandProperty FullName | 
Format-Table -AutoSize -Wrap |
Out-File -Path $HOME\Desktop\file_list.txt 
```

`Format-Table` コマンドの `AutoSize` プロパティを指定することですべての文字列を取得することが出来ます。
