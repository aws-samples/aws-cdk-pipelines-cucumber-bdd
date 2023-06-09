import { Aws } from "aws-cdk-lib";
import {
  CfnMethod,
  CognitoUserPoolsAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export interface CustomAPIGatewayMethodProps {
  method: string;
  resourceId: string;
  restApiId: string;
  lambdaArn: string;
  authorizer: CognitoUserPoolsAuthorizer;
}

export class CustomAPIGatewayMethod extends Construct {
  public readonly method: CfnMethod;

  constructor(
    scope: Construct,
    id: string,
    props: CustomAPIGatewayMethodProps
  ) {
    super(scope, id);

    const method = new CfnMethod(scope, "ApiGatewayMethod", {
      httpMethod: props.method,
      integration: {
        integrationHttpMethod: props.method,
        uri:
          `arn:${Aws.PARTITION}:apigateway:${Aws.REGION}:lambda:path/2015-03-31/functions/${props.lambdaArn}:` +
          "${stageVariables.lambdaAliasName}/invocations",
        type: "AWS_PROXY",
      },
      resourceId: props.resourceId,
      restApiId: props.restApiId,
      authorizerId: props.authorizer.authorizerId,
      authorizationType: "COGNITO_USER_POOLS",
    });

    this.method = method;
  }
}
