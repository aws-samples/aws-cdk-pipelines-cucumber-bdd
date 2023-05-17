# Cucumber BDD Test Integrated CDK Pipeline Demo Project

## Summary

This is a sample demo project with the intent to demonstrate how Cucumber BDD tests can be easily integrated with your CDK Pipeline CI/CD processes. This demo repository follows the git-flow branching strategy. One pipeline will be triggered off of changes to the main branch and will deploy a CDK stack to PreProd and Production environments. The second pipeline will be triggered off of changes to the develop branch and will deploy a CDK stack to a Dev environment. Following Cucumber BDD best practices, acceptance tests will be run automatically after deployments to Dev and PreProd to test and validate the behavior of the deployed applications.

This demo repo also showcases how the cucumber testing suite can be configured to automatically authenticate against an API deployment that requires Amazon Cognito authentication.

## Architecture Diagram

![Alt text](assets/Architecture-Diagram-With-Demo-API.png?raw=true "Architecture Diagram")

## Prerequisites needed for inital deployment

- Docker must be installed and running
- AWS Credentials must be configured that has appropriate permissions to deploy CDK applications.

## Initial Deployment Commands

- `chmod 700 initial-deploy.sh` changes permissions of the initial deploy script.
- `./initial-deploy.sh` deploys the demo application stacks.

## Below are CDK specific commands that may help with troubleshooting

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
