// Maps learning content questions to backend question IDs
// Format: topicId-questionIndex -> backendQuestionId
export const questionIdMap: Record<string, string> = {
  // Conditionals
  "conditionals-0": "cond-1", // Even or Odd
  "conditionals-1": "cond-2", // Largest of Two
  "conditionals-2": "cond-3", // Determine Grade
  
  // Loops
  "loops-0": "loop-1", // Print 1 to N
  "loops-1": "loop-2", // Multiplication Table
  "loops-2": "loop-3", // Sum of N numbers
  
  // Arrays
  "arrays-0": "array-1", // Sum of Array
  "arrays-1": "array-2", // Max Element
  "arrays-2": "array-3", // Reverse Array
  
  // Strings
  "strings-0": "string-1", // Reverse String
  "strings-1": "string-2", // Count Vowels
  "strings-2": "string-3", // Palindrome
  
  // Functions
  "functions-0": "func-1", // Add Two Numbers
  "functions-1": "func-2", // Prime Check
  "functions-2": "func-3", // Max of Two
};

export function getQuestionId(topicId: string, questionIndex: number): string | null {
  const key = `${topicId}-${questionIndex}`;
  return questionIdMap[key] || null;
}

// Completion tracking
const COMPLETION_STORAGE_KEY = "coding_question_completions";

export function getCompletedQuestions(): Set<string> {
  try {
    const stored = localStorage.getItem(COMPLETION_STORAGE_KEY);
    if (stored) {
      const completed = JSON.parse(stored) as string[];
      return new Set(completed);
    }
  } catch (error) {
    console.error("Failed to load completed questions:", error);
  }
  return new Set();
}

export function markQuestionCompleted(questionId: string): void {
  const completed = getCompletedQuestions();
  completed.add(questionId);
  localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(Array.from(completed)));
}

export function isQuestionCompleted(questionId: string): boolean {
  return getCompletedQuestions().has(questionId);
}

