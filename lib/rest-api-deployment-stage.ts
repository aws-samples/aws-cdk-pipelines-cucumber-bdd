import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestAPIStack } from "./rest-api-stack";

export interface RestAPIDeploymentStageProps extends StageProps {
  environment: string;
}

export class RestAPIDeploymentStage extends Stage {
  public readonly apiUrl: CfnOutput;
  public readonly cognitoClientId: CfnOutput;
  public readonly cognitoPoolId: CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    props?: RestAPIDeploymentStageProps
  ) {
    super(scope, id, props);

    const restAPIStack = new RestAPIStack(this, "RestAPIStack", {
      env: props?.env,
      environment: props?.environment || "dev",
    });

    this.apiUrl = restAPIStack.apiUrl;
    this.cognitoClientId = restAPIStack.cognitoClientId;
    this.cognitoPoolId = restAPIStack.cognitoPoolId;
  }
}
