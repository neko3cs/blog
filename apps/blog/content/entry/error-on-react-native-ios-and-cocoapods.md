---
Title: React Native iOS で run-ios 出来ない時のエラー
Category:
- 備忘録
- React Native
- iOS
Date: 2021-09-17T17:24:14+09:00
URL: https://blog.neko3cs.net/entry/error-on-react-native-ios-and-cocoapods
---

最近、React Nativeに手を出し始めました素人です。

iOSアプリ開発はあまり経験がなかったので初っ端からエラーにハマったのですが、調べてみたら原因は単純だったので備忘録します。

## 起こったこと

init後のコードを閲覧していた後、少しブランチを切り替えたりrevertを掛けたりなど、git操作をしました。

その後、以下のようなエラーが出るようになりました。

```text
neko3cs-MacBook-Pro@neko3cs ~/src/sample$ npx react-native run-ios
info Found Xcode workspace "sample.xcworkspace"
info Building (using "xcodebuild -workspace sample.xcworkspace -configuration Debug -scheme sample -destination id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX")
error Failed to build iOS project. We ran "xcodebuild" command but it exited with error code 65. To debug build logs further, consider building your app with Xcode.app, by opening sample.xcworkspace.
Command line invocation:
    /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -workspace sample.xcworkspace -configuration Debug -scheme sample -destination id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

User defaults from command line:
    IDEPackageSupportUseBuiltinSCM = YES

note: Using new build system
note: Building targets in parallel
note: Planning build
note: Analyzing workspace
note: Constructing build description
note: Build preparation complete
/Users/neko3cs/src/sample/ios/Pods/Target Support Files/Pods-sample/Pods-sample.debug.xcconfig:1:1: error: unable to open file (in target "sample" in project "sample")
/Users/neko3cs/src/sample/ios/Pods/Target Support Files/Pods-sample/Pods-sample.debug.xcconfig:1:1: error: unable to open file (in target "sample" in project "sample")
/Users/neko3cs/src/sample/ios/Pods/Target Support Files/Pods-sample/Pods-sample.debug.xcconfig:1:1: error: unable to open file (in target "sample" in project "sample")
/Users/neko3cs/src/sample/ios/Pods/Target Support Files/Pods-sample/Pods-sample.debug.xcconfig:1:1: error: unable to open file (in target "sample" in project "sample")
warning: Capabilities for Signing & Capabilities may not function correctly because its entitlements use a placeholder team ID. To resolve this, select a development team in the sample editor. (in target 'sample' from project 'sample')
warning: Unable to read contents of XCFileList '/Target Support Files/Pods-sample/Pods-sample-resources-Debug-output-files.xcfilelist' (in target 'sample' from project 'sample')
warning: Unable to read contents of XCFileList '/Target Support Files/Pods-sample/Pods-sample-frameworks-Debug-output-files.xcfilelist' (in target 'sample' from project 'sample')
error: Unable to load contents of file list: '/Target Support Files/Pods-sample/Pods-sample-frameworks-Debug-input-files.xcfilelist' (in target 'sample' from project 'sample')
error: Unable to load contents of file list: '/Target Support Files/Pods-sample/Pods-sample-resources-Debug-input-files.xcfilelist' (in target 'sample' from project 'sample')
error: Unable to load contents of file list: '/Target Support Files/Pods-sample/Pods-sample-frameworks-Debug-output-files.xcfilelist' (in target 'sample' from project 'sample')
error: Unable to load contents of file list: '/Target Support Files/Pods-sample/Pods-sample-resources-Debug-output-files.xcfilelist' (in target 'sample' from project 'sample')

** BUILD FAILED **

info Run CLI with --verbose flag for more details.
```

## 原因

CocoaPods のライブラリがちゃんとインストールされていないとこのようなエラーが出るようです。

React Native iOS の開発には [CocoaPods](https://cocoapods.org/) というツールを使用します。

これは iOS アプリのライブラリ管理をしてくれるツールです。

この CocoaPods のライブラリをインストール出来てなかったためエラーしていたようです。

## 対処法

ライブラリをダウンロードしてあげましょう。

以下のように `ios` フォルダで `pod install` コマンドを実行します。

そうすると必要なライブラリがインストールされて `react-native run-ios` 出来るようになります。

## 参考文献

以下のサイトに助けられました。

[error Failed to build iOS project. We ran "xcodebuild" command but it exited with error code 65](https://stackoverflow.com/questions/55235825/error-failed-to-build-ios-project-we-ran-xcodebuild-command-but-it-exited-wit)
