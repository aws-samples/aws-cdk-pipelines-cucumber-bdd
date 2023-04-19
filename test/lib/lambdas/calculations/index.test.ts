import {
  addNumbers,
  subtractNumbers,
} from "../../../../lib/lambdas/calculations";

describe("Calculations Index Tests", () => {
  describe("Add Numbers", () => {
    it("should return the correct sum.", () => {
      const number1 = 1;
      const number2 = 2;

      const result = addNumbers(number1, number2);

      expect(result).toBe(3);
    });
  });

  describe("Subtract Numbers", () => {
    it("should return the correct sum.", () => {
      const number1 = 1;
      const number2 = 2;

      const result = subtractNumbers(number1, number2);

      expect(result).toBe(-1);
    });
  });
});
