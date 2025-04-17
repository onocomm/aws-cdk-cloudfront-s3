import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';


export class CdkCloudFrontS3Stack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

      "SettingBehaviors":[
        {
          "pathPattern": "/test",
          "cacheEnabled": true
        }
      ]

    // ✅ 各種パラメータ
    const ResourceName =this.stackName ?? 'CdkCloudFrontS3Stack';
    const AlternateDomainNames = ["www.example.com"];
    const CertificateArn = "";
    const ContentBucketName = "example-content-bucket";
    const LogBucket =  "cloudfront-log-example.com";
    const LogFilePrefix = "example.com";
    const Description = "www.example.com用のCloudFrontディストリビューション";
    
    // ✅ CloudFrontのカスタムキャッシュポリシーを作成
    const customCachePolicy = new cloudfront.CachePolicy(this, 'CustomCachePolicy', {
      cachePolicyName: `${ResourceName}CachePolicy`,
      defaultTtl: Duration.minutes(5),  // デフォルトTTL 5分
      minTtl: Duration.seconds(1),    // 最小TTL 1秒
      maxTtl: Duration.days(365),       // 最大TTL 365日
      cookieBehavior: cloudfront.CacheCookieBehavior.none(), // Cookieなし
      headerBehavior: cloudfront.CacheHeaderBehavior.none(), //ヘッダーなし
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(), // すべてのクエリストリングをキャッシュキーに含める
      enableAcceptEncodingBrotli: true, // Brotli圧縮を有効化
      enableAcceptEncodingGzip: true,   // Gzip圧縮を有効化
    });
    
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: ContentBucketName,
      autoDeleteObjects: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const origin = origins.S3BucketOrigin.withOriginAccessControl(
      s3.Bucket.fromBucketAttributes(this, 'DefaultOriginBucket', {bucketName: DefaultOrigin, region: DefaultOriginRegion}),
      {
        originShieldEnabled: true,
        originShieldRegion: DefaultOriginRegion,
      }
    );

    // ✅ ビヘイビアの設定
    const behaviors = Object.fromEntries(
      SettingBehaviors.map((item) => ([
        item.pathPattern,
        {
          origin,
          viewerProtocolPolicy: CertificateArn ? cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS : cloudfront.ViewerProtocolPolicy.ALLOW_ALL, // HTTPリクエストをHTTPSにリダイレクト
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // ✅ GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE を許可
          cachePolicy: item.pathPattern ? customCachePolicy : cloudfront.CachePolicy.CACHING_DISABLED, // キャッシュポリシー
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022, // すべてのヘッダーをオリジンにリレー
          responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT, // ✅ CORS設定
        }
      ]))
    );

    // ✅ S3 バケット名を定義
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: LogBucket,
      autoDeleteObjects: false,
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      removalPolicy: RemovalPolicy.DESTROY, //RemovalPolicy.RETAIN
    });

    // ✅ CloudFrontディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: CertificateArn ? cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS : cloudfront.ViewerProtocolPolicy.ALLOW_ALL, // HTTPリクエストをHTTPSにリダイレクト
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // ✅ GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE を許可
        cachePolicy: customCachePolicy, // キャッシュ最適化のためのポリシー
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022, // ビューワーからのすべてのヘッダーをオリジンにリレー
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT, // ✅ SimpleCORS を設定
      },
      ...(SettingBehaviors.length &&
        { additionalBehaviors: behaviors }),
      // WAFをアタッチ
      webAclId: webAcl.attrArn,
      // 他の設定
      comment: Description,
      // 料金クラス（北米、欧州のみ）
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      // 有効
      enabled: true,
      // 代替ドメイン名（CNAME）を指定
        { domainNames: AlternateDomainNames }),
      // ACM証明書を指定
      ...(CertificateArn &&
          { certificate: certificatemanager.Certificate.fromCertificateArn(this, 'Certificate', CertificateArn) } ),
      // ログ保存用のS3バケットを指定
      logBucket,
      logFilePrefix: LogFilePrefix,
    });

    // 出力 - デプロイ後に参照できる情報
    new CfnOutput(this, 'DistributionDomainName', {
      description: 'CloudFrontディストリビューションのドメイン名',
      value: distribution.distributionDomainName,
    });

    new CfnOutput(this, 'WebACLId', {
      description: 'WAF Web ACLのID',
      value: webAcl.attrId,
    });
    
    new CfnOutput(this, 'ContentBucketName', {
      description: 'コンテンツS3バケット名',
      value: contentBucket.bucketName,
    });
  }
}
