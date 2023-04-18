import { Aspects, Stack, StackProps, pipelines } from "aws-cdk-lib";
import * as CodeCommit from "aws-cdk-lib/aws-codecommit";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { DeployEnvironment } from "../types";
import { RestAPIDeploymentStage } from "./rest-api-deployment-stage";
import * as cdknag from "cdk-nag";
import { CognitoTestUser } from "./cognito-test-user";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Key } from "aws-cdk-lib/aws-kms";

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
        commands: ["npm ci", "npm run build", "npx cdk synth"],
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
         * The below custom construct will create a test cognito user that can be used for cucumber test runs.
         */
        const cognitoTestUser = new CognitoTestUser(
          this,
          `CognitoTestUser-${deployEnvironment.environment}`,
          {
            deployEnvironment,
            cognitoPoolId: deployStage.cognitoPoolId.value,
          }
        );

        const endToEndStep = new CodeBuildStep(
          `EndToEndTest-${deployEnvironment.environment}`,
          {
            installCommands: ["npm install -g aws-cdk"],
            commands: [
              "npm ci",
              "echo $API_URL",
              "echo $COGNITO_PASSWORD_SECRETS_MANAGER_ARN",
              "echo $COGNITO_CLIENT_ID",
              "echo $COGNITO_USER_NAME",
              "npm run e2e",
            ],
            env: {
              COGNITO_PASSWORD_SECRETS_MANAGER_ARN:
                cognitoTestUser.testUserPasswordSecret.secretArn,
            },
            envFromCfnOutputs: {
              API_URL: deployStage.apiUrl,
              COGNITO_CLIENT_ID: deployStage.cognitoClientId,
              COGNITO_USER_NAME: deployStage.apiUrl,
            },
          }
        );

        pipeline.addStage(deployStage, {
          post: [endToEndStep],
        });
      } else {
        pipeline.addStage(deployStage, {
          pre: [new pipelines.ManualApprovalStep("ApproveProdDeployment")],
        });
      }
    });
  }
}
