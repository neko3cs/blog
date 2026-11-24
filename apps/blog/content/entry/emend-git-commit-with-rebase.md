---
Title: git rebaseを使って過去のコミットを修正する
Category:
- git
- 備忘録
Date: 2021-06-15T19:22:26+09:00
URL: https://blog.neko3cs.net/entry/emend-git-commit-with-rebase
---

この記事は Zenn にも同様の内容で投稿しております。

[git rebaseを使って過去のコミットを修正する](https://zenn.dev/neko3cs/articles/emend-git-commit-with-rebase)

* * *

gitを使って構成管理をしている際に、過去のコミットを直したくなることがあると思います。

私の場合、

> 「取り合えず完成！コミット！」
> 
> 「別の修正も完了！コミット！」
> 
> 「あぁ...2つ前でやった実装の漏れ見つけてしまった...🤦‍♂️」

といった感じで、後から修正したくなることがよくありました。

今までは仕方なく新規コミットとして追加していましたが、 `git rebase` を使えば過去のコミットも編集可能であることを知ったのでまとめます。

### How to

まず、 `rebase` は変更があると実行出来ないので、変更がある場合は一度 `git stash save` しておきましょう。

変更がなくなったら、以下のコマンドでリベースモードに入ります。

```shellscript
git rebase --interactive HEAD~~
```

`~` の数は戻したいコミットがある数まで指定します。

事前に `git log --oneline` とかで確認しておくとよいです。

リベースモードに入ったら変更したいコミットの `pick` を `edit` に変更します。

編集方法は `vi` と同じです。 `i` キーを押して編集モードに入ります。

![](https://storage.googleapis.com/zenn-user-upload/18a2642012ecb98bab05844d.png)

変更したら `esc` キーを押した後、 `:wq` で保存します。

このタイミングで編集を実施します。

最初に適用したい変更を `git stash save` している場合はここで `git stash pop` します。

編集が完了したら `--amend` で継ぎ足しコミットします。

```shellscript
git add --all
git commit --amend --no-edit
```

コミットが完了したらリベースモードを終了します。

```shellscript
git rebase --continue
```

ちなみに既に `git push` 済みのコミットを変更する場合、`push` 時に `--force` オプションをつける必要があります。

## リベースモードを辞めたい場合

リベースモードに入った後に、やっぱりリベースを辞めたくなったら以下のコマンドで戻ります。

```shellscript
git rebase --abort
```
