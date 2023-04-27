Feature: Calculations

    @RequiresAuthentication
    Scenario Outline: Calculations endpoint returns the correct results
        Given first number is set to <number1>
        And second number is set to <number2>
        And operation is <operation>
        When I calculate the result
        Then the result should be <calculation>
        Examples:
            | number1 | number2 | operation | calculation |
            | 2       | 2       | ADD       | 4           |
            | 1       | 5       | ADD       | 6           |
            | 2       | 2       | SUBTRACT  | 0           |
            | 1       | 5       | SUBTRACT  | -4          |
            | 2       | 2       | MULTIPLY  | 4           |
            | 1       | 5       | MULTIPLY  | 5           |