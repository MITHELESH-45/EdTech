
// Hidden test cases for coding assessment
// Mapped by Topic ID -> Question Index

export interface TestCase {
  input: string;
  output: string;
  description?: string; // For internal reference or debugging
}

export const HIDDEN_TEST_CASES: Record<string, Record<number, TestCase[]>> = {
  conditionals: {
    0: [ // Even or Odd
      { input: "6", output: "Even", description: "Standard even number" },
      { input: "7", output: "Odd", description: "Standard odd number" },
      { input: "0", output: "Even", description: "Zero is even" },
      { input: "-4", output: "Even", description: "Negative even number" },
      { input: "-11", output: "Odd", description: "Negative odd number" },
      { input: "100", output: "Even", description: "Large even number" },
      { input: "99", output: "Odd", description: "Large odd number" }
    ],
    1: [ // Largest of two numbers
      { input: "15\n23", output: "23", description: "Second number larger" },
      { input: "100\n5", output: "100", description: "First number larger" },
      { input: "-5\n-10", output: "-5", description: "Negative numbers comparison" },
      { input: "42\n42", output: "42", description: "Equal numbers" },
      { input: "0\n0", output: "0", description: "Zeroes" }
    ],
    2: [ // Grade based on score
      { input: "95", output: "A", description: "High A" },
      { input: "90", output: "A", description: "Boundary A" },
      { input: "89", output: "B", description: "High B" },
      { input: "80", output: "B", description: "Boundary B" },
      { input: "75", output: "C", description: "Mid C" },
      { input: "69", output: "F", description: "High F" },
      { input: "0", output: "F", description: "Zero score" }
    ]
  },
  loops: {
    0: [ // Print 1 to N
      { input: "5", output: "1\n2\n3\n4\n5", description: "Small N" },
      { input: "1", output: "1", description: "N=1" },
      { input: "0", output: "", description: "N=0 (should print nothing)" }
    ],
    1: [ // Multiplication table
      { input: "5", output: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50", description: "Standard table" },
      { input: "1", output: "1 x 1 = 1\n1 x 2 = 2\n1 x 3 = 3\n1 x 4 = 4\n1 x 5 = 5\n1 x 6 = 6\n1 x 7 = 7\n1 x 8 = 8\n1 x 9 = 9\n1 x 10 = 10", description: "Table of 1" },
      { input: "0", output: "0 x 1 = 0\n0 x 2 = 0\n0 x 3 = 0\n0 x 4 = 0\n0 x 5 = 0\n0 x 6 = 0\n0 x 7 = 0\n0 x 8 = 0\n0 x 9 = 0\n0 x 10 = 0", description: "Table of 0" }
    ],
    2: [ // Sum of first N natural numbers
      { input: "10", output: "55", description: "Standard sum" },
      { input: "1", output: "1", description: "Sum of 1" },
      { input: "0", output: "0", description: "Sum of 0" },
      { input: "100", output: "5050", description: "Larger sum" }
    ]
  },
  arrays: {
    0: [ // Sum of array elements
      { input: "5\n10 20 30 40 50", output: "150", description: "Standard array" },
      { input: "3\n1 1 1", output: "3", description: "Small values" },
      { input: "4\n-10 10 -5 5", output: "0", description: "Mixed positive and negative" },
      { input: "1\n42", output: "42", description: "Single element" }
    ],
    1: [ // Max element
      { input: "5\n34 12 78 45 23", output: "78", description: "Max in middle" },
      { input: "3\n1 2 3", output: "3", description: "Max at end" },
      { input: "3\n10 9 8", output: "10", description: "Max at start" },
      { input: "4\n-5 -10 -2 -20", output: "-2", description: "All negatives" }
    ],
    2: [ // Reverse array
      { input: "5\n1 2 3 4 5", output: "5 4 3 2 1", description: "Sorted array" },
      { input: "3\n10 20 30", output: "30 20 10", description: "Short array" },
      { input: "1\n99", output: "99", description: "Single element" }
    ]
  },
  strings: {
    0: [ // Reverse string
      { input: "Hello", output: "olleH", description: "Standard string" },
      { input: "World", output: "dlroW", description: "Another standard string" },
      { input: "12345", output: "54321", description: "Numbers" },
      { input: "A", output: "A", description: "Single char" },
      { input: "", output: "", description: "Empty string" },
      { input: "racecar", output: "racecar", description: "Palindrome" }
    ],
    1: [ // Count vowels
      { input: "Programming", output: "3", description: "Mixed case" },
      { input: "aeiou", output: "5", description: "All vowels" },
      { input: "xyz", output: "0", description: "No vowels" },
      { input: "AEIOU", output: "5", description: "Uppercase vowels" },
      { input: "Hello World", output: "3", description: "With space" }
    ],
    2: [ // Palindrome check
      { input: "racecar", output: "Yes", description: "Simple palindrome" },
      { input: "hello", output: "No", description: "Not a palindrome" },
      { input: "madam", output: "Yes", description: "Simple palindrome" },
      { input: "A", output: "Yes", description: "Single char is palindrome" },
      { input: "aba", output: "Yes", description: "Simple palindrome" }
    ]
  }
};
