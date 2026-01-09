import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/static.ts:6',message:'serveStatic entry',data:{__dirname:typeof __dirname !== 'undefined' ? __dirname : 'UNDEFINED',processCwd:process.cwd(),nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // Resolve dist path - in production build, __dirname will be 'dist', in ESM it might be undefined
  const baseDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), "dist");
  const distPath = path.resolve(baseDir, "public");
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/static.ts:7',message:'distPath resolved',data:{distPath,exists:fs.existsSync(distPath)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (!fs.existsSync(distPath)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/static.ts:9',message:'distPath does not exist - ERROR',data:{distPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
