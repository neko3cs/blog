---
Title: Ruby on Rails学習メモ
Category:
- Ruby
- Ruby on Rails
- 備忘録
Date: 2019-03-28T12:34:46+09:00
URL: https://blog.neko3cs.net/entry/ruby-on-rails-study-memo
---

以前にRuby on Railsを学んだ際のメモをそのまま載せます。 メモ書きなのであまり纏まってないと思います。

多分題材は[ドットインストール](https://dotinstall.com/lessons/basic_rails_v3)かな？

## Railsサーバの起動と停止

- 起動：`rails server -b {IPアドレス} -d`
  - 事前にマシンのIPを調べておく　→　`$ ip a` or `$ ifconfig`
- 停止：`cat tmp/pids/server.pid | xargs kill -9`
  - サーバのプロセスIDは`server.pid`に記録される
  - パイプラインで引き渡してkillコマンドで停止する

## scaffoldコマンド

- スタートアップコマンド（テンプレートを用意してくれる）
  - scaffold：足場をつくる
- コマンド
  - `$ rails g scaffold {api name} [name1:type1, name2:type2,  …]`
  - 型は `title:string`のように`{カラム名}:{型}`の順で指定
- scaffoldしたら以下のコマンドでDB設定
  - `$ rails db:migrade`
- 詳細は以下のサイトを参考
  - [いつも忘れる「Railsのgenerateコマンド」の備忘録 - maeharinの日記](http://maeharin.hatenablog.com/entry/20130212/rails_generate)

## Modelの作成

- `rails g model [model name]`で作成
- モデルをテーブルへ反映させる
  - `db:migrate`
    - モデル作成した後とかに自動でDBへテーブル作成をおこなったりする
  - `db:migrate:reset`
    - 全てのテーブルのtruncate tableみたいな感じ
  - `db:seed`
    - seeds.rbに書いたコードでデータベースへデータを格納できる

## consoleコマンド

- irbを起動する
- 対話型
- 特定のテーブルへのデータ追加とかできる
  - `$ irb > p = [model name].new(name1:type1, name2:type2…)`
    - newの時は`irb> p. save`が必要
  - `$ irb > [model name].create(name1:type1, name2:type2...)`
    - データのInsert

## Contorllerのルーティング

- `rails g controller [controller name]`でControllerの作成
- `/config/routes.rb`にてルーティング
  - `resource :[controller name]`
- `$ rails routes`にてアプリケーションでのルーティングを確認出来る

## Viewの記述

- `/app/views/`に`[view name].html.erb`を作成してhtmlで記述
- `<%%>`でRubyコードが書ける
- `<%= %>`でRubyの式を評価出来る → データバインド

## Rootパスの設定

- `/config/routes.rb`にて設定
  - `root '[Controller#Action]'`
- Convention over Configuration
  - Ruby on Railsは設定を設定ファイルに記述するのではなく、命名規則などの規約に基づいて設定が自動でなされる

## Application全体のレイアウト

- `app/views/layouts/application.html.erb`にて（WebFormsで言う）マスターページが用意されている
- 作成したViewは`<%= yield %>`にバインドされる

## CSS/JSファイル

- `app/assets/stylesheet`、`app/assets/javascript`に対応するファイルが生成される

## link\_toヘルパー

- TextとPathを渡してLinkButton化する
  - 例: `<%= link_to post.title, post_path(post) %>`

## image\_tagヘルパー

- FileNameとCssClassを渡して画像を表示する
  - 例: `<%= image_tag ‘header.png', class: 'header' %>`
- 画像は`app/asset/image/`のなかへ保存する

## form\_forヘルパー

- フォームタグの生成
  - 例: `<%= form_for :post, url: posts_path do |f| %>`
    - `f.text_field`, `f.text_area`のようにHtmlヘルパを使ってフォームを形成出来る
    - `f.submit`でsubmitボタンを生成出来る

## StrongParameters（requireメソッドとpermitメソッド）

- RailsではPOSTされたデータをそのままDBへ格納することは許されていない
  - ForbiddenAttributesError: 検証未チェックエラーの発生
- `require(:post).permit(:title, :body)`で検証
  - 「`params`が`:post`というキーを持ち、`params[:post]`は`:title, :body`というキーを持っているハッシュであること」と言う検証をおこなう（この形式のPOST以外はDBへ書き込まない）

## データのバリデーションチェック

- Modelsに記入
  - `app/models/post.rb` ※対象のModelクラス
- validatesヘルパーで検証
  - 例1: `presence: true`　→　空入力の禁止
  - 例2: `length { minimum: 3 }`　→　3文字以上
    - `message: 'メッセージ内容’`と続けるとエラーメッセージをカスタマイズ出来る

## エラー表示

- 例: `<% if @post.errors.messages[:title].any? %>`
  - エラー内容はモデルにerrorsというプロパティが用意されている

## データの更新

- 例: `@post.update(post_params)`
  - 渡ってきたパラメータで更新する
  - 更新できたかどうかは戻り値で確認

## 文字列の最適化

- simple\_formatメソッド
  - 文字列に含まれる改行を`<br/>`に変換したり、`<p>`で文字列を囲ったりする

## Viewの共通化

- 共通部品は`_form.html.erb`のようにアンダースコアから始める
- 似たようなフォームを共通化する際は必ず`routes.rb`へ`resources: [model name]`を記載する
  - 各フォームで渡されるべき`form_for`の引数はRailsが自動で渡してくれる
- 共通部品は`render ‘[view name]’`で呼び出す

## 削除リクエストの実行

- 例: `<%= link_to '[x]', post_path(post), method: 'delete', data: { confirm: 'Sure?' }, class: 'command' %>`
  - ルーティングはpost\_pathだけどGETメソッドと同じなため、明示的に`method: ‘delete'`をつける
  - `data: { confirm: 'Sure?' }`をつけることで削除リクエスト実行前に確認ダイアログを表示できる

## モデルの参照

- モデル同士での外部参照をおこなうには`references`型を使う
  - 例: `rails g model Comment body:string post:references`
  - モデル生成すると`belongs_to :post`という紐付けの設定がされている
- モデルの生成をおこなったら外部参照される側のモデルにも設定が必要
  - 例: `has_many :comments`
  - postに対してcommentが複数の場合なので`has_many`を使用する

## ルーティングの限定

- 使用するモデルによっては使われるルーティングが限られている場合がある
- そのため、限定しておくことで無駄なルーティングを減らす
  - 例: `resource :comments, only: [:create, :destroy]`
  - “only: “オプションを使用することで使用するルーティングを限定する

## 親モデルと子モデルの削除時オプション

- dependent:オプションの使用により親モデルが削除された場合の参照されている子モデルの扱いを設定する
  - 例: `has_many :comments, dependent: :destroy`
  - `dependent: :destroy`によって親モデルが削除されたら子モデルも削除されるようになる
