EdisonBadgeUI
=============


> LED matrix editor for EdisonBadgeWorkshop


## Getting Started

下記のオープンソースのライブラリ・ツールを使用しています。

* ベースのテンプレートおよびUI関連:
  * [Google Web Starter Kit](https://github.com/google/web-starter-kit)
  * [Ractive.js](https://github.com/ractivejs/ractive)
  * [jQuery](https://github.com/jquery/jquery)
  * [Underscore.js](https://github.com/jashkenas/underscore)
  * [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
* ドットパターンの描画: [pixi.js](https://github.com/GoodBoyDigital/pixi.js/)
* Edisonとの通信: [socket.io](http://socket.io/)

開発にはNode.jsを利用します。必要なライブラリやツールをインストールします。

```bash
$ npm install -g gulp bower
$ npm install
$ bower install
```

### Usage

開発用サーバーを起動しローカルマシンでプレビュー

```bash
$ gulp serve
```

ビルド

```bash
$ gulp
```

_./dist_ 以下にできたファイルを[EdisonBadge](https://github.com/inafact/EdisonBadgeWorkshop/tree/master/EdisonBadge)の_./lib/public_にコピーし、Edison上のサーバーでホストして利用します。


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
