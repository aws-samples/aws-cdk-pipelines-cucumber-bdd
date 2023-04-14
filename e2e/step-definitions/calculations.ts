import expect from "expect";
import { Given, Then, When } from "cucumber";
import axios from "axios";

let testNumber1: number;
let testNumber2: number;
let testOperation: string;
let testResult: number;

Given("first number is set to {int}", async function (number1: number) {
  testNumber1 = number1;
});

Given("second number is set to {int}", async function (number2: number) {
  testNumber2 = number2;
});

Given("operation is ADD", async function () {
  testOperation = "ADD";
});

When("I calculate the result", async function () {
  const result = await axios.post(`${process.env.API_URL}/calculations`, {
    number1: testNumber1,
    number2: testNumber2,
    operation: testOperation,
  });

  testResult = result.data.result;
});

Then("the result should be {int}", async function (calculation: string) {
  expect(testResult).toBe(calculation);
});
