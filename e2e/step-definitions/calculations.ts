import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { Before, Given, Then, When } from "@cucumber/cucumber";
import axios from "axios";
import expect from "expect";

const secretsManager = new SecretsManager({});
const cognitoIdp = new CognitoIdentityProvider({});

const TEST_USER_NAME = "TEST_USER";

const getTestUserPassword = async function () {
  const testUserPassword = await secretsManager.getSecretValue({
    SecretId: process.env.COGNITO_TEST_USER_PASSWORD_SECRETS_MANAGER_ARN,
  });

  return testUserPassword.SecretString || "";
};

const authenticate = async function () {
  const result = await cognitoIdp.initiateAuth({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: TEST_USER_NAME,
      PASSWORD: await getTestUserPassword(),
    },
  });

  return result.AuthenticationResult?.IdToken || "";
};

const setupUser = async function () {
  try {
    await cognitoIdp.adminCreateUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: TEST_USER_NAME,
    });
  } catch (err) {
    console.log("User likely already exists.");
  }

  await cognitoIdp.adminSetUserPassword({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: TEST_USER_NAME,
    Password: await getTestUserPassword(),
    Permanent: true,
  });
};

Before({ tags: "@RequiresAuthentication" }, async function () {
  try {
    this.authToken = await authenticate();
  } catch (err) {
    console.log("First Attempt at Authentication Failed.");
    await setupUser();
    this.authToken = await authenticate();
  }
});

Given("first number is set to {int}", async function (number1: number) {
  this.testNumber1 = number1;
});

Given("second number is set to {int}", async function (number2: number) {
  this.testNumber2 = number2;
});

Given("operation is ADD", async function () {
  this.testOperation = "ADD";
});

Given("operation is SUBTRACT", async function () {
  this.testOperation = "SUBTRACT";
});

When("I calculate the result", async function () {
  const result = await axios.post(
    `${process.env.API_URL}/calculations`,
    {
      number1: this.testNumber1,
      number2: this.testNumber2,
      operation: this.testOperation,
    },
    {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    }
  );

  this.testResult = result.data.result;
});

Then("the result should be {int}", async function (calculation: string) {
  expect(this.testResult).toBe(calculation);
});
