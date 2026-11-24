---
Title: Docker コンテナ内で実行した Angular アプリをホストからアクセスする
Category:
- 備忘録
- Angular
Date: 2020-07-26T01:38:35+09:00
URL: https://blog.neko3cs.net/entry/access-angular-in-docker-container-from-host
---

以下のコマンドで実行するとホストからアクセス出来るようになります。

```shellscript
$ ng serve --host=0.0.0.0 --poll
```

`--host=0.0.0.0` を付けないと外部から見えなくなるそうです。

`--poll` をつけることで webpack がソースコードを監視する精度が上がってちゃんとホットリロードが聞くようになります。
