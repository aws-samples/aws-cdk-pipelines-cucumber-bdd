import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestAPIStack } from "./rest-api-stack";

export class RestAPIDeploymentStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new RestAPIStack(this, "RestAPIStack");
  }
}
