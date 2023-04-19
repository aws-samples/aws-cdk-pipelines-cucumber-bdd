import { Aspects, Aws, Stack, StackProps, pipelines } from "aws-cdk-lib";
import * as CodeCommit from "aws-cdk-lib/aws-codecommit";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import * as cdknag from "cdk-nag";
import { Construct } from "constructs";
import { DeployEnvironment } from "../types";
import { CognitoTestUser } from "./cognito-test-user";
import { RestAPIDeploymentStage } from "./rest-api-deployment-stage";

export interface PipelineStackProps extends StackProps {
  createRepo: boolean;
  repoName: string;
  branchName: string;
  deployEnvironments: DeployEnvironment[];
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    let repo: CodeCommit.IRepository;

    if (props.createRepo) {
      repo = new CodeCommit.Repository(this, "Repo", {
        repositoryName: props.repoName,
      });
    } else {
      repo = CodeCommit.Repository.fromRepositoryName(
        this,
        "Repo",
        props.repoName
      );
    }

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: `${props.repoName}-${props.branchName}`,
      crossAccountKeys: true,
      enableKeyRotation: true,
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.codeCommit(repo, props.branchName),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run test", "npm run build", "npx cdk synth"],
      }),
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
    });

    /**
     * Start Deploy Stage(s)
     */

    props.deployEnvironments.forEach((deployEnvironment) => {
      const deployStage = new RestAPIDeploymentStage(
        this,
        `DeployRestAPI-${deployEnvironment.environment}`,
        {
          environment: deployEnvironment.environment,
        }
      );

      /**
       * This line is necessary to run CDK Nag on the application deployment stacks.
       */
      Aspects.of(deployStage).add(new cdknag.AwsSolutionsChecks());

      if (deployEnvironment.environment !== "Prod") {
        /**
         * The below custom construct will create a secret manager secret placeholder for the cognito test user's password.
         */
        const cognitoTestUser = new CognitoTestUser(
          this,
          `CognitoTestUser-${deployEnvironment.environment}`,
          {
            deployEnvironment,
          }
        );

        const bddTestStep = new CodeBuildStep(
          `BDD-Tests-${deployEnvironment.environment}`,
          {
            installCommands: ["npm install -g aws-cdk"],
            commands: [
              "npm ci",
              "echo $API_URL",
              "echo $COGNITO_TEST_USER_PASSWORD_SECRETS_MANAGER_ARN",
              "echo $COGNITO_CLIENT_ID",
              "npm run e2e",
            ],
            env: {
              COGNITO_TEST_USER_PASSWORD_SECRETS_MANAGER_ARN:
                cognitoTestUser.testUserPasswordSecret.secretArn,
            },
            envFromCfnOutputs: {
              API_URL: deployStage.apiUrl,
              COGNITO_CLIENT_ID: deployStage.cognitoClientId,
              COGNITO_USER_POOL_ID: deployStage.cognitoPoolId,
            },
            rolePolicyStatements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  "cognito-idp:AdminCreateUser",
                  "cognito-idp:AdminSetUserPassword",
                ],
                resources: [
                  `arn:${Aws.PARTITION}:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/*`,
                ],
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["kms:Decrypt"],
                resources: [cognitoTestUser.passwordEncryptionKey.keyArn],
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["secretsmanager:GetSecretValue"],
                resources: [cognitoTestUser.testUserPasswordSecret.secretArn],
              }),
            ],
          }
        );

        pipeline.addStage(deployStage, {
          post: [bddTestStep],
        });
      } else {
        pipeline.addStage(deployStage, {
          pre: [new pipelines.ManualApprovalStep("ApproveProdDeployment")],
        });
      }
    });
  }
}
