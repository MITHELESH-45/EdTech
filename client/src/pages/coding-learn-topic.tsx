import { useRoute } from "wouter";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code, CheckCircle2, AlertCircle, Play, Terminal, FileCode, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { getTopicById } from "@/lib/coding-learning-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SiC, SiCplusplus, SiPython } from "react-icons/si";
import { FaJava } from "react-icons/fa";
import { TbBrackets, TbRepeat, TbSquare, TbLetterT, TbFunction } from "react-icons/tb";

const topicIcons: Record<string, any> = {
  conditionals: TbBrackets,
  loops: TbRepeat,
  arrays: TbSquare,
  strings: TbLetterT,
  functions: TbFunction,
};

const languageIcons: Record<string, any> = {
  c: SiC,
  cpp: SiCplusplus,
  python: SiPython,
  java: FaJava,
};

export default function CodingLearnTopic() {
  const [, params] = useRoute("/coding/learn/:topic");
  const topicId = params?.topic || "";
  const topic = getTopicById(topicId);

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

  const TopicIcon = topicIcons[topicId] || Code;

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
            <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg border border-primary/20"
            >
              <TopicIcon className="h-7 w-7 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {topic.title}
              </h1>
              <p className="text-muted-foreground pt-2">{topic.description}</p>
            </div>
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
            <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all bg-gradient-to-br from-card to-muted/30 group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-md">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">Concept Explanation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
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
            <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all bg-gradient-to-br from-card to-muted/30 group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center border border-green-500/20 shadow-md">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="font-bold">Key Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-6">
                  {topic.keyRules.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="space-y-3 border-b last:border-b-0 border-border/50 pb-4 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 mt-0.5 flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{index + 1}</span>
                        </div>
                        <span className="text-foreground font-semibold text-base">{item.rule}</span>
                      </div>
                      <div className="pl-9 space-y-3">
                        <div className="flex items-start gap-2 text-sm bg-primary/5 rounded-lg p-3 border border-primary/10">
                          <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-primary">Example: </span>
                            <span className="text-muted-foreground">{item.example}</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap border border-border/50 shadow-inner">
                          {item.code}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 shadow-md">
                            <CardHeader className="py-2 px-3">
                              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                                <Terminal className="h-3 w-3" />
                                Input
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="text-xs text-foreground whitespace-pre-wrap font-mono bg-background/50 rounded p-2 border border-border/50">
                                {item.input || "—"}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 shadow-md">
                            <CardHeader className="py-2 px-3">
                              <div className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1">
                                <Terminal className="h-3 w-3" />
                                Output
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="text-xs text-foreground whitespace-pre-wrap font-mono bg-background/50 rounded p-2 border border-border/50">
                                {item.output || "—"}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </motion.li>
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
            <Card className="relative overflow-hidden border-2 border-amber-500/30 hover:shadow-xl transition-all bg-gradient-to-br from-card to-amber-500/5 group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-md">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="font-bold">Common Mistakes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-3">
                  {topic.commonMistakes.map((mistake, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-3 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20"
                    >
                      <span className="text-amber-500 mt-0.5 text-lg flex-shrink-0">⚠</span>
                      <span className="text-muted-foreground leading-relaxed">{mistake}</span>
                    </motion.li>
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
                {topic.questions.map((question, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Question {index + 1}</Badge>
                    </div>
                    <p className="font-medium text-foreground">{question.problem}</p>
                    <div className="space-y-2">
                      <div className="bg-muted rounded-md p-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Sample Input:</div>
                        <pre className="text-sm font-mono whitespace-pre-wrap">{question.input || "(No input)"}</pre>
                      </div>
                      <div className="bg-muted rounded-md p-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Sample Output:</div>
                        <pre className="text-sm font-mono whitespace-pre-wrap">{question.output}</pre>
                      </div>
                      {question.explanation && (
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                          <div className="text-xs font-semibold text-primary mb-1">💡 Hint:</div>
                          <p className="text-sm text-muted-foreground">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                  <TabsTrigger value="c" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-sky-600 data-[state=active]:text-white">
                    {(() => {
                      const Icon = languageIcons.c;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span>C</span>
                  </TabsTrigger>
                  <TabsTrigger value="cpp" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                    {(() => {
                      const Icon = languageIcons.cpp;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span>C++</span>
                  </TabsTrigger>
                  <TabsTrigger value="python" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:text-black">
                    {(() => {
                      const Icon = languageIcons.python;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span>Python</span>
                  </TabsTrigger>
                  <TabsTrigger value="java" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                    {(() => {
                      const Icon = languageIcons.java;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span>Java</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="c" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-lg p-4">
                      <pre className="text-xs font-mono bg-background/80 p-4 rounded-md overflow-x-auto border border-border/50 shadow-inner">
                        <code>{topic.syntax.c}</code>
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="cpp" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
                      <pre className="text-xs font-mono bg-background/80 p-4 rounded-md overflow-x-auto border border-border/50 shadow-inner">
                        <code>{topic.syntax.cpp}</code>
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                      <pre className="text-xs font-mono bg-background/80 p-4 rounded-md overflow-x-auto border border-border/50 shadow-inner">
                        <code>{topic.syntax.python}</code>
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="java" className="mt-4">
                  <ScrollArea className="h-[600px]">
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                      <pre className="text-xs font-mono bg-background/80 p-4 rounded-md overflow-x-auto border border-border/50 shadow-inner">
                        <code>{topic.syntax.java}</code>
                      </pre>
                    </div>
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
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/30 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2 text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Ready to Practice?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Open the code editor and start coding with the concepts you've learned.
                    </p>
                  </div>
                  <Link href="/code-editor">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/90 text-white border-0">
                        <Play className="h-5 w-5" />
                        Practice in Code Editor
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
    </div>
  );
}

