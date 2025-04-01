#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkCloudFrontS3Stack } from '../lib/cdk-cloudfront-s3-stack';

const envName = process.env.CDK_ENV || 'production';

const app = new cdk.App();
const config = app.node.tryGetContext(envName);

if (!config) {
  throw new Error(`Environment ${envName} is not defined in cdk.json`);
}

new CdkCloudFrontS3Stack(app, `CdkCloudFrontS3Stack-${config.ResourceName}`, {
  ...config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  }
});
