---
Title: Git でユーザーを間違ってコミット→プッシュしてしまったときの対処法
Date: 2020-08-17T13:07:38+09:00
URL: https://blog.neko3cs.net/entry/fix-wrong-user-commit-and-push-in-git
---

私は Git 利用では個人用と仕事用の2つのユーザーを使い分けています。

このため、たまに仕事用のユーザーで個人のリポジトリにコミット→プッシュしてしまったりして、厄介です。

でも、Git にはあとからコミットしたユーザーを修正する方法が用意されています。

```shellscript
$ git filter-branch -f --env-filter \
    "GIT_AUTHOR_NAME='<user.name>'; \
     GIT_AUTHOR_EMAIL='<user.email>'; \
     GIT_COMMITTER_NAME='<user.name>'; \
     GIT_COMMITTER_EMAIL='<user.email>';" \
    <target commit | HEAD>
$ git push -f
```

上記のコマンドを実行すると指定したコミット、もしくは、すべてのコミットが指定したユーザー名、メールアドレスに書き換わります。

`target commit` にコミット ID を指定するとそのコミットが、`HEAD` を指定すると全コミットが対象になります。

書き換えた後はフォースプッシュしてリモートも書き換えます。

```shellscript
git filter-branch --commit-filter ' 
  if [ "$GIT_COMMITTER_NAME" = "<target user.email>" ];
    then
        GIT_AUTHOR_NAME="<user.name>";
        GIT_AUTHOR_EMAIL="<user.email>";
        GIT_COMMITTER_NAME="<user.name>";
        GIT_COMMITTER_EMAIL="<user.email>";
        git commit-tree "$@";
    else
        git commit-tree "$@";
    fi'  HEAD
$ git push -f
```

書き換えたい対象のユーザーを指定する場合は上記のコマンドを実行します。
