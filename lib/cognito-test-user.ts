import { Construct } from "constructs";
import { DeployEnvironment } from "../types";

export interface CognitoTestUserProps {
  deployEnvironment: DeployEnvironment;
  cognitoPoolId: string;
}

export class CognitoTestUser extends Construct {
  constructor(scope: Construct, id: string, props: CognitoTestUserProps) {
    super(scope, id);
  }
}
