import { Stack, StackProps } from "aws-cdk-lib";
import {
  Cors,
  IResource,
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { APILambdaFunction } from "./api-lambda-function";

export interface RestAPIStackProps extends StackProps {
  environment: string;
}

export class RestAPIStack extends Stack {
  constructor(scope: Construct, id: string, props?: RestAPIStackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "RestAPI", {
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        stageName: props?.environment.toLowerCase().replace(/-/g, ""),
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
      }
    );

    addLambdaBackedEndpoint({
      parentResource: api.root,
      resourceName: "orders",
      methods: ["POST"],
      handler: calculationsLambda.function,
    });
  }
}

interface AddApiResourceProps {
  parentResource: IResource;
  resourceName: string;
  methods: string[];
  handler: IFunction;
}

function addLambdaBackedEndpoint(props: AddApiResourceProps) {
  const newResource = props.parentResource.addResource(props.resourceName);

  for (const method of props.methods) {
    newResource.addMethod(method, new LambdaIntegration(props.handler));
  }
  return newResource;
}
