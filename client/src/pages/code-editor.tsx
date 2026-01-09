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
import { Loader2, Play, MessageCircle } from "lucide-react";

interface RunResponse {
  success: boolean;
  output?: string;
  error?: string;
}

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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Code Editor</h1>
          <p className="text-sm text-muted-foreground">
            Run code in multiple languages, see errors instantly, and get help
            from Groot.
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
          <Button onClick={handleRun} disabled={isRunning}>
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

