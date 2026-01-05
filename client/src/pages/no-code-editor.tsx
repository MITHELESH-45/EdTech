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
  }, []);

  // Arduino functions
  const checkArduinoStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/arduino/status");
      if (response.ok) {
        const status = await response.json();
        setArduinoStatus(status);
      }
    } catch (error) {
      console.error("Failed to check Arduino status:", error);
    }
  }, []);

  const fetchAvailablePorts = useCallback(async () => {
    try {
      const response = await fetch("/api/arduino/ports");
      if (response.ok) {
        const ports = await response.json();
        // Ensure ports is an array
        const portsArray = Array.isArray(ports) ? ports : [];
        setAvailablePorts(portsArray);
        if (portsArray.length > 0 && !selectedPort) {
          const com11 = portsArray.find((p: string) => p.toUpperCase() === "COM11");
          setSelectedPort(com11 || portsArray[0]);
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

    const portToUse = useManualPort ? manualPort : selectedPort;
    if (!portToUse) {
      toast({
        title: "Upload Failed",
        description: "Please select or enter a serial port.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/arduino/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: arduinoCode,
          port: portToUse,
          fqbn: "arduino:avr:nano",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Parse Serial.print statements from uploaded code and show output
        parseSerialOutput(arduinoCode);
        toast({
          title: "Upload Successful",
          description: "Code has been uploaded to Arduino Nano!",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload code",
          variant: "destructive",
        });
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
  }, [arduinoCode, selectedPort, manualPort, useManualPort, toast, parseSerialOutput]);

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
        />
      </div>
    </div>
    </div>
  );
}
