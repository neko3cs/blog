---
Title: Windows TerminalでWindows Vimを使うと色がおかしくなる時の修正方法
Category:
- Windows
- vim
- 備忘録
Date: 2024-08-06T16:12:50+09:00
URL: https://blog.neko3cs.net/entry/fix-color-of-vim-on-windows-terminal
---

まず初めに症状を説明します。

以下は WSL2 Ubuntuのvimを起動した場合です。

![](/images/20240806/20240806155326.png)

次がWindowsでvim.exeを起動した場合です。

![](/images/20240806/20240806154805.png)

色がおかしいですね。

原因は分かっていませんが、vimrcに以下の通り設定すると正しい色で表示されます。

```viml
if has("win32") || has("win64")
  set t_Co=256
endif
```

一枚目と区別つかないですが、バージョンが色がおかしいものと同じなので直ったことが確認出来ます。

![](/images/20240806/20240806160854.png)

おそらく、まず私の使用しているカラースキームでは256色対応されていないと表示が正しくなくなるんだと思います。 そして、Windows Terminalとしては256色対応しているのに、Windows Vimでは256色使うようになっていない。 なので、256色使うように指定したら直ったということかなと思います。

\~ちなみに私のvimrcは以下にて公開しています。\~

* * *

## 2026年3月19日(木)追記

NeoVimに移行しました。それに伴って設定方法も変更しています。

詳細は init.lua をご確認ください。

[.dotfiles/init.lua at main · neko3cs/.dotfiles](https://github.com/neko3cs/.dotfiles/blob/main/init.lua)
