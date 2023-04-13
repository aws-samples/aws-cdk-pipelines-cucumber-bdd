import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestAPIStack } from "./rest-api-stack";

export interface RestAPIDeploymentStageProps extends StageProps {
  environment: string;
}

export class RestAPIDeploymentStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    props?: RestAPIDeploymentStageProps
  ) {
    super(scope, id, props);

    new RestAPIStack(this, "RestAPIStack", {
      env: props?.env,
      environment: props?.environment || "dev",
    });
  }
}
