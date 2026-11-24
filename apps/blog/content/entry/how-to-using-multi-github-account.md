---
Title: 複数のGitHubアカウントを同一PC上で使用する
Category:
- 備忘録
- git
- GitHub
Date: 2024-03-26T15:04:42+09:00
URL: https://blog.neko3cs.net/entry/how-to-using-multi-github-account
---

最近、会社用のGitHubアカウントを作成し、アカウントの複数運用が必要になりました。

その対応方法をメモしておきます。

### 手順

SSHキーをアカウント分用意しておきます。

以下のように、 `-f` オプションを指定して実行するとファイル名を分けられます。

```powershell
ssh-keygen -t rsa -b 4096 -C "<メールアドレス>" -f ~/.ssh/<ファイル名>
```

今回は個人アカウントを `github-personal` 、会社アカウントを `github-company` とします。

その後、作成したそれぞれのキーを各アカウントに登録します。

登録の仕方は過去記事で説明しているのでリンクを貼っておきます。

[git 入門 〜導入編〜 - ねこさんのぶろぐ](/entry/2019/10/18/084250)

最後にSSHの設定ファイルを作成します。

`~/.ssh/config` に以下の内容を記載します。

```text
Host github.com
    HostName github.com
    IdentityFile ~/.ssh/github-personal
    User git

Host github.com
    HostName github.com
    IdentityFile ~/.ssh/github-company
    User git
```

これで設定は終わりました。

### Tips

接続を明確に分けたい場合はSSH設定ファイルの `Host` の項目をホスト名ではなく別名を付けるといいと思います。

```text
Host github-personal
    HostName github.com
    IdentityFile ~/.ssh/github-personal
    User git

Host github-company
    HostName github.com
    IdentityFile ~/.ssh/github-company
    User git
```

その場合、 `git clone` する際のURLも変わります。

```powershell
// git@github.com -> git@github-personal
git clone git@github-personal:neko3cs/HogeHogeRepository.git
```

また、それぞれのリポジトリでのアカウントの切り分けは `git config --local` で各々設定を変えるか、次のようなシェル関数をrcファイルに用意して切り替えることになります。

以下はPowerShellの例で、 $PROFILE に追記しておくとどこからでも呼べるようになります。

```powershell
function ChangeTo-PersonalGitAccount {
  git config --global user.name <ユーザー名>
  git config --global user.email <メールアドレス>
}
```

## 2024-3-27 追記

冷静に考えたらHTTPS接続を使った方が楽だということに気づきました。 そもそも、アカウント複数運用する人はHTTPSで接続・認証し、 `git config --local user.(name|email)` でユーザーを個別に設定しておくといいと思います。 この記事はSSH認証を用いたい人向けということで参考にしてください。
