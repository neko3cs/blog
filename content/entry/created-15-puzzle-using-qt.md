---
Title: Qt Quickを使って15パズルを作成したのでメモしておく
Category:
- C++
- CMake
- Qt
- 雑記
Date: 2024-02-15T17:40:01+09:00
URL: https://blog.neko3cs.net/entry/created-15-puzzle-using-qt
---

今回、Qt Quickを用いて15パズルゲームを作成したので、困ったところなどをメモしておこうかなと思います。

ソースコードは以下になります。

[GitHub - neko3cs/15Puzzle](https://github.com/neko3cs/15Puzzle)

## なぜ作った？

元々大学3年時代、卒業研究でC++を使って実験プログラムを作ることになりました。

学科がプログラミングを専門とする専攻ではなかったため、プログラミングは不慣れでした。

そこで、C++の勉強のために15パズルゲームを作ろうとしました。

ですが、ままならないまま実験プログラムの作成時期になってしまったため放置されていたんですね。

それを最近掘り起こして動くようにした次第になります。

## プログラムの解説

ここからは実際のコードについて説明していきます。

👆のソースコードのリンクを開いて対比してみて貰えるといいと思います。

### CMake設定

CMakeプロジェクトとして作成しています。

```cmake
# CMakeLists.txt
add_compile_options(-Wall -O3)
```

最適化オプションは通常はO2で十分のようですが、イキってO3にしてます。

```cmake
# CMakeLists.txt
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)
```

上記の設定をしておくと Qt 周りの設定をよしなにしてくれるようです。

### プロジェクト構成

今回はMVVMパターンを意識して実装しました。

<figure><img src="/images/20240215/20240215171347.png" alt="プロジェクト構造" loading="lazy"><figcaption>プロジェクト構造</figcaption></figure>

modelsには15パズルのロジック処理を、view\_modelsには画面操作の処理を、viewには画面定義のqmlファイルが置かれています。

### Qt実装

QtはWidgetではなく、Qmlを使うQuickを使用しています。

QmlはJavaScriptベースのUI記述言語で、イベント処理などにJavaScriptを使用できますが、今回はC++の処理をバインドして使っています。

```cpp
// main.cpp
MainWindow mainWindow;
QQmlApplicationEngine engine;
engine.rootContext()->setContextProperty("mainWindow", &mainWindow);
```

まず、main.cppで `QQmlApplicationEngine` の定義をする時に、ViewModelとなるクラスを紐づけておきます。

この時、 `engine` の前に `mainWindow` を宣言しないとアプリケーション終了時に `engine` より先に `mainWindow` がメモリから消えて、propertyがnullだという実行時エラーが出るので注意です。

```qml
// MainWindow.qml
Column {
  anchors.centerIn: parent
  spacing: 10
  focus: true
  Keys.onLeftPressed: mainWindow.MoveHiddenPanelToLeft()
  Keys.onRightPressed: mainWindow.MoveHiddenPanelToRight()
  Keys.onUpPressed: mainWindow.MoveHiddenPanelToUp()
  Keys.onDownPressed: mainWindow.MoveHiddenPanelToDown()
```

また、画面定義でのキーボード入力のイベントにはKeysプロパティを使うのですが、これがQtQuick.Itemを継承したコンポーネントじゃないと正しく実装出来ないようです。

Keysプロパティの設定には `focus` を `true` にしておく必要があります。

この設定が `ApplicationWindow` コンポーネントにはないんですね。

```qml
// MainWindow.qml
Grid {
  columns: 4
  rows: 4
  spacing: 5
  anchors.horizontalCenter: parent.horizontalCenter

  Repeater {
    model: mainWindow.Panels
    delegate: Rectangle {
      width: 50
      height: 50
      color: modelData == 16 ? "green" : "white"
      border.color: modelData == 16 ? "transparent" : "green"

      Text {
        text: modelData == 16 ? "" : modelData
        font.pixelSize: 36
        color: "black"
        anchors.fill: parent
        verticalAlignment: Text.AlignVCenter
        horizontalAlignment: Text.AlignHCenter
      }
    }
  }
}
```

パネルの実装には `Grid` コンポーネントと `Repeater` コンポーネントを組み合わせて実装してます。

条件分岐による表示の切り替えはC++側では難しいのでJavaScriptで処理しています。<sup id="fnref-e3801fcd"><a href="#fn-e3801fcd">\*1</a></sup>

そして、`model` プロパティにC++側で用意した `Q_PROPERTY` 定義のオブジェクトを指定します。

```cpp
// MainWindow.hpp
Q_PROPERTY(QVariantList Panels READ GetPanels WRITE SetPanels NOTIFY PanelsChanged)
```

Qmlで扱えるように型は `QVariantList` というものを使用しています。

```cpp
// MainWindow.cpp
QVariantList MainWindow::GetPanels() const
{
  QVariantList list;
  for (auto value : _board.GetPanelsAsIntVector())
  {
    list.append(QVariant::fromValue(value));
  }

  return list;
}
```

内部では `Board` クラスとしてパネル情報を持っているので、リードシグナルとなる GetPanels メソッド内で変換しています。

### ロジック実装

```cpp
// Board.hpp
std::vector<Panel> board;
```

内部的には `std::vector` の一次元配列を用いて実装しています。

`Panel` クラスというのを定義していますが、過去の名残で数字を持つだけの意味をなさないクラスになってます。

```cpp
void Board::Initialize()
{
  unsigned seed =
      std::chrono::system_clock::now().time_since_epoch().count();

  std::vector<int> numbers;
  for (int num = 1; num <= SIZE * SIZE; num++)
  {
    numbers.push_back(num);
  }

  auto engine = std::default_random_engine(seed);
  std::shuffle(numbers.begin(), numbers.end(), engine);

  board.clear(); // 再初期化の時のため

  for (int x = 0; x < SIZE; x++)
  {
    for (int y = 0; y < SIZE; y++)
    {
      Panel panel(numbers[x * SIZE + y]);
      board.push_back(panel);
    }
  }
}
```

ゲーム起動時にパネル情報をランダムに配置するようにしています。

C++には時間をシードとして配列をランダム配置する処理が標準テンプレートライブラリにあるのでそれを用いてシャッフルしてます。

```cpp
void Board::MovePanel(MoveDirection direction)
{
  auto hidden = std::find_if(board.begin(), board.end(), [](Panel p)
                             { return p.IsHidden(); });
  auto hiddenIndex = std::distance(board.begin(), hidden);

  auto targetIndex = -1;
  switch (direction)
  {
  case MoveDirection::Left:
    targetIndex = hiddenIndex - 1;
    break;
  case MoveDirection::Right:
    targetIndex = hiddenIndex + 1;
    break;
  case MoveDirection::Up:
    targetIndex = hiddenIndex - SIZE;
    break;
  case MoveDirection::Down:
    targetIndex = hiddenIndex + SIZE;
    break;
  default:
    throw std::invalid_argument("無効な方向が引き渡されました。");
  }

  if (targetIndex >= 0 &&                            // 左上端を突き抜けないこと
      targetIndex < SIZE * SIZE &&                   // 右下端を突き抜けないこと
      ((hiddenIndex / SIZE == targetIndex / SIZE) || // 同行に存在すること
       (hiddenIndex % SIZE == targetIndex % SIZE)))  // 同列に存在すること
  {
    std::swap(board[hiddenIndex], board[targetIndex]);
  }
}
```

パネルの移動は少しだけトリッキーです。

一次元配列であることを意識して先頭と末尾を超えていないことに加えて、同行にあるということはどういうことか、同列にあるということはどういうことかを意識して条件を設定してます。

あとはただの一次元配列なのでスワップするだけです。

そして、この処理を `MainWindow.cpp` の各シグナルのメソッド内で実行するだけですね。

## 作ってみた感想

学生の時は本当にプログラミングが苦手でした。

あれから約10年ほどで2週間くらいで完成出来たので自分の成長を感じました。

久しぶりに C++ に触れてプログラミングを学び始めた頃を思い出せたのでよかったです。

今後 Qt をあえて使うことはあまりないかもですが、気が向いたときにまた触れてみたいと思います。

---

<span id="fn-e3801fcd"></span>[*1](#fnref-e3801fcd): とは言ってもただの三項演算子。
