---
Title: C# 9.0 の record 型 と DDD の値オブジェクトについて
Category:
- C#
- ドメイン駆動設計
Date: 2020-11-19T17:25:26+09:00
URL: https://blog.neko3cs.net/entry/csharp-9-record-and-value-object
---

.NET 5 のリリースにより、 C# 9.0 が使えるようになりました。

C# 9.0 の新機能の中で注目を浴びている機能として record 型があります。

この record 型がドメイン駆動設計の値オブジェクトの設計に有用だという知見を得たので、この知見について記したいと思います。

## record 型とは？

record 型の詳細は以下にあります。

[C# 9.0 の新機能 - C# ガイド](https://docs.microsoft.com/ja-jp/dotnet/csharp/whats-new/csharp-9#record-types)

record 型を使用することでイミュータブルなオブジェクトを容易に作ることが出来るようになります。

例えば、今までであれば以下の様に実装していたクラスが...

```csharp
public class Phone
{
    public string AreaCode { get; }
    public string CityCode { get; }
    public string SubscriberNumber { get; }

    public Phone(string areaCode, string cityCode, string subscriberNUmber) =>
        (AreaCode, CityCode, SubscriberNumber) = (areaCode, cityCode, subscriberNUmber);

    public static bool operator ==(Phone left, Phone right) =>
        left.AreaCode == right.AreaCode &&
        left.CityCode == right.CityCode &&
        left.SubscriberNumber == right.SubscriberNumber;

    public static bool operator !=(Phone left, Phone right) =>
        left.AreaCode != right.AreaCode ||
        left.CityCode != right.CityCode ||
        left.SubscriberNumber != right.SubscriberNumber;

    public override int GetHashCode() =>
        new[] { AreaCode, CityCode, SubscriberNumber }
            .Select(x => x is not null ? x.GetHashCode() : 0)
            .Aggregate((x, y) => x ^ y);

    public override bool Equals(object obj) =>
        obj is Phone other &&
        Equals(other.AreaCode, AreaCode) &&
        Equals(other.CityCode, CityCode) &&
        Equals(other.SubscriberNumber, SubscriberNumber);

    public override string ToString() =>
        $"{AreaCode}-{CityCode}-{SubscriberNumber}";
}
```

以下の様になります。

```csharp
public record Phone(
    string AreaCode,
    string CityCode,
    string SubscriberNumber
)
{
    public override string ToString() =>
        $"{AreaCode}-{CityCode}-{SubscriberNumber}";
}
```

主に以下の機能が自動で実装されるようになると公式には書いてあります。

- 値ベースの等価比較のためのメソッド
- `GetHashCode()` のオーバーライド
- コピーメンバーとクローンメンバー
- `PrintMembers` および `ToString()`

難しいことが書いてありますが、簡単に言うと上記で示した `class` の実装サンプルのメソッドは `operator` 含め、すべて自動で実装されます。

上記の `record` 型のサンプルで `ToString()` メソッドのオーバーライドの実装を残した通り、メソッドも実装出来ます。

ちなみに、自動実装される `ToString()` メソッドは以下の様に出力されるようです。

```text
"Phone { AreaCode = 080, CityCode = 1234, SubscriberNumber = 5678 }"
```

今のところ、使いどころが分からないですね。

## record 型と値オブジェクト

先日、Twitter で以下の様なことを教えて貰いました。

> record を使うとイミュータブルなオブジェクトが簡単に書けるのは嬉しいかなと思いました。  
> 従来だとリンク先のように大量にコードを書かないといけなかった。[https://t.co/ODAX7TCg7v](https://t.co/ODAX7TCg7v)
> 
> — Takashi Shibata (@shibatea365) [2020年11月16日](https://twitter.com/shibatea365/status/1328335334447353858?ref_src=twsrc%5Etfw)

[エリックエヴァンスのドメイン駆動設計](https://www.amazon.co.jp/dp/4798121967/ref=cm_sw_em_r_mt_dp_ftITFbEKD7K75) では、 ドメインの概念のうち「ライフサイクルがあり、識別子によって管理するもの」をエンティティ、「値は不変で、識別子によって管理しないもの」を値オブジェクトと呼んでいます。

前節で示した `class` のサンプルコードはこの値オブジェクトの実装例になります。

値は不変のため、プロパティが `get` のみであり、ID オブジェクトを保有していません。

また、クラスは参照型であるため、デフォルトでは `Equals()` メソッドは参照同士の比較をします。

そのため、`==` オペレーターや `!=` オペレーターの実装や `Equals()` メソッドのオーバーライドが必要になります。

ですが、 `record` 型を使用すればこれらがすべて自動で実装されるため、書くべきコードが減ってすっきりします。

コードが減れば確率的にバグが減るので安心ですね。

## 所感

ドメイン駆動設計に取り組んで以来、今まであまり値オブジェクトの定義をしてきませんでした。

今まで実装してきたコードの中には実は値オブジェクトになりうる概念もあったかもしれません。

今回の `record` 型の追加をきっかけに、値オブジェクトを見つけてみる意識をしていきたいと思いました。
