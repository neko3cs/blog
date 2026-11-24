---
Title: SQLでデータベースを復元する
Category:
- SQL
- SQL Server
- 備忘録
Date: 2024-06-27T15:40:23+09:00
URL: https://blog.neko3cs.net/entry/restore-sqlserver-database-using-sql
---

すぐ忘れるので備忘録です。

以下のSQLでバックアップから復元できます。

```sql
USE [master]

ALTER DATABASE [YourDatabase] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

RESTORE DATABASE
    [YourDatabase]
FROM
    DISK = 'C:\MSSQL14.DB\MSSQL\Backup\backup.bak'
WITH
    REPLACE

ALTER DATABASE [YourDatabase] SET MULTI_USER;
```

最初の `SET SINGLE_USER` は接続できるユーザーを1人に設定するコマンドです。 これはSSMSの復元のオプションにある「接続しているユーザーを切断する」チェックボックスと同じ効果があります。 最後の `SET MULTI_USER` で元に戻します。

`REPLACE` オプションを指定することで既存のデータベースを上書きします。
