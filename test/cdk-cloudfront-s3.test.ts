import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as CdkCloudFrontS3 from '../lib/cdk-cloudfront-s3-stack';

test('CloudFront と S3 オリジンリソースのテスト', () => {
  const app = new cdk.App();
  // スタック環境を指定
  const env = { 
    account: '123456789012', // テスト用のダミーアカウント
    region: 'us-east-1'      // テスト用のリージョン
  };
  
  // WHEN
  const stack = new CdkCloudFrontS3.CdkCloudFrontS3Stack(app, 'MyTestStack', { env } as any);
  
  // THEN
  const template = Template.fromStack(stack);

  // コンテンツ用S3バケットの検証
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'example-20240417-s3-bucket',
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true
    }
  });

  // ログ用S3バケットの検証
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'cloudfront-log-example-20240417.com',
    AccessControl: 'LogDeliveryWrite'
  });

  // カスタムキャッシュポリシーの検証
  template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
    CachePolicyConfig: {
      DefaultTTL: 300, // 5分
      MinTTL: 1,
      MaxTTL: 31536000, // 365日
      ParametersInCacheKeyAndForwardedToOrigin: {
        CookiesConfig: {
          CookieBehavior: 'none'
        },
        HeadersConfig: {
          HeaderBehavior: 'none'
        },
        QueryStringsConfig: {
          QueryStringBehavior: 'all'
        },
        EnableAcceptEncodingBrotli: true,
        EnableAcceptEncodingGzip: true
      }
    }
  });

  // CloudFrontディストリビューションの検証
  template.hasResourceProperties('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      DefaultCacheBehavior: {
        ViewerProtocolPolicy: 'redirect-to-https'
      },
      Enabled: true,
      PriceClass: 'PriceClass_All',
      Logging: {
        Bucket: Match.anyValue(),
        Prefix: 'example-20240417.com'
      }
    }
  });

  // 追加ビヘイビアの検証
  template.hasResourceProperties('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      CacheBehaviors: Match.arrayWith([
        Match.objectLike({
          PathPattern: '/images/*'
        })
      ])
    }
  });

  // オリジンアクセスコントロールの検証
  template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);

  // 出力の検証
  template.hasOutput('DistributionId', {});
});

// スタック名を使用したリソース識別のテスト
test('スタック名から生成されたリソース名がユニークであることを確認', () => {
  const app = new cdk.App();
  const env = { 
    account: '123456789012',
    region: 'us-east-1'
  };
  
  const stack1 = new CdkCloudFrontS3.CdkCloudFrontS3Stack(app, 'TestStack1', { env } as any);
  const stack2 = new CdkCloudFrontS3.CdkCloudFrontS3Stack(app, 'TestStack2', { env } as any);
  
  const template1 = Template.fromStack(stack1);
  const template2 = Template.fromStack(stack2);
  
  // 各スタックのキャッシュポリシー名にスタック名が含まれていることを確認
  template1.hasResourceProperties('AWS::CloudFront::CachePolicy', {
    CachePolicyConfig: {
      Name: 'TestStack1CachePolicy'
    }
  });
  
  template2.hasResourceProperties('AWS::CloudFront::CachePolicy', {
    CachePolicyConfig: {
      Name: 'TestStack2CachePolicy'
    }
  });
});
