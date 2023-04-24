npm install -g aws-cdk
npm install
npx cdk bootstrap --require--approval=never
npx cdk deploy --all --require-approval=never
git remote set origin codecommit::us-east-1://aws-cdk-pipelines-cucumber-bdd
git checkout -B main
git push origin main
git checkout -B develop
git push origin develop
