# EdisonBadge development files #

-------------------------------------------------------------------------------

# ワークショップに参加していない一般の方・パッケージされたソフトウェアとしてのみ利用したい方向けのインストラクション

## 事前準備

1. ホワイトリストへのIP追加

    アプリケーションは[Intel XDK IoT Edition](https://software.intel.com/en-us/html5/xdk-iot)（以降XDKと呼びます）を利用してEdisonへのアップロードが行われます。
    XDKをご利用のコンピューターにインストールした後、コンピューターに接続されたEdison側でXDKからの接続を許可する必要があります。

    シリアルポート経由もしくはssh経由でEdisonにログインし、
    ```shellscript
    $ xdk-whitelist --add 192.168.2.2
    ```
    を実行します。

2. 最新版のlibmraaの導入

    EagletボードからLEDマトリクスをコントロールするために、I2CのライブラリをEdisonで利用出来るようにします。

    シリアルポート経由もしくはssh経由でEdisonにログインし、
    ```shellscript
    $ echo "src intel-iotdk http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
    $ opkg update && okpkg upgrade
    ```
    を実行します。


## パッケージされたプロジェクトファイルの入手

下記のリンクから（Twitterのトラッキングを行うサーバー用アプリケーションを除く）コンパイルとバンドル作業を行ったパッケージ済みのプロジェクトファイルをダウンロードできます。
XDKからプロジェクトファイルを開いてアップロードするだけで使用できます。

https://www.dropbox.com/s/tkdu8munzg8gvyx/EdisonBadge_20141129.zip?dl=0

zipファイルを展開してできたフォルダ内にある__EdisonBadge.xdk__をXDKから開いてください。


# プロジェクトを一からコンパイルして利用したい方、ソースコードを自由に改変して使用したい方向けのインストラクション

プロジェクトは大きく分けて３つのアプリケーションで構成されています。

## EdisonBadge

実際にEdisonからLEDマトリクスをコントロールしているNode.jsアプリケーションです。UIおよびTwitterトラッキング用のサーバーアプリケーションとメッセージのやりとりを行い、それらに対応してLEDマトリクスを光らせます。
また同時に動作状態とLEDマトリクスの点灯パターンをEdison上にjsonファイルとして保存し、必要に応じてそれらのデータを元にスタンドアローンで動作します。
Wi-Fiネットワーク接続管理も行います。

## EdisonBadgeUI

上記EdisonBadge用のUIとして動作するhtml5ベースのwebアプリケーションです。下記の操作をwebブラウザから行えます。


リソースファイルの圧縮・結合を行ったものがEdison上のNode.jsサーバーでホストされます。

## EdisonBadgeServerApp

Twitter Streaming APIのプロキシとして動作するシンプルなNode.jsアプリケーションです。
検索のベースになるハッシュタグがついたつぶやきをAPIから取得し、WebSocket経由で接続されたクライアントに対して取得されたデータの中からクライアントが指定したユーザーIDのものフィルタして配信します。
