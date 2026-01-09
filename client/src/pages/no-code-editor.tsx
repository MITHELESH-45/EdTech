import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { BlockCanvas } from "@/components/no-code-editor/block-canvas";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NocodeSidebar, type ProjectData } from "@/components/no-code-editor/no-code-sidebar";
import { NocodePanel } from "@/components/no-code-editor/no-code-panel";
import type { PlacedBlock, BlockConnection } from "@/lib/block-types";
import { CodeGenerator } from "@/lib/code-generator";
import { schemaData } from "@/lib/no-code-blocks";
import { generateArduinoCodeFromBlocks } from "@/lib/no-code-arduino-generator";

function PaletteSkeleton() {
  return (
    <div className="max-h-screen flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="p-3 space-y-4">
        {[1, 2, 3, 4].map((group) => (
          <div key={group}>
            <Skeleton className="h-3 w-20 mb-2" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-20 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NocodeEditor() {
  const { toast } = useToast();
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [connections, setConnections] = useState<BlockConnection[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [arduinoCode, setArduinoCode] = useState<string>("");
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [outputContent, setOutputContent] = useState<string>(">>> Welcome to the No-Code Editor\n>>> Upload code to Arduino to see Serial.print output here");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Arduino upload state
  const [isUploading, setIsUploading] = useState(false);
  const [arduinoStatus, setArduinoStatus] = useState<any>(null);
  const [selectedPort, setSelectedPort] = useState<string>("COM11");
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [manualPort, setManualPort] = useState<string>("COM11");
  const [useManualPort, setUseManualPort] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string>("nano");
  
  // Serial monitor state
  const [isSerialMonitorActive, setIsSerialMonitorActive] = useState(false);
  const serialMonitorWsRef = useRef<WebSocket | null>(null);

  // Available boards for upload
  const availableBoards = [
    { id: "nano", name: "Arduino Nano" },
    { id: "esp32", name: "ESP32" },
    { id: "esp32wroom32", name: "ESP32-WROOM-32" },
  ];

  const handleSelectBlock = useCallback((blockId: string) => {
    setSelectedBlockType(blockId);
    setSelectedBlockId(null);
  }, []);

  const handlePlaceBlock = useCallback((blockId: string, x: number, y: number) => {
    // Get default values from schema
    let defaultValues: Record<string, any> = {};
    
    for (const category of schemaData.categories) {
      const block = category.components.find(c => c.id === blockId);
      if (block) {
        // Initialize with default values
        Object.entries(block.fields).forEach(([key, field]: [string, any]) => {
          defaultValues[key] = field.default;
        });
        break;
      }
    }

    const newBlock: PlacedBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockId,
      x: Math.max(50, x), // Ensure positive coordinates and minimum offset
      y: Math.max(50, y),
      fieldValues: defaultValues,
    };
    
    setPlacedBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockType(null);
    setSelectedBlockId(newBlock.id);
    
    // Generate code immediately when block is placed
    setIsCodeManuallyEdited(false);
    
    toast({
      title: "Block placed",
      description: "Block has been added to the canvas.",
    });
  }, [toast]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setPlacedBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setConnections((prev) => 
      prev.filter((c) => c.fromBlockId !== blockId && c.toBlockId !== blockId)
    );
    setSelectedBlockId(null);
    
    toast({
      title: "Block deleted",
      description: "The block has been removed.",
    });
  }, [toast]);

  const handleUpdateBlockValues = useCallback((blockId: string, values: Record<string, any>) => {
    setPlacedBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, fieldValues: values } : b))
    );
  }, []);

  const handleMoveBlock = useCallback((blockId: string, x: number, y: number) => {
    setPlacedBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, x, y } : b))
    );
  }, []);

  const handleConnectBlocks = useCallback((fromBlockId: string, toBlockId: string) => {
    // Create a BlockConnection object and add it to the connections array
    const newConnection: BlockConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromBlockId,
      toBlockId,
    };
    
    // Check if connection already exists
    setConnections((prev) => {
      const exists = prev.some(
        c => c.fromBlockId === fromBlockId && c.toBlockId === toBlockId
      );
      if (exists) {
        return prev; // Connection already exists
      }
      return [...prev, newConnection];
    });
    
    // Also update nextBlockId for backward compatibility
    setPlacedBlocks((prev) =>
      prev.map((b) => (b.id === fromBlockId ? { ...b, nextBlockId: toBlockId } : b))
    );
    
    toast({
      title: "Blocks connected",
      description: "Blocks have been connected.",
    });
  }, [toast]);

  // Parse Serial.print/Serial.println statements from Arduino code
  const parseSerialOutput = useCallback((code: string) => {
    const lines = code.split('\n');
    const outputLines: string[] = [];
    
    for (const line of lines) {
      // Match Serial.print("text") or Serial.println("text")
      const printMatch = line.match(/Serial\.print(ln)?\s*\(\s*"([^"]*)"\s*\)/);
      if (printMatch) {
        const text = printMatch[2];
        outputLines.push(text);
      }
      // Match Serial.print(variable) or Serial.println(variable)
      const varMatch = line.match(/Serial\.print(ln)?\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
      if (varMatch) {
        const varName = varMatch[2];
        outputLines.push(`[${varName}]`);
      }
    }
    
    if (outputLines.length > 0) {
      setOutputContent(`>>> Output after upload:\n${outputLines.join('\n')}`);
    } else {
      setOutputContent(">>> No Serial.print statements found in uploaded code\n>>> Add Serial.print blocks to see output here");
    }
  }, []);

  // Start/Stop Serial Monitor
  const startSerialMonitor = useCallback(async () => {
    const portToUse = useManualPort ? manualPort.trim().toUpperCase() : selectedPort?.trim().toUpperCase();
    if (!portToUse || !portToUse.match(/^COM\d+$/)) {
      toast({
        title: "Serial Monitor Failed",
        description: `Invalid port: ${portToUse || "none"}. Please select a valid COM port.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Start serial monitor via API
      const response = await fetch("/api/arduino/serial-monitor/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port: portToUse, baudRate: 9600 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to start serial monitor");
      }

      // Connect WebSocket for real-time data
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/arduino/serial-monitor?port=${portToUse}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[Serial Monitor] WebSocket connected");
        setIsSerialMonitorActive(true);
        setOutputContent(`>>> Serial Monitor Active on ${portToUse}\n>>> Waiting for data...\n`);
        toast({
          title: "Serial Monitor Started",
          description: `Reading from ${portToUse} at 9600 baud`,
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "data") {
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            setOutputContent((prev) => {
              const newContent = prev + `[${timestamp}] ${message.data}\n`;
              // Keep only last 1000 lines to prevent memory issues
              const lines = newContent.split('\n');
              if (lines.length > 1000) {
                return lines.slice(-1000).join('\n');
              }
              return newContent;
            });
          } else if (message.type === "error") {
            const errorMsg = message.error || "Unknown error";
            setOutputContent((prev) => prev + `>>> ERROR: ${errorMsg}\n`);
            
            // Provide helpful message for access denied errors
            let userMessage = errorMsg;
            if (errorMsg.includes("Access denied") || errorMsg.includes("cannot open")) {
              userMessage = `Port ${portToUse} is busy. Close other programs using this port (Arduino IDE, serial monitors, etc.) and try again.`;
            }
            
            toast({
              title: "Serial Monitor Error",
              description: userMessage,
              variant: "destructive",
              duration: 10000,
            });
            
            // Auto-stop on error
            setIsSerialMonitorActive(false);
            if (serialMonitorWsRef.current) {
              serialMonitorWsRef.current.close();
              serialMonitorWsRef.current = null;
            }
          }
        } catch (error) {
          console.error("[Serial Monitor] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[Serial Monitor] WebSocket error:", error);
        toast({
          title: "Serial Monitor Error",
          description: "Failed to connect to serial monitor",
          variant: "destructive",
        });
        setIsSerialMonitorActive(false);
      };

      ws.onclose = () => {
        console.log("[Serial Monitor] WebSocket closed");
        setIsSerialMonitorActive(false);
        setOutputContent((prev) => prev + "\n>>> Serial Monitor Disconnected\n");
      };

      serialMonitorWsRef.current = ws;
    } catch (error: any) {
      toast({
        title: "Serial Monitor Failed",
        description: error.message || "Failed to start serial monitor",
        variant: "destructive",
      });
    }
  }, [selectedPort, manualPort, useManualPort, toast]);

  const stopSerialMonitor = useCallback(async () => {
    const portToUse = useManualPort ? manualPort.trim().toUpperCase() : selectedPort?.trim().toUpperCase();
    
    // Close WebSocket
    if (serialMonitorWsRef.current) {
      serialMonitorWsRef.current.close();
      serialMonitorWsRef.current = null;
    }

    // Stop via API
    if (portToUse) {
      try {
        await fetch("/api/arduino/serial-monitor/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ port: portToUse }),
        });
      } catch (error) {
        console.error("[Serial Monitor] Failed to stop:", error);
      }
    }

    setIsSerialMonitorActive(false);
    setOutputContent((prev) => prev + "\n>>> Serial Monitor Stopped\n");
    toast({
      title: "Serial Monitor Stopped",
      description: "Serial monitor has been disconnected",
    });
  }, [selectedPort, manualPort, useManualPort, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serialMonitorWsRef.current) {
        serialMonitorWsRef.current.close();
      }
    };
  }, []);

  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnections((prev) => {
      const connection = prev.find(c => c.id === connectionId);
      if (connection) {
        // Also remove nextBlockId if it matches
        setPlacedBlocks((prevBlocks) =>
          prevBlocks.map((b) => 
            b.id === connection.fromBlockId && b.nextBlockId === connection.toBlockId
              ? { ...b, nextBlockId: undefined }
              : b
          )
        );
      }
      return prev.filter(c => c.id !== connectionId);
    });
    toast({
      title: "Connection deleted",
      description: "Wire has been removed.",
    });
  }, [toast]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('nocode-projects');
    if (savedProjects) {
      try {
        const loadedProjects = JSON.parse(savedProjects) as ProjectData[];
        setProjects(loadedProjects);
        
        // Load the last active project if available
        const lastProjectId = localStorage.getItem('nocode-last-project');
        if (lastProjectId) {
          const lastProject = loadedProjects.find(p => p.id === lastProjectId);
          if (lastProject) {
            loadProjectData(lastProject);
          }
        }
      } catch (error) {
        console.error('Failed to load projects from localStorage:', error);
      }
    }
  }, []);

  const loadProjectData = useCallback((project: ProjectData) => {
    setPlacedBlocks(project.placedBlocks || []);
    setConnections(project.connections || []);
    setArduinoCode(project.generatedCode || "");
    setIsCodeManuallyEdited(false);
    setCurrentProjectId(project.id);
    setSelectedBlockId(null);
    setSelectedBlockType(null);
    localStorage.setItem('nocode-last-project', project.id);
    
    toast({
      title: "Project loaded",
      description: `"${project.name}" has been loaded.`,
    });
  }, [toast]);

  // Listen for project load events from file input
  useEffect(() => {
    const handleLoadProject = (event: CustomEvent) => {
      const projectData = event.detail as ProjectData;
      // Add project to list and load it
      setProjects(prev => {
        const existing = prev.find(p => p.id === projectData.id);
        if (existing) return prev;
        return [...prev, projectData];
      });
      loadProjectData(projectData);
    };

    window.addEventListener('nocode-load-project', handleLoadProject as EventListener);
    return () => {
      window.removeEventListener('nocode-load-project', handleLoadProject as EventListener);
    };
  }, [loadProjectData]);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('nocode-projects', JSON.stringify(projects));
    } else {
      localStorage.removeItem('nocode-projects');
    }
  }, [projects]);

  const updateGeneratedCode = useCallback(() => {
    // Generate code if there are blocks placed, even without connections
    // And only if code hasn't been manually edited
    if (placedBlocks.length === 0) {
      setArduinoCode(`/*
 * Arduino Sketch - Generated by E-GROOTS No-Code Editor
 * Place blocks on the canvas to generate code
 */

void setup() {
  // No setup required
}

void loop() {
  // No loop code
}`);
      setIsCodeManuallyEdited(false);
      return;
    }
    
    // Only auto-generate if code hasn't been manually edited
    if (!isCodeManuallyEdited) {
      const arduino = generateArduinoCodeFromBlocks(placedBlocks, connections);
      setArduinoCode(arduino);
    }
  }, [placedBlocks, connections, isCodeManuallyEdited]);

  // Track previous state to detect actual changes
  const prevConnectionsRef = useRef<string>(JSON.stringify(connections));
  const prevFieldValuesRef = useRef<string>("");
  const prevBlocksCountRef = useRef<number>(0);
  
  // Update generated code when:
  // 1. Connections are added/removed/changed
  // 2. Block field values change
  // 3. Blocks are placed or removed
  useEffect(() => {
    const currentConnectionsStr = JSON.stringify(connections);
    const currentFieldValuesStr = JSON.stringify(
      placedBlocks.map(b => ({ id: b.id, fieldValues: b.fieldValues }))
    );
    const currentBlocksCount = placedBlocks.length;
    
    const connectionsChanged = prevConnectionsRef.current !== currentConnectionsStr;
    const fieldValuesChanged = prevFieldValuesRef.current !== currentFieldValuesStr;
    const blocksCountChanged = prevBlocksCountRef.current !== currentBlocksCount;
    
    // Regenerate if any of these changed
    if (connectionsChanged || fieldValuesChanged || blocksCountChanged) {
      prevConnectionsRef.current = currentConnectionsStr;
      prevFieldValuesRef.current = currentFieldValuesStr;
      prevBlocksCountRef.current = currentBlocksCount;
      
      // Generate code directly here to avoid dependency issues
      // Only auto-generate if code hasn't been manually edited
      if (!isCodeManuallyEdited) {
        const arduino = generateArduinoCodeFromBlocks(placedBlocks, connections);
        setArduinoCode(arduino);
      }
      // Don't parse output here - only show output after upload
    } else {
      // Update refs even if we don't regenerate (to track state)
      prevConnectionsRef.current = currentConnectionsStr;
      prevFieldValuesRef.current = currentFieldValuesStr;
      prevBlocksCountRef.current = currentBlocksCount;
    }
  }, [connections, placedBlocks, isCodeManuallyEdited]);

  // Auto-save project when blocks, connections, or code changes
  useEffect(() => {
    if (!currentProjectId) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (debounce)
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (currentProjectId) {
        setProjects(prev => prev.map(p => 
          p.id === currentProjectId 
            ? {
                ...p,
                placedBlocks,
                connections,
                generatedCode: arduinoCode,
                lastModified: Date.now(),
              }
            : p
        ));
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [placedBlocks, connections, arduinoCode, currentProjectId]);

  // Check Arduino status on mount
  useEffect(() => {
    checkArduinoStatus();
    fetchAvailablePorts();
    setSelectedPort("COM11");
    setManualPort("COM11");
    
    // Refresh status every 5 seconds to detect newly installed cores
    const statusInterval = setInterval(() => {
      checkArduinoStatus();
    }, 5000);
    
    return () => clearInterval(statusInterval);
  }, []);

  // Arduino functions
  const checkArduinoStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/arduino/status");
      if (response.ok) {
        const status = await response.json();
        setArduinoStatus(status);
        // Debug logging
        if (selectedBoard === "esp32" || selectedBoard === "esp32wroom32") {
          console.log("[ESP32 Core Status]", {
            detected: status.esp32CoreInstalled,
            cliInstalled: status.cliInstalled,
          });
        }
      }
    } catch (error) {
      console.error("Failed to check Arduino status:", error);
    }
  }, [selectedBoard]);

  const installArduinoCore = useCallback(async (core: string) => {
    try {
      const response = await fetch("/api/arduino/install-core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ core }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Core Installation Started",
          description: `Installing ${core === "esp32" ? "ESP32" : "AVR"} core. This may take a few minutes...`,
        });
        // Refresh status after a delay
        setTimeout(() => {
          checkArduinoStatus();
        }, 2000);
      } else {
        toast({
          title: "Installation Failed",
          description: result.error || "Failed to install core",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to install core",
        variant: "destructive",
      });
    }
  }, [toast, checkArduinoStatus]);

  const fetchAvailablePorts = useCallback(async () => {
    try {
      const response = await fetch("/api/arduino/ports");
      if (response.ok) {
        const data = await response.json();
        // Handle both { ports: [...] } and [...] formats
        const portsArray = Array.isArray(data) ? data : (Array.isArray(data.ports) ? data.ports : []);
        setAvailablePorts(portsArray);
        
        // Auto-select recommended port (connected board) or first port
        const recommendedPort = data.recommendedPort || data.recommended || null;
        if (recommendedPort && portsArray.includes(recommendedPort)) {
          // Use recommended port (connected Arduino/ESP32)
          setSelectedPort(recommendedPort);
          setManualPort(recommendedPort);
        } else if (portsArray.length > 0) {
          // Fallback to first port if no recommendation
          if (!selectedPort || !portsArray.includes(selectedPort)) {
            setSelectedPort(portsArray[0]);
            setManualPort(portsArray[0]);
          }
        }
      } else {
        // If API fails, set empty array
        setAvailablePorts([]);
      }
    } catch (error) {
      console.error("Failed to fetch ports:", error);
      // On error, set empty array to prevent crashes
      setAvailablePorts([]);
    }
  }, [selectedPort]);

  const handleUpload = useCallback(async () => {
    if (!arduinoCode || arduinoCode.trim().length === 0) {
      toast({
        title: "Upload Failed",
        description: "No Arduino code to upload. Add some blocks first.",
        variant: "destructive",
      });
      return;
    }

    let portToUse = useManualPort ? manualPort : selectedPort;
    if (!portToUse) {
      toast({
        title: "Upload Failed",
        description: "Please select or enter a serial port.",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize port format (uppercase, trimmed)
    portToUse = portToUse.trim().toUpperCase();
    if (!portToUse.match(/^COM\d+$/)) {
      toast({
        title: "Upload Failed",
        description: `Invalid port format: ${portToUse}. Must be COM1, COM2, etc.`,
        variant: "destructive",
      });
      return;
    }
    
    console.log(`[Upload] Board: ${selectedBoard}, Port: ${portToUse}`);

    setIsUploading(true);

    try {
      const response = await fetch("/api/arduino/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: arduinoCode,
          board: selectedBoard,
          port: portToUse,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Parse Serial.print statements from uploaded code and show output
        parseSerialOutput(arduinoCode);
        const boardName = availableBoards.find(b => b.id === selectedBoard)?.name || "Arduino";
        toast({
          title: "Upload Successful",
          description: `Code has been uploaded to ${boardName}!`,
        });
        
        // Stop serial monitor if active (port will be busy after upload)
        if (isSerialMonitorActive) {
          await stopSerialMonitor();
          // Wait a bit before allowing restart
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast({
            title: "Serial Monitor Stopped",
            description: "Serial monitor was stopped due to upload. You can restart it now.",
          });
        }
      } else {
        // Show detailed error message (handles both 400 and other errors)
        const errorMsg = result.error || result.details || "Failed to upload code";
        const outputMsg = result.output ? `\n\nOutput:\n${result.output.substring(0, 500)}` : "";
        toast({
          title: "Upload Failed",
          description: `${errorMsg}${outputMsg}`,
          variant: "destructive",
          duration: 15000, // Show longer for errors
        });
        console.error("Upload error:", result);
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload code",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [arduinoCode, selectedPort, manualPort, useManualPort, selectedBoard, toast, parseSerialOutput]);

  const handleNewProject = useCallback(() => {
    const newProject: ProjectData = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Project ${projects.length + 1}`,
      placedBlocks: [],
      connections: [],
      generatedCode: "",
      lastModified: Date.now(),
    };

    setProjects(prev => [...prev, newProject]);
    loadProjectData(newProject);
    
    toast({
      title: "New project created",
      description: "A new project has been created.",
    });
  }, [projects.length, loadProjectData, toast]);

  const handleLoadProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      loadProjectData(project);
    }
  }, [projects, loadProjectData]);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    if (currentProjectId === projectId) {
      // Clear current project if it was deleted
      setPlacedBlocks([]);
      setConnections([]);
      setArduinoCode("");
      setIsCodeManuallyEdited(false);
      setCurrentProjectId(null);
      setSelectedBlockId(null);
      setSelectedBlockType(null);
      localStorage.removeItem('nocode-last-project');
    }
    
    toast({
      title: "Project deleted",
      description: "The project has been deleted.",
    });
  }, [currentProjectId, toast]);

  const handleRenameProject = useCallback((projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, name: newName, lastModified: Date.now() }
        : p
    ));
    
    toast({
      title: "Project renamed",
      description: `Project renamed to "${newName}".`,
    });
  }, [toast]);

  const handleDownloadProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // If downloading current project, use current state, otherwise use saved state
    const projectToDownload = currentProjectId === projectId
      ? {
          ...project,
          placedBlocks,
          connections,
          generatedCode: arduinoCode,
          lastModified: Date.now(),
        }
      : project;

    const dataStr = JSON.stringify(projectToDownload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Project downloaded",
      description: `"${project.name}.json" has been downloaded.`,
    });
  }, [projects, currentProjectId, placedBlocks, connections, arduinoCode, toast]);

  const handleRun = useCallback(() => {
    updateGeneratedCode();
    toast({
      title: "Code Generated",
      description: "Arduino code has been generated from your blocks.",
    });
  }, [updateGeneratedCode, toast]);

  const handleStop = useCallback(() => {
    toast({
      title: "Stopped",
      description: "Execution stopped.",
    });
  }, [toast]);

  const handleReset = useCallback(() => {
    setPlacedBlocks([]);
    setConnections([]);
    setSelectedBlockId(null);
    setSelectedBlockType(null);
    setArduinoCode("");
    setIsCodeManuallyEdited(false);
    
    toast({
      title: "Canvas Reset",
      description: "All blocks have been cleared.",
    });
  }, [toast]);

  const handleArduinoCodeChange = useCallback((code: string) => {
    setArduinoCode(code);
    setIsCodeManuallyEdited(true);
    // Don't parse output here - only show output after upload
  }, []);

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
    <div className="flex flex-1 min-h-0 w-full">
      <div className="w-56 flex-shrink-0 border-r border-border overflow-y-auto">
        <NocodeSidebar
          onSelectBlock={handleSelectBlock}
          selectedBlockId={selectedBlockType}
          currentProjectId={currentProjectId}
          onNewProject={handleNewProject}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          onDownloadProject={handleDownloadProject}
          projects={projects}
        />
      </div>
  
      <div className="flex-1 min-w-0 overflow-hidden">
        <BlockCanvas
          placedBlocks={placedBlocks}
          connections={connections}
          selectedBlockId={selectedBlockId}
          selectedBlockType={selectedBlockType}
          onPlaceBlock={handlePlaceBlock}
          onSelectBlock={setSelectedBlockId}
          onDeleteBlock={handleDeleteBlock}
          onUpdateBlockValues={handleUpdateBlockValues}
          onConnectBlocks={handleConnectBlocks}
          onDeleteConnection={handleDeleteConnection}
          onMoveBlock={handleMoveBlock}
        />
      </div>
  
      <div className="flex-shrink-0 border-l border-border ">
        <NocodePanel
          isRunning={false}
          ledState={false}
          errorMessage={null}
          wireMode={false}
          onRun={handleRun}
          onStop={handleStop}
          onReset={handleReset}
          onToggleWireMode={() => {}}
          onToggleDebugPanel={() => {}}
          showDebugPanel={false}
          componentCount={placedBlocks.length}
          wireCount={connections.length}
          arduinoCode={arduinoCode}
          onArduinoCodeChange={handleArduinoCodeChange}
          isUploading={isUploading}
          onUpload={handleUpload}
          arduinoStatus={arduinoStatus}
          selectedPort={selectedPort}
          availablePorts={availablePorts}
          manualPort={manualPort}
          useManualPort={useManualPort}
          onPortChange={setSelectedPort}
          onManualPortChange={setManualPort}
          onUseManualPortChange={setUseManualPort}
          onRefreshPorts={fetchAvailablePorts}
          outputContent={outputContent}
          selectedBoard={selectedBoard}
          availableBoards={availableBoards}
          onBoardChange={setSelectedBoard}
          onInstallCore={installArduinoCore}
          isSerialMonitorActive={isSerialMonitorActive}
          onStartSerialMonitor={startSerialMonitor}
          onStopSerialMonitor={stopSerialMonitor}
        />
      </div>
    </div>
    </div>
  );
}
