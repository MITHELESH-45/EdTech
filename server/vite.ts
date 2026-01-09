import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  console.log('[DEBUG] setupVite entry - process.cwd():', process.cwd());
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:11',message:'setupVite entry',data:{processCwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };
  console.log('[DEBUG] Before createViteServer - viteConfig keys:', Object.keys(viteConfig));
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:18',message:'Before createViteServer',data:{viteConfigKeys:Object.keys(viteConfig)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  let vite;
  try {
    console.log('[DEBUG] Starting createViteServer...');
    vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:25',message:'Vite error logger called',data:{msg:typeof msg === 'string' ? msg : JSON.stringify(msg)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });
    console.log('[DEBUG] createViteServer succeeded');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:35',message:'createViteServer succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (error: any) {
    console.error('[DEBUG] createViteServer failed:', error.message);
    console.error('[DEBUG] Error stack:', error.stack);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:38',message:'createViteServer failed',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw error;
  }

  app.use(vite.middlewares);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:43',message:'Vite middlewares registered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Resolve client template from project root
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:38',message:'Before clientTemplate resolution',data:{processCwd:process.cwd(),url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html",
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:44',message:'clientTemplate resolved',data:{clientTemplate,exists:fs.existsSync(clientTemplate)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0c91fee-2e5b-4e6e-b5de-b4fb82a62f59',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:54',message:'Error in vite setup',data:{errorMessage:(e as Error).message,errorStack:(e as Error).stack,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}