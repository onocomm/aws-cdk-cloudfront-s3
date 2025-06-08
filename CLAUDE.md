# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) 向けのガイダンスです。

## プロジェクト概要

これは静的コンテンツ配信のためのCloudFrontディストリビューションとS3オリジンを作成するAWS CDKプロジェクトです。このスタックは以下を作成します：

1. **コンテンツ用S3バケット**: 静的コンテンツ保存用（パブリックアクセスをブロック、CloudFrontのみアクセス可能）
2. **ログ用S3バケット**: CloudFrontアクセスログ用
3. **CloudFrontディストリビューション**: カスタムキャッシュポリシー、オリジンシールド、`/images/*`用のカスタムビヘイビア付き

## よく使うコマンド

### 開発用
- `npm run build` - TypeScriptコードをコンパイル
- `npm run watch` - 変更を監視して自動コンパイル
- `npm run test` - Jestテストを実行

### CDK操作
- `cdk deploy` - スタックをAWSにデプロイ
- `cdk diff` - デプロイ済みスタックとローカル変更の差分を表示
- `cdk synth` - CloudFormationテンプレートを生成
- `cdk destroy` - スタックを削除

## アーキテクチャ情報

### 主要コンポーネント
- **メインスタック**: `lib/cdk-cloudfront-s3-stack.ts`の`CdkCloudFrontS3Stack`
- **カスタムキャッシュポリシー**: デフォルトTTL 5分、圧縮有効
- **オリジンアクセスコントロール (OAC)**: CloudFront経由でのみS3アクセスを保護
- **カスタムビヘイビア**: `/images/*`パスパターンの特別処理

### 設定パラメータ
スタックファイルの上部に配置：
- `BucketName`: コンテンツ用S3バケット名
- `LogBucket`: ログバケット名
- `LogFilePrefix`: ログファイルのプレフィックス
- コメントアウト済み: カスタムドメインとACM証明書の設定

### テスト
- AWS CDK assertionsライブラリを使用
- リソースプロパティと出力を検証
- 複数スタック間でのユニークなリソース名のテストを含む

### デプロイ時の注意事項
- 開発時の簡単なクリーンアップのため`RemovalPolicy.DESTROY`を使用
- コンテンツバケットはパブリックアクセスをブロック - CloudFront経由でのみアクセス
- WAFは含まれていないが、必要に応じて追加可能