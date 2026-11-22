---
Title: Arch Linuxセットアップマニュアル
Category:
- 備忘録
- Linux
- ArchLinux
Date: 2024-03-09T18:55:02+09:00
URL: https://blog.neko3cs.net/entry/archlinux-install-manual
---

私は大学時代の卒業研究ではLinuxを使って研究をしていました。 当時を懐かしみたい気持ちもあって、Linuxの開発環境を作ってみようと思います。 当時の研究室の同期が「つよつよエンジニアはArch Linuxだよ」って言ってたのでディストリビューションはArch Linuxにしようと思います。

## Arch Linuxとは

[公式サイト](https://archlinux.org/)には以下のようにあります。

> シンプルで軽量なディストリビューション
> 
> Arch Linuxの Web サイトにアクセスしました。Arch Linuxは、シンプルさを追求した軽量で柔軟な Linux® ディストリビューションです。

Arch Linuxはシンプルさと軽量さが売りになっているようです。 ユーザーはシステムを必要に応じて任意にカスタマイズすることが出来ます。 そのため、Arch Linuxは軽量であり、いわゆる低スペックマシンでも動作することが可能になっています。

また、カーネルはLinuxベースなのでLinuxのエコシステムを利用することが出来ます。

したがってお金のない大学生などでも中古で動くマシンを手に入れさえすれば使えるようになる、貧乏人の味方でもあるのです。

## セットアップ準備

まず、インストールメディアを準備します。

以下のページのJapanの項目からISOファイルをダウンロードします。<sup id="fnref-c22c1739"><a href="#fn-c22c1739">\*1</a></sup>

[Arch Linux - Downloads](https://archlinux.org/download/)

その後、任意のメディア作成ツールを使ってUSBメモリなどに焼きます。

- Windows: rufusなど
- macOS: diskutilなど

## セットアップ手順

基本的には公式のインストールガイドに従います。 ただし、公式は最低限の手順しかないので、日本語化など、追加で行いたいものを付け加えて説明します。

### 起動

UEFIを立ち上げ、起動ディスクをインストールメディアにして立ち上げます。

ブートローダーが立ち上がったら「Arch Linux install medium (x86\_64, UEFI)」を選択してインストールメディアを起動します。

### キーボード設定

日本語配列の人は以下のコマンドを実行して、キーボード配列を設定します。

英語配列の人は実行不要です。

```shellscript
loadkeys jp106
```

### ネットワーク接続確認

以下のコマンドを実行して、ネットワークに繋がっていることをここで確認しておきます。

```shellscript
ping archlinux.jp
```

### システムクロックの更新

以下のコマンドを実行して、システムクロックの設定をします。

```shellscript
timedatectl set-ntp true
timedatectl set-timezone Asia/Tokyo
timedatectl status
```

NTPで時間を同期するように変更し、タイムゾーンをAsia/Tokyoに合わせておきます。

### パーティション作成

パーティションを分割します。

UEFIの場合、以下のレイアウトが推奨されています。

| マウントポイント | パーティション | パーティションタイプ | 推奨容量 |
| --- | --- | --- | --- |
| `/mnt/boot` | `/dev/efi_system_partition` | EFI System Partition | 最低300MiB |
| `swap` | `/dev/swap_partition` | Linux swap | 512MiB以上 |
| `/mnt` | `/dev/root_partition` | Linux filesystem | 残り容量全て |

boot領域はインストールするカーネルの量によりますので、事前に入れるカーネルの総容量を計算しておくといいと思います。 本手順では300MiBあればインストール可能です。

swap領域は以下の参考をサイトに決めるといいと思います。

[第15章 swap 領域 Red Hat Enterprise Linux 7 | Red Hat Customer Portal](https://access.redhat.com/documentation/ja-jp/red_hat_enterprise_linux/7/html/storage_administration_guide/ch-swapspace)

上記を元に分割を実施します。

まず、以下のコマンドでパーティション状況を見ます。

```shellscript
lsblk
```

いっちゃんでかいディスクが分割対象です。多分 `/dev/sda` とかだと思います。

そしたら、以下のコマンドで分割ツールを起動します。

```shellscript
cgdisk /dev/sda
```

TUIのツールになっているので画面に沿って、上記の表のように分割していきます。

分割すると最終的に以下のような状態になりました。

![](/images/20240309/20240309175003.png)

### パーティションのフォーマット

以下のコマンドを実行して、パーティションをフォーマットします。

```shellscript
mkfs.fat -F 32 /dev/sda1
mkfs.ext4 /dev/sda2
mkswap /dev/sda2
```

EFIシステムパーティションはFAT32でのフォーマットが必要なようです。

ファイルシステムパーティションはLinuxでメジャーなext4を指定します。

### パーティションのマウント

以下のコマンドを実行して、パーティションをマウントします。

```shellscript
mount /dev/sda2 /mnt
mount --mkdir /dev/sda1 /mnt/boot
swapon /dev/sda3
```

### インストール

以下のコマンドを実行して、必要なカーネルなどをインストールします。

```shellscript
pacstrap /mnt base base-devel linux linux-firmware sudo nano
```

ミラーを変更した方がダウンロードが早くなるようですが、今回は気にせずそのまま実行します。

なお、インストールしたものは以下のとおりです。

| パッケージ | 内容 |
| --- | --- |
| base | Arch Linuxの基本パッケージ |
| base-devel | 開発で必要になるパッケージ群 |
| linux | 通常のLinuxのカーネル |
| linux\-firmware | 無線LANやグラフィックボードなどのLinux用ファームウェアパッケージ群 |
| sudo | 管理者権限実行で必要なツール |
| nano | エディター |

### fstabの生成

以下のコマンドを実行して、fstabを生成します。

```shellscript
genfstab -U /mnt >> /mnt/etc/fstab
```

### chrootの実行

以下のコマンドを実行して、chrootします。

```shellscript
arch-chroot /mnt
```

### タイムゾーンの設定

以下のコマンドを実行して、タイムゾーンを指定します。

```shellscript
ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
```

その後、以下のコマンドを実行して、 `/etc/adjtime` を生成します。

```shellscript
hwclock --systohc
```

### ローカリゼーションの設定

以下のコマンドを実行します。

```shellscript
sudo locale-gen
```

テキストエディタにて管理者権限で `/etc/locale.gen` を開き、以下の項目のコメントアウトを外します。

- en\_US.UTF-8
- ja\_JP.UTF-8

もう一度最初のコマンドを実行します。

```shellscript
sudo locale-gen
```

テキストエディタにて管理者権限で `/etc/locale.conf` を開き、以下を追記します。

```text
LANG=ja_JP.UTF-8
```

### ネットワークの設定

以下のコマンドを実行して、ホスト名を指定します。

```shellscript
echo neko3cs-archlinux > /etc/hostname
```

今回は `neko3cs-archlinux` としています。

これがコンピューター名となります。

また、 `/etc/hosts/` を開き、以下を追記します。

```text
127.0.1.1    neko3cs-archlinux.localdomain    neko3cs-archlinux
```

次に以下のコマンドを実行して、 dhcpd をインストールします。

```shellscript
pacman -S dhcpcd
```

`ip -l` でネットワークインターフェース名を確認します。

今回は `ens33` だったので以下のコマンドを実行し、dhcpd を有効化します。

```shellscript
systemctl enable dhcpd@ens33
```

### ブートローダーの設定

今回は GRUB を使用します。

以下のコマンドを実行して、GRUBをインストールします。

```shellscript
pacman -S grub
```

その後、以下のコマンドを実行して、GRUBをブート領域にインストールしていきます。

```shellscript
pacman -S efibootmgr
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=grub
grub-mkconfig -o /boot/grub/grub.cfg
```

### rootユーザーのパスワード設定

以下のコマンドを実行して、rootユーザーのパスワードを指定します。

```shellscript
passwd
```

### ユーザー作成

以下のコマンドを実行して、普段使用するユーザーを作成します。

```shellscript
useradd -m -g users -G wheel -s /bin/bash neko3cs
passwd neko3cs
```

その後、 `/etc/sudoers` を開き、以下の部分をアンコメントします。

```text
## uncomment to allow members of group wheel to execute any command
%wheel ALL=(ALL:ALL) ALL
```

ここで一度再起動します。

### yayのインストール

以下のコマンドを実行し、yayをインストールします。

```shellscript
sudo pacman -S git go
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
```

Arch Linuxのデフォルトパッケージマネージャーは pacman ですが、 pacman では不十分な場合 AUR からパッケージを取得します。

yay は AUR のパッケージマネージャーです。

### デスクトップ環境のインストール

今回は Xfce と LightDM を使用します。

以下のコマンドを実行して、デスクトップ環境をインストールします。

```shellscript
sudo pacman -S lightdm lightdm-gtk-greeter xfce4
sudo systemctl enable lightdm.service
startxfce4
```

### ファイアウォールのインストール

以下のコマンドを実行して、ファイアウォールをインストールします。

```shellscript
sudo pacman -S ufw gufw
```

### 日本語化

日本語に対応したフォントをインストールします。

```shellscript
sudo pacman -S otf-ipafont noto-fonts-cjk
```

日本語入力に対応したIMEをインストールします。

```shellscript
sudo pacman -S fcitx5-im fcitx5-mozc
```

## 参考文献

- [インストールガイド - ArchWiki](https://wiki.archlinux.jp/index.php/%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E3%82%AC%E3%82%A4%E3%83%89)
- [私的Arch Linuxインストール講座](https://zenn.dev/ytjvdcm/articles/0efb9112468de3#%E5%85%A5%E3%82%8C%E3%81%A6%E3%81%8A%E3%81%8D%E3%81%9F%E3%81%84%E3%82%BD%E3%83%95%E3%83%88%E8%89%B2%E3%80%85)
- [Arch Linux インストール (1)](https://aznote.jakou.com/archlinux/install1.html)
- [ArchLinuxのインストール 2.GUI(xfce)&日本語環境構築編 - グレインの備忘録](https://grainrigi.hatenablog.com/entry/2017/12/02/221247)

---

<span id="fn-c22c1739"></span>[*1](#fnref-c22c1739): 私は jaist.ac.jp から取得しました
