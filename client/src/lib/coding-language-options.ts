export type CodingLanguage = "python" | "javascript" | "cpp" | "java";

export interface LanguageOption {
  value: CodingLanguage;
  label: string;
  template: string;
}

export const languageOptions: LanguageOption[] = [
  {
    value: "python",
    label: "Python 3",
    template:
      "# Write your code here\n\ndef solution():\n    pass\n\nif __name__ == \"__main__\":\n    solution()",
  },
  {
    value: "javascript",
    label: "JavaScript",
    template:
      "// Write your code here\n\nfunction solution() {}\n\nsolution();",
  },
  {
    value: "cpp",
    label: "C++",
    template:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
  },
  {
    value: "java",
    label: "Java",
    template:
      "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
  },
];


