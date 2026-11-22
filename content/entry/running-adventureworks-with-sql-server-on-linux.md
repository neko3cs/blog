---
Title: SQL ServerのサンプルデータベースをSQL Server on Linuxで起動する
Category:
- SQL Server
- SQL Server on Linux
- Docker
Date: 2024-04-01T14:30:26+09:00
URL: https://blog.neko3cs.net/entry/running-adventureworks-with-sql-server-on-linux
---

技術調査などでアプリ開発をしているとき、なんでもいいからちょっとしたデータベースが欲しくなる時ありますよね。

Microsoft SQL ServerにはAdventure Worksというサンプルのデータベースがあります。

しかも、DWHサイズ、通常サイズ、ライトサイズとデータ量が分けられてバックアップが用意されています。

[AdventureWorks サンプル データベース - SQL Server](https://learn.microsoft.com/ja-jp/sql/samples/adventureworks-install-configure?view=sql-server-ver16&tabs=ssms)

今回はこのバックアップからSQL Server on Linux上で復元してすぐに使えるようにしたので、紹介します。

## 作ったもの

動くものは以下のGitHub上に保存しています。

[neko3cs-lab/mssql-database/adventure-works-lt2022 at main · neko3cs/neko3cs-lab](https://github.com/neko3cs/neko3cs-lab/tree/main/mssql-database/adventure-works-lt2022)

`setup_database.sh` を実行すればサンプルデータベースでSQL Serverを起動出来るようにしています。

## 内容解説

以下が起動用のシェルスクリプトです。

```shellscript
#!/bin/sh -e

function show_spinner {
  PID=$1
  DONE_MESSAGE=$2
  SP='\|/-'
  while ps -p $PID > /dev/null
  do
    printf "\b%c" "${SP:i++%4:1}"
    sleep 0.1
  done
  printf "\n$DONE_MESSAGE\n"
}

if [ ! -f $PWD/AdventureWorksLT2022.bak ]; then 
  curl -fsSOL https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorksLT2022.bak
fi

docker-compose up --detach
sleep 20 & pid=$!
show_spinner $pid 'docker-compose up Done!'
sqlcmd \
  -S localhost -d master -U sa -P P@ssword! \
  -i ./RestoreDatabase.sql

if echo $(uname -a) | grep -q '^Linux'; then
  WSL_IP_ADDRESS=$(ip a | grep eth0 | grep inet | grep -oP '(\d{1,3}\.){3}\d{1,3}' | head -n 1)
  echo "If you are running docker on wsl2, use this ip address for SSMS.: $WSL_IP_ADDRESS"
fi
```

バックアップを拾ってきて、docker-composeでSQL Server on Linuxを起動した後、レストア用のSQLスクリプトを実行しています。

`docker-compose up`が少し時間がかかるので、 `sleep 20` で待ってあげています。 `show_spinner` はくるくるを表示しているだけなので説明を省略します。

WSL2を使ってDockerを起動している人はホストのwindowsOSからSSMSでアクセスしたくなると思います。 なので、ご丁寧にWSL2上のIPアドレスを拾って表示するようにしています。

なお、`docker-compose.yaml` でSQL Server on Linuxを起動出来るように設定しています。

```yaml
version: '3'
services:
  database:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: adventureworks
    ports:
      - 1433:1433
    volumes:
      - type: bind
        source: $PWD
        target: /data
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=P@ssword!
```

今回はSQL Server 2022用のバックアップを使うため、2022-latestのタグを指定しています。

最後に`RestoreDatabase.sql` でバックアップからレストアします。

```sql
DROP DATABASE IF EXISTS [AdventureWorksLT2022];
GO

RESTORE DATABASE [AdventureWorksLT2022]
FROM DISK = N'/data/AdventureWorksLT2022.bak'
WITH
  MOVE 'AdventureWorksLT2022_Data' TO '/var/opt/mssql/data/AdventureWorksLT2022.mdf',
  MOVE 'AdventureWorksLT2022_Log' TO '/var/opt/mssql/data/AdventureWorksLT2022_log.ldf',
  FILE = 1,
  NOUNLOAD,
  STATS = 5;
GO
```

基本的にMicrosoft公式にあるSQL文をそのまま流用しています。

カレントディレクトリを `data` ディレクトリとしてバインドしているので、バックアップファイルのパスは上記のようになります。

また、公式では一部間違っていたのですが、 `MOVE 'AdventureWorks2022'` の部分は `MOVE 'AdventureWorks2022_Data'` と論理ファイル名を指定します。
