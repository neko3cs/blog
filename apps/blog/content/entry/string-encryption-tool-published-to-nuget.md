---
Title: 文字列暗号化ツールを作って nuget に公開してみた
Category:
- .NET Core
- .NET Core Tools
- CLI
Date: 2020-06-03T02:15:59+09:00
URL: https://blog.neko3cs.net/entry/string-encryption-tool-published-to-nuget
---

文字列暗号化ツール cryptstr を作って nuget に公開してみました。

[neko3cs/cryptstr](https://github.com/neko3cs/cryptstr)

[CryptStr 1.0.2](https://www.nuget.org/packages/CryptStr/)

業務で文字列の暗号化や復号化をすることがあるので以前、PowerShell Module として開発しましたが、dotnet core tool の方が圧倒的に便利だと思ったので作り直しました。

## どんなツール？

.NET の TripleDES 暗号化ライブラリで文字列を暗号化、復号化するツールになります。

## 使い方は？

主に以下のコマンドが用意されています。

| コマンド | 機能 |
| --- | --- |
| `cryptstr gen` | 暗号化、復号化のためのキー情報となる設定ファイルを生成します。 |
| `cryptstr enc` | 文字列の暗号化をおこないます。 |
| `cryptstr dec` | 文字列の復号化をおこないます。 |

### `cryptstr gen` コマンド

以下のコマンドでキー情報となる設定ファイルを生成出来ます。

```text
$ cryptstr gen
```

すると、`cryptstr.json` というファイルがカレントディレクトリに出力されます。

`cryptstr.json` のファイルフォーマットは以下の通りです。

```text
{
    "Key": "<Base64String>",
    "IV": "<Base64String>"
}
```

実際には改行はされておらず、一行です。

おすすめの使い方としてはこの情報を環境変数にでも登録しておけばどこからでもキー情報を取得出来るのではないかと思います。

**macOS, Linux の場合の例**

```text
$ export CRYPTSTR_KEY=$(cat cryptstr.json | jq -r '.Key')
$ export CRYPTSTR_IV=$(cat cryptstr.json | jq -r '.IV')
```

macOS, Linux の場合、[jq](https://stedolan.github.io/jq/) というツールを使うと JSON のパースが便利です。

**Windows の場合**

```text
PS> $config = (Get-Content .\cryptstr.json | ConvertFrom-Json)
PS> Environment.SetEnvironmentVariable("CryptStr.Key", $config.Key)
PS> Environment.SetEnvironmentVariable("CryptStr.IV", $config.IV)
```

### `cryptstr enc` コマンド

以下のコマンドで文字列の暗号化が出来ます。

```text
$ cryptstr enc <plain_string_value> -k <key_of_config_file> -v <iv_of_config_file>
```

すると、コンソール 上に暗号化された文字列が表示されます。

設定ファイルを直接読み込む実装も検討しましたが、機能が多いと美しくないため、シンプルを優先してこのようなインターフェースにしました。

### `cryptstr dec` コマンド

以下のコマンドで文字列の復号化が出来ます。

```text
$ cryptstr dec <encrypted_string_value> -k <key_of_config_file> -v <iv_of_config_file>
```

インターフェースは暗号化の際と揃えてありますので、覚えやすいかと思います。
