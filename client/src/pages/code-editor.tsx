import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CodeEditor } from "@/components/CodeEditor";
import {
  languageOptions,
  type CodingLanguage,
} from "@/lib/coding-language-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, MessageCircle, CheckCircle2, Send, AlertCircle } from "lucide-react";
import { TestcaseResults, type TestcaseResult } from "@/components/coding/TestcaseResults";
import { ScrollArea } from "@/components/ui/scroll-area";
import { markQuestionCompleted, isQuestionCompleted as checkQuestionCompleted } from "@/lib/question-mapping";
import { useToast } from "@/hooks/use-toast";

interface RunResponse {
  success: boolean;
  output?: string;
  error?: string;
}

interface CodingQuestion {
  id: string;
  component: string;
  title: string;
  description: string;
  testcases?: Array<{ input: string; expectedOutput: string }>;
}

interface SubmitResponse {
  success: boolean;
  passedCount: number;
  totalCount: number;
  results: TestcaseResult[];
  error?: string;
}

export default function CodeEditorPage() {
  const [location] = useLocation();
  
  // Extract questionId from URL - try both wouter location and window.location
  const getQuestionId = () => {
    // Try from wouter location first
    const searchParams1 = new URLSearchParams(location.split("?")[1] || "");
    const qId1 = searchParams1.get("questionId");
    if (qId1) return qId1;
    
    // Fallback to window.location
    if (typeof window !== "undefined") {
      const searchParams2 = new URLSearchParams(window.location.search);
      const qId2 = searchParams2.get("questionId");
      if (qId2) return qId2;
    }
    
    return null;
  };
  
  const questionId = getQuestionId();
  
  // Debug: Log questionId and location
  useEffect(() => {
    console.log("🔍 URL Debug:", {
      wouterLocation: location,
      windowLocation: typeof window !== "undefined" ? window.location.href : "N/A",
      questionId,
      searchParams: typeof window !== "undefined" ? window.location.search : "N/A"
    });
  }, [location, questionId]);

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
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState<{
    passedCount: number;
    totalCount: number;
    results: TestcaseResult[];
  } | null>(null);
  const [isQuestionCompleted, setIsQuestionCompleted] = useState(false);
  const { toast } = useToast();

  // HARDCODED TESTCASES FOR TESTING - Remove after debugging
  const hardcodedTestcases = [
    { input: "6", expectedOutput: "Even" },
    { input: "7", expectedOutput: "Odd" },
    { input: "0", expectedOutput: "Even" },
    { input: "15", expectedOutput: "Odd" },
    { input: "100", expectedOutput: "Even" },
    { input: "1", expectedOutput: "Odd" },
  ];

  useEffect(() => {
    if (questionId) {
      const fetchQuestion = async () => {
        setLoadingQuestion(true);
        setError("");
        try {
          const res = await fetch(`/api/coding/questions/${questionId}`);
          if (res.ok) {
            const data = await res.json();
            console.log("Fetched question:", data);
            console.log("Testcases:", data.testcases);
            console.log("Testcases length:", data.testcases?.length);
            
            // Always set the question if we have valid data (even if testcases are missing for debugging)
            if (data && data.id) {
              console.log("✅ Setting question:", {
                id: data.id,
                title: data.title,
                testcasesCount: data.testcases?.length || 0,
                hasTestcases: !!data.testcases && Array.isArray(data.testcases)
              });
              
              setQuestion(data);
              
              if (!data.testcases || !Array.isArray(data.testcases) || data.testcases.length === 0) {
                console.warn("⚠️ Warning: Question loaded but testcases are missing or empty");
                setError("Warning: This question has no testcases.");
              } else {
                setError(""); // Clear any previous errors
                console.log("✅ Question and testcases loaded successfully!");
              }
              
              // Check if question is already completed
              setIsQuestionCompleted(checkQuestionCompleted(questionId));
              // Reset code to template when question loads
              const template =
                languageOptions.find((l) => l.value === language)?.template ?? "";
              setCode(template);
              
              // Auto-populate input with first testcase if available
              if (data.testcases && Array.isArray(data.testcases) && data.testcases.length > 0) {
                setInput(data.testcases[0].input);
              } else {
                setInput(""); // Clear input if no testcases
              }
            } else {
              console.error("❌ Invalid question data:", data);
              setError("Question data is invalid.");
              setQuestion(null);
            }
          } else {
            const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
            console.error("Failed to fetch question:", res.status, errorData);
            setError(errorData.error || `Failed to load question (${res.status})`);
            setQuestion(null);
          }
        } catch (error) {
          console.error("Failed to fetch question:", error);
          setError("Failed to load question. Please try again.");
        } finally {
          setLoadingQuestion(false);
        }
      };
      fetchQuestion();
    } else {
      setQuestion(null);
      setSubmitResults(null);
      setIsQuestionCompleted(false);
    }
  }, [questionId, language]);

  const handleLanguageChange = (value: CodingLanguage) => {
    setLanguage(value);
    const template =
      languageOptions.find((l) => l.value === value)?.template ?? "";
    setCode(template);
    setOutput("");
    setError("");
    setAiHelp("");
    setSubmitResults(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    setAiHelp("");
    try {
      // If code contains input() and input is empty, use first testcase input if available
      let inputToUse = input;
      if (!inputToUse && question?.testcases && question.testcases.length > 0) {
        inputToUse = question.testcases[0].input;
        setInput(inputToUse); // Update the input field too
      }
      
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code,
          input: inputToUse || "", // Use empty string if still no input
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

  const handleSubmit = async () => {
    if (!questionId) return;
    
    setIsSubmitting(true);
    setSubmitResults(null);
    setError("");
    setOutput("");
    
    try {
      const res = await fetch("/api/coding/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code,
          questionId,
        }),
      });

      const data: SubmitResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Submission failed");
      } else {
        setSubmitResults({
          passedCount: data.passedCount,
          totalCount: data.totalCount,
          results: data.results,
        });
        
        // Check if all testcases passed
        if (data.passedCount === data.totalCount && questionId) {
          if (!checkQuestionCompleted(questionId)) {
            markQuestionCompleted(questionId);
            setIsQuestionCompleted(true);
            toast({
              title: "🎉 Congratulations!",
              description: "You've completed this question! All testcases passed.",
            });
            // Trigger custom event for same-tab updates
            window.dispatchEvent(new Event("questionCompleted"));
            // Trigger storage event for other tabs
            window.dispatchEvent(new Event("storage"));
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit solution");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {question ? question.title : "Code Editor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {question
              ? question.description
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
          <Button onClick={handleRun} disabled={isRunning || loadingQuestion}>
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
          {question && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loadingQuestion || !code.trim()}
              variant="default"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {loadingQuestion && (
        <Card>
          <CardContent className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading question...</span>
          </CardContent>
        </Card>
      )}

      {questionId && !loadingQuestion && !question && error && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground">Question ID: {questionId}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {submitResults && (
        <TestcaseResults
          results={submitResults.results}
          passedCount={submitResults.passedCount}
          totalCount={submitResults.totalCount}
        />
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
          {question && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{question.title || "Untitled Question"}</span>
                  </div>
                  {isQuestionCompleted && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs mb-2">
                  ✅ Question loaded: {question.id} | Title: {question.title}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {question.description || "No description available."}
                  </p>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Testcases ({question?.testcases?.length || hardcodedTestcases.length}):
                  </p>
                  {(() => {
                    // Use hardcoded testcases for testing, fallback to question testcases
                    const testcasesToShow = question?.testcases && Array.isArray(question.testcases) && question.testcases.length > 0
                      ? question.testcases
                      : hardcodedTestcases;
                    
                    console.log("🔍 TESTCASES DEBUG:", {
                      questionId,
                      hasQuestion: !!question,
                      questionTestcases: question?.testcases,
                      questionTestcasesLength: question?.testcases?.length,
                      usingHardcoded: testcasesToShow === hardcodedTestcases,
                      testcasesToShow,
                      testcasesToShowLength: testcasesToShow.length
                    });
                    
                    if (testcasesToShow && testcasesToShow.length > 0) {
                      return (
                        <>
                          <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
                            {testcasesToShow === hardcodedTestcases 
                              ? "⚠️ Using HARDCODED testcases for testing" 
                              : "✅ Using question testcases"}
                          </div>
                          <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/20">
                            <div className="space-y-2 pr-4">
                              {testcasesToShow.map((testcase: { input: string; expectedOutput: string }, idx: number) => (
                                <div key={idx} className="bg-muted/50 rounded-md p-2.5 text-xs border border-border/50">
                                  <div className="font-semibold text-foreground mb-1.5">
                                    Testcase {idx + 1}:
                                  </div>
                                  <div className="space-y-1.5">
                                    <div>
                                      <span className="text-muted-foreground font-medium text-[11px]">Input: </span>
                                      <div className="mt-0.5 bg-background rounded px-2 py-1 font-mono text-[11px] whitespace-pre-wrap break-words border border-border/30">
                                        {testcase.input || "(empty)"}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground font-medium text-[11px]">Expected Output: </span>
                                      <div className="mt-0.5 bg-background rounded px-2 py-1 font-mono text-[11px] whitespace-pre-wrap break-words border border-border/30">
                                        {testcase.expectedOutput}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          {!isQuestionCompleted && (
                            <p className="text-xs text-primary font-medium mt-2">
                              ✓ Solve all {testcasesToShow.length} testcases to complete this question
                            </p>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <div className="bg-muted/30 rounded-md p-3 text-center border border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">
                            No testcases available
                          </p>
                          <details className="text-[10px] text-muted-foreground text-left">
                            <summary className="cursor-pointer">Debug Info</summary>
                            <pre className="mt-2 p-2 bg-background rounded border text-[9px] overflow-auto max-h-32">
                              {JSON.stringify({ 
                                questionId, 
                                hasQuestion: !!question, 
                                questionTestcases: question?.testcases,
                                hardcodedTestcases,
                                testcasesToShow
                              }, null, 2)}
                            </pre>
                          </details>
                        </div>
                      );
                    }
                  })()}
                </div>
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
                disabled={!!question}
              />
              {question && (
                <p className="text-xs text-muted-foreground mt-2">
                  Input is provided by testcases when submitting
                </p>
              )}
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

