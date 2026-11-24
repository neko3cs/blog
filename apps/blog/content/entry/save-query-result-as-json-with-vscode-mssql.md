---
Title: VSCodeの拡張「mssql」で取得結果をJsonで保存して楽々アサーション
Category:
- VSCode
- SQL Server
Date: 2019-04-22T22:50:35+09:00
URL: https://blog.neko3cs.net/entry/save-query-result-as-json-with-vscode-mssql
---

SQL Server 2017など新しいバージョンのSQL Serverでは取得結果をJsonで保存する機能があります。

このような機能を使用することで`Newtonsoft.Json`の`JsonConvert`クラスにより、 `Repository`クラスの`GetAll`メソッド等でデータを取得するテストの記述が比較が楽になります。

```text
[
  {
    "id": 1,
    "name": "neko3cs",
    "age": 25
  },
  {
    "id": 2,
    "name": "neko3333333",
    "age": 26
  },
  {
    "id": 3,
    "name": "neko234",
    "age": 27
  }
]
```

```text
    public class PersonRepositoryFixture
    {
        [Fact]
        public void GetAllFact()
        {
            var json = File.ReadAllText(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "expected.json"));
            var expectetList = JsonConvert.DeserializeObject<List<Person>>(json);

            var target = new PersonRepository();

            var persons = target.GetAll();

            foreach (var i in Enumerable.Range(0, expectetList.Count))
            {
                Assert.Equal(expectetList[i].Id, persons[i].Id);
                Assert.Equal(expectetList[i].Name, persons[i].Name);
                Assert.Equal(expectetList[i].Age, persons[i].Age);
            }
        }
    }
```

上記では、JsonファイルにDBから`GetAll`メソッドで取得されるべきデータを`select * from Person`等SQLで取得し保存しています。 そして、`JsonConvert.DeserializeObject`メソッドを使ってデシリアライズ、このデータと`GetAll`メソッドで取得した結果を比較します。

expectedな値をコードに直書きしていると変更があった際に修正が大変です。 しかし上記のコードにより、テストの際にDBの状態が変わってしまうことがあっても簡単に`Repository`のテストが出来ます。

しかし、現実ではSQL Server 2008などレガシーに引きずられてSQL ServerにJsonで保存するような機能が備わっていない場合があります。 その際にVisual Studio Codeの「mssql」機能拡張を利用することで取得結果をJsonで保存することが出来ます。

[SQL Server (mssql) - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql)

Visual Studio Codeに上記の機能拡張を追加しましょう。

DBに接続し、`select`文を発行すると以下のような画面が表示されます。

![f:id:neko3cs:20190422224544p:plain](/images/20190422/20190422224544.png)

Result画面の右端に`{ }`のマークがあります。 これをクリックすると`Json`で保存することが出来ます。

![f:id:neko3cs:20190422224724p:plain](/images/20190422/20190422224724.png)

赤い枠で囲われたボタンをクリックするとすぐに`Json`ファイルとして保存が可能です。

このやり方であれば、SQLさえあれば取得系のテストのexpectedなデータは簡単に用意できるようになります。 レガシー環境で開発をしていても出来ることはあるので、このように効率化していきましょう！
