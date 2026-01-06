export interface CodingTopic {
  id: string;
  title: string;
  description: string;
  explanation: string;
  keyRules: Array<{
    rule: string;
    example: string;
    code: string;
    input: string;
    output: string;
  }>;
  commonMistakes: string[];
  syntax: {
    c: string;
    python: string;
    java: string;
    cpp: string;
  };
  questions: Array<{
    problem: string;
    input: string;
    output: string;
    explanation?: string;
  }>;
}

export const codingTopics: CodingTopic[] = [
  {
    id: "conditionals",
    title: "Conditionals",
    description: "Learn how to make decisions in your code using if-else statements",
    explanation: `Conditionals allow your program to make decisions based on different conditions. Think of them like choosing what to wear based on the weather - if it's raining, you take an umbrella; otherwise, you don't.

In programming, conditionals check if a condition is true or false, and then execute different code blocks accordingly. This is fundamental to creating programs that can respond to different situations and inputs.`,
    keyRules: [
      { rule: "Evaluate a boolean condition (true/false)", example: "Check even/odd with a single condition", code: "int n = 6;\nif (n % 2 == 0) printf(\"Even\"); else printf(\"Odd\");", input: "6", output: "Even" },
      { rule: "Use comparison operators to decide", example: "Pass/fail based on score >= 50", code: "int score = 42;\nif (score >= 50) printf(\"Pass\"); else printf(\"Fail\");", input: "42", output: "Fail" },
      { rule: "Combine conditions with logical operators", example: "Allow entry if age >= 18 AND has ID", code: "int age = 19; int hasID = 1;\nif (age >= 18 && hasID) printf(\"Allowed\"); else printf(\"Denied\");", input: "age=19, hasID=1", output: "Allowed" },
      { rule: "Chain multiple branches with else-if", example: "Grade banding A/B/C", code: "int s = 85;\nif (s >= 90) printf(\"A\");\nelse if (s >= 80) printf(\"B\");\nelse printf(\"C\");", input: "85", output: "B" },
      { rule: "Only the first true branch runs", example: "Order of checks matters", code: "int x = 95;\nif (x >= 90) printf(\"High\");\nelse if (x >= 80) printf(\"Mid\");", input: "95", output: "High" },
    ],
    commonMistakes: [
      "Using = instead of == for comparison (assignment vs equality)",
      "Forgetting curly braces {} in C/Java for multi-line blocks",
      "Not handling all possible cases",
      "Using incorrect comparison operators",
      "Nesting too many if-else statements (hard to read)",
    ],
    syntax: {
      c: `// Basic if statement
if (condition) {
    // code to execute if condition is true
}

// if-else statement
if (condition) {
    // code if true
} else {
    // code if false
}

// if-else if-else
if (condition1) {
    // code if condition1 is true
} else if (condition2) {
    // code if condition2 is true
} else {
    // code if all conditions are false
}

// Example: Check if number is positive
int num = 5;
if (num > 0) {
    printf("Positive");
} else if (num < 0) {
    printf("Negative");
} else {
    printf("Zero");
}`,
      python: `# Basic if statement
if condition:
    # code to execute if condition is true

# if-else statement
if condition:
    # code if true
else:
    # code if false

# if-elif-else
if condition1:
    # code if condition1 is true
elif condition2:
    # code if condition2 is true
else:
    # code if all conditions are false

# Example: Check if number is positive
num = 5
if num > 0:
    print("Positive")
elif num < 0:
    print("Negative")
else:
    print("Zero")`,
      java: `// Basic if statement
if (condition) {
    // code to execute if condition is true
}

// if-else statement
if (condition) {
    // code if true
} else {
    // code if false
}

// if-else if-else
if (condition1) {
    // code if condition1 is true
} else if (condition2) {
    // code if condition2 is true
} else {
    // code if all conditions are false
}

// Example: Check if number is positive
int num = 5;
if (num > 0) {
    System.out.println("Positive");
} else if (num < 0) {
    System.out.println("Negative");
} else {
    System.out.println("Zero");
}`,
      cpp: `#include <iostream>
using namespace std;

// Basic if statement
if (condition) {
    // code when true
}

// if-else statement
if (condition) {
    // code if true
} else {
    // code if false
}

// if-else if-else
if (condition1) {
    // code if condition1 is true
} else if (condition2) {
    // code if condition2 is true
} else {
    // code if all conditions are false
}

// Example: Check if number is positive
int num = 5;
if (num > 0) {
    cout << "Positive";
} else if (num < 0) {
    cout << "Negative";
} else {
    cout << "Zero";
}`,
    },
    questions: [
      {
        problem: "Write a program to check if a number is even or odd. If the number is even, print 'Even', otherwise print 'Odd'.",
        input: "6",
        output: "Even",
        explanation: "An even number is divisible by 2 with no remainder. Use the modulo operator (%) to check if num % 2 == 0.",
      },
      {
        problem: "Find the largest of two numbers. Read two integers and print the larger one.",
        input: "15\n23",
        output: "23",
        explanation: "Compare the two numbers using > operator. If first number is greater, print it; otherwise print the second number.",
      },
      {
        problem: "Determine the grade based on score. If score >= 90, print 'A'; if score >= 80, print 'B'; if score >= 70, print 'C'; otherwise print 'F'.",
        input: "85",
        output: "B",
        explanation: "Use if-else if chain to check score ranges. Remember to check from highest to lowest.",
      },
    ],
  },
  {
    id: "loops",
    title: "Loops",
    description: "Master repetition and iteration to execute code multiple times efficiently",
    explanation: `Loops are used to repeat a block of code multiple times. Instead of writing the same code over and over, loops let you execute code repeatedly until a condition is met.

Think of loops like doing push-ups - you repeat the same action (push-up) a certain number of times or until you're tired. In programming, loops help you process lists of data, repeat operations, and create patterns efficiently.`,
    keyRules: [
      { rule: "for loop: fixed number of iterations", example: "Print 1 to 5", code: "for (int i=1; i<=5; i++) printf(\"%d \", i);", input: "—", output: "1 2 3 4 5" },
      { rule: "while loop: run while condition stays true", example: "Count down from 3", code: "int n=3; while(n>0){ printf(\"%d \", n); n--; }", input: "—", output: "3 2 1" },
      { rule: "Avoid infinite loops: update the condition inside the loop", example: "Stop when x hits 0", code: "int x=4; while(x){ x--; }\n// without x-- this never ends", input: "—", output: "loop ends cleanly" },
      { rule: "Use counters for array traversal", example: "Sum 4 numbers", code: "int a[4]={1,2,3,4}; int s=0; for(int i=0;i<4;i++) s+=a[i];", input: "1 2 3 4", output: "10" },
      { rule: "break exits early", example: "Stop at first negative", code: "for(int i=0;i<5;i++){ if(arr[i]<0){ break; } }\n// loop stops at first negative", input: "[5,3,-1,7]", output: "stops at -1" },
      { rule: "continue skips to next iteration", example: "Print only odd numbers 1..5", code: "for(int i=1;i<=5;i++){ if(i%2==0) continue; printf(\"%d \",i);} ", input: "—", output: "1 3 5" },
    ],
    commonMistakes: [
      "Forgetting to increment the counter in while loops (infinite loop)",
      "Using wrong comparison operator (<= vs <)",
      "Off-by-one errors (starting from 0 vs 1)",
      "Modifying loop variable inside the loop incorrectly",
      "Not initializing loop variables",
    ],
    syntax: {
      c: `// for loop
for (initialization; condition; increment) {
    // code to repeat
}

// while loop
while (condition) {
    // code to repeat
    // update condition
}

// do-while loop (executes at least once)
do {
    // code to repeat
} while (condition);

// Example: Print numbers 1 to 10
for (int i = 1; i <= 10; i++) {
    printf("%d ", i);
}

// Example: Print multiplication table
int num = 5;
for (int i = 1; i <= 10; i++) {
    printf("%d x %d = %d\\n", num, i, num * i);
}`,
      python: `# for loop (with range)
for variable in range(start, end, step):
    # code to repeat

# while loop
while condition:
    # code to repeat
    # update condition

# Example: Print numbers 1 to 10
for i in range(1, 11):
    print(i, end=" ")

# Example: Print multiplication table
num = 5
for i in range(1, 11):
    print(f"{num} x {i} = {num * i}")

# Example: Countdown
count = 10
while count > 0:
    print(count)
    count -= 1`,
      java: `// for loop
for (initialization; condition; increment) {
    // code to repeat
}

// while loop
while (condition) {
    // code to repeat
    // update condition
}

// do-while loop
do {
    // code to repeat
} while (condition);

// Example: Print numbers 1 to 10
for (int i = 1; i <= 10; i++) {
    System.out.print(i + " ");
}

// Example: Print multiplication table
int num = 5;
for (int i = 1; i <= 10; i++) {
    System.out.println(num + " x " + i + " = " + (num * i));
}`,
      cpp: `#include <iostream>
using namespace std;

// for loop
for (initialization; condition; increment) {
    // code to repeat
}

// while loop
while (condition) {
    // code to repeat
    // update condition
}

// do-while loop
do {
    // code to repeat
} while (condition);

// Example: Print numbers 1 to 10
for (int i = 1; i <= 10; i++) {
    cout << i << " ";
}

// Example: Print multiplication table
int num = 5;
for (int i = 1; i <= 10; i++) {
    cout << num << " x " << i << " = " << (num * i) << "\\n";
}`,
    },
    questions: [
      {
        problem: "Print all numbers from 1 to N. Read an integer N and print numbers from 1 to N, each on a new line.",
        input: "5",
        output: "1\n2\n3\n4\n5",
        explanation: "Use a for loop starting from 1 and going up to N (inclusive). Print each number in the loop.",
      },
      {
        problem: "Print the multiplication table of a number. Read a number and print its multiplication table from 1 to 10.",
        input: "7",
        output: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70",
        explanation: "Use a for loop from 1 to 10. In each iteration, multiply the input number by the loop counter and print the result.",
      },
      {
        problem: "Calculate the sum of first N natural numbers. Read N and calculate 1 + 2 + 3 + ... + N.",
        input: "10",
        output: "55",
        explanation: "Initialize a sum variable to 0. Use a loop from 1 to N, adding each number to the sum. Print the final sum.",
      },
    ],
  },
  {
    id: "arrays",
    title: "Arrays",
    description: "Work with collections of data using arrays and lists",
    explanation: `An array is a collection of elements of the same type stored in contiguous memory locations. Think of it like a row of lockers - each locker has a number (index) and can store one item.

Arrays allow you to store multiple values under a single variable name, making it easy to work with lists of data like student grades, temperatures for each day, or a list of names.`,
    keyRules: [
      { rule: "Indices start at 0", example: "First element is index 0", code: "int a[3]={4,5,6}; printf(\"%d\", a[0]);", input: "[4,5,6]", output: "4" },
      { rule: "Last index is length-1", example: "For 5 items last is 4", code: "int a[5]={1,2,3,4,5}; printf(\"%d\", a[4]);", input: "[1,2,3,4,5]", output: "5" },
      { rule: "Fixed size in C/Java; dynamic in Python", example: "C fixed, Python grows", code: "int a[3]; // size fixed\n# Python\narr = []\narr.append(10)", input: "—", output: "arr=[10]" },
      { rule: "Access/modify with brackets", example: "Update second element", code: "int a[3]={1,2,3}; a[1]=9; printf(\"%d\", a[1]);", input: "[1,2,3]", output: "9" },
      { rule: "Iterate to process all elements", example: "Sum array", code: "int a[4]={1,2,3,4}; int s=0; for(int i=0;i<4;i++) s+=a[i];", input: "[1,2,3,4]", output: "10" },
      { rule: "Check bounds before access", example: "Guard index", code: "int i=5; int n=5; if(i < n) printf(\"%d\", a[i]);", input: "i=5,n=5", output: "skipped access (safe)" },
    ],
    commonMistakes: [
      "Accessing array[index] when index >= array length (out of bounds)",
      "Using 1-based indexing instead of 0-based",
      "Forgetting to initialize array elements",
      "Confusing array length with last index",
      "Not checking array bounds before access",
    ],
    syntax: {
      c: `// Declare and initialize array
int arr[5] = {1, 2, 3, 4, 5};

// Access element
int first = arr[0];  // first element
int last = arr[4];   // last element

// Modify element
arr[0] = 10;

// Loop through array
int arr[5] = {1, 2, 3, 4, 5};
for (int i = 0; i < 5; i++) {
    printf("%d ", arr[i]);
}

// Example: Sum of array elements
int arr[] = {10, 20, 30, 40, 50};
int sum = 0;
for (int i = 0; i < 5; i++) {
    sum += arr[i];
}
printf("Sum: %d", sum);`,
      python: `# Create list (Python's array)
arr = [1, 2, 3, 4, 5]

# Access element
first = arr[0]  # first element
last = arr[-1]  # last element (Python feature)

# Modify element
arr[0] = 10

# Loop through array
arr = [1, 2, 3, 4, 5]
for num in arr:
    print(num, end=" ")

# Loop with index
for i in range(len(arr)):
    print(f"Index {i}: {arr[i]}")

# Example: Sum of array elements
arr = [10, 20, 30, 40, 50]
total = sum(arr)  # Built-in function
# Or manually:
total = 0
for num in arr:
    total += num
print(f"Sum: {total}")`,
      java: `// Declare and initialize array
int[] arr = {1, 2, 3, 4, 5};
// Or: int[] arr = new int[5];

// Access element
int first = arr[0];  // first element
int last = arr[arr.length - 1];  // last element

// Modify element
arr[0] = 10;

// Loop through array
int[] arr = {1, 2, 3, 4, 5};
for (int i = 0; i < arr.length; i++) {
    System.out.print(arr[i] + " ");
}

// Enhanced for loop
for (int num : arr) {
    System.out.print(num + " ");
}

// Example: Sum of array elements
int[] arr = {10, 20, 30, 40, 50};
int sum = 0;
for (int num : arr) {
    sum += num;
}
System.out.println("Sum: " + sum);`,
      cpp: `#include <iostream>
using namespace std;

// Declare and initialize array
int arr[] = {1, 2, 3, 4, 5};

// Access element
int first = arr[0];                 // first element
int last = arr[sizeof(arr)/sizeof(int) - 1]; // last element

// Modify element
arr[0] = 10;

// Loop through array
for (size_t i = 0; i < sizeof(arr)/sizeof(int); i++) {
    cout << arr[i] << " ";
}

// Example: Sum of array elements
int nums[] = {10, 20, 30, 40, 50};
int sum = 0;
for (int x : nums) {
    sum += x;
}
cout << "Sum: " << sum;}`,
    },
    questions: [
      {
        problem: "Calculate the sum of all elements in an array. Read N, then N integers, and print their sum.",
        input: "5\n10 20 30 40 50",
        output: "150",
        explanation: "Read N, create an array of size N, read N integers into the array, then loop through and add all elements.",
      },
      {
        problem: "Find the maximum element in an array. Read N, then N integers, and print the largest number.",
        input: "5\n34 12 78 45 23",
        output: "78",
        explanation: "Initialize max with first element. Loop through array, compare each element with max, update max if current element is larger.",
      },
      {
        problem: "Print array elements in reverse order. Read N, then N integers, and print them in reverse.",
        input: "5\n1 2 3 4 5",
        output: "5 4 3 2 1",
        explanation: "Read array normally, then loop from last index (N-1) down to 0, printing each element.",
      },
    ],
  },
  {
    id: "strings",
    title: "Strings",
    description: "Manipulate and work with text data using string operations",
    explanation: `A string is a sequence of characters (letters, numbers, symbols) used to represent text. Think of it like a word or sentence - "Hello" is a string, "Programming" is a string, even "123" can be a string.

Strings are one of the most common data types because programs often need to work with text - reading user input, displaying messages, processing names, addresses, and more.`,
    keyRules: [
      { rule: "Strings are character sequences", example: "\"Hi\" has H and i", code: "char s[] = \"Hi\"; printf(\"%c %c\", s[0], s[1]);", input: "\"Hi\"", output: "H i" },
      { rule: "Indices start at 0", example: "First char is index 0", code: "string t = \"code\";\nchar first = t[0]; char last = t[t.size()-1];", input: "\"code\"", output: "first=c, last=e" },
      { rule: "Immutable in Python, mutable in C/Java", example: "Python cannot assign s[0]", code: "# Python\ns = \"Hi\"\n# s[0] = 'A' # error\ns = \"Ai\"  # rebind instead", input: "\"Hi\"", output: "\"Ai\"" },
      { rule: "Length, concat, substring, search", example: "Concat and slice", code: "string a=\"Hi\", b=\" there\";\nstring c = a + b; // \"Hi there\"\nstring sub = c.substr(1,2); // \"i \"", input: "\"Hi\" + \" there\"", output: "c=\"Hi there\", sub=\"i \"" },
      { rule: "Use escaping for special chars", example: "Newline and backslash", code: "printf(\"Line1\\nLine2\\\\\");", input: "—", output: "Line1\nLine2\\" },
      { rule: "Get length via len/strlen/.length()", example: "Length of \"abc\"", code: "strlen(\"abc\") == 3; // C\nlen(\"abc\") == 3  # Python\n\"abc\".length() == 3; // Java", input: "\"abc\"", output: "3" },
    ],
    commonMistakes: [
      "Accessing string[index] when index >= length",
      "Forgetting that strings are 0-indexed",
      "Not handling empty strings",
      "Confusing string length with last index",
      "Not escaping special characters properly",
    ],
    syntax: {
      c: `#include <string.h>

// String declaration
char str[] = "Hello";
char str2[100] = "World";

// String length
int len = strlen(str);

// Access character
char first = str[0];  // 'H'
char last = str[len - 1];  // 'o'

// String concatenation
char result[100];
strcpy(result, str);
strcat(result, " ");
strcat(result, str2);

// Example: Reverse a string
char str[] = "Hello";
int len = strlen(str);
for (int i = len - 1; i >= 0; i--) {
    printf("%c", str[i]);
}

// Example: Count vowels
char str[] = "Programming";
int count = 0;
for (int i = 0; i < strlen(str); i++) {
    char c = tolower(str[i]);
    if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
        count++;
    }
}
printf("Vowels: %d", count);`,
      python: `# String declaration
str1 = "Hello"
str2 = 'World'

# String length
length = len(str1)

# Access character
first = str1[0]  # 'H'
last = str1[-1]  # 'o' (Python feature)

# String concatenation
result = str1 + " " + str2

# String slicing
substring = str1[1:4]  # "ell"

# Example: Reverse a string
text = "Hello"
reversed_str = text[::-1]  # Python slicing
# Or manually:
reversed_str = ""
for i in range(len(text) - 1, -1, -1):
    reversed_str += text[i]

# Example: Count vowels
text = "Programming"
vowels = "aeiouAEIOU"
count = sum(1 for char in text if char in vowels)
# Or manually:
count = 0
for char in text:
    if char.lower() in "aeiou":
        count += 1
print(f"Vowels: {count}")`,
      java: `// String declaration
String str = "Hello";
String str2 = new String("World");

// String length
int len = str.length();

// Access character
char first = str.charAt(0);  // 'H'
char last = str.charAt(len - 1);  // 'o'

// String concatenation
String result = str + " " + str2;
// Or: String result = str.concat(" ").concat(str2);

// Substring
String sub = str.substring(1, 4);  // "ell"

// Example: Reverse a string
String text = "Hello";
StringBuilder reversed = new StringBuilder();
for (int i = text.length() - 1; i >= 0; i--) {
    reversed.append(text.charAt(i));
}
System.out.println(reversed.toString());

// Example: Count vowels
String text = "Programming";
int count = 0;
String vowels = "aeiouAEIOU";
for (int i = 0; i < text.length(); i++) {
    if (vowels.indexOf(text.charAt(i)) != -1) {
        count++;
    }
}
System.out.println("Vowels: " + count);`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

// String declaration
string str = "Hello";
string str2("World");

// String length
size_t len = str.size();

// Access character
char first = str[0];              // 'H'
char last  = str[str.size()-1];   // 'o'

// String concatenation
string result = str + " " + str2;

// Substring
string sub = str.substr(1, 3); // "ell"

// Example: Reverse a string
string text = "Hello";
string reversed(text.rbegin(), text.rend());
cout << reversed;

// Example: Count vowels
string txt = "Programming";
int count = 0;
for (char c : txt) {
    char lc = tolower(c);
    if (lc=='a'||lc=='e'||lc=='i'||lc=='o'||lc=='u') count++;
}
cout << "Vowels: " << count;}`,
    },
    questions: [
      {
        problem: "Reverse a string. Read a string and print it in reverse order.",
        input: "Hello",
        output: "olleH",
        explanation: "Loop through the string from the last character to the first, printing each character. Or use built-in reverse functions if available.",
      },
      {
        problem: "Count the number of vowels in a string. Read a string and count how many vowels (a, e, i, o, u) it contains (case-insensitive).",
        input: "Programming",
        output: "3",
        explanation: "Loop through each character, check if it's a vowel (a, e, i, o, u), and increment a counter. Remember to handle both uppercase and lowercase.",
      },
      {
        problem: "Check if a string is a palindrome. Read a string and print 'Yes' if it reads the same forwards and backwards, otherwise print 'No'.",
        input: "racecar",
        output: "Yes",
        explanation: "Compare characters from start and end moving towards center. If all match, it's a palindrome.",
      },
    ],
  },
  {
    id: "functions",
    title: "Functions",
    description: "Create reusable code blocks with functions and methods",
    explanation: `A function is a block of code that performs a specific task and can be reused multiple times. Think of it like a recipe - you write it once, and you can use it whenever you need to cook that dish.

Functions help you organize code, avoid repetition, and make programs easier to understand and maintain. Instead of writing the same code multiple times, you write it once in a function and call it whenever needed.`,
    keyRules: [
      { rule: "Functions have name, parameters, return", example: "add two numbers", code: "int add(int a,int b){ return a+b; }\nint x = add(3,4);", input: "3,4", output: "7" },
      { rule: "Define before use (or declare)", example: "Prototype then use", code: "int add(int,int); // prototype\nint main(){ add(1,2); }\nint add(int a,int b){ return a+b; }", input: "1,2", output: "3" },
      { rule: "Parameters receive values on call", example: "swap uses params", code: "void greet(char* name){ printf(\"Hi %s\", name); }\n// greet(\"Ana\")", input: "\"Ana\"", output: "Hi Ana" },
      { rule: "Return sends value back", example: "square returns result", code: "int sq(int n){ return n*n; }\nint y = sq(5);", input: "5", output: "25" },
      { rule: "Zero or many parameters", example: "no params vs many", code: "void hello(){ printf(\"Hi\"); }\nint sum3(int a,int b,int c){return a+b+c;}", input: "a=1,b=2,c=3", output: "6" },
      { rule: "Value or void return", example: "void prints, int returns", code: "void show(){ printf(\"Done\"); }\nint get(){ return 42; }", input: "—", output: "Done / 42" },
      { rule: "Call with parentheses", example: "invoke function", code: "printHello();\nint m = max(5,9);", input: "5,9", output: "m=9" },
      { rule: "Match argument count/types", example: "wrong calls fail", code: "// OK: add(2,3)\n// Wrong: add(\"hi\",2)\n// Wrong: add(5)", input: "\"hi\",2 or 5", output: "type/count error" },
    ],
    commonMistakes: [
      "Forgetting to return a value when function should return something",
      "Not matching parameter types when calling function",
      "Using wrong number of arguments",
      "Not handling return value",
      "Confusing parameters (definition) with arguments (call)",
    ],
    syntax: {
      c: `// Function definition
return_type function_name(parameter1_type param1, parameter2_type param2) {
    // function body
    return value;  // if returning something
}

// Function without return value
void printMessage() {
    printf("Hello");
}

// Function with parameters and return
int add(int a, int b) {
    return a + b;
}

// Function call
int result = add(5, 3);  // result = 8
printMessage();

// Example: Check if number is prime
int isPrime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

// Usage
if (isPrime(17)) {
    printf("Prime");
}`,
      python: `# Function definition
def function_name(parameter1, parameter2):
    # function body
    return value  # if returning something

# Function without return value
def print_message():
    print("Hello")

# Function with parameters and return
def add(a, b):
    return a + b

# Function call
result = add(5, 3)  # result = 8
print_message()

# Example: Check if number is prime
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

# Usage
if is_prime(17):
    print("Prime")`,
      java: `// Function definition (method in class)
public static return_type function_name(parameter1_type param1, parameter2_type param2) {
    // function body
    return value;  // if returning something
}

// Function without return value
public static void printMessage() {
    System.out.println("Hello");
}

// Function with parameters and return
public static int add(int a, int b) {
    return a + b;
}

// Function call
int result = add(5, 3);  // result = 8
printMessage();

// Example: Check if number is prime
public static boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

// Usage
if (isPrime(17)) {
    System.out.println("Prime");
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

// Function definition
int add(int a, int b) {
    return a + b;
}

// Void function
void printMessage() {
    cout << "Hello";
}

// Function call
int result = add(5, 3); // 8
printMessage();

// Example: Check if number is prime
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

// Usage
if (isPrime(17)) {
    cout << "Prime";
}`,
    },
    questions: [
      {
        problem: "Write a function to add two numbers. Create a function that takes two integers and returns their sum. Then call it with 15 and 27.",
        input: "",
        output: "42",
        explanation: "Define a function with two integer parameters. Return their sum. Call the function with the given numbers and print the result.",
      },
      {
        problem: "Write a function to check if a number is prime. Create a function that takes an integer and returns true if it's prime, false otherwise. Test with 17.",
        input: "",
        output: "Prime",
        explanation: "A prime number is only divisible by 1 and itself. Check divisibility from 2 to sqrt(n). If no divisors found, it's prime.",
      },
      {
        problem: "Write a function to find the maximum of two numbers. Create a function that takes two integers and returns the larger one. Test with 34 and 67.",
        input: "",
        output: "67",
        explanation: "Compare the two numbers using > operator. Return the larger number. Call the function and print the result.",
      },
    ],
  },
];

export function getTopicById(id: string): CodingTopic | undefined {
  return codingTopics.find((topic) => topic.id === id);
}

export function getAllTopics(): CodingTopic[] {
  return codingTopics;
}

