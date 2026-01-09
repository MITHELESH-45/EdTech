/**
 * Arduino Upload API Routes
 * 
 * CRITICAL: This backend is MANDATORY for Arduino uploads.
 * Frontend CANNOT directly access USB/Serial ports.
 * 
 * Flow:
 * 1. Receive Arduino C++ code from frontend
 * 2. Save as .ino file in temp directory
 * 3. Use Arduino CLI to compile
 * 4. Use Arduino CLI to upload to connected Arduino
 * 5. Return success/error to frontend
 */

import type { Express, Request, Response } from "express";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const execAsync = promisify(exec);

// Serial monitor state
interface SerialMonitorState {
  port: SerialPort | null;
  parser: ReadlineParser | null;
  isOpen: boolean;
  currentPort: string | null;
}

const serialMonitors = new Map<string, SerialMonitorState>();

// Configuration
interface ArduinoConfig {
  // Fully Qualified Board Name for Arduino Nano
  fqbn: string;
  // Serial port (auto-detected or user-specified)
  port: string;
  // Path to arduino-cli executable
  cliPath: string;
  // Temp directory for sketches
  sketchDir: string;
}

// Try to find Arduino CLI in common locations
async function findArduinoCli(): Promise<string> {
  const possiblePaths = [
    "arduino-cli", // In PATH
    "arduino-cli.exe", // Windows with .exe
  ];

  // Windows common installation paths
  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE || process.env.HOME || "";
    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    
    possiblePaths.push(
      path.join(userProfile, "AppData", "Local", "arduino-cli", "arduino-cli.exe"),
      path.join(localAppData, "arduino-cli", "arduino-cli.exe"),
      path.join(programFiles, "arduino-cli", "arduino-cli.exe"),
      path.join(programFilesX86, "arduino-cli", "arduino-cli.exe"),
      path.join(userProfile, ".arduino15", "packages", "arduino-cli", "arduino-cli.exe"),
    );
  } else {
    // Linux/Mac common paths
    const home = process.env.HOME || "";
    possiblePaths.push(
      path.join(home, ".local", "bin", "arduino-cli"),
      path.join(home, "bin", "arduino-cli"),
      "/usr/local/bin/arduino-cli",
      "/usr/bin/arduino-cli",
    );
  }

  // Test each path
  for (const cliPath of possiblePaths) {
    try {
      await execAsync(`"${cliPath}" version`, { timeout: 5000 });
      console.log(`[Arduino] Found CLI at: ${cliPath}`);
      return cliPath;
    } catch {
      // Try next path
      continue;
    }
  }

  // Default fallback
  return "arduino-cli";
}

// Initialize CLI path
let detectedCliPath = "arduino-cli";
findArduinoCli().then((path) => {
  detectedCliPath = path;
  console.log(`[Arduino] Using CLI path: ${detectedCliPath}`);
}).catch(() => {
  console.warn("[Arduino] Could not auto-detect CLI path, using default");
});

const defaultConfig: ArduinoConfig = {
  fqbn: "arduino:avr:nano",
  port: process.platform === "win32" ? "COM3" : "/dev/ttyUSB0",
  cliPath: detectedCliPath,
  sketchDir: path.join(os.tmpdir(), "egroots-arduino"),
};

// Store current configuration
let config: ArduinoConfig = { ...defaultConfig };

/**
 * Register Arduino routes
 */
export function registerArduinoRoutes(app: Express, httpServer?: HttpServer): void {
  // Setup WebSocket server for serial monitor if httpServer is provided
  let wss: WebSocketServer | null = null;
  if (httpServer) {
    wss = new WebSocketServer({ server: httpServer, path: "/api/arduino/serial-monitor" });
    wss.on("connection", (ws: WebSocket, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const port = url.searchParams.get("port");
      
      if (!port) {
        ws.close(1008, "Port parameter required");
        return;
      }
      
      console.log(`[Serial Monitor] WebSocket connected for port ${port}`);
      
      // Start serial monitor for this connection
      startSerialMonitor(port, 9600, (data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "data", data, timestamp: Date.now() }));
        }
      }, (error: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", error, timestamp: Date.now() }));
        }
      });
      
      ws.on("close", () => {
        console.log(`[Serial Monitor] WebSocket disconnected for port ${port}`);
        stopSerialMonitor(port);
      });
      
      ws.on("error", (error) => {
        console.error(`[Serial Monitor] WebSocket error for port ${port}:`, error);
        stopSerialMonitor(port);
      });
    });
  }
  
  // ==========================================================================
  // GET /api/arduino/status - Check Arduino CLI and connection status
  // ==========================================================================
  app.get("/api/arduino/status", async (_req: Request, res: Response) => {
    try {
      // Re-detect CLI path on each status check
      const cliPath = await findArduinoCli();
      config.cliPath = cliPath;
      
      // Check if Arduino CLI is installed
      const cliInstalled = await checkArduinoCli();
      
      // Get CLI version if available
      let cliVersion = "";
      let cliPathInfo = cliPath;
      if (cliInstalled) {
        try {
          const { stdout } = await execAsync(`"${cliPath}" version`);
          cliVersion = stdout.trim();
        } catch {
          // Ignore
        }
      } else {
        // Try to find where it might be
        cliPathInfo = "Not found in PATH or common locations";
      }
      
      // List connected boards
      const boards = cliInstalled ? await listConnectedBoards() : [];
      
      // Check if cores are installed
      const avrCoreInstalled = cliInstalled ? await checkArduinoCore() : false;
      const esp32CoreInstalled = cliInstalled ? await checkESP32Core() : false;
      
      res.json({
        cliInstalled,
        cliVersion,
        cliPath: cliPathInfo,
        coreInstalled: avrCoreInstalled, // Keep for backward compatibility
        avrCoreInstalled,
        esp32CoreInstalled,
        boards,
        config: {
          fqbn: config.fqbn,
          port: config.port,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to check Arduino status",
        details: error.message,
      });
    }
  });

  // ==========================================================================
  // POST /api/arduino/config - Update Arduino configuration
  // ==========================================================================
  app.post("/api/arduino/config", (req: Request, res: Response) => {
    const { port, fqbn } = req.body;
    
    if (port) {
      config.port = port;
    }
    if (fqbn) {
      config.fqbn = fqbn;
    }
    
    res.json({
      success: true,
      config: {
        fqbn: config.fqbn,
        port: config.port,
      },
    });
  });

  // ==========================================================================
  // GET /api/arduino/ports - List available serial ports
  // ==========================================================================
  app.get("/api/arduino/ports", async (_req: Request, res: Response) => {
    try {
      const ports = await listSerialPorts();
      // Return as array for frontend compatibility
      res.json(ports);
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to list serial ports",
        details: error.message,
      });
    }
  });

  // ==========================================================================
  // POST /api/arduino/upload - Upload Arduino code
  // ==========================================================================
  app.post("/api/arduino/upload", async (req: Request, res: Response) => {
    const { code, port: userPort, board } = req.body;
    
    // Validate request
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'code' in request body",
        details: "Code must be a non-empty string containing valid Arduino C++ code",
      });
    }
    
    // Auto-fix code if setup() or loop() is missing
    let fixedCode = code;
    const hasSetup = code.includes("void setup()");
    const hasLoop = code.includes("void loop()");
    
    if (!hasLoop) {
      return res.status(400).json({
        error: "Invalid Arduino code",
        details: "Code must contain a void loop() function",
      });
    }
    
    // If setup() is missing, add an empty one at the beginning
    if (!hasSetup) {
      // Try to find where to insert setup() - before loop() if it exists
      const loopIndex = fixedCode.indexOf("void loop()");
      if (loopIndex > 0) {
        // Insert setup() before loop()
        fixedCode = fixedCode.substring(0, loopIndex) + 
          "void setup() {\n  // No setup required\n}\n\n" + 
          fixedCode.substring(loopIndex);
      } else {
        // If we can't find loop(), prepend setup() at the beginning
        fixedCode = "void setup() {\n  // No setup required\n}\n\n" + fixedCode;
      }
      console.log("[Arduino] Auto-added missing setup() function");
    }
    
    // Check for Python code (should NEVER be uploaded)
    if (code.includes("import ") || code.includes("def ") || code.includes("print(")) {
      return res.status(400).json({
        error: "Python code detected",
        details: "Only Arduino C++ code can be uploaded. Python is for display only.",
      });
    }
    
    // Board → FQBN mapping (defaults to Arduino Nano)
    const boardFQBN: Record<string, string> = {
      nano: "arduino:avr:nano:cpu=atmega328",
      esp32: "esp32:esp32:esp32",
      esp32wroom32: "esp32:esp32:esp32", // ESP32-WROOM-32 uses same FQBN as ESP32 Dev Module
    };

    const selectedBoard: string = typeof board === "string" && board.length > 0 ? board : "nano";
    const fqbn = boardFQBN[selectedBoard] || boardFQBN.nano;

    // Validate and clean port
    let uploadPort = userPort || config.port;
    if (!uploadPort) {
      return res.status(400).json({
        error: "No serial port specified",
        details: "Please select a COM port from the list or enter one manually",
      });
    }
    
    // Ensure port is uppercase and properly formatted (e.g., COM11)
    uploadPort = uploadPort.trim().toUpperCase();
    if (!uploadPort.match(/^COM\d+$/)) {
      return res.status(400).json({
        error: "Invalid port format",
        details: `Port must be in format COM1, COM2, etc. Got: ${uploadPort}`,
      });
    }
    
      console.log(`[Arduino] Upload request - Board: ${selectedBoard}, FQBN: ${fqbn}, Port: ${uploadPort}`);
    
    try {
      // Step 0: Close any active serial monitor on this port before upload
      if (serialMonitors.has(uploadPort)) {
        console.log(`[Arduino] Closing serial monitor on ${uploadPort} before upload...`);
        stopSerialMonitor(uploadPort);
        // Wait a bit for port to be released
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Step 1: Create sketch directory
      const sketchName = `egroots_sketch_${Date.now()}`;
      const sketchPath = path.join(config.sketchDir, sketchName);
      const inoPath = path.join(sketchPath, `${sketchName}.ino`);
      
      // Create directories
      await fs.promises.mkdir(sketchPath, { recursive: true });
      
      // Step 2: Write the .ino file (use fixed code if setup was auto-added)
      await fs.promises.writeFile(inoPath, fixedCode, "utf8");
      console.log(`[Arduino] Saved sketch to: ${inoPath}`);
      
      // Step 3: Compile the sketch
      console.log(`[Arduino] Compiling sketch for ${selectedBoard} (${fqbn})...`);
      const compileResult = await compileSketch(sketchPath, fqbn);
      
      if (!compileResult.success) {
        return res.status(400).json({
          error: "Compilation failed",
          details: compileResult.error,
          output: compileResult.output,
        });
      }
      
      console.log(`[Arduino] Compilation successful`);
      
      // Step 4: Upload to board
      console.log(`[Arduino] Uploading to port ${uploadPort}...`);
      const uploadResult = await uploadSketch(sketchPath, fqbn, uploadPort);
      
      if (!uploadResult.success) {
        // Extract the actual error from the output if error message is truncated
        let errorDetails = uploadResult.error || "Upload failed";
        let fullOutput = uploadResult.output || "";
        
        // If error seems truncated or is just command output, extract meaningful error
        if (errorDetails.includes("Output:") || errorDetails.length > 500) {
          // Look for actual error messages in the output
          const lines = fullOutput.split('\n');
          for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('error:') || 
                lowerLine.includes('failed:') ||
                lowerLine.includes('cannot') ||
                lowerLine.includes('denied') ||
                (lowerLine.includes('error') && !lowerLine.includes('esptool'))) {
              errorDetails = line.trim();
              break;
            }
          }
          // If still not found, use first non-empty line that looks like an error
          if (errorDetails.includes("Output:")) {
            for (const line of lines) {
              if (line.trim() && !line.includes('esptool') && !line.includes('COM') && line.length < 200) {
                errorDetails = line.trim();
                break;
              }
            }
          }
        }
        
        return res.status(400).json({
          error: "Upload failed",
          details: errorDetails.substring(0, 500), // Limit to 500 chars
          output: fullOutput.substring(0, 1000), // Limit output to 1000 chars for readability
        });
      }
      
      console.log(`[Arduino] Upload successful!`);
      
      // Step 4.5: Wait a bit for port to be fully released after upload
      // Arduino CLI might still have the port open briefly
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 5: Clean up temp files
      try {
        await fs.promises.rm(sketchPath, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      res.json({
        success: true,
        message: `Code uploaded successfully to ${selectedBoard}`,
        port: uploadPort,
        board: selectedBoard,
        fqbn,
      });
      
    } catch (error: any) {
      console.error("[Arduino] Upload error:", error);
      res.status(500).json({
        error: "Upload failed",
        details: error.message,
      });
    }
  });

  // ==========================================================================
  // POST /api/arduino/compile - Compile only (no upload)
  // ==========================================================================
  app.post("/api/arduino/compile", async (req: Request, res: Response) => {
    const { code } = req.body;
    
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'code' in request body",
      });
    }
    
    try {
      const sketchName = `egroots_compile_${Date.now()}`;
      const sketchPath = path.join(config.sketchDir, sketchName);
      const inoPath = path.join(sketchPath, `${sketchName}.ino`);
      
      await fs.promises.mkdir(sketchPath, { recursive: true });
      await fs.promises.writeFile(inoPath, code, "utf8");
      
      const result = await compileSketch(sketchPath, config.fqbn);
      
      // Clean up
      try {
        await fs.promises.rm(sketchPath, { recursive: true, force: true });
      } catch (e) {}
      
      if (result.success) {
        res.json({
          success: true,
          message: "Compilation successful",
          output: result.output,
        });
      } else {
        res.status(400).json({
          error: "Compilation failed",
          details: result.error,
          output: result.output,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: "Compilation failed",
        details: error.message,
      });
    }
  });

  // ==========================================================================
  // POST /api/arduino/install-core - Install Arduino AVR or ESP32 core
  // ==========================================================================
  app.post("/api/arduino/install-core", async (req: Request, res: Response) => {
    const { core } = req.body; // "avr" or "esp32"
    const coreToInstall = core === "esp32" ? "esp32:esp32" : "arduino:avr";
    const coreName = core === "esp32" ? "ESP32" : "Arduino AVR";
    
    try {
      console.log(`[Arduino] Installing ${coreName} core...`);
      const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
      const { stdout, stderr } = await execAsync(
        `${cmd} core install ${coreToInstall}`,
        { timeout: 300000 } // 5 minutes for ESP32 (it's large)
      );
      
      res.json({
        success: true,
        message: `${coreName} core installed successfully`,
        output: stdout || stderr,
      });
    } catch (error: any) {
      res.status(500).json({
        error: `Failed to install ${coreName} core`,
        details: error.message,
      });
    }
  });

  // ==========================================================================
  // POST /api/arduino/serial-monitor/start - Start serial monitor
  // ==========================================================================
  app.post("/api/arduino/serial-monitor/start", async (req: Request, res: Response) => {
    const { port, baudRate = 9600 } = req.body;
    
    if (!port || typeof port !== "string") {
      return res.status(400).json({
        error: "Port is required",
        details: "Please provide a valid COM port (e.g., COM10, COM11)",
      });
    }
    
    const portFormatted = port.trim().toUpperCase();
    
    try {
      // Check if already open
      if (serialMonitors.has(portFormatted) && serialMonitors.get(portFormatted)?.isOpen) {
        return res.json({
          success: true,
          message: `Serial monitor already running on ${portFormatted}`,
        });
      }
      
      // Start serial monitor
      const success = await startSerialMonitor(portFormatted, baudRate);
      
      if (success) {
        res.json({
          success: true,
          message: `Serial monitor started on ${portFormatted} at ${baudRate} baud`,
        });
      } else {
        res.status(500).json({
          error: "Failed to start serial monitor",
          details: `Could not open port ${portFormatted}. Make sure the port is available and not in use by another program.`,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to start serial monitor",
        details: error.message,
      });
    }
  });

  // ==========================================================================
  // POST /api/arduino/serial-monitor/stop - Stop serial monitor
  // ==========================================================================
  app.post("/api/arduino/serial-monitor/stop", async (req: Request, res: Response) => {
    const { port } = req.body;
    
    if (!port || typeof port !== "string") {
      return res.status(400).json({
        error: "Port is required",
      });
    }
    
    const portFormatted = port.trim().toUpperCase();
    stopSerialMonitor(portFormatted);
    
    res.json({
      success: true,
      message: `Serial monitor stopped on ${portFormatted}`,
    });
  });

  // ==========================================================================
  // GET /api/arduino/serial-monitor/status - Get serial monitor status
  // ==========================================================================
  app.get("/api/arduino/serial-monitor/status", async (req: Request, res: Response) => {
    const port = req.query.port as string;
    
    if (port) {
      const portFormatted = port.trim().toUpperCase();
      const monitor = serialMonitors.get(portFormatted);
      res.json({
        isOpen: monitor?.isOpen || false,
        port: portFormatted,
      });
    } else {
      // Return all active monitors
      const activeMonitors = Array.from(serialMonitors.entries())
        .filter(([_, state]) => state.isOpen)
        .map(([port, _]) => port);
      res.json({
        activePorts: activeMonitors,
      });
    }
  });
}

// =============================================================================
// SERIAL MONITOR FUNCTIONS
// =============================================================================

/**
 * Start serial monitor for a port
 */
async function startSerialMonitor(
  port: string,
  baudRate: number = 9600,
  onData?: (data: string) => void,
  onError?: (error: string) => void
): Promise<boolean> {
  try {
    // Close existing monitor if any
    if (serialMonitors.has(port)) {
      stopSerialMonitor(port);
      // Wait for port to be released
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Retry logic for "Access denied" errors (port might be busy)
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        const serialPort = new SerialPort({
          path: port,
          baudRate: baudRate,
          autoOpen: false,
        });
        
        const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));
        
        const state: SerialMonitorState = {
          port: serialPort,
          parser: parser,
          isOpen: false,
          currentPort: port,
        };
        
        serialPort.on("open", () => {
          console.log(`[Serial Monitor] Opened ${port} at ${baudRate} baud`);
          state.isOpen = true;
        });
        
        parser.on("data", (data: string) => {
          const dataStr = data.toString().trim();
          if (dataStr) {
            console.log(`[Serial Monitor ${port}]`, dataStr);
            if (onData) {
              onData(dataStr);
            }
          }
        });
        
        serialPort.on("error", (error) => {
          console.error(`[Serial Monitor ${port}] Error:`, error);
          if (onError) {
            onError(error.message);
          }
          state.isOpen = false;
        });
        
        serialPort.on("close", () => {
          console.log(`[Serial Monitor] Closed ${port}`);
          state.isOpen = false;
          serialMonitors.delete(port);
        });
        
        serialMonitors.set(port, state);
        
        // Try to open with timeout
        const openResult = await new Promise<boolean>((resolve) => {
          const openTimeout = setTimeout(() => {
            if (!state.isOpen) {
              serialPort.close();
              serialMonitors.delete(port);
              const errorMsg = `Timeout opening ${port}. Port may be in use.`;
              console.error(`[Serial Monitor] ${errorMsg}`);
              if (onError) {
                onError(errorMsg);
              }
              resolve(false);
            }
          }, 3000);
          
          serialPort.open((err) => {
            clearTimeout(openTimeout);
            if (err) {
              lastError = err;
              serialMonitors.delete(port);
              resolve(false);
            } else {
              // Successfully opened
              resolve(true);
            }
          });
        });
        
        if (openResult) {
          return true; // Successfully opened
        }
        
        // If failed and we have retries, wait and retry
        if (lastError && (lastError.message.includes("Access denied") || lastError.message.includes("cannot open")) && retries > 1) {
          retries--;
          console.log(`[Serial Monitor] Port ${port} busy, retrying in 1 second... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue; // Retry
        } else {
          // Failed and no more retries or different error
          if (lastError && onError) {
            onError(lastError.message);
          }
          return false;
        }
      } catch (error: any) {
        lastError = error;
        if (retries > 1 && (error.message.includes("Access denied") || error.message.includes("cannot open"))) {
          retries--;
          console.log(`[Serial Monitor] Port ${port} busy, retrying in 1 second... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue; // Retry
        } else {
          throw error;
        }
      }
    }
    
    // All retries failed
    const errorMsg = lastError?.message || `Failed to open ${port} after 3 retries`;
    console.error(`[Serial Monitor] ${errorMsg}`);
    if (onError) {
      onError(errorMsg);
    }
    return false;
  } catch (error: any) {
    console.error(`[Serial Monitor] Failed to start on ${port}:`, error);
    if (onError) {
      onError(error.message);
    }
    return false;
  }
}

/**
 * Stop serial monitor for a port
 */
function stopSerialMonitor(port: string): void {
  const monitor = serialMonitors.get(port);
  if (monitor && monitor.port) {
    try {
      if (monitor.port.isOpen) {
        monitor.port.close();
      }
    } catch (error) {
      console.error(`[Serial Monitor] Error closing ${port}:`, error);
    }
    serialMonitors.delete(port);
    console.log(`[Serial Monitor] Stopped ${port}`);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if Arduino CLI is installed
 */
async function checkArduinoCli(): Promise<boolean> {
  try {
    // Use quotes for Windows paths with spaces
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    await execAsync(`${cmd} version`, { timeout: 5000 });
    return true;
  } catch (error: any) {
    console.log(`[Arduino] CLI check failed: ${error.message}`);
    // Try to re-detect
    const newPath = await findArduinoCli();
    if (newPath !== config.cliPath) {
      config.cliPath = newPath;
      try {
        const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
        await execAsync(`${cmd} version`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Check if Arduino AVR core is installed
 */
async function checkArduinoCore(): Promise<boolean> {
  try {
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    const { stdout } = await execAsync(`${cmd} core list`, { timeout: 10000 });
    return stdout.includes("arduino:avr");
  } catch {
    return false;
  }
}

/**
 * Check if ESP32 core is installed
 */
async function checkESP32Core(): Promise<boolean> {
  try {
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    const { stdout } = await execAsync(`${cmd} core list`, { timeout: 10000 });
    // Check for esp32:esp32 in the output (case-insensitive)
    const output = stdout.toLowerCase();
    return output.includes("esp32:esp32") || output.includes("esp32");
  } catch (error: any) {
    console.error("[Arduino] Failed to check ESP32 core:", error.message);
    return false;
  }
}

/**
 * List connected Arduino boards
 */
async function listConnectedBoards(): Promise<Array<{ port: string; board: string }>> {
  try {
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    const { stdout } = await execAsync(`${cmd} board list --format json`, { timeout: 10000 });
    const data = JSON.parse(stdout);
    
    if (Array.isArray(data)) {
      return data
        .filter((item: any) => item.matching_boards && item.matching_boards.length > 0)
        .map((item: any) => ({
          port: item.port?.address || item.address || "unknown",
          board: item.matching_boards?.[0]?.name || "Unknown Board",
        }));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * List all serial ports
 * Enhanced to detect all COM ports on Windows, including COM11+
 */
async function listSerialPorts(): Promise<string[]> {
  const ports: string[] = [];
  
  try {
    // Try Arduino CLI first (most accurate)
    const { stdout } = await execAsync(`${config.cliPath} board list --format json`);
    const data = JSON.parse(stdout);
    
    if (Array.isArray(data)) {
      const cliPorts = data
        .map((item: any) => item.port?.address || item.address)
        .filter(Boolean);
      ports.push(...cliPorts);
    }
  } catch (error) {
    // Arduino CLI not available or failed - use fallback detection
    console.log("[Arduino] CLI port detection failed, using fallback");
  }
  
  // Fallback: Detect all COM ports on Windows
  if (process.platform === "win32") {
    try {
      // Use PowerShell to list all COM ports
      const { stdout } = await execAsync(
        'powershell -Command "Get-WmiObject Win32_SerialPort | Select-Object -ExpandProperty DeviceID"'
      );
      const comPorts = stdout
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.startsWith('COM') && line.length > 3);
      
      // Add all detected COM ports
      for (const port of comPorts) {
        if (!ports.includes(port)) {
          ports.push(port);
        }
      }
      
      // Also add common COM ports if none found
      if (ports.length === 0) {
        for (let i = 1; i <= 20; i++) {
          ports.push(`COM${i}`);
        }
      }
    } catch (error) {
      // PowerShell failed - generate common COM ports
      for (let i = 1; i <= 20; i++) {
        ports.push(`COM${i}`);
      }
    }
  } else {
    // Linux/Mac: try common device paths
    const commonPorts = [
      "/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyUSB2",
      "/dev/ttyACM0", "/dev/ttyACM1", "/dev/ttyACM2",
      "/dev/tty.usbserial", "/dev/tty.usbmodem",
    ];
    ports.push(...commonPorts);
  }
  
  // Remove duplicates and sort
  return Array.from(new Set(ports)).sort();
}

/**
 * Compile Arduino sketch
 */
async function compileSketch(
  sketchPath: string,
  fqbn: string
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    // Re-detect CLI path before compiling
    const cliPath = await findArduinoCli();
    config.cliPath = cliPath;
    
    // Check if Arduino CLI is available
    const cmdCheck = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    try {
      await execAsync(`${cmdCheck} version`, { timeout: 5000 });
    } catch (error: any) {
      return {
        success: false,
        output: "",
        error: `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`,
      };
    }
    
    // For ESP32, we might need to add verbose output to see actual errors
    const verboseFlag = fqbn.includes("esp32") ? "--verbose" : "";
    const cmd = `${cmdCheck} compile ${verboseFlag} --fqbn ${fqbn} "${sketchPath}"`.trim();
    console.log(`[Arduino] Running: ${cmd}`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 180000, // 3 minute timeout for ESP32 (compilation takes longer)
    });
    
    // Check if compilation actually succeeded (ESP32 sometimes outputs warnings to stderr)
    const output = stdout + (stderr ? `\n${stderr}` : "");
    const hasError = output.toLowerCase().includes("error") || 
                     output.toLowerCase().includes("failed") ||
                     (stderr && !stderr.toLowerCase().includes("warning"));
    
    if (hasError && !output.toLowerCase().includes("sketch uses")) {
      return {
        success: false,
        output: output,
        error: `Compilation failed. Check the output for details.\n\n${output}`,
      };
    }
    
    return {
      success: true,
      output: output,
    };
  } catch (error: any) {
    let errorMessage = error.stderr || error.message || "Unknown error";
    const errorOutput = error.stdout || "";
    
    // Check if it's a core not found error
    if (errorMessage.includes("platform") && errorMessage.includes("not found")) {
      const isESP32 = fqbn.includes("esp32");
      errorMessage = `${isESP32 ? "ESP32" : "Arduino"} core not found.\n\nPlease install the core:\narduino-cli core install ${isESP32 ? "esp32:esp32" : "arduino:avr"}\n\nThen restart the server.`;
    }
    // Check if it's a CLI not found error
    else if (errorMessage.includes("not recognized") || errorMessage.includes("not found") || errorMessage.includes("command not found")) {
      errorMessage = `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`;
    }
    
    // Extract more detailed error information
    const stderrOutput = error.stderr || "";
    const stdoutOutput = error.stdout || "";
    const combinedOutput = (stdoutOutput + "\n" + stderrOutput).trim();
    
    // If error message is generic or truncated, try to get more details from output
    if ((errorMessage === "Unknown error" || errorMessage.length > 500) && combinedOutput) {
      // Look for the actual error in the output (skip command lines)
      const lines = combinedOutput.split('\n');
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if ((lowerLine.includes('error') || 
             lowerLine.includes('failed') ||
             lowerLine.includes('denied') ||
             lowerLine.includes('cannot')) &&
            !lowerLine.includes('esptool') &&
            !lowerLine.includes('arduino-cli') &&
            line.length < 300) {
          errorMessage = line.trim();
          break;
        }
      }
    }
    
    return {
      success: false,
      output: combinedOutput.substring(0, 1000) || stdoutOutput.substring(0, 1000),
      error: errorMessage.substring(0, 500),
    };
  }
}

/**
 * Upload Arduino sketch
 */
async function uploadSketch(
  sketchPath: string,
  fqbn: string,
  port: string
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    // Re-detect CLI path before uploading
    const cliPath = await findArduinoCli();
    config.cliPath = cliPath;
    
    // Check if Arduino CLI is available
    const cmdCheck = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    try {
      await execAsync(`${cmdCheck} version`, { timeout: 5000 });
    } catch (error: any) {
      return {
        success: false,
        output: "",
        error: `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`,
      };
    }
    
    // For Arduino Nano, try new bootloader first
    let actualFqbn = fqbn;
    if (fqbn === "arduino:avr:nano") {
      // Try with new bootloader first
      actualFqbn = "arduino:avr:nano:cpu=atmega328";
    }
    
    // For ESP32, increase timeout and add verbose flag for better error messages
    const isESP32 = actualFqbn.includes("esp32");
    const verboseFlag = isESP32 ? "--verbose" : "";
    const timeout = isESP32 ? 180000 : 120000; // 3 minutes for ESP32, 2 for others
    
    // Ensure port is properly formatted (uppercase, no spaces)
    const portFormatted = port.trim().toUpperCase();
    
    const cmd = `${cmdCheck} upload ${verboseFlag} -p ${portFormatted} --fqbn ${actualFqbn} "${sketchPath}"`.trim();
    console.log(`[Arduino] Running upload command: ${cmd}`);
    console.log(`[Arduino] Port: ${portFormatted}, FQBN: ${actualFqbn}, ESP32: ${isESP32}`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: timeout,
    });
    
    return {
      success: true,
      output: stdout + (stderr ? `\n${stderr}` : ""),
    };
  } catch (error: any) {
    let errorMessage = error.stderr || error.message || "Unknown error";
    const errorOutput = error.stdout || "";
    const isESP32 = fqbn.includes("esp32");
    
    // Check if it's a CLI not found error
    if (errorMessage.includes("not recognized") || errorMessage.includes("not found") || errorMessage.includes("command not found")) {
      errorMessage = `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`;
    }
    // ESP32-specific error handling
    else if (isESP32) {
      if (errorMessage.includes("Connecting") && errorMessage.includes("timed out") || errorMessage.includes("timeout")) {
        errorMessage = `ESP32 upload failed: Could not connect to board.\n\nTroubleshooting:\n1. Hold the BOOT button on your ESP32\n2. Press and release the RESET button (while holding BOOT)\n3. Release the BOOT button\n4. Try uploading again\n\nOr check:\n- Is the correct COM port selected?\n- Are the USB drivers installed?\n- Is another program using the serial port?`;
      } else if (errorMessage.includes("A fatal error occurred") || errorMessage.includes("Failed to connect")) {
        errorMessage = `ESP32 upload failed: Connection error.\n\n${errorMessage}\n\nTry:\n1. Put ESP32 in bootloader mode (hold BOOT, press RESET, release BOOT)\n2. Check COM port selection\n3. Close other programs using the serial port`;
      } else if (errorMessage.includes("Permission denied") || errorMessage.includes("Access is denied")) {
        errorMessage = `ESP32 upload failed: Port access denied.\n\nClose other programs using COM${port} and try again.`;
      }
    }
    
    // If new bootloader fails, try old bootloader (Arduino Nano only)
    if (!isESP32 && (error.message.includes("programmer") || error.message.includes("sync"))) {
      try {
        const cmdCheck = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
        const cmd = `${cmdCheck} upload -p ${port} --fqbn arduino:avr:nano:cpu=atmega328old "${sketchPath}"`;
        console.log(`[Arduino] Retrying with old bootloader: ${cmd}`);
        
        const { stdout, stderr } = await execAsync(cmd, {
          timeout: 120000,
        });
        
        return {
          success: true,
          output: stdout + (stderr ? `\n${stderr}` : ""),
        };
      } catch (retryError: any) {
        return {
          success: false,
          output: retryError.stdout || "",
          error: retryError.stderr || retryError.message,
        };
      }
    }
    
    // Extract more detailed error information
    const stderrOutput = error.stderr || "";
    const stdoutOutput = error.stdout || "";
    const combinedOutput = (stdoutOutput + "\n" + stderrOutput).trim();
    
    // If error message is generic or truncated, try to get more details from output
    if ((errorMessage === "Unknown error" || errorMessage.length > 500) && combinedOutput) {
      // Look for the actual error in the output (skip command lines)
      const lines = combinedOutput.split('\n');
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if ((lowerLine.includes('error') || 
             lowerLine.includes('failed') ||
             lowerLine.includes('denied') ||
             lowerLine.includes('cannot')) &&
            !lowerLine.includes('esptool') &&
            !lowerLine.includes('arduino-cli') &&
            line.length < 300) {
          errorMessage = line.trim();
          break;
        }
      }
    }
    
    return {
      success: false,
      output: combinedOutput.substring(0, 1000) || stdoutOutput.substring(0, 1000),
      error: errorMessage.substring(0, 500),
    };
  }
}

