---
Title: T-SQLで特定DBへの接続をすべて切断する
Category:
- SQL Server
- T-SQL
- SQL
Date: 2023-01-19T19:46:26+09:00
URL: https://blog.neko3cs.net/entry/how-to-disconnect-sql-server-db-connection
---

SQL Serverに対してDDLなどを実行したいとき、テストなどで実行していたプログラム等の接続が残っているなど、うまく実行が出来ないケースがあるかと思います。

そんな時は以下のようなSQLを実行するように実行したいDDLの最初に記述しておくとよいかもしれません。

```sql
declare Disconnect cursor for
select 
    [dm_exec_sessions].[session_id]
from
    [sys].[dm_exec_sessions]
    inner join [sys].[dm_exec_connections]
        on [dm_exec_sessions].[session_id] = [dm_exec_connections].[session_id]
    inner join [sys].[databases]
        on [dm_exec_sessions].[database_id] = [databases].[database_id]
where
    [databases].[name] = '{任意のデータベース名}'  -- ここに接続を切りたいデータベースの物理名を記述する

declare @Sql as nvarchar(max)
declare @SessionId as smallint
fetch next from Disconnect into @SessionId

while @@FETCH_STATUS = 0
begin
    set @Sql = 'Kill ' + CAST(@SessionId AS nvarchar(max)) + ';'
    exec (@Sql)
    fetch next from Disconnect into @SessionId
end

close Disconnect
deallocate Disconnect
```

SQL Serverへの接続はセッションという形で保持されています。

セッションの情報は `dm_exec_sessions` テーブルから取得出来ます。

各セッションがつないでいるデータベースの情報は `dm_exec_connections` にて持っているため、 `dm_exec_sessions` と結合してデータベース名を指定します。

あとは取得したセッションのIDを使って、 `kill` コマンドで切断することが出来ます。

## 参考記事

- [sys.dm\_exec\_sessions (Transact-SQL) - SQL Server | Microsoft Learn](https://learn.microsoft.com/ja-jp/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-sessions-transact-sql?view=sql-server-ver16)
- [sys.dm\_exec\_connections (Transact-SQL) - SQL Server | Microsoft Learn](https://learn.microsoft.com/ja-jp/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql?view=sql-server-ver16)
- [KILL (Transact-SQL) - SQL Server | Microsoft Learn](https://learn.microsoft.com/ja-jp/sql/t-sql/language-elements/kill-transact-sql?view=sql-server-ver16)
