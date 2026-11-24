---
Title: C#のTop-Level Statementでハマった話
Category:
- .NET
- C#
- 備忘録
Date: 2022-05-01T01:19:37+09:00
URL: https://blog.neko3cs.net/entry/mistake-of-top-level-statement-with-namespace
---

.NET5.0のコンソールアプリケーションを.NET6.0にアップグレードしてTop-Level Statementを利用しようとしたときに起きた問題です。

> 最上位レベルのステートメントが含まれているファイルには、そのファイルの最後の最上位レベルのステートメントの後に、名前空間と型を含めることもできます。

[最上位レベルのステートメント - C# チュートリアル](https://docs.microsoft.com/ja-jp/dotnet/csharp/whats-new/tutorials/top-level-statements)

これめちゃくちゃ重要な文言でしたが見落とし、ハマってしまいました。

## 起きたこと

.NET5.0で作成した以下のようなコードがありました。

```csharp
using System;

namespace MyProject
{
    public static class Program
    {
        public static void Main(string args[])
        {
                Console.WriteLine("Hello World!");  // 例です
        }
    }
}
```

プロジェクトファイルを `net6.0` にし、こうしました。

```csharp
using System;

namespace MyProject;

Console.WriteLine("Hello World!");  // 例です
```

はい、コンパイルエラーになりました。

## 解決方法

公式ドキュメントにあるように、 **そのファイルの最後の最上位レベルのステートメントの後に、名前空間と型を含め** ましょう。

最初、何がダメなのか分かりませんでしたが、Top-Level Statementは端的に言うとProgram.csの名前空間、クラス名、Mainメソッドを省略出来る記法なので省略しなければだめですね。

例文でいえば、 `namespace MyProject;` が不要、もしくは最後尾行にこなければなりません。
