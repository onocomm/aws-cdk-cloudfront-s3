# AWS CDK CloudFront + S3 スタック

このプロジェクトでは、AWS CDKを使用してCloudFrontとS3バケットを組み合わせた静的コンテンツ配信インフラストラクチャを構築します。

## アーキテクチャ概要

このスタック（`CdkCloudFrontS3Stack`）は次のリソースを作成します：

1. **コンテンツ用S3バケット**:
   - 静的コンテンツを保存するためのバケット
   - パブリックアクセスをブロック（CloudFrontからのアクセスのみ許可）
   - オリジンアクセスコントロール（OAC）によるセキュリティ強化

2. **CloudFrontログ用S3バケット**:
   - CloudFrontのアクセスログを保存するバケット
   - 適切なアクセスコントロール設定

3. **CloudFrontディストリビューション**:
   - S3バケットをオリジンとして使用
   - オリジンシールド機能を有効化
   - ビューワーからのHTTPリクエストをHTTPSにリダイレクト
   - カスタムキャッシュポリシー設定
   - 画像ファイル（/images/*）用の特別なビヘイビア設定
   - アクセスログの有効化

## カスタムキャッシュポリシー

本実装では以下の設定を持つカスタムキャッシュポリシーを作成します：

- デフォルトTTL: 5分
- 最小TTL: 1秒
- 最大TTL: 365日
- Cookie: キャッシュキーに含めない
- ヘッダー: キャッシュキーに含めない
- クエリ文字列: すべてキャッシュキーに含める
- Brotliおよびgzip圧縮: 有効

## 前提条件

- Node.js と npm がインストールされていること
- AWS CDK CLI がインストールされていること (`npm install -g aws-cdk`)
- AWS 認証情報が設定されていること

## デプロイ手順

1. 必要に応じて `lib/cdk-cloudfront-s3-stack.ts` ファイルを編集し、以下のパラメータを変更：
   - `BucketName`: コンテンツ用S3バケット名
   - `LogBucket`: ログ用S3バケット名
   - `LogFilePrefix`: ログファイルのプレフィックス
   - その他必要な設定（カスタムドメイン、リージョン等）

2. 依存パッケージをインストール
   ```bash
   npm install
   ```

3. TypeScriptコードをコンパイル
   ```bash
   npm run build
   ```

4. CDKを使用してスタックをデプロイ
   ```bash
   cdk deploy
   ```

デプロイ完了後、出力された `DistributionId` を確認できます。これはCloudFrontディストリビューションのIDです。

## コンテンツのアップロード

デプロイ後、以下の手順でコンテンツをアップロードできます：

1. AWS Management Consoleまたは AWS CLIを使用してS3バケットにファイルをアップロード
   ```bash
   aws s3 cp ./local-directory s3://example-20240417-s3-bucket/ --recursive
   ```

2. CloudFrontディストリビューションのドメイン名を使用してコンテンツにアクセス

## カスタムドメインの設定（オプション）

カスタムドメインを使用する場合は、以下の手順を実施します：

1. コード内のコメントアウトされた部分を有効化：
   - `DomainNames` 変数の設定
   - ACM証明書の設定（`CertificateArn` および `certificate` 関連のコード）

2. CloudFrontディストリビューション設定の `domainNames` と `certificate` パラメータを有効化

3. DNSプロバイダー側で、カスタムドメインからCloudFrontディストリビューションへのエイリアスレコードを作成

## その他のコマンド

* `npm run watch` - 変更を監視して自動コンパイル
* `npm run test` - テストの実行
* `cdk diff` - デプロイ済みスタックとの差分を表示
* `cdk synth` - CloudFormationテンプレートの合成

## 注意事項

- S3バケットは直接パブリックアクセスできないように設定されています。すべてのアクセスはCloudFront経由となります。
- 本実装ではWAFは含まれていませんが、必要に応じて追加することができます。
- コードには一部コメントアウトされた機能（カスタムドメイン、ACM証明書）があり、必要に応じて有効化できます。
