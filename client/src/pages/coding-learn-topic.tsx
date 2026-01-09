import { useRoute } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code, CheckCircle2, AlertCircle, Play, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { getTopicById } from "@/lib/coding-learning-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getQuestionId, isQuestionCompleted } from "@/lib/question-mapping";
import { useEffect, useState } from "react";

export default function CodingLearnTopic() {
  const [, params] = useRoute("/coding/learn/:topic");
  const topicId = params?.topic || "";
  const topic = getTopicById(topicId);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());

  // Refresh completion status
  useEffect(() => {
    const checkCompletions = () => {
      const completed = new Set<string>();
      topic?.questions.forEach((_, index) => {
        const questionId = getQuestionId(topicId, index);
        if (questionId && isQuestionCompleted(questionId)) {
          completed.add(questionId);
        }
      });
      setCompletedQuestions(completed);
    };

    checkCompletions();
    
    // Listen for storage changes (when question is completed in code editor)
    const handleStorageChange = () => {
      checkCompletions();
    };
    
    // Listen for custom storage event (same-tab updates)
    const handleCustomStorage = () => {
      checkCompletions();
    };
    
    // Refresh when page regains focus (user returns from code editor)
    const handleFocus = () => {
      checkCompletions();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("questionCompleted", handleCustomStorage);
    window.addEventListener("focus", handleFocus);
    // Also check periodically in case of same-tab updates
    const interval = setInterval(checkCompletions, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("questionCompleted", handleCustomStorage);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [topicId, topic]);

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Topic Not Found</h2>
        <p className="text-muted-foreground">The topic you're looking for doesn't exist.</p>
        <Link href="/coding">
          <Button>Back to Coding Fundamentals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href="/coding">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{topic.title}</h1>
            <p className="text-muted-foreground pt-2">{topic.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        {/* <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/coding" className="hover:text-foreground transition-colors">
          Coding Playground
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{topic.title}</span> */}
      </motion.div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Left Column - Learning Content */}
        <div className="space-y-6">
          {/* Concept Explanation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Concept Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {topic.explanation}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Rules with examples */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Key Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {topic.keyRules.map((item, index) => (
                    <li key={index} className="space-y-2 border-b last:border-b-0 border-border pb-3 last:pb-0">
                      <div className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-foreground font-medium">{item.rule}</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">Example:</span> {item.example}
                        </div>
                        <div className="bg-muted rounded-md p-3 text-xs font-mono whitespace-pre-wrap">
                          {item.code}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 pl-1">
                          <div className="bg-background border border-border rounded-md p-2">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Input</div>
                            <div className="text-xs text-foreground whitespace-pre-wrap">{item.input || "—"}</div>
                          </div>
                          <div className="bg-background border border-border rounded-md p-2">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Output</div>
                            <div className="text-xs text-foreground whitespace-pre-wrap">{item.output || "—"}</div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Common Mistakes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Common Mistakes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {topic.commonMistakes.map((mistake, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">⚠</span>
                      <span className="text-muted-foreground">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Practice Questions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Practice Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {topic.questions.map((question, index) => {
                  const questionId = getQuestionId(topicId, index);
                  const isCompleted = questionId ? completedQuestions.has(questionId) : false;
                  
                  return (
                    <div key={index} className="border-l-4 border-primary pl-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-foreground">{question.problem}</p>
                      {questionId && !isCompleted && (
                        <Link href={`/code-editor?questionId=${questionId}`}>
                          <Button className="gap-2" size="sm">
                            <Code className="h-4 w-4" />
                            Solve in Code Editor
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      {questionId && isCompleted && (
                        <Link href={`/code-editor?questionId=${questionId}`}>
                          <Button variant="outline" className="gap-2" size="sm">
                            <Code className="h-4 w-4" />
                            View in Code Editor
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Syntax Reference */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:sticky lg:top-6 h-fit"
        >
          <Card>
            <CardHeader>
              <CardTitle>Syntax Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="python" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="c">C</TabsTrigger>
                  <TabsTrigger value="cpp">C++</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="java">Java</TabsTrigger>
                </TabsList>
                <TabsContent value="c" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{topic.syntax.c}</code>
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="cpp" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{topic.syntax.cpp}</code>
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{topic.syntax.python}</code>
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="java" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{topic.syntax.java}</code>
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Practice Button - Sticky at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="sticky bottom-6 z-10"
          >
            <Card className="bg-card border-border shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">Ready to Practice?</h3>
                    <p className="text-sm text-muted-foreground">
                      Open the code editor and start coding with the concepts you've learned.
                    </p>
                  </div>
                  <Link href="/code-editor">
                    <Button size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Practice in Code Editor
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
    </div>
  );
}

