import * as cdk from "aws-cdk-lib";
import * as cdknag from "cdk-nag";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();
cdk.Aspects.of(app).add(new cdknag.AwsSolutionsChecks());

const REPO_NAME = "aws-cdk-pipelines-cucumber-bdd";

/**
 * Main Branch Pipeline
 */
new PipelineStack(app, "MainPipeline", {
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
new PipelineStack(app, "DevelopPipeline", {
  createRepo: false,
  repoName: REPO_NAME,
  branchName: "develop",
  deployEnvironments: [
    {
      environment: "Dev",
    },
  ],
});
