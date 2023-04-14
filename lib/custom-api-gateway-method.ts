import { Aws } from "aws-cdk-lib";
import { CfnMethod } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export interface CustomAPIGatewayMethodProps {
  method: string;
  resourceId: string;
  restApiId: string;
  lambdaArn: string;
}

export class CustomAPIGatewayMethod extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: CustomAPIGatewayMethodProps
  ) {
    super(scope, id);

    const lambdaArnWithStageVariable = props.lambdaArn
      .split(":")
      .map((val, i) => {
        return i === 7 ? "${stageVariables.lambdaAliasName}" : val;
      })
      .join(":");

    new CfnMethod(scope, "ApiGatewayMethod", {
      httpMethod: props.method,
      integration: {
        integrationHttpMethod: props.method,
        uri: `arn:${Aws.PARTITION}:${Aws.REGION}:lambda:path/2015-03-31/functions/${lambdaArnWithStageVariable}/invocations`,
        type: "AWS_PROXY",
      },
      resourceId: props.resourceId,
      restApiId: props.restApiId,
      authorizationType: "NONE",
    });
  }
}
