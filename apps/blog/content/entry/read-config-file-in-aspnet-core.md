---
Title: ASP.NET Coreで設定ファイルを読み込む
Category:
- ASP.NET Core
- .NET Core
Date: 2019-03-25T15:58:57+09:00
URL: https://blog.neko3cs.net/entry/read-config-file-in-aspnet-core
---

ASP.NET Coreのプロジェクトを起こすとappsettings.jsonという設定ファイルが生成されます。

これを読み込んでアプリ内で使用するにはまず以下のような設定値管理クラスを作ります。 今回はSingletonパターンを活用しています。

```csharp
    public class AppSettings
    {
        private static AppSettings instance;
        public static AppSettings Instance
        {
            get
            {
                if (instance is null) { instance = new AppSettings(); }
                return instance;
            }
            set { instance = value; }
        }

        public Logging Logging { get; set; }
        public string AllowedHosts { get; set; }
        public Dictionary<string, string> ScriptPaths { get; set; }
    }

    public class Logging
    {
        public Dictionary<string, string> LogLevel { get; set; }
    }
```

これは元の設定ファイルの構造に依存しています。

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ScriptPaths": {
    "GetDateTimeNow": "/Models/Scripts/GetDateTimeNowScript.csx"
  }
}
```

このクラスに対して、`Startup.cs`の以下のメソッドにて読み込みと保存をおこないます。

```csharp
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            // ... 中略 ...

            // 設定ファイルの読み込み
            var builder = new ConfigurationBuilder()
                    .SetBasePath(env.ContentRootPath)
                    .AddJsonFile(path: "appsettings.json", optional: true, reloadOnChange: true);
            // 読み込んだ設定を保存
            AppSettings.Instance = Configuration.Get<AppSettings>();
        }
```
