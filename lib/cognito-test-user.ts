import { Construct } from "constructs";
import { DeployEnvironment } from "../types";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import * as cdknag from "cdk-nag";
import { Key } from "aws-cdk-lib/aws-kms";
import { RemovalPolicy } from "aws-cdk-lib";

export interface CognitoTestUserProps {
  deployEnvironment: DeployEnvironment;
  cognitoPoolId: string;
}

export class CognitoTestUser extends Construct {
  public readonly testUserPasswordSecret: Secret;

  constructor(scope: Construct, id: string, props: CognitoTestUserProps) {
    super(scope, id);

    /**
     * Store Test User Password in Secrets Manager
     */
    const testUserPassword = new Secret(this, "TestUserPassword", {
      encryptionKey: new Key(this, "CucumberTestUserPasswordEncKey", {
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });

    cdknag.NagSuppressions.addResourceSuppressions(testUserPassword, [
      {
        id: "AwsSolutions-SMG4",
        reason: "Automatic secret rotation is not valid for Cognito Users.",
      },
    ]);

    this.testUserPasswordSecret = testUserPassword;
  }
}
