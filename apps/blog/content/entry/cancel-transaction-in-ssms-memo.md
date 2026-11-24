---
Title: 本番環境のSSMSでトランザクションキャンセルした際にやらかした話
Category:
- SQL Server
- SSMS
- 備忘録
- 反省文
Date: 2021-04-09T08:00:00+09:00
URL: https://blog.neko3cs.net/entry/cancel-transaction-in-ssms-memo
---

この記事は [Zenn](https://zenn.dev/) にも同様の内容で投稿しております。

[本番環境のSSMSでトランザクションキャンセルした際にやらかした話](https://zenn.dev/neko3cs/articles/cancel-transaction-in-ssms-memo)

* * *

先日、本番障害で任意のテーブルをロックしっぱなしにし、さらに業務影響を与えるという二次障害を起こしました。

この記事は将来の自分への記事でもあります。

今回の件で学んだことをまとめ、同じミスを繰り返さないようにしたいです。

## 経緯

某日、本番環境にて業務が停止するレベルの障害が発生しました。

本障害は3ヵ月前に起こっていましたが、久しぶりだったこともあり少し焦っていました。

しかし、本障害は対応手順書が存在し、手順書を見れば問題を解決出来るようになっていました。

私は手順書通りに実行しました。

詳細は社外秘としますが、概ね、以下のような流れです。

1. SSMSで原因解消用のSQL（`update`文を含む）を実行する
   - このクエリは状況によってクエリが終了しない（ずっと発行中になる）
2. クエリが終了しない場合、クエリ発行を中断し、Windows Serviceの業務アプリを再起動する

今回のケースはクエリが終了しない場合であったため、SSMSの画面上からクエリ発行を中断し、Windows Serviceの再起動を試みました。

ここで、問題が発生します。

手順書上では、Windows Serviceは正常に再起動し、問題が解消する手順となっていました。

しかし、Windows Serviceは再起動時のデータベースアクセスにて、タイムアウトエラーを発生し、起動に失敗しました。

この時点で顧客から鬼電が掛かりまくっており、私はパニックになってしまいました。

## 何が起こったか

問題の発生点はここです。

> SSMSの画面上からクエリ発行を中断し、

発行クエリには`update`文が含まれています。

経緯では触れませんでしたが、`update`文を含んでいるため、トランザクションの明示的な開始もしていました。

SSMSではトランザクション処理実行中にクエリ発行を中断すると、中断したタイミングで処理が止まるため、トランザクションは開始されたままになります。

実験してみましょう。

適当にデータベースを作成し、以下のクエリを実行してみます。

```sql
use [TestDatabase]

begin transaction

select
    *
from
    [SampleTable]

update 
    [SampleTable]
set
    [StringValue] = 'ほげほげ'
where
    [IntValue] = 100

waitfor delay '00:00:10';

select
    *
from
    [SampleTable]

rollback transaction
```

重たい処理を表現するために`waitfor delay`で処理を待ちます。

この際にSSMS画面上の`■`マークの「クエリ実行の取り消し」ボタンを押下します。

![](https://storage.googleapis.com/zenn-user-upload/ba6nj492wtyyw57b19xcyen7izkv)

次に`sys.dm_tran_locks`テーブルを確認し、テーブルのロック状況を確認します。

![](https://storage.googleapis.com/zenn-user-upload/s77adkbziv637nil6qj6o61v6ceb)

`[SampleTable]`テーブルがロック状態にありますね。

つまり話を戻すと、`update`文による占有ロックが掛かったままになっていたため、Windows Serviceは再起動時に`select`文すら発行出来ず、処理が落ちたということになります。

## どうすべきだったか

SSMSでキャンセルした場合、エラーではないため `try-catch` では制御出来ません。

その他色々ググってみましたが、SQL側で制御する方法は私は見つけられませんでした。 <sup id="fnref-f20c1eee"><a href="#fn-f20c1eee">\*1</a></sup>

そのため、今回のケースでは以下の対策方法が考えられるのではないかと思います。

1. 手順書に `sys.dm_tran_locks` テーブルを確認するクエリを実行する手順を追加する
   - 明示的に確認することを手順書に組み込むことで確実に防ぐ
   - クエリは事前に作成しておき、第三者のレビューを通しておく
2. PowerShellスクリプトなど、プログラムにてタイムアウト時間を設定して実行する
   - `Invoke-SqlCmd` コマンド <sup id="fnref-8a100398"><a href="#fn-8a100398">\*2</a></sup>には `-QueryTimeout` というプロパティがあります
   - スクリプトは作成者以外によるテストをしておく

そもそも、人の手で作業をするからミスをするのであって、理想を言えば後者を採用するべきだと思います。

ですが、今回のケースのレベルであれば前者の手順書に明記でも十分回避可能かと思います。

私にはこれくらいしか思いつきませんでした。

もし、他にもっといい方法があればコメントを頂けると幸いです。

---

<span id="fn-f20c1eee"></span>[*1](#fnref-f20c1eee): 2021/4/9時点

<span id="fn-8a100398"></span>[*2](#fnref-8a100398): [Invoke-Sqlcmd - Microsoft Docs](https://docs.microsoft.com/ja-jp/powershell/module/sqlserver/invoke-sqlcmd?view=sqlserver-ps)
