---
Title: C#のTaskと非同期処理についてまとめる
Category:
- C#
- .NET Core
- 非同期処理
Date: 2019-08-25T05:56:49+09:00
URL: https://blog.neko3cs.net/entry/task-and-async-programming-of-csharp
---

最近非同期処理関係で詰まるところがあったので、頭の整理も兼ねてまとめたいと思います。

## Taskとは

C#のTaskとは**Task**です。 これ自体は非同期処理でもなんでもない、ただの処理の手順書に過ぎません。

```text
// 返ってきてるのはHTTP GETするという手順のみ
Task<HttpResponseMessage> task = httpClient.GetAsync(url);
```

このtaskを実行することで結果を得られます。

```text
Task<HttpResponseMessage> task = httpClient.GetAsync(url);
// awaitによって実行されるため、返ってくるのは手順を実施した結果
HttpResponseMessage response = await task;
```

上記の例では変数`task`は`HttpResponseMessage`を返すことを約束するただの関数オブジェクトのようなものです。 中身の処理が何かどうかは呼び出し元には関係なく、 変数`url`を渡して実行したら`HttpResponseMessage`が取得できる手順書であるというのがTaskの本質です。

## Taskと非同期処理

Taskは単なる手順書です。 手順通りに実行されていればTaskがどのスレッドで実行されていようが問題がありません。 そのため、Taskを実行すると自然とマルチスレッド処理として実行されます。

これがTaskと非同期処理の関係です。

## async await

Taskは同期的に実行することも出来ます <sup id="fnref-edf0d5bf"><a href="#fn-edf0d5bf">\*1</a></sup> が、通常は非同期で実行します。

Taskを非同期で実行するためには`await`キーワードを使用します。 `await`キーワードの使用されたメソッドには`async`キーワードを使用します。 `async`キーワードを使用したメソッドは`Task`、`Task<T>`、`void`のいずれかで返します。

そのため、以下のような記述が成り立ちます。

```text
private async Task<HttpResponseMessage> CallGetAsync(string url)
{
    var httpClient = new HttpClient();
    var response = await httpClient.GetAsync(url);
    return response;
}

private async Task GetMarkdownAsync()
{
    var url = "https://blog.neko3cs.net/";

    var response = await CallGetAsync(url);
    var text = await response.Content.ReadAsStringAsync();

    File.WriteAllText(_path, text);
}
```

上記では、`CallGetAsync`メソッド内の`httpClient.GetAsync`はTaskを返すメソッドのため、`await`キーワードを使用して実行しています。 `CallGetAsync`メソッド内で`await`キーワードが使用されたため、メソッドには`async`キーワードを使用します。 返したい値は`HttpResponseMessage`型の`response`なので戻り値は`Task<HttpResponseMessage>`になります。

`GetMarkdownAsync`メソッドも非同期メソッドである`CallGetAsync`を呼んでいるため、`await`と`async`を使用します。 `GetMarkdownAsync`メソッドは戻り値が無いため、`Task`型を返します。

このように、非同期メソッドを呼ぶメソッドは数珠つなぎのように非同期メソッドになってゆきます。 これは仕様です。仕方ないので数珠つなぎで非同期メソッドにしましょう。

## async voidについて

前項で`async`キーワードを使用したメソッドは`Task`、`Task<T>`、`void`のいずれかで返しますと言いました。 非同期処理でvoidを返すということはどういうことなのでしょうか？

`Task`クラスには`Task.Status`や`Task.Exception`のようなTaskの進行状況を把握するようなプロパティが存在します。 voidで返すということはこれらの情報を取得することが出来ないということになります。

つまり、実行したタスクが終わったのかも、 エラーが起こっても起こったのかすらもわからない、危険な状態になります。

そのため、async voidは特定の条件下以外では使用は**推奨されません**。

その条件が**呼び出し元メソッドのシグネチャを変更出来ない**場合です。 その代表例がWinFormsやWPFでのUIイベントハンドラになります。

これらのメソッドは`void`を返すことが決められていますので勝手に`Task`を返せばビルドエラーとなります。

そのため、必然的にasync voidを使用せざる負えないことになります。

## Taskの待ち方について

Taskは`await`キーワードを使って待ちましょう。

他にも`Task.Wait()`、`Task.Result`、`Task.GetAwaiter().GetResult()`等の方法でTaskを待つことが出来ますが、 これらはTaskが完了するまで呼び出し元スレッドの処理を停止させます。 <sup id="fnref-9b6165d8"><a href="#fn-9b6165d8">\*2</a></sup>

コンソールアプリの場合は慣例の`Console.ReadLine()`でアプリが終了しないようにする代わりになるため問題ではありません。 ですが、WinFormsやWPFのようなUIのあるアプリの場合はどうでしょうか？

呼び出し元スレッド = UI実行スレッドが停止してアプリが固まります。 だめですね。

そのため、UIのあるアプリでは<strong>`Task.Wait()`や`Task.Result`してはいけません</strong>。

## 非同期処理と排他制御

`lock`キーワードによる排他制御下で`await`キーワードを使用することは出来ません。

これは`lock`による排他制御では排他ロックしたスレッドでロックを解放しないといけない制約があり、 `await`してしまうとスレッドが切り替わってしまう可能性があるため文法レベルで使えなくなっています。

この代替策として[AsyncLock](https://github.com/StephenCleary/AsyncEx)というものがあるのでこれを使用しましょう。 AsyncLockでは内部的にSemaphoreSlimクラスが使われています。

SemaphoreSlimによる排他制御はスレッドに依存しないため、 非同期処理によってスレッドが切り替わってしまっても排他ロックの解放が出来ます。

AsyncLockはSemaphoreSlimをより使いやすくしたクラスだと思って問題ないです。

## 参考

- [Task クラス (System.Threading.Tasks) | Microsoft Learn](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.task?view=netframework-4.8)
- [Taskを極めろ！async/await完全攻略 #C# - Qiita](https://qiita.com/acple@github/items/8f63aacb13de9954c5da)
- [https://www.kekyo.net/2016/12/06/6186](https://www.kekyo.net/2016/12/06/6186)
- [Kouji Matsuiさん](https://twitter.com/kekyo2/)との[会話](https://twitter.com/neko3cs/status/1164949274532048896)
- [非同期：awaitを含むコードをロックするには？（SemaphoreSlim編）［C#、VB］：.NET TIPS - ＠IT](https://www.atmarkit.co.jp/ait/articles/1411/11/news117.html)

---

<span id="fn-edf0d5bf"></span>[*1](#fnref-edf0d5bf): [Task.RunSynchronously Method](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.task.runsynchronously?view=netframework-4.8#System_Threading_Tasks_Task_RunSynchronously)

<span id="fn-9b6165d8"></span>[*2](#fnref-9b6165d8): Task.ResultもTask.GetAwaiter().GetResult()も内部的にはTask.Wait()を呼んでいます
