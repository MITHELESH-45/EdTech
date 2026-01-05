import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible locations for .env file (root directory first)
const possibleEnvPaths = [
  path.join(process.cwd(), ".env"), // project_root/.env (ROOT - PRIORITY)
  path.join(__dirname, ".env"), // server/.env
  path.join(__dirname, "..", ".env"), // ../.env (parent of server)
  path.join(process.cwd(), "server", ".env"), // project_root/server/.env
];

let envPath: string | undefined;
for (const envPathCandidate of possibleEnvPaths) {
  if (fs.existsSync(envPathCandidate)) {
    envPath = envPathCandidate;
    break;
  }
}

// Load environment variables
if (envPath) {
  const result = dotenv.config({ path: envPath, override: true });
  if (result.error) {
    console.warn(`[WARN] Failed to load .env from ${envPath}:`, result.error);
  } else {
    console.log(`[INFO] Loaded .env from ${envPath}`);
  }
} else {
  console.warn("[WARN] No .env file found in expected locations:", possibleEnvPaths);
}

// Check if OPENAI_API_KEY is loaded
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[ERROR] OPENAI_API_KEY not found in environment variables");
  console.error("[ERROR] Please ensure .env file exists in root directory or server/ directory with OPENAI_API_KEY");
} else {
  console.log(`[INFO] OPENAI_API_KEY loaded (length: ${apiKey.length})`);
}  

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Production vs development setup
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ✅ Windows-safe server listen
  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(port, () => {
    log(`serving on http://localhost:${port}`);
  });
})();
