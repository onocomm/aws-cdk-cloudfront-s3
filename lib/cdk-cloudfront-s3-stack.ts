import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
//import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class CdkCloudFrontS3Stack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // ✅ 各種パラメータ
    const ResourceName =this.stackName ?? 'CdkCloudFrontS3Stack';
    //const DomainNames = ["www.example-20240417.com"];
    //const CertificateArn = "";
    const BucketName = "example-20240417-s3-bucket";
    const LogBucket =  "cloudfront-log-example-20240417.com";
    const LogFilePrefix = "example-20240417.com";
    const Description = "www.example-20240417.com用のCloudFrontディストリビューション";
    
    // ✅ コンテンツ配信用のS3バケットを作成
    const S3Bucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: BucketName,
      autoDeleteObjects: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ✅ ACM証明書を作成（必要な場合）
    //const certificate = certificatemanager.Certificate.fromCertificateArn(this, 'Certificate', CertificateArn);

    // ✅ CloudFrontのオリジンを作成
    const origin = origins.S3BucketOrigin.withOriginAccessControl(S3Bucket);

    // ✅ CloudFrontのカスタムキャッシュポリシーを作成
    const customCachePolicy = new cloudfront.CachePolicy(this, 'CustomCachePolicy', {
      cachePolicyName: `${ResourceName}CachePolicy`, // キャッシュポリシーの名前
      defaultTtl: Duration.minutes(5),  // デフォルトTTL 5分
      minTtl: Duration.seconds(1),    // 最小TTL 1秒
      maxTtl: Duration.days(365),       // 最大TTL 365日
      cookieBehavior: cloudfront.CacheCookieBehavior.none(), // Cookieなし
      headerBehavior: cloudfront.CacheHeaderBehavior.none(), //ヘッダーなし
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(), // すべてのクエリストリングをキャッシュキーに含める
      enableAcceptEncodingBrotli: true, // Brotli圧縮を有効化
      enableAcceptEncodingGzip: true,   // Gzip圧縮を有効化
    });
        
    // ✅ デフォルトビヘイビアの設定（設定内容は適宜変更してください）
    const defaultBehavior ={
      origin: origin, // S3バケットをオリジンとして指定
      compress: true, // 圧縮を有効化
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE を許可
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD, // GET, HEAD のみキャッシュ
      cachePolicy: customCachePolicy, //キャッシュポリシー 
      // cloudfront.CachePolicy.CACHING_OPTIMIZED // キャッシュポリシーの最適化
      // cloudfront.CachePolicy.CACHING_DISABLED // キャッシュポリシーの無効化
      originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN, // オリジンリクエストポリシー
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // HTTPリクエストをHTTPSにリダイレクト
      responseHeadersPolicy:cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS, // レスポンスヘッダーポリシー
    };
    
    // ✅ 追加ビヘイビアの設定
    const additionalBehaviors ={
      '/images/*': { // 画像用のビヘイビア
        origin, // S3バケットをオリジンとして指定
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE を許可
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD, // GET, HEAD のみキャッシュ
        cachePolicy: customCachePolicy, //キャッシュポリシー 
        // cloudfront.CachePolicy.CACHING_OPTIMIZED // キャッシュポリシーの最適化
        // cloudfront.CachePolicy.CACHING_DISABLED // キャッシュポリシーの無効化
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN, // オリジンリクエストポリシー
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // HTTPリクエストをHTTPSにリダイレクト
        responseHeadersPolicy:cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS, // レスポンスヘッダーポリシー
      },
    };

    // ✅ ログ用バケットを作成
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: LogBucket,
      autoDeleteObjects: false,
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      removalPolicy: RemovalPolicy.DESTROY, //RemovalPolicy.RETAIN
    });

    // ✅ CloudFrontディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: defaultBehavior,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL, // 料金クラス（北米、欧州のみ）
      additionalBehaviors: additionalBehaviors, // 追加ビヘイビアの設定
      //domainNames: DomainNames, // カスタムドメイン名を指定
      //certificate: certificate, // ACM証明書を指定
      //webAclId: webAcl.attrArn, // WAFをアタッチ
      logBucket, // ログ保存用のS3バケットを指定
      logFilePrefix: LogFilePrefix, // ログファイルのプレフィックスを指定
      comment: Description,
      enabled: true,
    });

    // 出力
    new CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFrontディストリビューションのID',
    });
  }
}
