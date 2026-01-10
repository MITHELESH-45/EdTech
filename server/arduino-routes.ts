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

const execAsync = promisify(exec);

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
export function registerArduinoRoutes(app: Express): void {
  
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
      
      // Check if Arduino core is installed
      const coreInstalled = cliInstalled ? await checkArduinoCore() : false;
      
      res.json({
        cliInstalled,
        cliVersion,
        cliPath: cliPathInfo,
        coreInstalled,
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
      res.json({ ports });
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
    const { code, port: userPort } = req.body;
    
    // Validate request
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'code' in request body",
        details: "Code must be a non-empty string containing valid Arduino C++ code",
      });
    }
    
    // Basic validation - must contain setup() and loop()
    if (!code.includes("void setup()") || !code.includes("void loop()")) {
      return res.status(400).json({
        error: "Invalid Arduino code",
        details: "Code must contain both void setup() and void loop() functions",
      });
    }
    
    // Check for Python code (should NEVER be uploaded)
    if (code.includes("import ") || code.includes("def ") || code.includes("print(")) {
      return res.status(400).json({
        error: "Python code detected",
        details: "Only Arduino C++ code can be uploaded. Python is for display only.",
      });
    }
    
    const uploadPort = userPort || config.port;
    
    try {
      // Step 1: Create sketch directory
      const sketchName = `egroots_sketch_${Date.now()}`;
      const sketchPath = path.join(config.sketchDir, sketchName);
      const inoPath = path.join(sketchPath, `${sketchName}.ino`);
      
      // Create directories
      await fs.promises.mkdir(sketchPath, { recursive: true });
      
      // Step 2: Write the .ino file
      await fs.promises.writeFile(inoPath, code, "utf8");
      console.log(`[Arduino] Saved sketch to: ${inoPath}`);
      
      // Step 3: Compile the sketch
      console.log(`[Arduino] Compiling sketch...`);
      const compileResult = await compileSketch(sketchPath, config.fqbn);
      
      if (!compileResult.success) {
        return res.status(400).json({
          error: "Compilation failed",
          details: compileResult.error,
          output: compileResult.output,
        });
      }
      
      console.log(`[Arduino] Compilation successful`);
      
      // Step 4: Upload to Arduino
      console.log(`[Arduino] Uploading to port ${uploadPort}...`);
      const uploadResult = await uploadSketch(sketchPath, config.fqbn, uploadPort);
      
      if (!uploadResult.success) {
        return res.status(400).json({
          error: "Upload failed",
          details: uploadResult.error,
          output: uploadResult.output,
        });
      }
      
      console.log(`[Arduino] Upload successful!`);
      
      // Step 5: Clean up temp files
      try {
        await fs.promises.rm(sketchPath, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      res.json({
        success: true,
        message: "Code uploaded successfully to Arduino",
        port: uploadPort,
        board: config.fqbn,
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
  // POST /api/arduino/install-core - Install Arduino AVR core
  // ==========================================================================
  app.post("/api/arduino/install-core", async (_req: Request, res: Response) => {
    try {
      console.log("[Arduino] Installing Arduino AVR core...");
      const { stdout, stderr } = await execAsync(
        `${config.cliPath} core install arduino:avr`
      );
      
      res.json({
        success: true,
        message: "Arduino AVR core installed successfully",
        output: stdout || stderr,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to install Arduino core",
        details: error.message,
      });
    }
  });
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
    
    const cmd = `${cmdCheck} compile --fqbn ${fqbn} "${sketchPath}"`;
    console.log(`[Arduino] Running: ${cmd}`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120000, // 2 minute timeout
    });
    
    return {
      success: true,
      output: stdout + (stderr ? `\n${stderr}` : ""),
    };
  } catch (error: any) {
    let errorMessage = error.stderr || error.message || "Unknown error";
    
    // Check if it's a CLI not found error
    if (errorMessage.includes("not recognized") || errorMessage.includes("not found") || errorMessage.includes("command not found")) {
      errorMessage = `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`;
    }
    
    return {
      success: false,
      output: error.stdout || "",
      error: errorMessage,
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
    
    const cmd = `${cmdCheck} upload -p ${port} --fqbn ${actualFqbn} "${sketchPath}"`;
    console.log(`[Arduino] Running: ${cmd}`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120000, // 2 minute timeout
    });
    
    return {
      success: true,
      output: stdout + (stderr ? `\n${stderr}` : ""),
    };
  } catch (error: any) {
    let errorMessage = error.stderr || error.message || "Unknown error";
    
    // Check if it's a CLI not found error
    if (errorMessage.includes("not recognized") || errorMessage.includes("not found") || errorMessage.includes("command not found")) {
      errorMessage = `Arduino CLI not found at: ${config.cliPath}\n\nPlease ensure Arduino CLI is installed and either:\n1. Added to your system PATH, or\n2. Restart the server after installation\n\nInstallation:\n• Windows: choco install arduino-cli\n• Or download: https://arduino.github.io/arduino-cli/installation/\n\nAfter installation, restart the server.`;
    }
    
    // If new bootloader fails, try old bootloader
    if (error.message.includes("programmer") || error.message.includes("sync")) {
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
    
    return {
      success: false,
      output: error.stdout || "",
      error: errorMessage,
    };
  }
}

