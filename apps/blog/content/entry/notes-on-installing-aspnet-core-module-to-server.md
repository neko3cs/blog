---
Title: ASP.NET Core Moduleをサーバにインストールする際の注意点
Category:
- 備忘録
- ASP.NET Core
Date: 2019-10-04T18:54:45+09:00
URL: https://blog.neko3cs.net/entry/notes-on-installing-aspnet-core-module-to-server
---

おしごとで勘違いしたので備忘録。

ASP.NET CoreをIISでホストする時、[ASP.NET Core Module](https://dotnet.microsoft.com/download/dotnet-core)をサーバにインストールする必要があります。

いろいろ調べていてIISにインストールしたModuleをIISの \[機能ビュー\] > \[ハンドラーマッピング\] からモジュールマップを追加する必要があるのかと勘違いしました。

ASP.NET Coreのハンドラーモジュールはサイトをデプロイした際にweb.configを読込み、自動的に設定してくれるため、手作業でIIS上でハンドラーマッピングの追加をする必要はないです。

Visual StudioにてASP.NET Coreアプリを発行した際に生成されるweb.configに以下の設定があれば自動設定されます。

```text
<system.webServer>
    <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\WebApplication1.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="InProcess" />
</system.webServer>
```
