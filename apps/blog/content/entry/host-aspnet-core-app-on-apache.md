---
Title: ASP.NET CoreアプリをApacheでホストする
Category:
- ASP.NET Core
- .NET Core
- Apache
- CentOS
- Docker
Date: 2019-08-17T17:33:34+09:00
URL: https://blog.neko3cs.net/entry/host-aspnet-core-app-on-apache
---

ASP.NET Coreの登場でLinuxでもC#で作成したWebアプリが動かせるようになったみたいです。 .NETは使いたいけど、Linuxの文化も取り入れたい！ということで簡単にApacheでホストしてみたいと思います。

本手順ではサーバ構築にDockerを使用します。事前にインストールしておきましょう。

## サーバを用意する

Dockerを使用してCentOSのサーバを建てます。 Dockerfile書いてドヤりたかったんですが、筆者弱小エンジニアなので手作業()で構築します。

取り敢えず、最新のCentOSイメージを拾って起動し、中に入ります。

```text
$ docker pull centos
$ docker run -p 80:80 -p 443:443 -d --privileged centos:latest /sbin/init
$ docker exec -it {CentOSのコンテナID} /bin/bash
```

CentOSコンテナの中に入れたら必要なパッケージをインストールします。

```text
# yum update
# yum install -y httpd firewalld
# rpm -Uvh https://packages.microsoft.com/config/rhel/7/packages-microsoft-prod.rpm
# yum install -y dotnet-sdk-2.2
```

httpdがApache HTTP Serverでfirewalldはただのファイアウォールです。 .NET Core SDKは通常のパッケージマネージャーから取得出来ないのでパッケージを取得してからインストールします。

インストール出来たらサービスを起動してあげましょう。

```text
# systemctl enable httpd
# systemctl start httpd
# systemctl status httpd
# systemctl enable firewalld
# systemctl start firewalld
# systemctl status firewalld
```

ちゃんと起動していれば、緑色で`active (running)`って表示されるかと思います。

![f:id:neko3cs:20190817024513p:plain](/images/20190817/20190817024513.png)

![f:id:neko3cs:20190817024532p:plain](/images/20190817/20190817024532.png)

最後にファイアウォールに穴を開けてHTTP(S)通信出来るようにしてあげます。

```text
# firewall-cmd --add-port=80/tcp --permanent
# firewall-cmd --reload
# firewall-cmd --list-all
```

![f:id:neko3cs:20190817025035p:plain](/images/20190817/20190817025035.png)

赤枠のように80番が開通すればオッケーです。

※実はここで`ERROR: Exception DBusException: org.freedesktop.DBus.Error.AccessDenied`というエラーが発生しましたが、firewalldをreinstallしたり、CentOSコンテナを再起動したら直りました。原因はよくわかりません...。

## アプリを用意する

デプロイ環境の構築手順の確認が目的なのでデフォルトで生成されるテンプレートをそのままホストします。

```text
$ mkdir webapplication1; cd webapplication1
$ dotnet new sln; dotnet new mvc
$ dotnet publish -c Release -r linux-x64 -o ~/Desktop/publish
```

Linux環境で動かすため、`dotnet publish`する際に、`-r linux-x64`とLinux用にコンパイルされるよう指定してあげましょう。

## アプリをデプロイする

デスクトップに発行したバイナリをコンテナ内に配置して動くようにしましょう。

ASP.NET CoreではKestrelという独自のWebサーバがアプリケーションに内包されています。 これ単独でもWebアプリをホストすることは可能ですが、ApacheやIISと比べると機能が不十分だと言われています。 そのため、通常はApacheやIISをリバースプロキシサーバとして仲介させるのが良いそうです。

![f:id:neko3cs:20190817163604p:plain](/images/20190817/20190817163604.png)

まずはバイナリを圧縮してコンテナ内に持っていきます。

```text
$ tar -zcvf publish.tar.gz ~/Desktop/publish
$ docker cp publish.tar.gz {CentOSのコンテナID}:/var/www/publish.tar.gz
```

送れたら、中に入って解凍します。

```text
$ docker exec -it {CentOSのコンテナID} /bin/bash
# cd /var/www
# tar -zxvf publish.tar.gz
```

ASP.NET Coreアプリはサービスとして起動することでKestrelを使用してアプリをホストすることが出来るっぽいです。 なので解凍したバイナリを実行するサービスを作成・実行します。

以下のパスにファイルを作成します。

```text
# vi /etc/systemd/system/kestrel-webapplicaiton1.service
```

ファイルを開いたら以下の内容を記述します。

```text
[Unit]
Description=Example .NET Web API App running on CentOS 7

[Service]
WorkingDirectory=/var/www/publish
ExecStart=/usr/bin/dotnet /var/www/publish/WebApplication1.dll
Restart=always
# Restart service after 10 seconds if the dotnet service crashes:
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=dotnet-example
User=apache
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

基本公式のコピペですが、以下のみ変更が必要です。

| 項目 | 説明 |
| --- | --- |
| WorkingDirectory | バイナリのあるファイルのパス |
| ExecStart | 実行コマンド。dotnetコマンドでアプリの.dllを実行します |

作成したらサービスを有効化し起動します。

```text
# systemctl enable kestrel-webapplicaiton1.service
# systemctl start kestrel-webapplicaiton1.service
# systemctl status kestrel-webapplicaiton1.service
```

以下のように緑色で`active (running)`って表示されればOKです。

![f:id:neko3cs:20190817170435p:plain](/images/20190817/20190817170435.png)

最後にApacheの設定をします。以下のパスにファイルを作成します。

```text
# vi /etc/httpd/conf.modules.d/webapplicaiton1.conf
```

ファイルを開いたら以下の内容を記述します。

```text
<VirtualHost *:80>
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    ServerName www.neko3cs.com
    ServerAlias *.neko3cs.com
</VirtualHost>
```

最低限必要な記述は上記のようです。 公式には他にも設定がありますが今回は ~Apacheの設定方法をよく知らないので~ 動作確認の取れたものを記載しています。

設定ファイルを追加できたらApacheに設定を再読み込みさせましょう。

```text
# systemctl reload httpd
```

## アクセスしてみる

最初にCentOSコンテナを起動した際にコンテナ内部の80番ポートとローカルの80番ポートを繋ぐように設定しました。 なのでそのままローカルのブラウザで`localhost`を叩いたら実行されると思います。

![f:id:neko3cs:20190817172225p:plain](/images/20190817/20190817172225.png)

## 最後に

今回は最低限の実行方法の確認のみを行いました。 なので、一部本番環境で使用するには不適切な部分（SSL通信してないとか）があるかもしれません。

今後はIISではなくApacheでASP.NET Coreアプリを実行してゆきたいと思うので、CentOSやApacheについてもう少し学んでゆきたいと思います。
