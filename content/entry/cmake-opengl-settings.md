---
Title: macOSでビルドするOpenGLのCMake設定をおこなう
Category:
- C++
- OpenGL
- CMake
- macOS
Date: 2024-01-16T17:21:34+09:00
URL: https://blog.neko3cs.net/entry/cmake-opengl-settings
---

macOSでCMakeを使ってOpenGLプロジェクトをビルドするための最小のCMake設定です。

## バージョン情報

```shellscript
$ sw_vers
ProductName:        macOS
ProductVersion:     14.3
BuildVersion:       23D56

$ xcodebuild -version
Xcode 15.2
Build version 15C500b

$ cmake -version
cmake version 3.28.1

CMake suite maintained and supported by Kitware (kitware.com/cmake).

$make --version
GNU Make 3.81
Copyright (C) 2006  Free Software Foundation, Inc.
This is free software; see the source for copying conditions.
There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.

This program built for i386-apple-darwin11.3.0
```

## サンプル

```text
cmake_minimum_required(VERSION 3.16)
project(SampleProject)

set(CMAKE_CXX_FLAGS "-std=c++20")
add_compile_options(-Wall -O2)

add_definitions(-Wno-deprecated-declarations)

find_package(OpenGL REQUIRED)
find_package(GLUT REQUIRED)
include_directories(
    ${OPENGL_INCLUDE_DIR}
    ${GLUT_INCLUDE_DIR}
)

add_executable(
    a.out
    main.cc
)

target_link_libraries(
    a.out
    ${OPENGL_LIBRARIES}
    ${GLUT_LIBRARIES}
)
```

## 解説

```text
cmake_minimum_required(VERSION 3.16)
project(SampleProject)
```

CMakeのバージョンとプロジェクト名を設定しています。

```text
set(CMAKE_CXX_FLAGS "-std=c++20")
add_compile_options(-Wall -O2)
```

コンパイルオプションを設定しています。

- `-std=c++20` : C++20の有効化
  - `add_comple_options` にも記載できますが、 `CMAKE_CXX_FLAGS` に set で設定することが推奨されているみたいです
- `-Wall` : 警告の有効化
- `-O2` : 最適化度の設定
  - 0\~3がありますが、3は危険で2くらいがちょうどいいみたいです

```text
add_definitions(-Wno-deprecated-declarations)
```

非推奨の定義の呼び出し警告をオフに設定しています。

最新のmacOSではOpenGLが非推奨であり、Metalを使用することが推奨されています。

それで警告が出るため、このオプションを有効にしておくと良いと思います。（多分）

```text
find_package(OpenGL REQUIRED)
find_package(GLUT REQUIRED)
include_directories(${OPENGL_INCLUDE_DIR} ${GLUT_INCLUDE_DIR})
```

OpenGLのライブラリを探してきてきます。

macOSに標準でインストールされているOpenGLとGLUTを探してきてくれるみたいです。

その後ライブラリのインクルードファイルのディレクトリの場所を設定します。

`OPENGL_INCLUDE_DIR` や `GLUT_INCLUDE_DIR` といった変数は `find_package` コマンドで自動定義されます。

```text
add_executable(a.out main.cc)
```

実行ファイルの設定です。

```text
target_link_libraries(a.out ${OPENGL_LIBRARIES} ${GLUT_LIBRARIES})
```

各種ライブラリをリンクします。

ここで探してきたOpenGLのライブラリをリンクします。

`OPENGL_LIBRARIES` や `GLUT_LIBRARIES` といった変数は `find_package` コマンドで自動定義されます。
