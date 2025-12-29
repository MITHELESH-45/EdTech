import { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { BlockCanvas } from "@/components/no-code-editor/block-canvas";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NocodeSidebar } from "@/components/no-code-editor/no-code-sidebar";
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
