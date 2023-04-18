import * as cdk from "aws-cdk-lib";
import * as cdknag from "cdk-nag";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();
cdk.Aspects.of(app).add(new cdknag.AwsSolutionsChecks());

const REPO_NAME = "aws-cdk-pipelines-cucumber-bdd";

/**
 * Main Branch Pipeline
 */
const mainBranchPipeline = new PipelineStack(app, "MainPipeline", {
  createRepo: true,
  repoName: REPO_NAME,
  branchName: "main",
  deployEnvironments: [
    {
      environment: "PreProd",
    },
    {
      environment: "Prod",
    },
  ],
});

/**
 * Develop Branch Pipeline
 */
const developBranchPipeline = new PipelineStack(app, "DevelopPipeline", {
  createRepo: false,
  repoName: REPO_NAME,
  branchName: "develop",
  deployEnvironments: [
    {
      environment: "Dev",
    },
  ],
});

cdknag.NagSuppressions.addStackSuppressions(mainBranchPipeline, [
  {
    id: "AwsSolutions-IAM5",
    reason:
      "The CI/CD pipeline generated by this CDK application will automatically create some roles used to interact with specific CI/CD related AWS services. The roles generated are least priveledge, but require the use of some '*'s. Please evaluate these auto-generated policies to ensure they match the security requirements of your organization.",
  },
]);

cdknag.NagSuppressions.addStackSuppressions(mainBranchPipeline, [
  {
    id: "AwsSolutions-S1",
    reason:
      "The artifacts bucket generated by this CDK application does not need server logs enabled since it is only used by CI/CD processes.",
  },
]);

cdknag.NagSuppressions.addStackSuppressions(developBranchPipeline, [
  {
    id: "AwsSolutions-IAM5",
    reason:
      "The CI/CD pipeline generated by this CDK application will automatically create some roles used to interact with specific CI/CD related AWS services. The roles generated are least priveledge, but require the use of some '*'s. Please evaluate these auto-generated policies to ensure they match the security requirements of your organization.",
  },
]);

cdknag.NagSuppressions.addStackSuppressions(developBranchPipeline, [
  {
    id: "AwsSolutions-S1",
    reason:
      "The artifacts bucket generated by this CDK application does not need server logs enabled since it is only used by CI/CD processes.",
  },
]);
