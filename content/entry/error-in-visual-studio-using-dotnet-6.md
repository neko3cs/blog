---
Title: .NET6でPublishSingleFileしたらVisual Studioでエラーが発生した（2022年5月19日時点）
Category:
- .NET
- Visual Studio
Date: 2022-05-19T14:25:52+09:00
URL: https://blog.neko3cs.net/entry/error-in-visual-studio-using-dotnet-6
---

Visual Studio 2022でコンソールアプリを作成中に以下のようなエラーに出くわしました。

> 謎のエラーが出てVSでデバッグ実行出来ぬ...  
>   
> 何者なんだ... [pic.twitter.com/8jZt0s53wu](https://t.co/8jZt0s53wu)
> 
> — neko3cs (@neko3cs) [2022年5月19日](https://twitter.com/neko3cs/status/1527109577455505410?ref_src=twsrc%5Etfw)

> CoreCLR にアタッチできません。操作はサポートされていません。不明なエラー: 0x80004005。

所見では意味不明でしたが色々調べていたら以下のようなGitHub Issueに出くわしました。

[Support Single File Diagnostics · Issue #45382 · dotnet/runtime](https://github.com/dotnet/runtime/issues/45382)

私のコンソールアプリプロジェクトでは確かに以下のような記述がされていました。

```xml
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <PublishSingleFile>true</PublishSingleFile>
    <PublishReadyToRun>true</PublishReadyToRun>
    <PublishTrimmed>true</PublishTrimmed>
    <CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>
  </PropertyGroup>
```

どうやらデバッグ実行時にPublishSingleFileされるとうまくVisual Studioがプロセスにアタッチ出来ないようです。

現状回避策として以下のようにReleaseビルドの時だけPublishSingleFileされるようにすることでデバッグ実行出来るようになるようです。

```xml
<PublishSingleFile Condition="'$(Configuration)' == 'Release'">true</PublishSingleFile>
```

Issueも立っているので今後のアップデートで改善されることに期待しましょう！
