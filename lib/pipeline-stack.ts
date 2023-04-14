import { Stack, StackProps, Stage, pipelines } from "aws-cdk-lib";
import * as CodeCommit from "aws-cdk-lib/aws-codecommit";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import * as path from "path";
import { DeployEnvironment } from "../types";
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
        code: CodeCommit.Code.fromZipFile(
          path.join(__dirname, "../initial-commit.zip"),
          props.branchName
        ),
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
     * Start Test Stage
     */
    // const testingStage = pipeline.addStage({ stageName: "Test" });
    // const testingProject = new CodeBuild.PipelineProject(
    //   this,
    //   `TestingProject`,
    //   {
    //     environment: {
    //       buildImage: CodeBuild.LinuxBuildImage.STANDARD_6_0,
    //       environmentVariables: {
    //         AWS_XRAY_CONTEXT_MISSING: {
    //           value: "IGNORE_ERROR",
    //         },
    //       },
    //     },
    //     buildSpec: CodeBuild.BuildSpec.fromObject({
    //       version: "0.2",
    //       phases: {
    //         install: {
    //           "runtime-versions": {
    //             nodejs: "16",
    //           },
    //           commands: ["ls", "npm install"],
    //         },
    //         build: {
    //           commands: ["npm run test"],
    //         },
    //       },
    //     }),
    //   }
    // );

    // testingStage.addAction(
    //   new CodePipelineActions.CodeBuildAction({
    //     actionName: "TestingAction",
    //     input: sourceArtifact,
    //     project: testingProject,
    //   })
    // );

    /**
     * Start Deploy Stage(s)
     */

    props.deployEnvironments.forEach((deployEnvironment) => {
      const deployStage = new RestAPIDeploymentStage(
        this,
        `DeployRestAPI-${deployEnvironment.environment}`,
        {
          env: {
            account: deployEnvironment.account,
            region: deployEnvironment.region,
          },
          environment: deployEnvironment.environment,
        }
      );

      const endToEndStep = new CodeBuildStep(
        `EndToEndTest-${deployEnvironment.environment}`,
        {
          installCommands: ["npm install -g aws-cdk"],
          commands: [
            "npm ci",
            "API_URL=https://1bbyx6ckne.execute-api.us-east-1.amazonaws.com/dev",
            // `API_URL=$(aws ssm get-parameter --name "/api-gw-demo/${deployEnvironment.environment}/API_URL" --with-decryption --query "Parameter.Value" --output text)`,
            "npm run e2e",
          ],
        }
      );

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
