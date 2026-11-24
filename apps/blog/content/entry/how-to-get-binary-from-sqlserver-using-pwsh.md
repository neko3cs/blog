---
Title: SQL Server の varbinary 型データを PowerShell で取得して保存する
Category:
- PowerShell
- PowerShell Core
- SQL Server
Date: 2021-09-10T17:54:54+09:00
URL: https://blog.neko3cs.net/entry/how-to-get-binary-from-sqlserver-using-pwsh
---

今回は PowerShell を使って SQL Server に保存された `varbinary` 型のデータを取得してファイル保存する方法を紹介します。

私の担当システムでは画像を扱っており、SQL Server のデータベースに `varbinary` 型で保存するようにしてます。

これを時々何が入っているのか確認したくなるのですが、一々C#でアプリ作って確認するのは手間ですよね？

PowerShellでサクッと出来ないかなと調べたら意外と単純だったのでここに記載します。

## やりかた

以下のコマンドで行けます。

```powershell
Invoke-Sqlcmd `
-ServerInstance "localhost" `
-Database "DATABASE" `
-Username "sa" `
-Password "P@ssword!" `
-MaxBinaryLength 5000000 `
-Query "select [Value] from [Image] where [ImageId] = 10000" |
Select-Object -ExpandProperty Value |
Set-Content -Path .\Image.tif -AsByteStream
```

`-MaxBinaryLength` の値を調整するのが肝です。

サイズは Transact-SQL の `len()` 関数とか使えばわかるのでそれよりちょっと大きい値を指定しておけばいいと思います。

ちなみに、Windows PowerShellの場合は `-AsByteStream` ではなく `-Encoding Byte` と指定します。

## Invoke\-Sqlcmd について

上記のコマンドを実行するには [SqlServer Module](https://www.powershellgallery.com/packages/SqlServer) という PowerShell モジュールがインストールされている必要があります。

以下のコマンドでインストールします。

```powershell
Install-Module -Name SqlServer
```

なお、SqlServer Module は SQL Server Management Studio 16.x のバージョンには同梱していますが<sup id="fnref-e339c622"><a href="#fn-e339c622">\*1</a></sup>、それ以外のバージョンの場合は PowerShell Galleryからオンライン、もしくはマニュアルでのインストールが必要になります。

---

<span id="fn-e339c622"></span>[*1](#fnref-e339c622): [SQL Server PowerShell - SQL Server | Microsoft Docs](https://docs.microsoft.com/ja-jp/sql/powershell/sql-server-powershell?view=sql-server-ver15)
