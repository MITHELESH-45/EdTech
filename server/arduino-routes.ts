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
  // Path to PlatformIO CLI executable
  platformioPath: string;
  // Temp directory for sketches
  sketchDir: string;
}

// Try to find PlatformIO CLI in common locations
async function findPlatformIO(): Promise<string> {
  const possiblePaths = [
    "pio", // In PATH
    "platformio", // Alternative command name
    "pio.exe", // Windows with .exe
    "platformio.exe", // Windows with .exe
  ];

  // Windows common installation paths
  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE || process.env.HOME || "";
    const localAppData = process.env.LOCALAPPDATA || "";
    const pythonUserBase = process.env.PYTHONUSERBASE || path.join(userProfile, "AppData", "Roaming", "Python");
    
    possiblePaths.push(
      path.join(userProfile, ".platformio", "penv", "Scripts", "platformio.exe"),
      path.join(localAppData, "platformio", "platformio.exe"),
      path.join(pythonUserBase, "Scripts", "platformio.exe"),
      path.join(pythonUserBase, "Scripts", "pio.exe"),
    );
  } else {
    // Linux/Mac common paths
    const home = process.env.HOME || "";
    possiblePaths.push(
      path.join(home, ".platformio", "penv", "bin", "platformio"),
      path.join(home, ".platformio", "penv", "bin", "pio"),
      path.join(home, ".local", "bin", "platformio"),
      path.join(home, ".local", "bin", "pio"),
      path.join(home, "bin", "platformio"),
      path.join(home, "bin", "pio"),
      "/usr/local/bin/platformio",
      "/usr/local/bin/pio",
      "/usr/bin/platformio",
      "/usr/bin/pio",
    );
  }

  // Test each path
  for (const cliPath of possiblePaths) {
    try {
      await execAsync(`"${cliPath}" --version`, { timeout: 5000 });
      console.log(`[PlatformIO] Found CLI at: ${cliPath}`);
      return cliPath;
    } catch {
      // Try next path
      continue;
    }
  }

  // Default fallback
  return "pio";
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

// Initialize CLI paths
let detectedCliPath = "arduino-cli";
let detectedPlatformIOPath = "pio";

findArduinoCli().then((path) => {
  detectedCliPath = path;
  console.log(`[Arduino] Using CLI path: ${detectedCliPath}`);
}).catch(() => {
  console.warn("[Arduino] Could not auto-detect CLI path, using default");
});

findPlatformIO().then((path) => {
  detectedPlatformIOPath = path;
  console.log(`[PlatformIO] Using CLI path: ${detectedPlatformIOPath}`);
}).catch(() => {
  console.warn("[PlatformIO] Could not auto-detect PlatformIO path, using default");
});

const defaultConfig: ArduinoConfig = {
  fqbn: "arduino:avr:nano",
  port: process.platform === "win32" ? "COM3" : "/dev/ttyUSB0",
  cliPath: detectedCliPath,
  platformioPath: detectedPlatformIOPath,
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
      // Re-detect CLI path on each status check to ensure consistency
      const cliPath = await findArduinoCli();
      config.cliPath = cliPath;
      
      // Check if Arduino CLI is installed (this also updates config.cliPath if needed)
      const cliInstalled = await checkArduinoCli();
      
      // Ensure CLI path is set correctly after check
      if (cliInstalled) {
        // Verify CLI path is correct by testing it
        const verifyPath = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
        try {
          await execAsync(`${verifyPath} version`, { timeout: 5000 });
        } catch {
          // If verification fails, try to find CLI again
          const newPath = await findArduinoCli();
          config.cliPath = newPath;
        }
      }
      
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
      
      // Check if PlatformIO is installed
      const platformioInstalled = await checkPlatformIO();
      let platformioVersion = "";
      let platformioPathInfo = config.platformioPath;
      if (platformioInstalled) {
        try {
          const { stdout } = await execAsync(`"${config.platformioPath}" --version`, { timeout: 5000 });
          platformioVersion = stdout.trim();
        } catch {
          // Ignore
        }
      } else {
        platformioPathInfo = "Not found in PATH or common locations";
      }
      
      // Check if cores are installed (only if CLI is installed)
      // These functions now verify CLI path internally, so we get consistent results
      let avrCoreInstalled = false;
      let esp32CoreInstalled = false;
      
      if (cliInstalled) {
        // Re-verify CLI path is correct before checking cores (ensure consistency)
        const verifyPath = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
        try {
          await execAsync(`${verifyPath} version`, { timeout: 5000 });
          // CLI path is valid, proceed with core checks
          avrCoreInstalled = await checkArduinoCore();
          esp32CoreInstalled = await checkESP32Core();
          // Update cliPathInfo with actual verified path
          cliPathInfo = config.cliPath;
        } catch (verifyError: any) {
          console.error("[Arduino] CLI path verification failed in status check:", verifyError.message);
          // CLI path might have changed, try to re-detect
          const newPath = await findArduinoCli();
          if (newPath !== config.cliPath) {
            config.cliPath = newPath;
            cliPathInfo = newPath;
            // Retry core checks with new path
            try {
              await execAsync(`${config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath} version`, { timeout: 5000 });
              avrCoreInstalled = await checkArduinoCore();
              esp32CoreInstalled = await checkESP32Core();
            } catch {
              // If still fails, cores are not installed
              avrCoreInstalled = false;
              esp32CoreInstalled = false;
            }
          }
        }
      }
      
      res.json({
        cliInstalled,
        cliVersion,
        cliPath: cliPathInfo,
        platformioInstalled,
        platformioVersion,
        platformioPath: platformioPathInfo,
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
  // Returns ports with connected boards prioritized first
  // ==========================================================================
  app.get("/api/arduino/ports", async (_req: Request, res: Response) => {
    try {
      // Get connected boards first (these are actual Arduino/ESP32 devices)
      const connectedBoards = await listConnectedBoards();
      const connectedPorts = connectedBoards.map(b => b.port).filter(Boolean);
      
      // Get all serial ports
      const allPorts = await listSerialPorts();
      
      // Prioritize: connected boards first, then other ports
      const prioritizedPorts: string[] = [];
      
      // Add connected ports first
      for (const port of connectedPorts) {
        if (!prioritizedPorts.includes(port)) {
          prioritizedPorts.push(port);
        }
      }
      
      // Add remaining ports
      for (const port of allPorts) {
        if (!prioritizedPorts.includes(port)) {
          prioritizedPorts.push(port);
        }
      }
      
      // If no ports found, still return empty array (don't add dummy ports)
      // Return with metadata about which ports are connected
      res.json({
        ports: prioritizedPorts.length > 0 ? prioritizedPorts : allPorts,
        connectedBoards: connectedBoards,
        recommendedPort: connectedPorts.length > 0 ? connectedPorts[0] : (allPorts.length > 0 ? allPorts[0] : null),
      });
    } catch (error: any) {
      console.error("[Arduino] Error listing ports:", error);
      res.status(500).json({
        error: "Failed to list serial ports",
        details: error.message,
        ports: [], // Return empty array on error
        recommendedPort: null,
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
    
    // Check if PlatformIO is available first (preferred method)
    const platformioInstalled = await checkPlatformIO();
    const usePlatformIO = platformioInstalled && req.query.method !== "arduino-cli";
    
    if (usePlatformIO) {
      console.log(`[PlatformIO] Using PlatformIO for upload (preferred method)`);
      // Redirect to PlatformIO upload logic (inline implementation)
      try {
        // Close any active serial monitor on this port before upload
        if (serialMonitors.has(uploadPort)) {
          console.log(`[PlatformIO] Closing serial monitor on ${uploadPort} before upload...`);
          stopSerialMonitor(uploadPort);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Create sketch directory
        const sketchName = `pio_sketch_${Date.now()}`;
        const sketchPath = path.join(config.sketchDir, sketchName);
        const srcDir = path.join(sketchPath, "src");
        const inoPath = path.join(srcDir, "main.cpp");
        
        // Create directories
        await fs.promises.mkdir(srcDir, { recursive: true });
        
        // Convert Arduino .ino code to C++ (add Arduino.h if needed)
        let cppCode = fixedCode;
        if (!cppCode.includes("#include") && !cppCode.includes("Arduino.h")) {
          cppCode = "#include <Arduino.h>\n\n" + cppCode;
        }
        
        await fs.promises.writeFile(inoPath, cppCode, "utf8");
        console.log(`[PlatformIO] Saved sketch to: ${inoPath}`);
        
        // Compile using PlatformIO
        const compileResult = await compileWithPlatformIO(sketchPath, selectedBoard);
        
        if (!compileResult.success) {
          try {
            await fs.promises.rm(sketchPath, { recursive: true, force: true });
          } catch {}
          return res.status(400).json({
            error: "Compilation failed (PlatformIO)",
            details: compileResult.error,
            output: compileResult.output,
          });
        }
        
        // Upload using PlatformIO
        const uploadResult = await uploadWithPlatformIO(sketchPath, selectedBoard, uploadPort);
        
        // Cleanup
        try {
          await fs.promises.rm(sketchPath, { recursive: true, force: true });
        } catch {}
        
        if (!uploadResult.success) {
          return res.status(400).json({
            error: "Upload failed (PlatformIO)",
            details: uploadResult.error,
            output: uploadResult.output,
          });
        }
        
        return res.json({
          success: true,
          message: `Code uploaded successfully to ${selectedBoard} using PlatformIO`,
          port: uploadPort,
          board: selectedBoard,
          method: "platformio",
        });
      } catch (error: any) {
        console.error("[PlatformIO] Upload error:", error);
        // Fall through to Arduino CLI if PlatformIO fails
        console.log("[PlatformIO] Upload failed, falling back to Arduino CLI...");
      }
    }
    
    // Fall back to Arduino CLI
    console.log(`[Arduino] Using Arduino CLI for upload${usePlatformIO ? " (PlatformIO fallback)" : ""}`);
    
    // Check if required core is installed before attempting upload
    const isESP32 = fqbn.includes("esp32");
    const isAVR = fqbn.includes("arduino:avr");
    
    try {
      // Re-detect CLI path before checking cores
      const cliPath = await findArduinoCli();
      config.cliPath = cliPath;
      
      // Check if Arduino CLI is available
      const cliInstalled = await checkArduinoCli();
      if (!cliInstalled) {
        return res.status(400).json({
          error: "No upload tool available",
          details: `Neither PlatformIO nor Arduino CLI is installed.\n\nPlease install one of:\n• PlatformIO: pip install platformio\n• Arduino CLI: choco install arduino-cli\n\nOr visit:\n• PlatformIO: https://platformio.org/install/cli\n• Arduino CLI: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`,
        });
      }
      
      // Check if required core is installed
      if (isESP32) {
        const esp32CoreInstalled = await checkESP32Core();
        if (!esp32CoreInstalled) {
          return res.status(400).json({
            error: "ESP32 core not installed",
            details: `The ESP32 core is required but not installed.\n\nPlease install it using the "Install" button next to "ESP32 Core" in the upload panel, or run:\narduino-cli core install esp32:esp32\n\nAfter installation, try uploading again.`,
            requiresCoreInstall: true,
            coreType: "esp32",
          });
        }
      } else if (isAVR) {
        const avrCoreInstalled = await checkArduinoCore();
        if (!avrCoreInstalled) {
          return res.status(400).json({
            error: "Arduino AVR core not installed",
            details: `The Arduino AVR core is required but not installed.\n\nPlease install it using the "Install" button next to "AVR Core" in the upload panel, or run:\narduino-cli core install arduino:avr\n\nAfter installation, try uploading again.`,
            requiresCoreInstall: true,
            coreType: "avr",
          });
        }
      }
      
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
  // POST /api/arduino/upload-platformio - Upload using PlatformIO CLI (alternative method)
  // ==========================================================================
  app.post("/api/arduino/upload-platformio", async (req: Request, res: Response) => {
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
    
    if (!hasSetup) {
      const loopIndex = fixedCode.indexOf("void loop()");
      if (loopIndex > 0) {
        fixedCode = fixedCode.substring(0, loopIndex) + 
          "void setup() {\n  // No setup required\n}\n\n" + 
          fixedCode.substring(loopIndex);
      } else {
        fixedCode = "void setup() {\n  // No setup required\n}\n\n" + fixedCode;
      }
      console.log("[PlatformIO] Auto-added missing setup() function");
    }
    
    // Check for Python code
    if (code.includes("import ") || code.includes("def ") || code.includes("print(")) {
      return res.status(400).json({
        error: "Python code detected",
        details: "Only Arduino C++ code can be uploaded. Python is for display only.",
      });
    }
    
    // Board mapping
    const selectedBoard: string = typeof board === "string" && board.length > 0 ? board : "nano";
    const supportedBoards = ["nano", "esp32", "esp32wroom32"];
    
    if (!supportedBoards.includes(selectedBoard.toLowerCase())) {
      return res.status(400).json({
        error: "Unsupported board for PlatformIO",
        details: `Board "${selectedBoard}" not supported. Supported boards: ${supportedBoards.join(", ")}`,
      });
    }
    
    // Validate and clean port
    let uploadPort = userPort || config.port;
    if (!uploadPort) {
      return res.status(400).json({
        error: "No serial port specified",
        details: "Please select a COM port from the list or enter one manually",
      });
    }
    
    uploadPort = uploadPort.trim().toUpperCase();
    if (!uploadPort.match(/^COM\d+$/)) {
      return res.status(400).json({
        error: "Invalid port format",
        details: `Port must be in format COM1, COM2, etc. Got: ${uploadPort}`,
      });
    }
    
    console.log(`[PlatformIO] Upload request - Board: ${selectedBoard}, Port: ${uploadPort}`);
    
    try {
      // Check if PlatformIO CLI is installed
      const platformioInstalled = await checkPlatformIO();
      if (!platformioInstalled) {
        return res.status(400).json({
          error: "PlatformIO CLI not found",
          details: `PlatformIO CLI is not installed or not found in PATH.\n\nPlease install PlatformIO CLI:\n• Windows: pip install platformio\n• Linux/Mac: pip3 install platformio\n• Or visit: https://platformio.org/install/cli\n\nAfter installation, restart the server.`,
        });
      }
      
      // Step 0: Close any active serial monitor on this port before upload
      if (serialMonitors.has(uploadPort)) {
        console.log(`[PlatformIO] Closing serial monitor on ${uploadPort} before upload...`);
        stopSerialMonitor(uploadPort);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Step 1: Create sketch directory
      const sketchName = `pio_sketch_${Date.now()}`;
      const sketchPath = path.join(config.sketchDir, sketchName);
      const srcDir = path.join(sketchPath, "src");
      const inoPath = path.join(srcDir, "main.cpp");
      
      // Create directories
      await fs.promises.mkdir(srcDir, { recursive: true });
      
      // Step 2: Write the code file (PlatformIO uses main.cpp instead of .ino)
      // Convert Arduino .ino code to C++ (add Arduino.h if needed)
      let cppCode = fixedCode;
      if (!cppCode.includes("#include") && !cppCode.includes("Arduino.h")) {
        cppCode = "#include <Arduino.h>\n\n" + cppCode;
      }
      
      await fs.promises.writeFile(inoPath, cppCode, "utf8");
      console.log(`[PlatformIO] Saved sketch to: ${inoPath}`);
      
      // Step 3: Compile the sketch using PlatformIO
      console.log(`[PlatformIO] Compiling sketch for ${selectedBoard}...`);
      const compileResult = await compileWithPlatformIO(sketchPath, selectedBoard);
      
      if (!compileResult.success) {
        // Cleanup
        try {
          await fs.promises.rm(sketchPath, { recursive: true, force: true });
        } catch {}
        
        return res.status(400).json({
          error: "Compilation failed",
          details: compileResult.error,
          output: compileResult.output,
        });
      }
      
      console.log(`[PlatformIO] Compilation successful`);
      
      // Step 4: Upload to board using PlatformIO
      console.log(`[PlatformIO] Uploading to port ${uploadPort}...`);
      const uploadResult = await uploadWithPlatformIO(sketchPath, selectedBoard, uploadPort);
      
      // Step 5: Clean up temp files
      try {
        await fs.promises.rm(sketchPath, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (!uploadResult.success) {
        return res.status(400).json({
          error: "Upload failed",
          details: uploadResult.error,
          output: uploadResult.output,
        });
      }
      
      console.log(`[PlatformIO] Upload successful!`);
      
      res.json({
        success: true,
        message: `Code uploaded successfully to ${selectedBoard} using PlatformIO`,
        port: uploadPort,
        board: selectedBoard,
        method: "platformio",
      });
      
    } catch (error: any) {
      console.error("[PlatformIO] Upload error:", error);
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
      // Re-detect CLI path before installing
      const cliPath = await findArduinoCli();
      config.cliPath = cliPath;
      
      // Check if Arduino CLI is available
      const cliInstalled = await checkArduinoCli();
      if (!cliInstalled) {
        return res.status(400).json({
          error: "Arduino CLI not found",
          details: `Arduino CLI is not installed or not found in PATH.\n\nPlease install Arduino CLI:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`,
        });
      }
      
      console.log(`[Arduino] Installing ${coreName} core...`);
      const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
      const { stdout, stderr } = await execAsync(
        `${cmd} core install ${coreToInstall}`,
        { timeout: 300000 } // 5 minutes for ESP32 (it's large)
      );
      
      // Verify installation was successful
      const output = (stdout || stderr || "").toLowerCase();
      if (output.includes("error") && !output.includes("already installed")) {
        return res.status(500).json({
          error: `Failed to install ${coreName} core`,
          details: stdout || stderr || "Unknown error during installation",
        });
      }
      
      res.json({
        success: true,
        message: `${coreName} core installed successfully`,
        output: stdout || stderr,
      });
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || error.message || "Unknown error";
      res.status(500).json({
        error: `Failed to install ${coreName} core`,
        details: errorOutput,
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
 * Assumes CLI path in config.cliPath is already verified
 */
async function checkArduinoCore(): Promise<boolean> {
  try {
    // Verify CLI path is valid by testing it
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    
    // First verify CLI works
    try {
      await execAsync(`${cmd} version`, { timeout: 5000 });
    } catch (verifyError: any) {
      console.log("[Arduino] CLI path verification failed, trying to re-detect...");
      // Try to re-detect CLI path if verification fails
      const newPath = await findArduinoCli();
      if (newPath !== config.cliPath) {
        config.cliPath = newPath;
        console.log(`[Arduino] CLI path updated to: ${newPath}`);
        // Update command with new path
        const newCmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
        await execAsync(`${newCmd} version`, { timeout: 5000 });
        // Use new command for core list
        const { stdout } = await execAsync(`${newCmd} core list`, { timeout: 10000 });
        const output = stdout.toLowerCase();
        const hasCore = output.includes("arduino:avr") || 
                        output.includes("arduino avr") ||
                        output.match(/arduino\s+avr/i) !== null;
        console.log(`[Arduino] AVR core ${hasCore ? 'detected' : 'not found'}`);
        return hasCore;
      } else {
        throw verifyError; // Re-throw if we couldn't find a new path
      }
    }
    
    // CLI path is valid, check cores
    // Ensure Arduino CLI config is initialized first (skip if it exists)
    try {
      // Check if config exists first (config init fails if config already exists, which is fine)
      await execAsync(`${cmd} config init`, { timeout: 5000 });
    } catch (initError: any) {
      // If config already exists, error message usually contains "already exists" - that's fine
      if (!initError.message?.toLowerCase().includes("already exists") && 
          !initError.stderr?.toLowerCase().includes("already exists")) {
        console.log(`[Arduino] Config init note: ${initError.message || "Config might already exist"}`);
      }
    }
    
    // Run core list with proper timeout and buffer
    const { stdout, stderr } = await execAsync(`${cmd} core list`, { 
      timeout: 30000, 
      maxBuffer: 10 * 1024 * 1024 
    });
    const output = (stdout || "").toLowerCase();
    const errorOutput = (stderr || "").toLowerCase();
    
    // Log output for debugging
    if (stdout) console.log(`[Arduino] Core list stdout: ${stdout.substring(0, 500)}`);
    if (stderr) console.log(`[Arduino] Core list stderr: ${stderr.substring(0, 500)}`);
    
    // Check for various formats: arduino:avr, arduino:avr@version, arduino avr
    const hasCore = output.includes("arduino:avr") || 
                    output.includes("arduino avr") ||
                    output.match(/arduino\s+avr/i) !== null;
    
    console.log(`[Arduino] AVR core ${hasCore ? 'detected' : 'not found'}`);
    return hasCore;
  } catch (error: any) {
    const errorOutput = error.stderr || error.stdout || error.message || "Unknown error";
    console.error("[Arduino] Failed to check AVR core:");
    console.error(`[Arduino] Error message: ${error.message}`);
    console.error(`[Arduino] Stderr: ${error.stderr || "No stderr"}`);
    console.error(`[Arduino] Stdout: ${error.stdout || "No stdout"}`);
    return false;
  }
}

/**
 * Check if ESP32 core is installed
 * Assumes CLI path in config.cliPath is already verified
 */
async function checkESP32Core(): Promise<boolean> {
  try {
    // Verify CLI path is valid by testing it
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    
    // First verify CLI works
    try {
      await execAsync(`${cmd} version`, { timeout: 5000 });
    } catch (verifyError: any) {
      console.log("[Arduino] CLI path verification failed, trying to re-detect...");
      // Try to re-detect CLI path if verification fails
      const newPath = await findArduinoCli();
      if (newPath !== config.cliPath) {
        config.cliPath = newPath;
        console.log(`[Arduino] CLI path updated to: ${newPath}`);
        // Update command with new path
        const newCmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
        await execAsync(`${newCmd} version`, { timeout: 5000 });
        // Use new command for core list
        const { stdout } = await execAsync(`${newCmd} core list`, { timeout: 10000 });
    const output = stdout.toLowerCase();
        const hasCore = output.includes("esp32:esp32") || output.includes("esp32");
        console.log(`[Arduino] ESP32 core ${hasCore ? 'detected' : 'not found'}`);
        return hasCore;
      } else {
        throw verifyError; // Re-throw if we couldn't find a new path
      }
    }
    
    // CLI path is valid, check cores
    // Ensure Arduino CLI config is initialized first (skip if it exists)
    try {
      // Check if config exists first (config init fails if config already exists, which is fine)
      await execAsync(`${cmd} config init`, { timeout: 5000 });
    } catch (initError: any) {
      // If config already exists, error message usually contains "already exists" - that's fine
      if (!initError.message?.toLowerCase().includes("already exists") && 
          !initError.stderr?.toLowerCase().includes("already exists")) {
        console.log(`[Arduino] Config init note: ${initError.message || "Config might already exist"}`);
      }
    }
    
    // Run core list with proper timeout and buffer
    const { stdout, stderr } = await execAsync(`${cmd} core list`, { 
      timeout: 30000, 
      maxBuffer: 10 * 1024 * 1024 
    });
    // Check for esp32:esp32 in the output (case-insensitive)
    const output = (stdout || "").toLowerCase();
    const errorOutput = (stderr || "").toLowerCase();
    
    // Log output for debugging
    if (stdout) console.log(`[Arduino] Core list stdout: ${stdout.substring(0, 500)}`);
    if (stderr) console.log(`[Arduino] Core list stderr: ${stderr.substring(0, 500)}`);
    
    const hasCore = output.includes("esp32:esp32") || output.includes("esp32");
    
    console.log(`[Arduino] ESP32 core ${hasCore ? 'detected' : 'not found'}`);
    return hasCore;
  } catch (error: any) {
    const errorOutput = error.stderr || error.stdout || error.message || "Unknown error";
    console.error("[Arduino] Failed to check ESP32 core:");
    console.error(`[Arduino] Error message: ${error.message}`);
    console.error(`[Arduino] Stderr: ${error.stderr || "No stderr"}`);
    console.error(`[Arduino] Stdout: ${error.stdout || "No stdout"}`);
    return false;
  }
}

/**
 * List connected Arduino boards
 */
async function listConnectedBoards(): Promise<Array<{ port: string; board: string; fqbn?: string }>> {
  try {
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    
    // Ensure Arduino CLI config is initialized first
    try {
      await execAsync(`${cmd} config init`, { timeout: 5000 });
    } catch {
      // Config might already exist, ignore
    }
    
    const { stdout, stderr } = await execAsync(`${cmd} board list --format json`, { 
      timeout: 30000, 
      maxBuffer: 10 * 1024 * 1024 
    });
    
    // Log output for debugging
    if (stdout) console.log(`[Arduino] Board list stdout: ${stdout.substring(0, 500)}`);
    if (stderr) console.log(`[Arduino] Board list stderr: ${stderr.substring(0, 500)}`);
    
    const data = JSON.parse(stdout);
    
    if (Array.isArray(data)) {
      return data
        .filter((item: any) => {
          // Include boards with matching boards OR just ports that might be Arduino
          const hasPort = item.port?.address || item.address;
          const hasMatchingBoards = item.matching_boards && item.matching_boards.length > 0;
          return hasPort && (hasMatchingBoards || item.port?.protocol === "serial");
        })
        .map((item: any) => ({
          port: item.port?.address || item.address || "unknown",
          board: item.matching_boards?.[0]?.name || item.matching_boards?.[0]?.fqbn || "Unknown Board",
          fqbn: item.matching_boards?.[0]?.fqbn,
        }));
    }
    return [];
  } catch (error: any) {
    console.error("[Arduino] Failed to list connected boards:");
    console.error(`[Arduino] Error message: ${error.message}`);
    console.error(`[Arduino] Stderr: ${error.stderr || "No stderr"}`);
    console.error(`[Arduino] Stdout: ${error.stdout || "No stdout"}`);
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
    // Try Arduino CLI first (most accurate) - properly quote path
    const cmd = config.cliPath.includes(" ") ? `"${config.cliPath}"` : config.cliPath;
    const { stdout } = await execAsync(`${cmd} board list --format json`, { timeout: 10000 });
    const data = JSON.parse(stdout);
    
    if (Array.isArray(data)) {
      const cliPorts = data
        .map((item: any) => {
          // Try multiple possible port address fields
          return item.port?.address || 
                 item.address || 
                 item.port?.address_label ||
                 item.port?.protocol === "serial" ? (item.port?.address || item.address) : null;
        })
        .filter(Boolean)
        .map((p: string) => p.toUpperCase()); // Normalize to uppercase
      ports.push(...cliPorts);
    }
  } catch (error: any) {
    // Arduino CLI not available or failed - use fallback detection
    console.log("[Arduino] CLI port detection failed, using fallback:", error.message);
  }
  
  // Fallback: Detect all COM ports on Windows
  if (process.platform === "win32") {
    try {
      // Use PowerShell to list all COM ports
      const { stdout } = await execAsync(
        'powershell -Command "Get-WmiObject Win32_SerialPort | Select-Object -ExpandProperty DeviceID"',
        { timeout: 5000 }
      );
      const comPorts = stdout
        .split('\n')
        .map((line: string) => line.trim().toUpperCase())
        .filter((line: string) => line.startsWith('COM') && line.length > 3 && /^COM\d+$/.test(line));
      
      // Add all detected COM ports
      for (const port of comPorts) {
        if (!ports.includes(port)) {
          ports.push(port);
        }
      }
    } catch (error: any) {
      console.log("[Arduino] PowerShell port detection failed:", error.message);
      // Don't add dummy ports - only real detected ports
    }
    
    // Also try using serialport library as additional fallback
    try {
      const portList = await SerialPort.list();
      for (const portInfo of portList) {
        const port = portInfo.path?.toUpperCase();
        if (port && port.startsWith('COM') && !ports.includes(port)) {
          ports.push(port);
        }
      }
    } catch (error: any) {
      console.log("[Arduino] SerialPort library detection failed:", error.message);
    }
  } else {
    // Linux/Mac: use serialport library for accurate detection
    try {
      const portList = await SerialPort.list();
      for (const portInfo of portList) {
        const port = portInfo.path;
        if (port && !ports.includes(port)) {
          ports.push(port);
        }
      }
    } catch (error: any) {
      console.log("[Arduino] SerialPort library detection failed:", error.message);
      // Fallback: try common device paths
    const commonPorts = [
      "/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyUSB2",
      "/dev/ttyACM0", "/dev/ttyACM1", "/dev/ttyACM2",
      "/dev/tty.usbserial", "/dev/tty.usbmodem",
    ];
      for (const port of commonPorts) {
        if (!ports.includes(port)) {
          ports.push(port);
        }
      }
    }
  }
  
  // Remove duplicates, normalize, and sort
  const uniquePorts = Array.from(new Set(ports.map(p => p.toUpperCase())));
  return uniquePorts.sort((a, b) => {
    // Sort COM ports numerically (COM1, COM2, ..., COM10, COM11)
    const matchA = a.match(/^COM(\d+)$/);
    const matchB = b.match(/^COM(\d+)$/);
    if (matchA && matchB) {
      return parseInt(matchA[1]) - parseInt(matchB[1]);
    }
    return a.localeCompare(b);
  });
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
    if (errorMessage.includes("platform") && errorMessage.includes("not found") ||
        errorMessage.includes("platform") && errorMessage.includes("not installed") ||
        errorMessage.includes("no platform") ||
        errorOutput.toLowerCase().includes("platform") && errorOutput.toLowerCase().includes("not found")) {
      const isESP32 = fqbn.includes("esp32");
      errorMessage = `${isESP32 ? "ESP32" : "Arduino"} core not found.\n\nPlease install the core using the "Install" button in the upload panel, or run:\narduino-cli core install ${isESP32 ? "esp32:esp32" : "arduino:avr"}\n\nAfter installation, try uploading again.`;
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
 * Map board names to PlatformIO board IDs
 */
function getPlatformIOBoard(board: string): string {
  const boardMap: Record<string, string> = {
    nano: "atmega328", // Arduino Nano with ATmega328
    esp32: "esp32dev", // ESP32 Dev Module
    esp32wroom32: "esp32dev", // ESP32-WROOM-32 uses same as ESP32 Dev
  };
  return boardMap[board.toLowerCase()] || "atmega328";
}

/**
 * Create platformio.ini configuration file for a sketch
 */
async function createPlatformIOConfig(
  sketchPath: string,
  board: string
): Promise<string> {
  const pioBoard = getPlatformIOBoard(board);
  const isESP32 = board.toLowerCase().includes("esp32");
  
  let configContent = `[env:${pioBoard}]
platform = ${isESP32 ? "espressif32" : "atmelavr"}
board = ${pioBoard}
framework = arduino
`;

  // Add upload settings
  if (isESP32) {
    configContent += `upload_speed = 460800
monitor_speed = 115200
`;
  } else {
    configContent += `upload_speed = 57600
monitor_speed = 9600
`;
  }

  const iniPath = path.join(sketchPath, "platformio.ini");
  await fs.promises.writeFile(iniPath, configContent, "utf8");
  console.log(`[PlatformIO] Created platformio.ini at: ${iniPath}`);
  return iniPath;
}

/**
 * Check if PlatformIO CLI is installed
 */
async function checkPlatformIO(): Promise<boolean> {
  try {
    const cmd = config.platformioPath.includes(" ") ? `"${config.platformioPath}"` : config.platformioPath;
    await execAsync(`${cmd} --version`, { timeout: 5000 });
    return true;
  } catch {
    // Try to re-detect
    const newPath = await findPlatformIO();
    if (newPath !== config.platformioPath) {
      config.platformioPath = newPath;
      try {
        const cmd = config.platformioPath.includes(" ") ? `"${config.platformioPath}"` : config.platformioPath;
        await execAsync(`${cmd} --version`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Compile sketch using PlatformIO
 */
async function compileWithPlatformIO(
  sketchPath: string,
  board: string
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    // Re-detect PlatformIO path
    const pioPath = await findPlatformIO();
    config.platformioPath = pioPath;
    
    // Check if PlatformIO is available
    const cmdCheck = config.platformioPath.includes(" ") ? `"${config.platformioPath}"` : config.platformioPath;
    
    // Verify PlatformIO works
    try {
      await execAsync(`${cmdCheck} --version`, { timeout: 5000 });
    } catch (error: any) {
      return {
        success: false,
        output: "",
        error: `PlatformIO CLI not found at: ${config.platformioPath}\n\nPlease install PlatformIO CLI:\n• Windows: pip install platformio\n• Linux/Mac: pip3 install platformio\n• Or visit: https://platformio.org/install/cli\n\nAfter installation, restart the server.`,
      };
    }
    
    // Create platformio.ini configuration file
    await createPlatformIOConfig(sketchPath, board);
    
    // Initialize PlatformIO project (if not already initialized)
    try {
      await execAsync(`${cmdCheck} project init --board ${getPlatformIOBoard(board)} --project-dir "${sketchPath}"`, { 
        timeout: 10000 
      });
    } catch {
      // Project might already be initialized, that's fine
      console.log("[PlatformIO] Project already initialized or init failed (continuing anyway)");
    }
    
    // Compile using PlatformIO
    console.log(`[PlatformIO] Compiling for ${board}...`);
    const cmd = `${cmdCheck} run --project-dir "${sketchPath}"`;
    console.log(`[PlatformIO] Running: ${cmd}`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 180000, // 3 minutes timeout
      maxBuffer: 10 * 1024 * 1024,
    });
    
    const output = stdout + (stderr ? `\n${stderr}` : "");
    const hasError = /error/i.test(output) && !/warning/i.test(output) || /failed/i.test(output);
    
    if (hasError && !output.toLowerCase().includes("success")) {
      return {
        success: false,
        output: output,
        error: `PlatformIO compilation failed. Check the output for details.\n\n${output.substring(0, 1000)}`,
      };
    }
    
    console.log(`[PlatformIO] Compilation successful`);
    return {
      success: true,
      output: output,
    };
  } catch (error: any) {
    const errorOutput = error.stderr || error.stdout || error.message || "Unknown error";
    console.error("[PlatformIO] Compilation error:", errorOutput);
    
    return {
      success: false,
      output: errorOutput.substring(0, 1000),
      error: error.message || "PlatformIO compilation failed",
    };
  }
}

/**
 * Upload sketch using PlatformIO
 */
async function uploadWithPlatformIO(
  sketchPath: string,
  board: string,
  port: string
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const isESP32 = board.toLowerCase().includes("esp32");
    const portFormatted = port.trim().toUpperCase();
    const cmdCheck = config.platformioPath.includes(" ") ? `"${config.platformioPath}"` : config.platformioPath;
    
    // For ESP32, automatically reset to boot mode before upload
    if (isESP32) {
      console.log(`[PlatformIO/ESP32] Preparing ESP32 for upload...`);
      await resetESP32ToBootMode(portFormatted);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Upload using PlatformIO
    console.log(`[PlatformIO] Uploading to ${portFormatted}...`);
    const uploadCmd = `${cmdCheck} run --target upload --upload-port ${portFormatted} --project-dir "${sketchPath}"`;
    console.log(`[PlatformIO] Running: ${uploadCmd}`);
    
    const { stdout, stderr } = await execAsync(uploadCmd, {
      timeout: 180000, // 3 minutes timeout for ESP32
      maxBuffer: 10 * 1024 * 1024,
    });
    
    const output = stdout + (stderr ? `\n${stderr}` : "");
    
    // Check for success/failure
    const hasError = /error/i.test(output) || /failed/i.test(output) || /timeout/i.test(output);
    const hasSuccess = /success/i.test(output) || /uploading/i.test(output) && !hasError || 
                       (isESP32 && /hash of data verified/i.test(output));
    
    if (hasSuccess && !hasError) {
      console.log(`[PlatformIO] ✓ Upload successful`);
      return {
        success: true,
        output: output || "Upload completed successfully",
      };
    }
    
    if (hasError) {
      console.error(`[PlatformIO] Upload failed`);
      return {
        success: false,
        output: output,
        error: `PlatformIO upload failed. Check the output for details.\n\n${output.substring(0, 500)}`,
      };
    }
    
    // If unclear, assume success if no clear errors
    return {
      success: true,
      output: output || "Upload completed",
    };
  } catch (error: any) {
    const errorOutput = error.stderr || error.stdout || error.message || "Unknown error";
    console.error("[PlatformIO] Upload error:", errorOutput);
    
    return {
      success: false,
      output: errorOutput.substring(0, 1000),
      error: error.message || "PlatformIO upload failed",
    };
  }
}

/**
 * Automatically reset ESP32 into boot mode using DTR/RTS pins
 * This eliminates the need for manual boot button pressing
 * 
 * @param port - Serial port (e.g., COM10, /dev/ttyUSB0)
 */
async function resetESP32ToBootMode(port: string): Promise<void> {
  let serialPort: SerialPort | null = null;
  try {
    console.log(`[ESP32] Attempting automatic ESP32 reset to boot mode on ${port}...`);
    
    // Open serial port with auto-open disabled
    serialPort = new SerialPort({
      path: port,
      baudRate: 115200,
      autoOpen: false,
    });
    
    // Open the port
    await new Promise<void>((resolve, reject) => {
      serialPort!.open((err) => {
        if (err) {
          console.log(`[ESP32] Could not open port for reset (may be in use): ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // ESP32 WROOM 32 boot mode entry sequence:
    // DTR controls EN (reset pin): low = reset, high = run
    // RTS controls GPIO0 (boot pin): low = boot mode, high = normal mode
    // Sequence: Hold BOOT (RTS low) -> Press RESET (DTR low) -> Release RESET (DTR high) -> Keep BOOT low during upload
    
    console.log(`[ESP32] Step 1: Setting RTS low (GPIO0 low = boot mode)...`);
    serialPort.set({ rts: false }); // RTS low = GPIO0 low = boot mode
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[ESP32] Step 2: Setting DTR low (EN low = reset)...`);
    serialPort.set({ dtr: false }); // DTR low = EN low = reset
    await new Promise(resolve => setTimeout(resolve, 100)); // Hold reset for 100ms
    
    console.log(`[ESP32] Step 3: Setting DTR high (EN high = release reset)...`);
    serialPort.set({ dtr: true }); // DTR high = EN high = release reset
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for ESP32 to enter boot mode
    
    // Keep RTS low (boot mode) - arduino-cli/esptool will handle releasing it
    console.log(`[ESP32] ESP32 should now be in boot mode (RTS kept low)`);
    
  } catch (error: any) {
    // If we can't reset automatically, that's okay - arduino-cli will try anyway
    console.log(`[ESP32] Automatic reset failed (will proceed anyway): ${error.message}`);
  } finally {
    // Close the port - IMPORTANT: must close before arduino-cli uses it
    if (serialPort && serialPort.isOpen) {
      await new Promise<void>((resolve) => {
        serialPort!.close((err) => {
          if (err) console.log(`[ESP32] Error closing port: ${err.message}`);
          else console.log(`[ESP32] Port closed successfully`);
          resolve();
        });
      });
    }
    // Give port time to be fully released and ESP32 to stabilize
    console.log(`[ESP32] Waiting for port to be released...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
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
    
    // For ESP32 boards, automatically reset to boot mode before upload
    if (isESP32) {
      console.log(`[ESP32] Preparing ESP32 for upload...`);
      await resetESP32ToBootMode(portFormatted);
      // Small delay to ensure port is ready
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Try upload with retry for ESP32
    const uploadAttempts = isESP32 ? 3 : 1; // 3 attempts for ESP32
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= uploadAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`[ESP32] Retry attempt ${attempt}/${uploadAttempts}...`);
          // Try automatic reset again on retry
          if (isESP32) {
            console.log(`[ESP32] Attempting automatic ESP32 reset again...`);
            await resetESP32ToBootMode(portFormatted);
            // Small delay after reset
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
    
    const cmd = `${cmdCheck} upload ${verboseFlag} -p ${portFormatted} --fqbn ${actualFqbn} "${sketchPath}"`.trim();
        console.log(`[Arduino] Running upload command (attempt ${attempt}/${uploadAttempts}): ${cmd}`);
    console.log(`[Arduino] Port: ${portFormatted}, FQBN: ${actualFqbn}, ESP32: ${isESP32}`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: timeout,
    });
    
        // Combine all output
        const stdoutStr = stdout ? String(stdout) : "";
        const stderrStr = stderr ? String(stderr) : "";
        const output = (stdoutStr + "\n" + stderrStr).trim();
        
        // Check if this was successful
        // ESP32 successful upload indicators:
        // - "Hash of data verified" (appears multiple times)
        // - "Hard resetting via RTS pin..."
        // - "New upload port: COM10 (serial)"
        // - "Wrote X bytes" with 100.0%
        // - No "error" or "failed" messages
        
        const hasError = /error:/i.test(output) ||
          /\bfatal error\b/i.test(output) ||
          /\bError\b/i.test(output) ||
          /upload failed/i.test(output) ||
          /failed to connect/i.test(output) ||
          /wrong boot/i.test(output) ||
          /boot mode detected/i.test(output);
        
        const hasSuccess = /hash of data verified/i.test(output) ||  // ESP32 success indicator
          /hard resetting/i.test(output) ||                           // ESP32 success indicator
          /new upload port/i.test(output) ||                          // ESP32 success indicator
          /wrote.*100\.0%/i.test(output) ||                           // 100% completion
          /connected to esp32/i.test(output) ||                       // ESP32 connected
          /successfully/i.test(output) ||
          /done uploading/i.test(output) ||
          /uploaded/i.test(output);
        
        // If successful, break out of retry loop
        if (hasSuccess && !hasError) {
          console.log(`[Arduino] ✓ Success on attempt ${attempt}`);
    return {
      success: true,
            output: output || "Upload completed successfully",
          };
        }
        
        // Special case: ESP32 often shows success even if command exits with code
        // Check for multiple success indicators
        const successIndicators = [
          /hash of data verified/i,
          /hard resetting/i,
          /new upload port/i,
          /wrote.*100\.0%/i,
          /connected to esp32/i,
        ];
        const successCount = successIndicators.filter(regex => regex.test(output)).length;
        
        // If we have 2+ success indicators and no errors, consider it successful
        if (successCount >= 2 && !hasError) {
          console.log(`[Arduino] ✓ Success detected (${successCount} indicators) on attempt ${attempt}`);
          return {
            success: true,
            output: output || "Upload completed successfully",
          };
        }
        
        // Even with 1 strong indicator (Hash verified + Hard reset), it's success
        const hasHashAndReset = /hash of data verified/i.test(output) && /hard resetting/i.test(output);
        if (hasHashAndReset && !hasError) {
          console.log(`[Arduino] ✓ Success detected (Hash verified + Hard reset) on attempt ${attempt}`);
          return {
            success: true,
            output: output || "Upload completed successfully",
          };
        }
        
        // If this is the last attempt, throw error to be caught below
        if (attempt === uploadAttempts) {
          lastError = { stdout, stderr, output };
          throw new Error(output || "Upload failed");
        }
        
        // Otherwise, continue to retry
        console.log(`[Arduino] Attempt ${attempt} failed, will retry...`);
        
      } catch (uploadError: any) {
        // IMPORTANT: ESP32 uploads can succeed even if execAsync throws
        // Check the error output for success indicators before treating as failure
        let errorOutput = "";
        if (uploadError.stdout) errorOutput += String(uploadError.stdout);
        if (uploadError.stderr) errorOutput += (errorOutput ? "\n" : "") + String(uploadError.stderr);
        if (uploadError.message) errorOutput += (errorOutput ? "\n" : "") + String(uploadError.message);
        
        const combinedOutput = errorOutput || uploadError.message || "";
        
        // Check for ESP32 success indicators in error output
        const hasHashVerified = /hash of data verified/i.test(combinedOutput);
        const hasHardReset = /hard resetting/i.test(combinedOutput);
        const hasNewPort = /new upload port/i.test(combinedOutput);
        const has100Percent = /100\.0%/i.test(combinedOutput);
        
        // If we see multiple success indicators, it's actually a success!
        const successInError = (hasHashVerified && hasHardReset) ||
          (hasHashVerified && hasNewPort) ||
          (hasHashVerified && has100Percent && hasHardReset);
        
        if (successInError && !/fatal error/i.test(combinedOutput) && !/wrong boot/i.test(combinedOutput)) {
          console.log(`[Arduino] ✓ Success detected in error output (ESP32 completed upload)`);
          return {
            success: true,
            output: combinedOutput || "Upload completed successfully",
          };
        }
        
        // If this is the last attempt, handle the error
        if (attempt === uploadAttempts) {
          lastError = uploadError;
          break; // Exit retry loop to handle error below
        }
        // Otherwise, continue to next retry
        console.log(`[Arduino] Attempt ${attempt} failed, will retry...`);
        lastError = uploadError;
      }
    }
    
    // Handle final error after all retries
    if (lastError) {
      // Capture ALL possible error information
      let errorOutput = "";
      let errorMessage = lastError.message || "Unknown error";
      
      // Try to get stdout/stderr from error object
      if (lastError.stdout) {
        errorOutput += String(lastError.stdout);
      }
      if (lastError.stderr) {
        errorOutput += (errorOutput ? "\n" : "") + String(lastError.stderr);
      }
      if (lastError.output) {
        errorOutput += (errorOutput ? "\n" : "") + String(lastError.output);
      }
      
      // If no output captured, use the error message
      if (!errorOutput.trim()) {
        errorOutput = errorMessage;
      }
      
      // Combine all error info
      const fullErrorOutput = errorOutput.trim() || errorMessage;
      
      // CRITICAL: Check if upload actually succeeded despite error being thrown
      // ESP32 uploads can succeed even if execAsync throws (some tools exit with non-zero codes)
      const hasHashVerified = /hash of data verified/i.test(fullErrorOutput);
      const hasHardReset = /hard resetting/i.test(fullErrorOutput);
      const hasNewPort = /new upload port/i.test(fullErrorOutput);
      const has100Percent = /100\.0%/i.test(fullErrorOutput);
      const hasConnected = /connected to esp32/i.test(fullErrorOutput);
      
      // If we see multiple strong success indicators, it's actually a success!
      const strongSuccessIndicators = [
        hasHashVerified && hasHardReset,
        hasHashVerified && hasNewPort,
        hasHashVerified && has100Percent && hasHardReset,
        hasConnected && hasHashVerified && hasHardReset,
      ].filter(Boolean).length;
      
      // Check for actual fatal errors
      const hasFatalError = /fatal error/i.test(fullErrorOutput) ||
        /wrong boot/i.test(fullErrorOutput) ||
        /failed to connect/i.test(fullErrorOutput);
      
      // If we have strong success indicators and no fatal errors, it's a success!
      if (strongSuccessIndicators >= 1 && !hasFatalError) {
        console.log(`[Arduino] ✓ Success detected in final error handler (ESP32 upload completed)`);
        return {
          success: true,
          output: fullErrorOutput || "Upload completed successfully",
        };
      }
      
      console.error(`[Arduino] All attempts failed`);
      console.error(`[Arduino] Message: ${errorMessage}`);
      console.error(`[Arduino] Output: ${fullErrorOutput.substring(0, 500)}`);
      
      // Provide helpful error messages based on common issues
      let helpfulMessage = "Upload failed";
      const errorLower = fullErrorOutput.toLowerCase();
      
      if (errorLower.includes("timeout") || errorLower.includes("timed out")) {
        helpfulMessage = "Upload timeout - try pressing RESET button on board right before uploading";
      } else if (errorLower.includes("access") || errorLower.includes("permission") || errorLower.includes("denied")) {
        helpfulMessage = "Permission denied - close Arduino IDE and other programs using the port";
      } else if (errorLower.includes("not found") || errorLower.includes("no such file") || errorLower.includes("cannot find")) {
        helpfulMessage = "Port not found - verify board is connected and port name is correct";
      } else if (errorLower.includes("boot mode") || errorLower.includes("download mode") || errorLower.includes("wrong boot")) {
        helpfulMessage = "ESP32 boot mode error - Automatic reset failed. Try: 1) Unplug and replug USB cable, 2) Click Upload again. If still failing, manually hold BOOT button while clicking Upload.";
      } else if (errorLower.includes("cannot open") || errorLower.includes("busy")) {
        helpfulMessage = "Port is busy - close other programs (Arduino IDE, serial monitors) using this port";
      } else if (errorLower.includes("programmer") || errorLower.includes("stk500")) {
        helpfulMessage = "Programmer error - verify board type is correct and try pressing RESET";
      }
      
      // Check if it's a CLI not found error
      if (errorMessage.includes("not recognized") || errorMessage.includes("not found") || errorMessage.includes("command not found")) {
        helpfulMessage = `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`;
      }
      // ESP32-specific error handling
      else if (isESP32) {
        if (errorMessage.includes("Connecting") && errorMessage.includes("timed out") || errorMessage.includes("timeout")) {
          helpfulMessage = `ESP32 upload failed: Could not connect to board.\n\nTroubleshooting:\n1. Hold the BOOT button on your ESP32\n2. Press and release the RESET button (while holding BOOT)\n3. Release the BOOT button\n4. Try uploading again\n\nOr check:\n- Is the correct COM port selected?\n- Are the USB drivers installed?\n- Is another program using the serial port?`;
        } else if (errorMessage.includes("A fatal error occurred") || errorMessage.includes("Failed to connect")) {
          helpfulMessage = `ESP32 upload failed: Connection error.\n\n${errorMessage}\n\nTry:\n1. Put ESP32 in bootloader mode (hold BOOT, press RESET, release BOOT)\n2. Check COM port selection\n3. Close other programs using the serial port`;
        } else if (errorMessage.includes("Permission denied") || errorMessage.includes("Access is denied")) {
          helpfulMessage = `ESP32 upload failed: Port access denied.\n\nClose other programs using COM${port} and try again.`;
        }
      }
      
      return {
        success: false,
        output: fullErrorOutput,
        error: helpfulMessage,
      };
    }
    
    // Fallback (shouldn't reach here)
    return {
      success: false,
      output: "No error details available",
      error: "Upload failed - unknown error",
    };
  } catch (error: any) {
    // Handle non-retry errors (e.g., CLI not found)
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
      const lines = combinedOutput.split("\n");
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if ((lowerLine.includes("error") ||
          lowerLine.includes("failed") ||
          lowerLine.includes("denied") ||
          lowerLine.includes("cannot")) &&
          !lowerLine.includes("esptool") &&
          !lowerLine.includes("arduino-cli") &&
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

