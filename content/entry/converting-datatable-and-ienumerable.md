---
Title: IEnumerable<T>とDataTableの変換の仕方
Category:
- .NET
- C#
- LINQ
- SQL Server
Date: 2024-02-23T18:53:45+09:00
URL: https://blog.neko3cs.net/entry/converting-datatable-and-ienumerable
---

現在、個人的なツール開発にてDataTable型を扱うような処理を作成していたのですが、普段の処理ではDataTable型を直接扱わずに任意のクラスのリスト（IEnumerable\<T>）型で扱いたいです。

そこで、ChatGPTを駆使しながら、IEnumerable\<T>型とDataTable型の相互変換の処理について調べてみました。

以下にサンプルコードの動くものを用意しています。

[neko3cs-lab/dotnet-converting-datatable-and-ienumerable at main · neko3cs/neko3cs-lab](https://github.com/neko3cs/neko3cs-lab/tree/main/dotnet-converting-datatable-and-ienumerable)

拡張メソッドとして実装してみたので、fluentに記述出来るようになると思います。

## IEnumerable\<T> → DataTable

以下のようなコードで実現できます。

```csharp
public static class IEnumerableExtensions
{
  public static DataTable ToDataTable<T>(this IEnumerable<T> items)
  {
    var table = new DataTable();
    var props = typeof(T).GetProperties();

    foreach (var prop in props)
    {
      var isNullableType = prop.PropertyType.IsGenericType &&
                           prop.PropertyType.GetGenericTypeDefinition().Equals(typeof(Nullable<>));
      table.Columns.Add(new DataColumn
      {
        ColumnName = prop.Name,
        DataType = isNullableType ? Nullable.GetUnderlyingType(prop.PropertyType)
                                  : prop.PropertyType
      });
    }
    foreach (var item in items)
    {
      var row = table.NewRow();
      foreach (var prop in props)
      {
        row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
      }
      table.Rows.Add(row);
    }

    return table;
  }
}
```

SQL Serverとの処理で使用する場合は、プロパティ名とカラム名が一致していることを前提としています。

## DataTable → IEnumerable\<T>

以下のようなコードで実現できます。

```csharp
public static class DataTableExtensions
{
  public static IEnumerable<T> ToEnumerable<T>(this DataTable table) where T : new()
  {
    var props = typeof(T).GetProperties();
    foreach (DataRow row in table.Rows)
    {
      T item = new T();
      foreach (var prop in props)
      {
        if (table.Columns.Contains(prop.Name) && row[prop.Name] != DBNull.Value)
        {
          prop.SetValue(item, Convert.ChangeType(row[prop.Name], prop.PropertyType));
        }
      }
      yield return item;
    }
  }
}
```

少しだけ禍根があるのが、ジェネリックを用いている都合上、record classなどを使ってデータを扱う場合、以下のようにパブリックパラメーターなしのコンストラクターを用意しないといけないようです。

どうにかSystem.Reflectionを使って引数を特定して〜ってやろうとしたのですが、CS0310のエラーが消えなかったので諦めました。 <sup id="fnref-a5e20c03"><a href="#fn-a5e20c03">\*1</a></sup>

```csharp
public record class Person
{
  public int Id { get; init; } = 0;
  public string Name { get; init; } = string.Empty;
  public int Age { get; init; } = 0;

  public Person() { }

  public Person(int id, string name, int age)
  {
    Id = id;
    Name = name;
    Age = age;
  }
}
```

---

<span id="fn-a5e20c03"></span>[*1](#fnref-a5e20c03): Activator.CreateInstance(Type type, object\[\] parameters) を用いたのですが、内部処理でパブリックパラメーターなしのコンストラクターを使っているのかもしれません...(未確認)
