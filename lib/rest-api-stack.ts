import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  AccessLogFormat,
  CognitoUserPoolsAuthorizer,
  Cors,
  IResource,
  IRestApi,
  LogGroupLogDestination,
  MockIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AdvancedSecurityMode, UserPool } from "aws-cdk-lib/aws-cognito";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import * as cdknag from "cdk-nag";
import { Construct } from "constructs";
import * as path from "path";
import { CustomAPIGatewayMethod } from "./custom-api-gateway-method";
import { LambdaFunction } from "./lambda-function";

export interface RestAPIStackProps extends StackProps {
  environment: string;
}

interface AddApiResourceProps {
  api: IRestApi;
  parentResource: IResource;
  resourceName: string;
  methods: string[];
  handler: IFunction;
  authorizer: CognitoUserPoolsAuthorizer;
}

export class RestAPIStack extends Stack {
  public readonly apiUrl: CfnOutput;

  constructor(scope: Construct, id: string, props: RestAPIStackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, "UserPool", {
      advancedSecurityMode: AdvancedSecurityMode.ENFORCED,
      selfSignUpEnabled: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "UserPoolAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    const stageName = props?.environment.toLowerCase().replace(/-/g, "");

    const apiGatewayAccessLogGroup = new LogGroup(this, "ApiGatewayAccessLogs");

    const api = new RestApi(this, "RestAPI", {
      restApiName: `RESTApi-${props.environment}`,
      cloudWatchRole: true,
      deployOptions: {
        stageName,
        variables: {
          lambdaAliasName: stageName,
        },
        accessLogDestination: new LogGroupLogDestination(
          apiGatewayAccessLogGroup
        ),
        accessLogFormat: AccessLogFormat.clf(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
    });

    authorizer._attachToApi(api);

    const calculationsLambda = new LambdaFunction(this, "CalculationsLambda", {
      entry: `${path.resolve(__dirname)}/lambdas/calculations/index.ts`,
      aliasName: stageName,
    });

    calculationsLambda.alias.addPermission(
      "PermitAPIGWinvokeCalculationsLambdaAlias",
      {
        principal: new ServicePrincipal("apigateway.amazonaws.com"),
        sourceArn: api.arnForExecuteApi("*").split("/").slice(0, 2).join("/"),
      }
    );

    this.addLambdaBackedEndpoint({
      api,
      parentResource: api.root,
      resourceName: "calculations",
      methods: ["POST"],
      handler: calculationsLambda.function,
      authorizer,
    });

    this.apiUrl = new CfnOutput(this, "ApiUrl", {
      value: api.url,
    });

    cdknag.NagSuppressions.addResourceSuppressions(
      api,
      [
        {
          id: "AwsSolutions-APIG2",
          reason: "This REST API does not need request validation enabled.",
        },
        {
          id: "AwsSolutions-APIG4",
          reason: "This REST API uses cognito authorization.",
        },
        {
          id: "AwsSolutions-COG4",
          reason: "This REST API uses cognito authorization.",
        },
        {
          id: "AwsSolutions-APIG6",
          reason:
            "The REST API has cloudwatch logging setup on needed methods.",
        },
        {
          id: "AwsSolutions-IAM4",
          reason:
            "The Service Role created by the RestAPI construct is least-privilege and necessary to log.",
        },
      ],
      true
    );
  }

  private addLambdaBackedEndpoint = (props: AddApiResourceProps) => {
    const newResource = props.parentResource.addResource(props.resourceName);

    for (const method of props.methods) {
      /**
       * Adding custom method, since we want to use stage variables to invoke different aliases
       * This functionality is not currently supported by the AWS CDK construct LambdaIntegration.
       */
      const customMethod = new CustomAPIGatewayMethod(
        this,
        `${props.resourceName}-${method}`,
        {
          method,
          resourceId: newResource.resourceId,
          restApiId: props.parentResource.api.restApiId,
          lambdaArn: props.handler.functionArn,
          authorizer: props.authorizer,
        }
      );

      /**
       * This line is necessary to ensure that the API Gateway Deployment does not happen before all methods are set up properly.
       */
      props.api.latestDeployment?.node?.addDependency(customMethod.method);
    }

    return newResource;
  };
}
