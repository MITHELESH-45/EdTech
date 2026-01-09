import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Get the directory of the current module (works in both ESM and CJS)
// Use process.cwd() as base and resolve server directory from there
const __dirname = path.resolve(process.cwd(), "server");
// #region agent log
fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:11',message:'__dirname resolution',data:{__dirname,processCwd:process.cwd(),nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:105',message:'Server initialization started',data:{processCwd:process.cwd(),nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // Initialize MongoDB connection
  try {
    const { connectToMongoDB } = await import("./utils/mongodb");
    await connectToMongoDB();
    console.log("[SERVER] MongoDB initialized successfully");
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:112',message:'MongoDB connection failed',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error("[SERVER] Failed to connect to MongoDB:", error.message);
    console.error("[SERVER] Server will continue but authentication features may not work");
    console.error("[SERVER] Please check:");
    console.error("  1. MongoDB connection string is correct");
    console.error("  2. Network connectivity to MongoDB");
    console.error("  3. MongoDB server is running and accessible");
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Production vs development setup
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:131',message:'Before serveStatic/setupVite branch',data:{nodeEnv:process.env.NODE_ENV,isProduction:process.env.NODE_ENV === "production"},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (process.env.NODE_ENV === "production") {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:134',message:'Calling serveStatic',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    serveStatic(app);
  } else {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:139',message:'Calling setupVite',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ✅ Windows-safe server listen
  const port = parseInt(process.env.PORT || "5000", 10);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:148',message:'Before server.listen',data:{port,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  httpServer.listen(port, () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:152',message:'Server started successfully',data:{port,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    log(`serving on http://localhost:${port}`);
  });

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:158',message:'Server listen error',data:{errorCode:error.code,errorMessage:error.message,port,address:error.address},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (error.code === 'EADDRINUSE') {
      console.error(`[ERROR] Port ${port} is already in use. Please:`);
      console.error(`  1. Stop the other process using port ${port}`);
      console.error(`  2. Or set a different port: PORT=5001 npm run dev`);
      console.error(`  3. Or kill the process: netstat -ano | findstr :${port}`);
    } else {
      console.error(`[ERROR] Server failed to start:`, error);
    }
    process.exit(1);
  });
})();
