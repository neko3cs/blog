---
Title: EntityFrameworkCoreを使ってみた
Category:
- .NET Core
- EntityFramework Core
Date: 2018-11-25T23:15:37+09:00
URL: https://blog.neko3cs.net/entry/try-entity-framework-core
---

EntityFrameworkCoreを使ってみたので備忘録に主要な知識だけメモします。

以下、確認時バージョンです。

| こうもく | ばーじょん |
| --- | --- |
| macOS | Mojave 10.14.1 |
| .NET Core | 2.1.302 |
| Microsoft.EntityFrameworkCore.Design | 2.1.4 |
| Microsoft.EntityFrameworkCore.Sqlite | 2.1.4 |

またソースコードもいかに保管しています。

[neko3cs-lab/entity-framework-core-for-blog at main · neko3cs/neko3cs-lab](https://github.com/neko3cs/neko3cs-lab/tree/main/entity-framework-core-for-blog)

## 1\. 導入

とりあえず適当にコンソールアプリを作ります。

```shellscript
dotnet new sln -o SampleEntityFrameworkCore
cd SampleEntityFrameworkCore
dotnet new console -o SampleEntityFrameworkCore
cd SampleEntityFrameworkCore
```

そうしたら、以下のコマンドでEntityFrameworkCoreを便利に使うためのツールを導入します。

```shellscript
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
```

今回使用する便利なツールとは、EntityFrameworkCoreToolsというツールです。 コマンドベースでデータベースをマイグレーションしたり、 データベースファイルからDbContextクラスをスキャフォールディングすることが出来ます。 EntityFrameworkCoreToolsはEntityFrameworkCore.Designによってインストールされます。

EntityFrameworkCore.SqliteはEntityFrameworkCoreでSqliteを扱うためなので深い意味はないです。

以下のコマンドでなんか出たらおっけーです。

```shellscript
dotnet restore
dotnet ef
```

![](/images/20181114/20181114213411.png)

ユニコーンかわいいっすね。

## 2\. コードからマイグレーション

まずは、マイグレーションからします。

マイグレーションは簡単に説明すると、コードやコマンドの情報からデータベースファイルを生成する技術のことを言います。

マイグレーションするための元情報を用意します。

以下はDbContextクラスです。 データベースへアクセスするため窓口になるクラスです。

```csharp
using Microsoft.EntityFrameworkCore;

namespace SampleEntityFrameworkCore.Models.CodeFirst
{
    public class CodeFirstDbContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=codeFirstDb.db3");
        }

        public DbSet<Blog> Blogs { get; set; }
        public DbSet<Post> Posts { get; set; }
    }
}
```

以下はBlogクラスです。 データベース上のBlogテーブルに当たるクラスです。

```csharp
using System.Collections.Generic;

namespace SampleEntityFrameworkCore.Models.CodeFirst
{
    public class Blog
    {
        public int BlogId { get; set; }
        public string Url { get; set; }
        public ICollection<Post> Posts { get; set; }
    }
}
```

以下はPostクラスです。 データベース上のPostテーブルに当たるクラスです。

```csharp
using System.Collections.Generic;

namespace SampleEntityFrameworkCore.Models.CodeFirst
{
    public class Post
    {
        public int PostId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public int BlogId { get; set; }
        public Blog Blog { get; set; }
    }
}
```

上記のクラスを用意して以下のコマンドを入力すると作成したクラスから自動的にデータベースを作成してくれます。

```shellscript
dotnet ef migrations add InitialCreate -c CodeFirstDbContext
dotnet ef database update
```

以下のような表示がされれば成功ですね。

![](/images/20181125/20181125222654.png)

## 3\. データベースからスキャフォールディング

次はスキャフォールディングです。

スキャフォールディングは簡単に説明すると、コードを自動生成する技術です。 データベースのスキーマからDbContextやEntityを自動生成します。

おそらく、よく使うのはスキャフォールディングではないかと思います。 私自身、データベースはあくまでデータの永続化のためのコードから切り離された存在だと思っています。 なので、ORマッパーを使うにしてもデータベース設計はデータベースの習わしに合わせている方がよいと思ってます。 （上手く言えていない、かつ、完全に個人的な意見ですが...）

まずはデータベースを用意します。

今回はSQLiteを使うのでDB Browser for SQLiteでデータベースファイルを用意します。 スキーマは"2. コードからマイグレーション"と同じなので省略します。

```text
databaseFirstDb.db3
```

あとは以下のコマンドを入力するだけでDbContextクラスとEntityクラスが自動生成されます。

```shellscript
dotnet ef dbcontext scaffold "Data Source=databaseFirstDb.db3" Microsoft.EntityFrameworkCore.Sqlite -t Blog -t Post -c DbFirstDbContext -o Models/DbFirst
```

以下の表示がされれば成功です。

![](/images/20181125/20181125230049.png)

## まとめ

上記でDbContextの準備が出来ればあとは使うだけです。

重要なところとすれば以下かと思います。

- "Microsoft.EntityFrameworkCore.Design"をnugetから落として、EntityFrameworkCoreToolsを使えるようにする
- コードファーストな場合、以下のコマンドからデータベースファイルを生成
  - `dotnet ef migrations add InitialCreate`
  - `dotnet ef database update`
- データベースファーストな場合、以下のコマンドからDbContextクラス、Entityクラスを生成
  - `dotnet ef dbcontext scaffold "<接続文字列>" <使用データベースプロバイダ> -t <テーブル名> -c <コンテキストクラス名> -o <出力先>`

コードは出来るだけ自動生成した方が効率が良いのでコマンドは忘れず覚えておきたいです。

## 参考

[EF Core ツールのリファレンス (.NET CLI) - EF Core](https://docs.microsoft.com/ja-jp/ef/core/miscellaneous/cli/dotnet)

[ASP.NET Core での Entity Framework Core を使用した Razor Pages - チュートリアル 1/8](https://docs.microsoft.com/ja-jp/ef/core/get-started/aspnetcore/new-db?tabs=visual-studio)

[ASP.NET Core での Entity Framework Core を使用した Razor Pages - チュートリアル 1/8](https://docs.microsoft.com/ja-jp/ef/core/get-started/aspnetcore/existing-db)
