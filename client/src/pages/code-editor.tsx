import { useState } from "react";
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
import { Loader2, Play, MessageCircle, Code2, Terminal, FileCode, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { SiC, SiCplusplus, SiPython, SiJavascript } from "react-icons/si";
import { FaJava } from "react-icons/fa";

interface RunResponse {
  success: boolean;
  output?: string;
  error?: string;
}

const languageIcons: Record<string, any> = {
  c: SiC,
  cpp: SiCplusplus,
  python: SiPython,
  java: FaJava,
  javascript: SiJavascript,
};

export default function CodeEditorPage() {
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

  const handleLanguageChange = (value: CodingLanguage) => {
    setLanguage(value);
    const template =
      languageOptions.find((l) => l.value === value)?.template ?? "";
    setCode(template);
    setOutput("");
    setError("");
    setAiHelp("");
  };

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

  const LanguageIcon = languageIcons[language] || Code2;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg"
          >
            <Code2 className="h-6 w-6 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Code Editor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Run code in multiple languages, see errors instantly, and get help from Groot.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={language}
            onValueChange={(val) => handleLanguageChange(val as CodingLanguage)}
          >
            <SelectTrigger className="w-[180px] border-2 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-2">
                <LanguageIcon className="h-4 w-4" />
                <SelectValue placeholder="Language" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((lang) => {
                const Icon = languageIcons[lang.value] || Code2;
                return (
                  <SelectItem key={lang.value} value={lang.value} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{lang.label}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleRun} disabled={isRunning} size="lg" className="shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/90">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Run Code
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="min-h-[400px] border-2 hover:shadow-xl transition-all bg-gradient-to-br from-card to-muted/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-md">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold">Code Editor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] relative">
              <div className="absolute inset-0 rounded-lg border-2 border-border/50 bg-background/50 backdrop-blur-sm">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  height="100%"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-2 hover:shadow-xl transition-all bg-gradient-to-br from-card to-muted/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-md">
                    <Terminal className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="font-bold">Input</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter custom input for your program (optional)"
                  className="min-h-[100px] border-2 bg-background/80 backdrop-blur-sm"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-2 hover:shadow-xl transition-all bg-gradient-to-br from-card to-muted/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between gap-2 relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center border border-green-500/20 shadow-md">
                    <Terminal className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="font-bold">Output & Errors</span>
                </CardTitle>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAskAi}
                    disabled={isAskingAi || (!error && !output)}
                    className="shadow-md hover:shadow-lg border-2"
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
                </motion.div>
              </CardHeader>
              <CardContent className="relative">
                <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-lg p-3 border-2 border-border/50 shadow-inner min-h-[100px] max-h-60 overflow-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {error ? (
                      <span className="text-red-500 dark:text-red-400">
                        Error:\n{error}
                      </span>
                    ) : output ? (
                      <span className="text-green-600 dark:text-green-400">{output}</span>
                    ) : (
                      <span className="text-muted-foreground">Run your code to see output here.</span>
                    )}
                  </pre>
                </div>
                {aiHelp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-sm whitespace-pre-wrap shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">Groot's Help:</span>
                    </div>
                    <p className="text-muted-foreground">{aiHelp}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

