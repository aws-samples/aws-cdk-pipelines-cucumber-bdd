# Install CDK + other NPM dependencies
npm install -g aws-cdk
npm install

# Bootstrap & Deploy CDK stack to AWS
npx cdk bootstrap --require-approval never
npx cdk deploy --all --require-approval never

# Hook up Git repository to CodeCommit
# Note: This step might require custom git hooks to be installed via the `git-remote-codecommit` package
git remote set-url origin codecommit::us-east-1://aws-cdk-pipelines-cucumber-bdd

# Push code to CodeCommit
git checkout -B main
git push origin main
git checkout -B develop
git push origin develop
