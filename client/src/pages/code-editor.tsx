import { useState, useEffect } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import {
  languageOptions,
  type CodingLanguage,
} from "@/lib/coding-language-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, MessageCircle, X, CheckCircle2, XCircle, Send } from "lucide-react";
import { useLocation } from "wouter";
import { getTopicById, type CodingTopic } from "@/lib/coding-learning-content";
import { Badge } from "@/components/ui/badge";

interface RunResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export default function CodeEditorPage() {
  const [location] = useLocation();
  const [language, setLanguage] = useState<CodingLanguage>("python");
  const [code, setCode] = useState<string>(
    languageOptions.find((l) => l.value === "python")?.template ?? "",
  );
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [aiHelp, setAiHelp] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    topic: CodingTopic;
    questionIndex: number;
    question: { problem: string; input: string; output: string; explanation?: string };
  } | null>(null);
  const [testCases, setTestCases] = useState<Array<{ input: string; output: string; id: number }>>([]);
  const [testCaseResults, setTestCaseResults] = useState<Array<{
    id: number;
    passed: boolean;
    actualOutput?: string;
    error?: string;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load question from URL params
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const topicId = url.searchParams.get("topic");
      const questionIndex = url.searchParams.get("question");

      if (topicId && questionIndex !== null) {
        const topic = getTopicById(topicId);
        const questionIdx = parseInt(questionIndex, 10);
        
        if (topic && topic.questions[questionIdx]) {
          const question = topic.questions[questionIdx];
          setCurrentQuestion({ topic, questionIndex: questionIdx, question });
          
          // Generate 3 test cases
          // Test case 1: Use the sample input/output from the question
          const testCase1 = {
            id: 1,
            input: question.input || "",
            output: question.output,
          };
          
          // Test case 2 & 3: Generate variations based on the problem type
          const variations = generateTestCases(question, topic.id);
          const testCase2 = { id: 2, ...variations[0] };
          const testCase3 = { id: 3, ...variations[1] };
          
          setTestCases([testCase1, testCase2, testCase3]);
          
          // Set the first test case input as default
          setInput(testCase1.input);
          
          // Reset test case results
          setTestCaseResults([]);
        }
      } else {
        setCurrentQuestion(null);
        setTestCases([]);
        setTestCaseResults([]);
      }
    } catch (error) {
      // If URL parsing fails, just clear question state
      setCurrentQuestion(null);
      setTestCases([]);
    }
  }, [location]);

  // Helper function to generate additional test cases based on problem type
  function generateTestCases(question: { problem: string; input: string; output: string }, topicId: string): Array<{ input: string; output: string }> {
    const problem = question.problem.toLowerCase();
    const variations: Array<{ input: string; output: string }> = [];
    
    // Generate test cases based on topic/problem type
    if (topicId === "conditionals") {
      if (problem.includes("even") || problem.includes("odd")) {
        // Test with odd number (if sample was even)
        if (question.input === "6" || question.output === "Even") {
          variations.push({ input: "7", output: "Odd" });
          variations.push({ input: "10", output: "Even" });
        } else {
          variations.push({ input: "6", output: "Even" });
          variations.push({ input: "9", output: "Odd" });
        }
      } else if (problem.includes("largest") || problem.includes("greater")) {
        // Test with different number combinations
        variations.push({ input: "50\n30", output: "50" });
        variations.push({ input: "25\n25", output: "25" });
      } else if (problem.includes("grade") || problem.includes("score")) {
        // Test with different scores
        variations.push({ input: "95", output: "A" });
        variations.push({ input: "65", output: "C" });
      } else {
        // Default variations
        variations.push({ input: question.input || "", output: question.output });
        variations.push({ input: question.input || "", output: question.output });
      }
    } else if (topicId === "loops") {
      if (problem.includes("sum") || problem.includes("add")) {
        variations.push({ input: "1\n2\n3\n0", output: "6" });
        variations.push({ input: "10\n20\n30\n0", output: "60" });
      } else if (problem.includes("factorial")) {
        variations.push({ input: "5", output: "120" });
        variations.push({ input: "4", output: "24" });
      } else {
        variations.push({ input: question.input || "", output: question.output });
        variations.push({ input: question.input || "", output: question.output });
      }
    } else {
      // Default: use sample as variations
      variations.push({ input: question.input || "", output: question.output });
      variations.push({ input: question.input || "", output: question.output });
    }
    
    return variations;
  }

  const handleLanguageChange = (value: CodingLanguage) => {
    setLanguage(value);
    const template =
      languageOptions.find((l) => l.value === value)?.template ?? "";
    setCode(template);
    setOutput("");
    setError("");
    setAiHelp("");
    // Clear test results when language changes
    setTestCaseResults([]);
  };

  // Clear test results when code changes (if question is loaded)
  useEffect(() => {
    if (currentQuestion && testCaseResults.length > 0) {
      setTestCaseResults([]);
    }
  }, [code, currentQuestion, testCaseResults.length]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    setAiHelp("");
    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code,
          input,
        }),
      });

      const data: RunResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Execution failed");
      } else {
        setOutput(data.output ?? "");
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAskAi = async () => {
    if (!error && !output) return;
    setIsAskingAi(true);
    setAiHelp("");
    try {
      const message = [
        `I am working in an online coding playground with the language: ${language}.`,
        "",
        "Here is my code:",
        "```",
        code,
        "```",
        "",
        error
          ? `When I run it, I get this error:\n${error}`
          : `The code runs, but the output is:\n${output}\n\nPlease review it and tell me if you spot any logical issues or improvements.`,
        "",
        "Explain step-by-step what is wrong and how I can fix or improve the code.",
      ].join("\n");

      const res = await fetch("/api/groot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = (await res.json()) as { response?: string; error?: string };

      if (!res.ok || data.error) {
        setAiHelp(data.error || "Failed to get AI help");
      } else {
        setAiHelp(data.response ?? "");
      }
    } catch (err: any) {
      setAiHelp(err?.message ?? "Failed to get AI help");
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleTestCaseSelect = (testCase: { input: string; output: string }) => {
    setInput(testCase.input);
  };

  // Normalize output for comparison (trim whitespace, normalize line endings)
  const normalizeOutput = (output: string): string => {
    return output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  };

  const handleSubmit = async () => {
    if (!currentQuestion || testCases.length === 0) return;
    
    setIsSubmitting(true);
    setTestCaseResults([]);
    setError("");
    setOutput("");
    
    const results: Array<{
      id: number;
      passed: boolean;
      actualOutput?: string;
      error?: string;
    }> = [];
    
    // Run each test case sequentially
    for (const testCase of testCases) {
      try {
        const res = await fetch("/api/coding/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language,
            code,
            input: testCase.input,
          }),
        });

        const data: RunResponse = await res.json();

        if (!res.ok || !data.success || data.error) {
          results.push({
            id: testCase.id,
            passed: false,
            actualOutput: data.output,
            error: data.error || "Execution failed",
          });
        } else {
          const actualOutput = normalizeOutput(data.output ?? "");
          const expectedOutput = normalizeOutput(testCase.output);
          const passed = actualOutput === expectedOutput;
          
          results.push({
            id: testCase.id,
            passed,
            actualOutput: data.output ?? "",
            error: passed ? undefined : `Expected: "${expectedOutput}", Got: "${actualOutput}"`,
          });
        }
      } catch (err: any) {
        results.push({
          id: testCase.id,
          passed: false,
          error: err?.message ?? "Failed to run test case",
        });
      }
    }
    
    setTestCaseResults(results);
    setIsSubmitting(false);
    
    // Show summary in output
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    if (passedCount === totalCount) {
      setOutput(`✅ All test cases passed! (${passedCount}/${totalCount})`);
    } else {
      setOutput(`❌ Test results: ${passedCount}/${totalCount} passed`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Code Editor</h1>
          <p className="text-sm text-muted-foreground">
            {currentQuestion 
              ? `Practice: ${currentQuestion.topic.title} - Question ${currentQuestion.questionIndex + 1}`
              : "Run code in multiple languages, see errors instantly, and get help from Groot."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={language}
            onValueChange={(val) => handleLanguageChange(val as CodingLanguage)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentQuestion && testCases.length > 0 && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isRunning}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit Code
                </>
              )}
            </Button>
          )}
          <Button onClick={handleRun} disabled={isRunning || isSubmitting}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Question Display */}
      {currentQuestion && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary">
                Question {currentQuestion.questionIndex + 1}
              </Badge>
              <CardTitle className="text-lg">{currentQuestion.topic.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentQuestion(null);
                setTestCases([]);
                window.history.replaceState({}, "", "/code-editor");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Problem Statement:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.question.problem}</p>
            </div>
            {currentQuestion.question.explanation && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                <p className="text-xs font-semibold text-primary mb-1">💡 Hint:</p>
                <p className="text-sm text-muted-foreground">{currentQuestion.question.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px]">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              height="100%"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Test Cases */}
          {testCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {testCases.map((testCase) => {
                  const result = testCaseResults.find(r => r.id === testCase.id);
                  const hasResult = result !== undefined;
                  const isPassed = result?.passed ?? false;
                  
                  return (
                    <div 
                      key={testCase.id} 
                      className={`border rounded-md p-3 space-y-2 transition-colors ${
                        hasResult 
                          ? isPassed 
                            ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" 
                            : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              hasResult 
                                ? isPassed 
                                  ? "border-green-500 text-green-700 dark:text-green-400" 
                                  : "border-red-500 text-red-700 dark:text-red-400"
                                : ""
                            }`}
                          >
                            Test Case {testCase.id}
                          </Badge>
                          {hasResult && (
                            <div className="flex items-center gap-1">
                              {isPassed ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">Passed</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">Failed</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTestCaseSelect(testCase)}
                          className="h-6 text-xs"
                          disabled={isSubmitting}
                        >
                          Use Input
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted rounded p-2">
                          <div className="font-semibold text-muted-foreground mb-1">Input:</div>
                          <pre className="font-mono whitespace-pre-wrap text-[11px]">{testCase.input || "(No input)"}</pre>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <div className="font-semibold text-muted-foreground mb-1">Expected Output:</div>
                          <pre className="font-mono whitespace-pre-wrap text-[11px]">{testCase.output}</pre>
                        </div>
                      </div>
                      {hasResult && (
                        <div className={`rounded p-2 text-xs ${
                          isPassed 
                            ? "bg-green-100/50 dark:bg-green-900/30" 
                            : "bg-red-100/50 dark:bg-red-900/30"
                        }`}>
                          <div className="font-semibold text-muted-foreground mb-1">
                            {isPassed ? "Actual Output:" : "Actual Output (Error):"}
                          </div>
                          {isPassed ? (
                            <pre className="font-mono whitespace-pre-wrap text-[11px] text-green-700 dark:text-green-300">
                              {result.actualOutput || "(No output)"}
                            </pre>
                          ) : (
                            <div className="space-y-1">
                              <pre className="font-mono whitespace-pre-wrap text-[11px] text-red-700 dark:text-red-300">
                                {result.actualOutput || "(No output)"}
                              </pre>
                              {result.error && (
                                <div className="text-red-600 dark:text-red-400 font-semibold mt-1">
                                  {result.error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter custom input for your program (optional)"
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Output & Errors</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAskAi}
                disabled={isAskingAi || (!error && !output)}
              >
                {isAskingAi ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Asking...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-1 h-3 w-3" /> Ask Groot
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="min-h-[80px] max-h-40 overflow-auto rounded-md bg-muted p-2 text-sm">
                {error
                  ? `Error:\n${error}`
                  : output || "Run your code to see output here."}
              </pre>
              {aiHelp && (
                <div className="mt-3 rounded-md border bg-background p-2 text-sm whitespace-pre-wrap">
                  {aiHelp}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

