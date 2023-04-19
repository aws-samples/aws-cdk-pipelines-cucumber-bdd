import { IKey, Key } from "aws-cdk-lib/aws-kms";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import * as cdknag from "cdk-nag";
import { Construct } from "constructs";
import { DeployEnvironment } from "../types";

export interface CognitoTestUserProps {
  deployEnvironment: DeployEnvironment;
}

export class CognitoTestUser extends Construct {
  public readonly testUserPasswordSecret: Secret;
  public readonly passwordEncryptionKey: Key;

  constructor(scope: Construct, id: string, props: CognitoTestUserProps) {
    super(scope, id);

    const encryptionKey = new Key(this, "PasswordEncKey", {
      enableKeyRotation: true,
    });

    /**
     * Store Test User Password in Secrets Manager
     */
    const testUserPassword = new Secret(this, "TestUserPassword", {
      encryptionKey,
      secretName: `test-user-password-${props.deployEnvironment.environment}`,
    });

    cdknag.NagSuppressions.addResourceSuppressions(testUserPassword, [
      {
        id: "AwsSolutions-SMG4",
        reason: "Automatic secret rotation is not valid for Cognito Users.",
      },
    ]);

    this.passwordEncryptionKey = encryptionKey;
    this.testUserPasswordSecret = testUserPassword;
  }
}
