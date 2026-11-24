---
Title: SqlBulkCopyを実行してくれるコマンドレットを作って公開しました。
Category:
- .NET
- C#
- PowerShell
- PowerShell Core
- リリース
Date: 2024-02-26T18:29:11+09:00
URL: https://blog.neko3cs.net/entry/publishing-pssqlbulkcopy-1.0.0.0
---

高速にテーブルへのデータ登録をおこなうことが出来る [SqlBulkCopy](https://learn.microsoft.com/ja-jp/dotnet/api/system.data.sqlclient.sqlbulkcopy?view=dotnet-plat-ext-8.0&viewFallbackFrom=net-8.0) をラップしたコマンドレットを自作して公開しました。

[GitHub - neko3cs/PSSQLBulkCopy: This is a SQLBulkCopy Wrapper for using PowerShell.](https://github.com/neko3cs/PSSQLBulkCopy)

[PSSQLBulkCopy 1.0.0](https://www.powershellgallery.com/packages/PSSQLBulkCopy/1.0.0)

## どんなツール？

サポートされたフォーマットのCSVとテーブル名を渡して実行するとCSVの値がテーブルへ登録されます。

SQL Serverを対象にしています。

## 使い方は？

以下のように実行することでテーブルへ登録できます。

```powershell
Invoke-SqlBulkCopy `
  -ServerInstance {SQL Serverのサーバーインスタンス名, default: 実行端末のコンピューター名} `
  -Database {対象データベース名} `
  -Username {対象データベースのユーザー名} `
  -Password {対象データベースのユーザーパスワード} `
  -TableName {バルクコピー先のテーブル名} `
  -CsvFilePath {後述のフォーマットに従ったCSVファイルのパス}
  -ConnectionTimeout {接続タイムアウト時間(秒), default: 15秒}
```

また、CSVのフォーマットは以下のような内容になっています。

| 行目 | 内容 | 備考 |
| --- | --- | --- |
| 1行目 | カラム名 | \- |
| 2行目 | SQL Server型名 | ? をつけるとNULL許容として認識します |
| 3行目以降 | 値 | DBNULL とするとNULLで格納されます |

例えば、以下のようなフォーマットになります。

```csv
Id,Name,Age,IsMale
int,nvarchar,int,bit?
1,Bob,20,1
2,Alice,21,0
3,John,22,DBNULL
```

## 今後の課題

byte\[\], Guid, object, XmlElement, DateTimeOffsetに関しては動作未確認です。 今回はインストールして手動でテストしましたが、ちゃんとテストコードを書いてみて上記も動作確認してみようと思います。
