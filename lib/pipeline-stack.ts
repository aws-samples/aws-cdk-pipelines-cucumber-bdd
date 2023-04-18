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

      const endToEndStep = new CodeBuildStep(
        `EndToEndTest-${deployEnvironment.environment}`,
        {
          installCommands: ["npm install -g aws-cdk"],
          commands: ["npm ci", "echo $API_URL", "npm run e2e"],
          envFromCfnOutputs: {
            API_URL: deployStage.apiUrl,
          },
        }
      );

      if (deployEnvironment.environment !== "Prod") {
        /**
         * The below custom construct will create a test cognito user that can be used for cucumber test runs.
         */
        // new CognitoTestUser(
        //   this,
        //   `CognitoTestUser-${deployEnvironment.environment}`,
        //   {
        //     deployEnvironment,
        //   }
        // );
      }

      pipeline.addStage(deployStage, {
        pre:
          deployEnvironment.environment === "Prod"
            ? [new pipelines.ManualApprovalStep("ApproveProdDeployment")]
            : [],
        post: deployEnvironment.environment === "Prod" ? [] : [endToEndStep],
      });
    });
  }
}
