---
Title: WebAPIでC#スクリプトファイルを読み込んで実行する
Category:
- .NET Core
- ASP.NET Core
Date: 2019-03-27T23:58:07+09:00
URL: https://blog.neko3cs.net/entry/run-csharp-script-file-from-webapi
---

Azure FunctionsではC#スクリプトを使用してロジックを構築します。

このロジックを模倣してASP.NET CoreでもC#スクリプトを読み込んで実行する方法を示します。

## 事前準備

まず、ASP.NET Core Web APIテンプレートからWeb APIを作成します。

![f:id:neko3cs:20190327213553p:plain:w500](/images/20190327/20190327213553.png)

プロジェクトが作成されたらこの段階でNugetパッケージを更新しておきましょう。

パッケージの更新が出来たら"\[プロジェクト\] > \[Nuget パッケージの追加\]"から"Microsoft.CodeAnalysis.CSharp.Scripting"を追加します。

![f:id:neko3cs:20190327214338p:plain:w500](/images/20190327/20190327214338.png)

追加が出来たら、プロジェクト構成を以下のようにします。 Modelsフォルダ以下のフォルダ・ファイルを追加しました。

![f:id:neko3cs:20190327220129p:plain:w300](/images/20190327/20190327220129.png)

## スクリプトファイル実行クラスの作成

事前準備で用意した`GetDateTimeNowScript.csx`ファイルに以下のコードを記述します。

```csharp
using System;

// クラスの定義はなくても良い
// クラスは静的でなくても良い
public static class Script
{
    public static string Run()
    {
        var now = DateTime.Now;

        return now.ToString("yyyy-MM-dd HH:mm:ss");
    }
}

// 実際にスクリプトとして実行されている場所はここ
// Run()が返す値をホストへ返す場合は"return"で返す
return Script.Run();
```

ただ現在時間取ってフォーマットして返してるだけですね。 注意点としてC#スクリプトでホストに対して戻り値が欲しい場合はトップダウンで`return`してあげる必要があります。 それからC#スクリプトでは名前空間は定義出来ません。というかファイルが名前空間みたいなものなので必要ありません。

次に同じく事前準備で用意した`CsxManager.cs`ファイルに以下のコードを記述します。

```csharp
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp.Scripting;

namespace SampleWebAPI.Models
{
    public static class CsxManager
    {
        // ↓絶対パスを入れる
        public static string ContentRootPath => "dokokaNoPath/SampleWebAPI/SampleWebAPI/Models/Scripts";

        public static async Task<T> RunScriptAsync<T>(string scriptId)
        {
            // ファイル名 = IDとする
            var fileName = $"{scriptId}Script.csx";

            // C#スクリプトファイルを読み込む
            var scriptPath = $"{ContentRootPath}/{fileName}";
            var scriptText = File.ReadAllText(scriptPath, Encoding.UTF8);

            // スクリプトの作成 -> これによってC#スクリプトを実行
            var script = CSharpScript.Create<T>(scriptText);

            // 実行して結果を受け取る
            var result = await script.RunAsync();
            return result.ReturnValue;
        }
    }
}
```

ここでは引数の`scriptId`と一致するファイルのC#スクリプトを実行し、結果を受け取る処理を記述しています。 最後のRunAsync()によって、`GetDateTimeNowScript.csx`の最後で`return`した値を受け取ります。 この時の戻り値の型はスクリプトインスタンスを生成した際のジェネリック型`T`になります。

最後に実際にこのスクリプトを実行してくれるWebAPIの受け口を作りましょう。 `ValueController.cs`を以下のように編集します。

```csharp
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SampleWebAPI.Models;

namespace SampleWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValuesController : ControllerBase
    {
        // GET api/values
        [HttpGet("get")]
        public async Task<ActionResult<string>> Get() => await CsxManager.RunScriptAsync<string>("GetDateTimeNow");
    }
}
```

ただ`CsxManager`を経由してC#スクリプトに処理を代替しているのでControllerはこれほど短くなります。 もう自動生成したいレベルですね。

これをコールすると以下のような結果が見られます。

![f:id:neko3cs:20190327231629p:plain:w500](/images/20190327/20190327231629.png)

ちゃんとC#スクリプトで得た結果をクライアント側で受け取れていますね。

最後に、このC#スクリプトを活用したWebAPIのアーキテクチャは言うなればAzure Functionsのパクリですが、 あまりアーキテクチャ設計が得意ではない（トランザクションスクリプトに慣れてる）チームには向いているのではないかと思いました。

とは言え、課題もあるので洗練していけたらと思います。
