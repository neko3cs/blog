---
Title: PowerShell Galleryへ公開する際に出る 'Cannot index into a null array' への対処法
Category:
- PowerShell
- PowerShell Core
- 備忘録
Date: 2024-02-26T18:13:17+09:00
URL: https://blog.neko3cs.net/entry/publishing-ps-module-error-null-array
---

PowerShell Galleryへモジュールを公開しようと、 `Publish-Module` した際に以下のようなエラーが出ました。

```text
Write-Error: Failed to generate the compressed file for module 'Cannot index into a null array'.
```

## 原因

どうやら 'en\_US' 圏以外の人が公開しようとすると出るエラーのようです。

issueが上がっていました。

[Failed to generate the compressed file for module 'Cannot index into a null array'. · Issue #606 · PowerShell/PowerShellGetv2](https://github.com/PowerShell/PowerShellGetv2/issues/606)

nugetの言語設定が 'en\_US' 以外になっていると起こるようです。

## 解決方法

現在この問題へは対応がなされておらず、優先度が下がっています。

応急処置として、.NETの環境変数をいじってあげると問題を回避出来るようです。

```powershell
$env:DOTNET_CLI_LANGUAGE="en_US"
$env:DOTNET_CLI_UI_LANGUAGE="en_US"
```
