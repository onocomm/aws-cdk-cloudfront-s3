#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkCloudFrontS3Stack } from '../lib/cdk-cloudfront-s3-stack';

const app = new cdk.App();

new CdkCloudFrontS3Stack(app, 'CdkCloudFrontS3Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  }
});
