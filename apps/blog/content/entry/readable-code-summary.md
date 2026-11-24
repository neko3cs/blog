---
Title: リーダブルコード まとめ
Category:
- コーディングルール
- 備忘録
Date: 2019-02-18T08:47:12+09:00
URL: https://blog.neko3cs.net/entry/readable-code-summary
---

## はじめに

[リーダブルコード -より良いコードを書くためのシンプルで実践的なテクニック-](http://amzn.asia/ghIKDQq)を読んだ、 自分自身の備忘録・メモとして残したいと思います。

## 1章 理解しやすいコード

- コードは読みやすくしなければいけない
- コードは他人が最短時間で理解できるように書かなければならない
  - 「読みやすさの基本定理」
  - ここでいう他人とは、数ヶ月後、コードの内容を忘れてしまった自分も含む

## 第Ⅰ部 表面上の改善

### 2章 名前に情報を詰め込む

- 明確な単語を選ぶ
  - 例： `Node.Size()`
  - Size()では抽象的すぎる、以下のようなリネームがよいとされている
    - `Height()`: ツリーの高さ
    - `NumNodes()`: ノードの数
    - `MemoryBytes()`: ツリーのメモリ消費量
- tmpやretvalなどの汎用的な名前を避ける
  - 平方根の合計が返される関数の戻り値なら`sum_squares`など、何が入っているのかわかるものをつける
  - `tmp`はものすごく短いスコープの中でのみ許される
    - 探さなくても`tmp`に何が入っているのかわかるため（ex: swap関数とか）
- 抽象的な名前よりも具体的な名前を使う
  - TCP/IPポートへサーバがListenできるかどうかチェックするメソッドならば、`CanListenOnPort()`など
  - その変数、メソッドが何を格納しているのか、何をするのかを一目でわかるようにする
- 名前に情報を追加する
  - 単位 ･･･ ex: `download_limit`　→ `max_kbps`
  - 状態 ･･･ ex: `password`　→ `plaintext_password`
- 名前の長さを決める
  - 名前空間の広さやスコープの長さが変数名の長さの基準
- 名前のフォーマットで情報を伝える
  - 基本的に言語ごとの命名規則に従えば良いと思われる

### 3章 誤解されない名前

- 限界値を含める場合はminとmaxを使う
  - `MAX_ITEMS_IN_CART`
- 範囲を指定するときはfirstとlastを使う
  - `(List<Author>) Authors[lastAuthorNum]`
- 包含/排他的範囲にはbeginとendを使う
  - `PrintEventsInRange(begin: "2018/4/1 12:00am", end: "2018/4/2 12:00am");`
- ブール値の名前
  - `is, has, can, should`が接頭辞としてよく使われる
  - <strong>*否定形は避ける*</strong>
    - 肯定形が否定の否定になってわかりづらい
    - `disable_ssl`　→ `use_ssl`

### 4章 美しさ

- 一貫性のある完結な改行位置
  - 同じメソッドやコンストラクタの呼び出しが複数続く場合など

```java
// TcpConnectionSmulation(throughput[kbps], latency[ms], jitter[ms], packet_loss[percent]);
public static final TcpConnectionSimulator wifi = 
    new TcpConnectionSmulation(500, 80, 200, 1);

public static final TcpConnectionSimulator t3_fiber = 
    new TcpConnectionSmulation(500, 80, 200, 1);

public static final TcpConnectionSimulator cell = 
    new TcpConnectionSmulation(500, 80, 200, 1);
```

- メソッドを使った整列
  - 以下のコード、重複処理の排除とコードの見やすさが達せられている

```cpp
void main()
{
    CheckFullName("Doug Adams" , "Mr.Douglas"       , "");
    CheckFullName("Jake Brown" , "Mr.Jake Brown III", "");
    CheckFullName("No Such Guy", ""                 , "no match found");
    CheckFullName("John"       , ""                 , "more than one result");
}

void CheckFullName(string partial_name, string expected_full_name, string expected_error)
{
    string error;
    // database_connection: メンバ変数
    string full_name = ExpandFullName(database_connection, partial_name, &error);
    assert(error == expected_error);
    assert(full_name == expected_full_name);
}
```

- 宣言をブロックにまとめる
  - 以下のように関連性のあるコードを改行とコメントでまとめる

```cpp
class FrontendServer {
  public:
    FrontendServer();
    ~FrontendServer();

    // ハンドラ
    void ViewProfile(HttpRequest* request);
    void SaveProfile(HttpRequest* request);
    void FindProfile(HttpRequest* request);

    // リクエストとリプライのユーティリティ
    string ExtractQueryParam(HttpRequest* request, string param);
    void ReplyOK(HttpRequest* request, string html);
    void ReplyNotFound(HttpRequest* request, string error);

    // データベースのヘルパー
    void OpenDatabase(string location, string user);
    void CloseDatabase(string location);
}
```

- 個人的好みと一貫性
  - <strong>*一般論や個人的好みよりプロジェクトで一貫されたフォーマットが優先されるべき*</strong>
    - 統一されたコードのが読みやすいため

### 5章 コメントすべきことを知る

- コードからすぐにわかることはコメントに書かない
  - `SetProperty(ref hoge, value); // プロパティを設定`みたいなの
- <strong>*酷いコードを補う為のコメントはまず、コードを修正する*</strong>
- なぜその実装になっているのかをコメントする
  - 「監督ドキュメンタリー」を入れると説明されている
- コードの欠陥にコメントをつける
  - `TODO`, `FIXME`, `HACK`など
- <strong>*読み手が「えっ？」と思う質問されそうなコードにコメントをする*</strong>
  - トリッキーな処理方法など
- 誤った使われ方をしそうなコード（メソッド・プロパティ）に詳細な実装をコメントする

### 6章 コメントは正確で簡潔に

- <strong>*コメントは簡潔にしておく*</strong>
  - 「これ」、「それ」などのあいまいな代名詞は避ける
- 関数の動作を正確に記述する
  - `int CountLines(string str);`は具体的に何が返ってくるのか
    - `"\n"`の数をカウントしているのであればその旨をコメントするなど
- <strong>*コードの意図を書く*</strong>
  - コードを書く際に考えていたことをコメントすることでバグの発見に寄与できる
- 「名前付き引数」コメント
  - `Connect(/* timeout_ms = */ 10, /* user_encryption = */ false);`みたいに引数が何を示すのかを記述
  - C#には名前付き引数が構文レベルで用意されている
    - `Connect(timeout_ms: 10, userEncryption: false);`
- <strong>*情報密度の高い言葉を使う*</strong>
  - 「キャッシュ層」、「正規化する」などの情報量の高い言葉を使用することで短いコメントになる

## 第Ⅱ部 ループとロジックの単純化

### 7章 制御フローを読みやすくする

- 条件式の引数の並び順
  - 「調査対象」を左側、「比較対象」を右側に奥
  - 例: `while (count > 0) { ~ }`
- `if/else`文の並び順
  - 条件式は肯定形で記述
  - `if (!hasValue) {} else {}`ではなく、`if (hasValue) {} else {}`とする
- 三項演算子
  - 簡潔な処理の場合のみ使用する
    - 例: `time_str += (hour >= 12) ? "am" : "pm"`
  - 計算式や入れ子になっていると難解なので避ける
- 関数から早く返す
  - 「ガード節」の利用
    - 関数内の処理にそぐわない条件はすぐに出す

```csharp
protected void btnLogin_Clicked(object sender, EventArgs e)
{
    // ID、パスワードは必須項目
    if (UserID == string.Empty || Password == string.Empty) { return; }
    
    // 以下処理が続く...
}
```

- ネストを浅くする
  - `return`や`continue`などを使用して関数やループから早く出すことで条件の複雑化を防ぐ

### 8章 巨大な式を分割する

- 複雑な式は「説明変数」、「要約変数」へ格納して使用する
  - 例: `var userName = line.Split(new char[]{ ':' })[0];`
  - 例: `var userOwnsDocument = (request.user.id == document.owner.id);`
  - 「説明変数」、「要約変数」の使用によりコードを文書化出来読みやすくなる
- <strong>*ド・モルガンの法則を使う*</strong>
  - 複雑な条件式を簡潔にする
- 短絡評価の悪用
  - `assert((!(bucket = FindBucket(key))) || !bucket->IsOccupied());`みたいなまとめたコードは書かない
- 巨大な文を分割する
  - DRYの実践
  - 複数回使用する式（LINQのメソッドチェーンなど）は変数に格納しておくなど
- 式を簡潔にするもう1つの創造的な方法
  - C++においてはマクロを活用する

### 9章 変数と読みやすさ

- 無意味な変数は削除する
- 変数のスコープは可能な限り短くする
  - 大きなクラスを小さなクラスへ分割するとスコープも短くなる
- 定義の位置を下げる
  - 変数は使用される直前まで宣言しない
- readonlyやconstを多用して変数の設定回数を1回だけにする
  - 変更されない値は当然値が把握出来る

## 第Ⅲ部 コードの再編成

### 10章 無関係の下位問題を抽出する

- 長い関数には別問題の解法が含まれていることがあるので別関数として切り出す
  - 以下のサンプルだと「指定の緯度経度に最も近い位置を探す」という問題の中に、「2地点間の距離を算出する」という問題が含まれている
  - このような問題を別関数・クラスに抽出する

```javascript
var findClosestLocation = function(lat, lng, array) {
    var closest;
    var closest_dist = Number.MAX_VALUE;
    for (var i = 0; i < array.length; i+= 1) {
        // ---- ↓この部分が無関係の下位問題 --------------------------------
        // 2つの地点をラジアンに変換
        var lat_rad = radians(lat);
        var lng_rad = radians(lng);
        var lat2_rad = radians(array[i].latitude);
        var lng2_rad = radians(array[i].longitude);

        // 「球面三角法の第二余弦定理」の公式を使う
        var dist = Math.acos(Math.sin(lat_rad) * Math.sin(lat2_rad) +
                             Math.cos(lat_rad) * Math.cos(lat2_rad) +
                             Math.cos(lng2_rad - lng_rad));
        // ↑ ----------------------------------------------------------
        if (dist < closest_dist) {
            closest = array[i];
            closest_dist = dist;
        }
    }
    return closest;
}
```

- 汎用的なコードはUtilityクラスとして切り出しておく
  - プロジェクト固有ではない汎用コードはプロジェクトが変わっても再利用できる
- <strong>*必要に応じてインターフェースを整える*</strong>
  - 以下は関数`url_safe_encript()`によって変数`url`の値が見やすくなっている

```python
  user_info = { "username": "...", "password": "..." }
  url = "http://example.com/?user_info=" + url_safe_encrypt(user_info) # 複雑な暗号化処理を内包
```

- やりすぎには注意する
  - 小さな関数ばかりのコードは読みづらいし、デバッグもしづらい

### 11章 一度に1つのことを

- 関数は一度に1つのことを行うようにする
  - <strong>*単一責任の原則*</strong>
- コードが複雑な場合は以下のように分解
  1. コードがおこなっている「タスク」を列挙する
     - ここでのタスクは「オブジェクトが妥当か確認する」のように曖昧なもの
  2. タスクをできるだけ異なる関数に分割する
     - 別の関数に出来ないものは領域で分割する
       - → [「4章 宣言をブロックにまとめる」を参照](#4%E7%AB%A0-%E7%BE%8E%E3%81%97%E3%81%95)

### 12章 コードに思いを込める

- 「おばあちゃんがわかるように説明できなければ、本当に理解したとは言えない」
  - アルバート・アインシュタイン
- コードをより明確にする簡単な手順
  1. コードの動作を簡単な言葉で同僚にもわかるように説明する
     - 人じゃなくても「ラバーダッキング」という手法もある
  2. その説明のなかで使っているキーワードやフレーズに注目する
     - ここから分割する下位問題が見つかる
  3. その説明に合わせてコードを書く
- ライブラリを知る
  - 実装しようとしている処理が提供されているライブラリにないか確認する
  - 標準ライブラリ以外にもOSSのライブラリ等も確認する

### 13章 短いコードを書く

- コードを小さく保つ方法
  1. 汎用的なユーティリティコードを作ってコードの重複を減らす
  2. 未使用のコード、無用な機能を削除する
     - <strong>*YAGNIの原則*</strong>
  3. プロジェクトをサブプロジェクトに分割する
  4. コードの「重量」を意識する、軽量で機敏にしておく
- 身近なライブラリに親しむ
  - 標準ライブラリやよく使われるOSSのライブラリは時間がある時に目を通して把握しておく
    - どんなものがあったか記憶しておくだけで、使う時に役立つ
- ライブラリの再利用性を意識する
  - 既に設計・テストされたメソッドを使用することで無駄な時間を使用しなくて済むという意識を保つ
- <strong>*Unixツールボックスを使う*</strong>
  - プログラミング言語では何十行も書かなきゃいけない処理が、シェルスクリプトなら数行で済むケースがある
    - 例: アクセスログからどのURLでエラーしているか調べたい場合...
  - WindowならPowerShellがある
    - C#なら`System.Management.Automation.RunspaceInvoke`クラスでPowerShellを実行できる

## 第Ⅳ部 選抜テーマ

14章はテストについて、15章は実例を使った全章の総括なので割愛します。

* * *

1. このエントリーは[2018年8月9日にQiitaにて投稿していた記事](https://qiita.com/neko3cs/items/e7cdc5609dcfe7261745)の移転・修正ブログです。
2. 一気に書き上げてまとまってないと思うので後日、自分の意見を織りつつ整理します。
