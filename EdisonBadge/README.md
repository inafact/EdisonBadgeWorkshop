EdisonBadge
===========

WIP

> Intel XDK IoT Edition project files for EdisonBadgeWorkshop


## Getting Started

### Prerequets

Node.jsからI2C経由で[LEDマトリクス基板](https://www.switch-science.com/catalog/2071/)をコントロールするために、c++で書かれたネイティブのモジュールを利用します。
Edisonに[libmrra](https://github.com/intel-iot-devkit/mraa)を導入し、Edison上で_./lib/matrix_以下のソースからモジュールをコンパイルする必要があります。

__libmraaの導入__

```bash
$ echo "src mraa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/mraa-upm.conf
$ opkg update
$ opkg install libmraa0
```

__ネイティブモジュールのコンパイル__

```bash
$ npm install -g node-gyp
$ cd ./lib/matrix
$ ./build.sh
```

ネイティブモジュールは_./lib/matrix/build_にコンパイルされます。

XDKからプロジェクトのアップロードとアプリケーションの起動を行う場合は、Edison上でコンパイルされたbuildディレクトリをホストPC上の（ここではXDKを起動しているPC）プロジェクト内の同じ場所にコピーした上で、アップロードと起動を行ってください。

また、ブラウザベースのUIを使う場合は、[EdisonBadgeUI](https://github.com/inafact/EdisonBadgeWorkshop/tree/master/EdisonBadgeUI)をビルドしてできた_dist_フォルダの中身を_./lib/public_にコピーしてからアップロードを行ってください。

### Usage

XDKからプロジェクトのアップロードとアプリケーションの起動を行います。


### Notice

**_settings.json内に記述されているTwitter連動に使用される外部サーバーアプリケーションは基本的にMaker Faire Tokyo 2014期間中のみ提供されているもののため、予告なく停止される場合があります。_**

**_必要な場合は_**

**_https://github.com/inafact/EdisonBadgeWorkshop/tree/master/EdisonBadgeServerApp_**

**_のソースコードを元にご自分でアプリケーションを外部のサーバーで稼働させて、上記の設定を変更してください。
また、このアプリケーションはEdison上で動かすことも可能です。_**


## License

The MIT License

Copyright (c) 2014, Takanobu Inafuku

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
