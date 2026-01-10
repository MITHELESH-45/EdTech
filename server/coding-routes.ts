import type { Express, Request, Response } from "express";

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
}


