---
Title: IIS上に構築されたFTPサーバーのユーザー名を先に修正してしまった後のIISマネージャーでの設定について
Category:
- 備忘録
- IIS
- FTP
Date: 2021-09-04T20:03:58+09:00
URL: https://blog.neko3cs.net/entry/how-to-fix-ftp-auth-rule-after-fix-user-name
---

業務上、FTPユーザーの名前を統一する必要があり、IISマネージャー上に立っているFTPサーバーのユーザー名を変更するといったことをしてしまいました。

これによって 530 エラーでログイン出来なくなってしまいました。

<figure><img src="/images/20210904/20210904195126.png" alt="f:id:neko3cs:20210904195126p:plain" loading="lazy"><figcaption>ログイン出来なくなった ftp_user くん</figcaption></figure>

IISの仕様を理解していなかったので原因解明に少し時間が掛かってしまいました。

将来の自分のために備忘録を残しておきたいと思います。

## 原因

IIS には **FTPの承認規則** というものがあります。

FTP 接続する際のルール設定はここで行うようです。

<figure><img src="/images/20210904/20210904195632.png" alt="f:id:neko3cs:20210904195632p:plain" loading="lazy"><figcaption>FTPの承認規則</figcaption></figure>

Windows の「コンピューターの管理」からユーザー名を変更してしまうとここで設定されているルールとの整合性が取れなくなり、アクセス出来なくなるようです。

## 解消方法

**FTPの承認規則**を修正してあげましょう。

<figure><img src="/images/20210904/20210904195934.png" alt="f:id:neko3cs:20210904195934p:plain" loading="lazy"><figcaption>FTPの承認規則の修正</figcaption></figure>

右ペインにある「編集」から修正出来ます。

ユーザを「コンピューターの管理」で修正したユーザー名に修正します。

今思えば、ユーザー名を変更するのではなく、新たにFTPユーザーを追加すればよかったですね。
