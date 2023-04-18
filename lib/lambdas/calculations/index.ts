import { APIGatewayProxyEvent } from "aws-lambda";
import { generateErrorResult, generateOkResult } from "./response";

const addNumbers = (number1: number, number2: number): number => {
  return number1 + number2;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const { operation, number1, number2 } = JSON.parse(event.body || "{}");

  let result;

  switch (operation) {
    case "ADD":
      result = addNumbers(number1, number2);
      break;
    default:
      return generateErrorResult();
  }

  return generateOkResult(
    JSON.stringify({
      result,
    })
  );
};
