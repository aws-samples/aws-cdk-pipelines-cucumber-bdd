import { StackProps, aws_codepipeline } from "aws-cdk-lib";
import { Key } from "aws-cdk-lib/aws-kms";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as cdknag from "cdk-nag";

export interface CodePipelineWithLoggingProps extends StackProps {
  pipelineName: string;
}

export class CodePipelineWithLogging extends Construct {
  public readonly encryptionKey: Key;
  public readonly artifactBucket: Bucket;
  public readonly pipeline: aws_codepipeline.Pipeline;
  public readonly loggingBucket: Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: CodePipelineWithLoggingProps
  ) {
    super(scope, id);

    const encryptionKey = new Key(this, "PipelineEncryptionKey", {
      enableKeyRotation: true,
    });

    const loggingBucket = new Bucket(this, "LoggingBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
    });

    const artifactBucket = new Bucket(this, "ArtifactBucket", {
      encryption: BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      serverAccessLogsBucket: loggingBucket,
    });

    const pipeline = new aws_codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: props.pipelineName,
      artifactBucket,
      enableKeyRotation: true,
      crossAccountKeys: true,
    });

    this.pipeline = pipeline;
    this.artifactBucket = artifactBucket;
    this.encryptionKey = encryptionKey;
    this.loggingBucket = loggingBucket;
  }
}
