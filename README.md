# AWS CDK CloudFront + S3 + WAF プロジェクト

このプロジェクトでは、AWS CDKを使用して以下のインフラストラクチャを構築します：
1. S3バケットをオリジンとするCloudFrontディストリビューション
2. CloudFrontディストリビューションに接続されたWAFによるセキュリティ強化

## 構成内容

このスタック（`CdkCloudFrontS3Stack`）は次のリソースを作成します：

1. **S3バケット**:
   - ウェブコンテンツを保存するためのバケット
   - CloudFrontからのアクセスのみを許可

2. **WAF Web ACL**:
   - レートベース制限：IPアドレスごとに100リクエスト/5分に制限（DDoS対策）
   - SQLインジェクション対策：AWSマネージドルールセット
   - 一般的なWebアプリケーション脆弱性対策：AWSマネージドルールセット

3. **CloudFrontディストリビューション**:
   - S3バケットをオリジンとして使用
   - ビューワーからのHTTPリクエストをHTTPSにリダイレクト
   - 最適化されたキャッシュポリシー
   - WAF Web ACLによる保護

## デプロイ前の準備

1. `cdk.json` ファイルを編集し、以下の設定を変更：
   - `ContentBucketName` の値を実際のS3バケット名に変更
   - 必要に応じて `ContentKeyPrefix` を設定

## デプロイ方法

```bash
npm run build   # TypeScriptをJavaScriptにコンパイル
cdk deploy      # AWSアカウントにスタックをデプロイ
```

デプロイ後は、出力される以下の情報を使用してCloudFrontディストリビューションにアクセスできます：
- `DistributionDomainName`: CloudFrontディストリビューションのドメイン名
- `WebACLId`: WAF Web ACLのID
- `ContentBucketName`: コンテンツS3バケット名

## 注意事項

- S3バケットは直接パブリックアクセスできないように設定されています。すべてのアクセスはCloudFront経由する必要があります。
- コンテンツをS3バケットにアップロードした後、CloudFrontディストリビューションを通じてアクセスできます。

## その他のコマンド

* `npm run watch`   変更を監視して自動コンパイル
* `npm run test`    Jestを使用したユニットテストの実行
* `cdk diff`        デプロイ済みスタックと現在の状態を比較
* `cdk synth`       CloudFormationテンプレートを出力
