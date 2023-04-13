import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();
// cdk.Aspects.of(app).add(new cdknag.AwsSolutionsChecks());

const REPO_NAME = "demo-api-gw-stage-deployments";
const ACCOUNT_ID_DEVOPS = "168869132244";
const ACCOUNT_ID_DEPLOY = "001432741118";
const REGION_PRIMARY = "us-east-1";

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
      account: ACCOUNT_ID_DEPLOY,
      region: REGION_PRIMARY,
    },
    {
      environment: "Prod",
      account: ACCOUNT_ID_DEPLOY,
      region: REGION_PRIMARY,
    },
  ],
  env: {
    account: ACCOUNT_ID_DEVOPS,
    region: REGION_PRIMARY,
  },
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
      account: ACCOUNT_ID_DEPLOY,
      region: REGION_PRIMARY,
    },
  ],
  env: {
    account: ACCOUNT_ID_DEVOPS,
    region: REGION_PRIMARY,
  },
});
