---
Title: Maui BlazorでRazor ClassLibを使ってコンポーネントをプロジェクト分離する
Category:
- C#
- .NET
- MAUI
- Blazor
- ASP.NET Core
- 備忘録
Date: 2024-05-05T23:52:07+09:00
URL: https://blog.neko3cs.net/entry/separate-component-to-project-maui-blazor
---

昨今の.NETのUIフレームワークで一番熱いものはBlazorなんじゃないかと思っています。 Webはもちろん、デスクトップやモバイルでもMaui BlazorによってiOSやAndroid、macOS、WindowsなんかもBlazorでUI定義が出来ます。

ここ最近の.NETはUIフレームワークが多様化してMSやサードパーティにていろんなアプローチが提供されているため、自分の中で確実な1つを定めたいなという思いに至りました。

そこで課題になるのはデスクトップだったのですが、BlazorがWebView2を通してMauiやWPFにて再利用が可能というところもあり、今後はBlazorをキャッチアップしていきたいと思っています。(2024年5月5日時点)

そのファーストステップとして、Blazorで作ったコンポーネントをWebやMauiで再利用できるようにクラスライブラリとして定義し、Mauiから利用する方法を調べたのでまとめます。

動くものは以下にあります。

[neko3cs-lab/dotnet-maui-blazor at main · neko3cs/neko3cs-lab](https://github.com/neko3cs/neko3cs-lab/tree/main/dotnet-maui-blazor)

## やり方

まずは、以下のコマンドでMaui BlazorプロジェクトとRazor ClassLib(RCL)プロジェクトを生成します。 ソリューション追加とプロジェクト参照もしておきます。

```powershell
dotnet new maui-blazor -o MauiBlazorApp
dotnet new razorclasslib -o MauiBlazorApp.RCL
# slnの生成と追加、プロジェクト参照は省略
```

ここでMauiBlazorAppプロジェクトの\_Imports.razorに以下の2つを追加しておきます。

- System.Reflection
  - あとでAssemblyクラスを使うため
- MauiBlazorApp.RCL
  - コンポーネントを参照するため

```csharp
@using System.Net.Http
@using System.Reflection  // 追加
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.JSInterop
@using MauiBlazorApp
@using MauiBlazorApp.Shared
@using MauiBlazorApp.RCL  // 追加
```

次にMauiBlazorAppプロジェクトのルーターがMauiBlazorApp.RCLのコンポーネントへルーティング出来るようにします。Main.razorにアセンブリを管理する配列のフィールドを定義してRouterコンポーネントに `AdditionalAssemblies` 属性を追加する。

```csharp
<Router AppAssembly="@typeof(Main).Assembly" AdditionalAssemblies="@LazyLoadAssemblies">
  <Found Context="routeData">

// 中略

@code {
  Assembly[] LazyLoadAssemblies = new[] { typeof(MauiBlazorApp.RCL._Imports).Assembly };
}
```

MauiBlazorApp.RCLの方でコンポーネントを定義してあげます。

この時、 `@page` ディレクティブを使ってルーティングURLを設定します。

```csharp
@page "/helloworld"

<h3>Hello World</h3>

<div class="my-component">
    This component is defined in the <strong>MauiBlazorApp.RCL</strong> library.
</div>
```

あとはNavMenu.razorなどで他のコンポーネントと同様にNavLinkを追加します。

```csharp
<NavLink class="nav-link" href="helloworld">
```

## 参考リンク

- [ASP.NET Core Razor コンポーネントを Razor クラス ライブラリ (RCL) から使用する | Microsoft Learn](https://learn.microsoft.com/ja-jp/aspnet/core/blazor/components/class-libraries?view=aspnetcore-8.0&tabs=visual-studio-code)
