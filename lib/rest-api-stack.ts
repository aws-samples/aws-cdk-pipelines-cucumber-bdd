import { Stack, StackProps } from "aws-cdk-lib";
import {
  Cors,
  IResource,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { APILambdaFunction } from "./api-lambda-function";
import { CustomAPIGatewayMethod } from "./custom-api-gateway-method";

export interface RestAPIStackProps extends StackProps {
  environment: string;
}

interface AddApiResourceProps {
  parentResource: IResource;
  resourceName: string;
  methods: string[];
  handler: IFunction;
}

export class RestAPIStack extends Stack {
  constructor(scope: Construct, id: string, props: RestAPIStackProps) {
    super(scope, id, props);

    const stageName = props?.environment.toLowerCase().replace(/-/g, "");

    const api = new RestApi(this, "RestAPI", {
      restApiName: `RESTApi-${props.environment}`,
      deployOptions: {
        stageName,
        variables: {
          lambdaAliasName: stageName,
        },
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
    });

    api.root.addMethod("ANY");

    const calculationsLambda = new APILambdaFunction(
      this,
      "CalculationsLambda",
      {
        entry: `${path.resolve(__dirname)}/lambdas/calculations/index.ts`,
        aliasName: stageName,
      }
    );

    this.addLambdaBackedEndpoint({
      parentResource: api.root,
      resourceName: "orders",
      methods: ["POST"],
      handler: calculationsLambda.function,
    });
  }

  private addLambdaBackedEndpoint = (props: AddApiResourceProps) => {
    const newResource = props.parentResource.addResource(props.resourceName);

    for (const method of props.methods) {
      /**
       * Adding custom method, since we want to use stage variables to invoke different aliases
       * This functionality is not currently supported by the AWS CDK construct LambdaIntegration.
       */
      new CustomAPIGatewayMethod(this, `${props.resourceName}-${method}`, {
        method,
        resourceId: newResource.resourceId,
        restApiId: props.parentResource.api.restApiId,
        lambdaArn: props.handler.functionArn,
      });
    }

    return newResource;
  };
}
