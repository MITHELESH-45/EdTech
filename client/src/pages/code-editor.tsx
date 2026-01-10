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
import { Loader2, Play, CheckCircle2, XCircle, X, Send, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getTopicById, type CodingTopic } from "@/lib/coding-learning-content";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<CodingLanguage>("python");
  const [code, setCode] = useState<string>(
    languageOptions.find((l) => l.value === "python")?.template ?? "",
  );
  
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
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

  const handleLanguageChange = (value: CodingLanguage) => {
    setLanguage(value);
    const template =
      languageOptions.find((l) => l.value === value)?.template ?? "";
    setCode(template);
    setError("");
    setAssessmentResult(null);
  };

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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          
          <Button 
            onClick={handleRun} 
            disabled={isRunning || isSubmitting}
            variant="secondary"
          >
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
                setAssessmentResult(null);
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
