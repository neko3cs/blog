---
Title: Windows で sudo を実現する、「gsudo」の紹介
Date: 2020-07-23T16:12:55+09:00
URL: https://blog.neko3cs.net/entry/gsudo-sudo-for-windows
---

Linux に慣れている人は Windows に `sudo` コマンドがないことに不満はないでしょうか？

私はあります。

例えば、 Windows のパッケージマネージャーの 1 つである [Chocolatey](https://chocolatey.org/) でアプリをインストールするときに管理者権限じゃないとインストール出来なくて一々開きなおすとか...。

そんな不満を Twitter にぶちまけていたら神ツールを紹介してくれる人が現れました。

> 何がいけないって windows に sudo コマンドがないのがいけないんだと思います。  
>   
> あるけど、面倒くさすぎるでしょ。  
> Start-Process で管理者権限として別プロセスで実行しないといけない。
> 
> — 𝓷𝓮𝓴𝓸 (@neko3cs) [2020年7月16日](https://twitter.com/neko3cs/status/1283885090418778113?ref_src=twsrc%5Etfw)

> windowsの標準機能にsudoが加わるまではgsudoが良い感じです  
> Credentials Cache機能がとても便利[https://t.co/LSOAiW2pa8](https://t.co/LSOAiW2pa8)
> 
> — lu-anago (@lululu63499233) [2020年7月16日](https://twitter.com/lululu63499233/status/1283906911784460288?ref_src=twsrc%5Etfw)

というわけで、Windows で `sudo` コマンドを実現する `gsudo` というツールを紹介します。

[gerardog/gsudo](https://github.com/gerardog/gsudo)

## 導入

`gsudo` は scoop もしくは chocolatey からインストール可能です。

**scoop**\*

```powershell
PS> scoop install gsudo
```

**chocolatey**

```powershell
PS> choco install gsudo
PS> refreshenv # パス反映のためのリフレッシュコマンド
```

また、パッケージマネージャーを利用していなくても、下記コマンドでマニュアルインストール出来ます。

```powershell
PS> PowerShell -Command "Set-ExecutionPolicy RemoteSigned -scope Process; iwr -useb https://raw.githubusercontent.com/gerardog/gsudo/master/installgsudo.ps1 | iex"
```

## 使い方

使い方はとてもシンプルで `sudo` コマンドとほぼ同じです。

以下のコマンドで新規ウィンドウを開くことなく、管理者権限に切り替えられます。

```powershell
PS> gsudo
```

![f:id:neko3cs:20200723154443p:plain](/images/20200723/20200723154443.png)

ただし、`gsudo` は UAC のダイアログが表示されます。

これが、`gsudo` の由来かもしれません。（GUI sudo？）

![f:id:neko3cs:20200723154527j:plain](/images/20200723/20200723154527.jpg)

また、管理者権限から抜けたい場合は以下のコマンドで抜けます。

```powershell
PS> exit
```

![f:id:neko3cs:20200723154728p:plain](/images/20200723/20200723154728.png)

当然ですが特定のコマンドに対してのみ `gsudo` を利用することも出来ます。

```powershell
PS> gsudo choco install git # コマンド実行後に UAC が表示される
```

詳細な使い方は公式ドキュメントが丁寧なので分かりやすいです。

[gerardog / gsudo - usage](https://github.com/gerardog/gsudo#usage)
