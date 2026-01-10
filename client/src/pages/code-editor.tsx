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
<<<<<<< HEAD
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, MessageCircle, X, CheckCircle2, XCircle, Send } from "lucide-react";
import { useLocation } from "wouter";
import { getTopicById, type CodingTopic } from "@/lib/coding-learning-content";
import { Badge } from "@/components/ui/badge";
=======
import { Loader2, Play, CheckCircle2, XCircle, X, Send, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getTopicById, type CodingTopic } from "@/lib/coding-learning-content";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001

interface TestCaseResult {
  index: number;
  status: "PASSED" | "FAILED";
  input?: string;
  output?: string;
  isHidden: boolean;
}

interface AssessmentResponse {
  success: boolean;
  status?: "PASSED" | "FAILED";
  results?: TestCaseResult[];
  feedback?: string;
  failedTestCaseIndex?: number | null;
  confidence?: number;
  pointsAwarded?: number;
  error?: string;
  output?: string;
  message?: string;
}

export default function CodeEditorPage() {
  const [location] = useLocation();
<<<<<<< HEAD
=======
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
  const [language, setLanguage] = useState<CodingLanguage>("python");
  const [code, setCode] = useState<string>(
    languageOptions.find((l) => l.value === "python")?.template ?? "",
  );
  
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
<<<<<<< HEAD
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
=======
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    topic: CodingTopic;
    questionIndex: number;
    question: { 
      problem: string; 
      input: string; 
      output: string; 
      explanation?: string;
      examples?: Array<{ input: string; output: string }>;
    };
  } | null>(null);
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001

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
<<<<<<< HEAD
          
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
=======
          setAssessmentResult(null);
        }
      } else {
        setCurrentQuestion(null);
        setAssessmentResult(null);
      }
    } catch (error) {
      setCurrentQuestion(null);
    }
  }, [location]);
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001

  const handleLanguageChange = (value: CodingLanguage) => {
    setLanguage(value);
    const template =
      languageOptions.find((l) => l.value === value)?.template ?? "";
    setCode(template);
    setError("");
<<<<<<< HEAD
    setAiHelp("");
    // Clear test results when language changes
    setTestCaseResults([]);
=======
    setAssessmentResult(null);
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
  };

  // Clear test results when code changes (if question is loaded)
  useEffect(() => {
    if (currentQuestion && testCaseResults.length > 0) {
      setTestCaseResults([]);
    }
  }, [code, currentQuestion, testCaseResults.length]);

  const handleRun = async () => {
    setIsRunning(true);
    setError("");
    setAssessmentResult(null);

    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code,
          userId: user?.userId,
          topicId: currentQuestion?.topic.id,
          questionIndex: currentQuestion?.questionIndex,
          problemStatement: currentQuestion?.question.problem
        }),
      });

      const data: AssessmentResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Execution failed");
      } else {
        setAssessmentResult(data);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!assessmentResult || assessmentResult.status !== "PASSED") return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/coding/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code,
          userId: user?.userId,
          topicId: currentQuestion?.topic.id,
          questionIndex: currentQuestion?.questionIndex,
          problemStatement: currentQuestion?.question.problem
        }),
      });

      const data: AssessmentResponse = await res.json();

      if (!res.ok || !data.success) {
        toast({
            title: "Submission Failed",
            description: data.error || "Failed to submit solution",
            variant: "destructive",
        });
      } else {
        // Success!
        if (data.pointsAwarded) {
            toast({
                title: "Points Awarded!",
                description: `You earned ${data.pointsAwarded} points!`,
                variant: "default",
            });
            // Update the points in header by invalidating query
            queryClient.invalidateQueries({ queryKey: ["/api/courses/info", user?.userId] });
        } else {
             toast({
                title: "Completed!",
                description: "Solution submitted successfully.",
                variant: "default",
            });
        }
      }
    } catch (err: any) {
       toast({
            title: "Error",
            description: "Failed to submit solution",
            variant: "destructive",
        });
    } finally {
      setIsSubmitting(false);
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
<<<<<<< HEAD
        <div>
          <h1 className="text-2xl font-bold">Code Editor</h1>
          <p className="text-sm text-muted-foreground">
            {currentQuestion 
              ? `Practice: ${currentQuestion.topic.title} - Question ${currentQuestion.questionIndex + 1}`
              : "Run code in multiple languages, see errors instantly, and get help from Groot."}
          </p>
=======
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => window.history.back()}
            disabled={isRunning || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Code Editor</h1>
            <p className="text-sm text-muted-foreground">
              {currentQuestion 
                ? `Assessment: ${currentQuestion.topic.title} - Question ${currentQuestion.questionIndex + 1}`
                : "Practice coding with AI Assessment."}
            </p>
          </div>
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
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
<<<<<<< HEAD
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
=======
          
          <Button 
            onClick={handleRun} 
            disabled={isRunning || isSubmitting}
            variant="secondary"
          >
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run
              </>
            )}
          </Button>

          <Button 
            onClick={handleSubmit} 
            disabled={
                isRunning || 
                isSubmitting || 
                !assessmentResult || 
                assessmentResult.status !== "PASSED"
            }
            className={assessmentResult?.status === "PASSED" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isSubmitting ? (
               <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
               <>
                <Send className="mr-2 h-4 w-4" /> Submit Solution
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
<<<<<<< HEAD
                setTestCases([]);
=======
                setAssessmentResult(null);
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
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
<<<<<<< HEAD
=======

            {currentQuestion.question.examples && currentQuestion.question.examples.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Example Test Cases:</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {currentQuestion.question.examples.map((example, idx) => (
                    <div key={idx} className="bg-muted/50 p-2 rounded text-xs border">
                      <div className="font-semibold text-muted-foreground mb-1">Test Case {idx + 1}</div>
                      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                        <span className="font-medium text-foreground">Input:</span>
                        <code className="bg-background px-1 rounded whitespace-pre-wrap">{example.input}</code>
                        <span className="font-medium text-foreground">Output:</span>
                        <code className="bg-background px-1 rounded whitespace-pre-wrap">{example.output}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
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

<<<<<<< HEAD
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
=======
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500 font-mono text-sm whitespace-pre-wrap bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
                {error}
              </div>
            ) : !assessmentResult ? (
              <div className="text-muted-foreground text-sm p-4 bg-muted/50 rounded-md">
                Run your code to see test case results.
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-3 rounded-md border ${
                  assessmentResult.status === "PASSED" 
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
                }`}>
                  <div className="flex items-center gap-2 font-semibold">
                    {assessmentResult.status === "PASSED" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    {assessmentResult.status === "PASSED" ? "All Test Cases Passed!" : "Solution Failed"}
                  </div>
                  {assessmentResult.feedback && (
                    <p className="mt-2 text-sm opacity-90">{assessmentResult.feedback}</p>
                  )}
>>>>>>> be92af514c5e3eaff3c0d33f5ee5d0fe0c120001
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-semibold">Test Cases:</p>
                    {assessmentResult.results?.map((result, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-card border text-sm">
                            {result.status === "PASSED" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                        Test Case {idx + 1} {result.isHidden && "(Hidden)"}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        result.status === "PASSED" 
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}>
                                        {result.status}
                                    </span>
                                </div>
                                
                                {!result.isHidden && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                        <div>
                                            <span className="font-semibold block mb-1">Input:</span>
                                            <code className="bg-background px-1 rounded">{result.input}</code>
                                        </div>
                                        <div>
                                            <span className="font-semibold block mb-1">Expected:</span>
                                            <code className="bg-background px-1 rounded">{result.output}</code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
