import type { Express, Request, Response } from "express";
import { storage } from "./storage";

type SupportedLanguage = "python" | "javascript" | "cpp" | "java";

function mapToPistonLanguage(language: SupportedLanguage): string {
  const map: Record<SupportedLanguage, string> = {
    python: "python",
    javascript: "js",
    cpp: "cpp",
    java: "java",
  };
  return map[language] ?? language;
}

interface PistonExecuteResponse {
  run?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
  };
  compile?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
  };
}

export function registerCodingRoutes(app: Express): void {
  app.post("/api/coding/run", async (req: Request, res: Response) => {
    try {
      const { language, code, input } = req.body as {
        language?: SupportedLanguage;
        code?: string;
        input?: string;
      };

      if (!language || !code) {
        return res
          .status(400)
          .json({ success: false, error: "language and code are required" });
      }

      const pistonLanguage = mapToPistonLanguage(language);

      const pistonResponse = await fetch(
        "https://emkc.org/api/v2/piston/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: pistonLanguage,
            version: "*",
            files: [{ content: code }],
            stdin: input ?? "",
          }),
        },
      );

      if (!pistonResponse.ok) {
        const errorData = await pistonResponse
          .json()
          .catch(() => ({} as any));
        return res.status(500).json({
          success: false,
          error:
            (errorData as any)?.error ||
            `Failed to execute code (status ${pistonResponse.status})`,
        });
      }

      const data = (await pistonResponse.json()) as PistonExecuteResponse;

      const compile = data.compile ?? {};
      const run = data.run ?? {};

      const compileError =
        (compile.stderr || compile.output || "").trim() || "";
      const runtimeError = (run.stderr || "").trim() || "";

      const isError =
        !!compileError || !!runtimeError || (run.code ?? 0) !== 0;

      if (isError) {
        const combinedError = [compileError, runtimeError]
          .filter(Boolean)
          .join("\n\n")
          .trim();

        return res.status(200).json({
          success: false,
          output: run.stdout ?? "",
          error: combinedError || "Execution failed",
        });
      }

      const output =
        (run.output || run.stdout || "").toString() ?? "";

      return res.status(200).json({
        success: true,
        output,
      });
    } catch (error: any) {
      console.error("[coding-run] error executing code:", error);
      return res.status(500).json({
        success: false,
        error: "Unexpected error while executing code",
      });
    }
  });

  // Get all coding components
  app.get("/api/coding/components", async (_req: Request, res: Response) => {
    try {
      const components = await storage.getCodingComponents();
      res.json(components);
    } catch (error: any) {
      console.error("[coding-components] error:", error);
      res.status(500).json({ error: "Failed to fetch components" });
    }
  });

  // Get questions for a component
  app.get("/api/coding/components/:componentId/questions", async (req: Request, res: Response) => {
    try {
      const { componentId } = req.params;
      const questions = await storage.getQuestionsByComponent(componentId);
      res.json(questions);
    } catch (error: any) {
      console.error("[coding-questions] error:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get a specific question
  app.get("/api/coding/questions/:questionId", async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      console.log(`[coding-question] Fetching question: ${questionId}`);
      const question = await storage.getQuestion(questionId);
      if (!question) {
        console.log(`[coding-question] Question not found: ${questionId}`);
        return res.status(404).json({ error: "Question not found" });
      }
      console.log(`[coding-question] Question found:`, {
        id: question.id,
        title: question.title,
        testcasesCount: question.testcases?.length || 0,
        hasTestcases: !!question.testcases && Array.isArray(question.testcases)
      });
      res.json(question);
    } catch (error: any) {
      console.error("[coding-question] error:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  // Submit solution and evaluate all testcases
  app.post("/api/coding/submit", async (req: Request, res: Response) => {
    try {
      const { language, code, questionId } = req.body as {
        language?: SupportedLanguage;
        code?: string;
        questionId?: string;
      };

      if (!language || !code || !questionId) {
        return res
          .status(400)
          .json({ error: "language, code, and questionId are required" });
      }

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      const pistonLanguage = mapToPistonLanguage(language);
      const results: Array<{
        input: string;
        expectedOutput: string;
        actualOutput: string;
        passed: boolean;
        error?: string;
      }> = [];

      // Evaluate each testcase
      for (const testcase of question.testcases) {
        try {
          const pistonResponse = await fetch(
            "https://emkc.org/api/v2/piston/execute",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                language: pistonLanguage,
                version: "*",
                files: [{ content: code }],
                stdin: testcase.input,
              }),
            },
          );

          if (!pistonResponse.ok) {
            results.push({
              input: testcase.input,
              expectedOutput: testcase.expectedOutput,
              actualOutput: "",
              passed: false,
              error: `Execution failed with status ${pistonResponse.status}`,
            });
            continue;
          }

          const data = (await pistonResponse.json()) as PistonExecuteResponse;
          const compile = data.compile ?? {};
          const run = data.run ?? {};

          const compileError = (compile.stderr || compile.output || "").trim();
          const runtimeError = (run.stderr || "").trim();
          const hasError = !!compileError || !!runtimeError || (run.code ?? 0) !== 0;

          if (hasError) {
            const errorMsg = [compileError, runtimeError].filter(Boolean).join("\n").trim();
            results.push({
              input: testcase.input,
              expectedOutput: testcase.expectedOutput,
              actualOutput: run.stdout ?? "",
              passed: false,
              error: errorMsg || "Execution failed",
            });
            continue;
          }

          const actualOutput = (run.output || run.stdout || "").toString().trim();
          const expectedOutput = testcase.expectedOutput.trim();
          
          // Normalize outputs for comparison (remove trailing whitespace from each line)
          const normalize = (text: string) => {
            return text.split('\n').map(line => line.trimEnd()).join('\n').trimEnd();
          };

          const normalizedActual = normalize(actualOutput);
          const normalizedExpected = normalize(expectedOutput);

          const passed = normalizedActual === normalizedExpected;

          results.push({
            input: testcase.input,
            expectedOutput: testcase.expectedOutput,
            actualOutput: actualOutput,
            passed,
          });
        } catch (error: any) {
          results.push({
            input: testcase.input,
            expectedOutput: testcase.expectedOutput,
            actualOutput: "",
            passed: false,
            error: error.message || "Unexpected error",
          });
        }
      }

      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;

      res.json({
        success: true,
        passedCount,
        totalCount,
        results,
      });
    } catch (error: any) {
      console.error("[coding-submit] error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit solution",
      });
    }
  });
}


