import { APIGatewayProxyEvent } from "aws-lambda";
import { generateErrorResult, generateOkResult } from "./response";

export const addNumbers = (number1: number, number2: number): number => {
  return number1 + number2;
};

export const subtractNumbers = (number1: number, number2: number): number => {
  return number1 - number2;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const { operation, number1, number2 } = JSON.parse(event.body || "{}");

  let result;

  try {
    console.log(operation);
    switch (operation) {
      case "ADD":
        result = addNumbers(number1, number2);
        break;
      case "SUBTRACT":
        result = subtractNumbers(number1, number2);
        break;
      default:
        return generateErrorResult();
    }

    return generateOkResult(
      JSON.stringify({
        result,
      })
    );
  } catch (err) {
    console.log(JSON.stringify(err));
    return generateErrorResult();
  }
};
