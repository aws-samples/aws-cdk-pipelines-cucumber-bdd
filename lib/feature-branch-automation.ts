import { Construct } from "constructs";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { LambdaFunction } from "./lambda-function";
import * as AwsEventsTargets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

export interface FeatureBranchAutomationProps {
  repo: IRepository;
}

export class FeatureBranchAutomation extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: FeatureBranchAutomationProps
  ) {
    super(scope, id);

    const featureBranchAutomationLambdaFunction = new LambdaFunction(
      this,
      "FeatureBranchAutomation",
      {
        entry: `${path.resolve(
          __dirname
        )}/lambdas/feature-branch-automation/index.ts`,
        aliasName: "LIVE",
      }
    );

    props.repo.onReferenceCreated("OnRepoReferenceCreated", {
      target: new AwsEventsTargets.LambdaFunction(
        featureBranchAutomationLambdaFunction.alias
      ),
    });

    props.repo.onReferenceDeleted("OnRepoReferenceDeleted", {
      target: new AwsEventsTargets.LambdaFunction(
        featureBranchAutomationLambdaFunction.alias
      ),
    });
  }
}
