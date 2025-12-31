import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { BlockCanvas } from "@/components/no-code-editor/block-canvas";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NocodeSidebar, type ProjectData } from "@/components/no-code-editor/no-code-sidebar";
import { NocodePanel } from "@/components/no-code-editor/no-code-panel";
import type { PlacedBlock, BlockConnection } from "@/lib/block-types";
import { CodeGenerator } from "@/lib/code-generator";
import { schemaData } from "@/lib/no-code-blocks";

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
  const [generatedCode, setGeneratedCode] = useState<string>("# Generated code will appear here\n");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      x,
      y,
      fieldValues: defaultValues,
    };
    
    setPlacedBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockType(null);
    setSelectedBlockId(newBlock.id);
    
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
    // Update sequential connection (simple version - connects blocks sequentially)
    setPlacedBlocks((prev) =>
      prev.map((b) => (b.id === fromBlockId ? { ...b, nextBlockId: toBlockId } : b))
    );
    
    toast({
      title: "Blocks connected",
      description: "Blocks have been connected.",
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
    setGeneratedCode(project.generatedCode || "# Generated code will appear here\n");
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

  // Generate code whenever blocks change
  const codeGenerator = useMemo(() => {
    return new CodeGenerator(placedBlocks, connections);
  }, [placedBlocks, connections]);

  const updateGeneratedCode = useCallback(() => {
    const code = codeGenerator.generate();
    setGeneratedCode(code);
  }, [codeGenerator]);

  // Update generated code when blocks or their values change
  useEffect(() => {
    updateGeneratedCode();
  }, [updateGeneratedCode]);

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
                generatedCode,
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
  }, [placedBlocks, connections, generatedCode, currentProjectId]);

  const handleNewProject = useCallback(() => {
    const newProject: ProjectData = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Project ${projects.length + 1}`,
      placedBlocks: [],
      connections: [],
      generatedCode: "# Generated code will appear here\n",
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
      setGeneratedCode("# Generated code will appear here\n");
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
          generatedCode,
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
  }, [projects, currentProjectId, placedBlocks, connections, generatedCode, toast]);

  const handleRun = useCallback(() => {
    updateGeneratedCode();
    toast({
      title: "Code Generated",
      description: "Python code has been generated from your blocks.",
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
    setGeneratedCode("# Generated code will appear here\n");
    
    toast({
      title: "Canvas Reset",
      description: "All blocks have been cleared.",
    });
  }, [toast]);

  return (
    <div className="max-h-screen bg-background flex flex-col">
      <Header showSearch={false}/>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 flex-shrink-0">
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
          onMoveBlock={handleMoveBlock}
        />

        <div className="flex flex-shrink-0">
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
            generatedCode={generatedCode}
            onCodeChange={setGeneratedCode}
          />
        </div>
      </div>
    </div>
  );
}
