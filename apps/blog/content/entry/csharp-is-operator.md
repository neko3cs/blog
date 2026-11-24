---
Title: C#で英語っぽく条件分岐を記載する
Category:
- .NET
- C#
- 備忘録
Date: 2024-07-06T16:44:50+09:00
URL: https://blog.neko3cs.net/entry/csharp-is-operator
---

備忘録です。

C#ではリテラルとの比較で `is` や `not` といった構文が使用できます。

小規模アプリや使い捨てのツールなどでは、bool変数で IsRunning としてよいかなと思います。

アプリケーション規模が大きくなるようであれば、可読性を意識して Enum で状態値など管理すると if 文が分かりやすくなるかなと思います。

ここは好みの問題もあるので、チームで使用する場合は合意を得て使うといいですね。

[Gist: neko3cs/41ffe86c0e93ab6bc61e7dac42c51cf4](https://gist.github.com/neko3cs/41ffe86c0e93ab6bc61e7dac42c51cf4)

公式リファレンスは以下になります。

['is' 演算子 - 型または定数パターンに対して式を照合する - C# reference | Microsoft Learn](https://learn.microsoft.com/ja-jp/dotnet/csharp/language-reference/operators/is)
