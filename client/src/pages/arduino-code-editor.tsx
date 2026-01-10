/**
 * Arduino Block-Based Code Editor
 * 
 * CRITICAL RULES:
 * 1. Python code is ONLY for display - NEVER executed
 * 2. Arduino C++ is the ONLY code uploaded to hardware
 * 3. Upload ONLY happens when user clicks Upload button
 * 4. Backend handles all USB/Serial communication
 */

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Play,
  Square,
  Cpu,
  Code,
  Terminal,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Usb,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  arduinoBlocks,
  arduinoBlockCategories,
  getArduinoBlockById,
  type PlacedArduinoBlock,
  type ArduinoBlockDefinition,
} from "@/lib/arduino-blocks";
import {
  generateCode,
  generateLedOnCode,
  generateLedBlinkCode,
  validateArduinoCode,
} from "@/lib/arduino-code-generator";

// =============================================================================
// TYPES
// =============================================================================

interface ArduinoStatus {
  cliInstalled: boolean;
  cliVersion?: string;
  cliPath?: string;
  coreInstalled: boolean;
  boards: Array<{ port: string; board: string }>;
  config: { fqbn: string; port: string };
}

interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ArduinoCodeEditor() {
  const { toast } = useToast();
  
  // Block state
  const [placedBlocks, setPlacedBlocks] = useState<PlacedArduinoBlock[]>([]);
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  // Code state
  const [pythonCode, setPythonCode] = useState("# No blocks added yet");
  const [arduinoCode, setArduinoCode] = useState("");
  
  // Arduino status
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoStatus | null>(null);
  const [selectedPort, setSelectedPort] = useState<string>("COM11");
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [manualPort, setManualPort] = useState<string>("COM11");
  const [useManualPort, setUseManualPort] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  // UI state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["led", "digital"])
  );
  const [showPythonPanel, setShowPythonPanel] = useState(true);
  const [showArduinoPanel, setShowArduinoPanel] = useState(true);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Check Arduino status on mount
  useEffect(() => {
    checkArduinoStatus();
    fetchAvailablePorts();
    // Default to COM11 if available
    setSelectedPort("COM11");
    setManualPort("COM11");
  }, []);

  // Regenerate code when blocks change
  useEffect(() => {
    const result = generateCode(placedBlocks);
    setPythonCode(result.pythonCode);
    setArduinoCode(result.arduinoCode);
  }, [placedBlocks]);

  // ==========================================================================
  // API CALLS
  // ==========================================================================

  const checkArduinoStatus = async () => {
    try {
      const response = await fetch("/api/arduino/status");
      if (response.ok) {
        const status = await response.json();
        setArduinoStatus(status);
        if (status.boards.length > 0) {
          setSelectedPort(status.boards[0].port);
        }
      }
    } catch (error) {
      console.error("Failed to check Arduino status:", error);
    }
  };

  const fetchAvailablePorts = async () => {
    try {
      const response = await fetch("/api/arduino/ports");
      if (response.ok) {
        const data = await response.json();
        const ports = data.ports || [];
        setAvailablePorts(ports);
        
        // Auto-select COM11 if available, otherwise select first port
        if (ports.includes("COM11")) {
          setSelectedPort("COM11");
          setManualPort("COM11");
        } else if (ports.length > 0) {
          setSelectedPort(ports[0]);
          setManualPort(ports[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch ports:", error);
      // Fallback: add common COM ports
      const commonPorts = Array.from({ length: 20 }, (_, i) => `COM${i + 1}`);
      setAvailablePorts(commonPorts);
      setSelectedPort("COM11");
      setManualPort("COM11");
    }
  };

  const uploadToArduino = async () => {
    if (!arduinoCode.trim()) {
      toast({
        title: "No Code to Upload",
        description: "Add some blocks first to generate Arduino code.",
        variant: "destructive",
      });
      return;
    }

    // Validate code before upload
    const validation = validateArduinoCode(arduinoCode);
    if (!validation.valid) {
      toast({
        title: "Invalid Code",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    // Use manual port if enabled, otherwise use selected port
    const portToUse = useManualPort ? manualPort : selectedPort;
    
    if (!portToUse) {
      toast({
        title: "No Port Selected",
        description: "Please select or enter a COM port.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch("/api/arduino/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: arduinoCode,
          port: portToUse,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult({ success: true, message: result.message });
        toast({
          title: "Upload Successful! 🎉",
          description: "Code uploaded to Arduino. Check your LED!",
        });
      } else {
        // Check if error is about missing Arduino CLI
        const isCliError = result.error?.includes("Arduino CLI") || result.details?.includes("Arduino CLI");
        
        setUploadResult({
          success: false,
          error: result.error,
          details: result.details,
        });
        
        if (isCliError) {
          toast({
            title: "Arduino CLI Not Found",
            description: "Please install Arduino CLI first. See instructions below.",
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: result.error || "Unknown error",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        error: "Network error",
        details: error.message,
      });
      toast({
        title: "Upload Failed",
        description: "Could not connect to server",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const installArduinoCore = async () => {
    try {
      toast({ title: "Installing Arduino Core...", description: "This may take a few minutes" });
      const response = await fetch("/api/arduino/install-core", { method: "POST" });
      const result = await response.json();
      
      if (result.success) {
        toast({ title: "Core Installed!", description: "Arduino AVR core is ready" });
        checkArduinoStatus();
      } else {
        toast({ title: "Installation Failed", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Installation Failed", description: "Network error", variant: "destructive" });
    }
  };

  // ==========================================================================
  // BLOCK HANDLERS
  // ==========================================================================

  const handlePlaceBlock = useCallback((blockId: string, x: number, y: number) => {
    const definition = getArduinoBlockById(blockId);
    if (!definition) return;

    const newBlock: PlacedArduinoBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockId,
      x,
      y,
      fieldValues: Object.fromEntries(
        Object.entries(definition.fields).map(([key, field]) => [key, field.default])
      ),
    };

    setPlacedBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockType(null);
    setSelectedBlockId(newBlock.id);
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setPlacedBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

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

  const handleClearCanvas = () => {
    setPlacedBlocks([]);
    setSelectedBlockId(null);
    setSelectedBlockType(null);
  };

  // Quick test buttons
  const addLedOnBlock = () => {
    handlePlaceBlock("led_on", 100, 100);
  };

  const addLedBlinkBlocks = () => {
    handlePlaceBlock("led_blink", 100, 100);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ════════════════════════════════════════════════════════════════════
            LEFT SIDEBAR - Block Palette
        ════════════════════════════════════════════════════════════════════ */}
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Arduino Blocks</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Drag blocks to canvas
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {arduinoBlockCategories.map((category) => {
                const categoryBlocks = arduinoBlocks.filter(
                  (b) => b.category === category.id
                );
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id} className="mb-2">
                    <button
                      onClick={() => {
                        setExpandedCategories((prev) => {
                          const next = new Set(prev);
                          if (next.has(category.id)) {
                            next.delete(category.id);
                          } else {
                            next.add(category.id);
                          }
                          return next;
                        });
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm font-medium"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.label}
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {categoryBlocks.length}
                      </Badge>
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {categoryBlocks.map((block) => (
                          <button
                            key={block.id}
                            onClick={() => setSelectedBlockType(block.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                              "hover:bg-accent",
                              selectedBlockType === block.id &&
                                "bg-primary text-primary-foreground"
                            )}
                            style={{
                              borderLeft: `3px solid ${block.color}`,
                            }}
                          >
                            {block.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="p-3 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quick Test</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={addLedOnBlock}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Add LED ON Block
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={addLedBlinkBlocks}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Add LED Blink Block
            </Button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            CENTER - Block Canvas
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
              disabled={placedBlocks.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">
              {placedBlocks.length} block{placedBlocks.length !== 1 ? "s" : ""}
            </span>
            <div className="flex-1" />
            {selectedBlockType && (
              <Badge variant="secondary">
                Click canvas to place: {getArduinoBlockById(selectedBlockType)?.label}
              </Badge>
            )}
          </div>

          {/* Canvas */}
          <div
            className="flex-1 bg-muted/30 relative overflow-auto"
            onClick={(e) => {
              if (selectedBlockType && e.target === e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                handlePlaceBlock(
                  selectedBlockType,
                  e.clientX - rect.left,
                  e.clientY - rect.top
                );
              }
            }}
          >
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Blocks */}
            {placedBlocks.map((block) => {
              const definition = getArduinoBlockById(block.blockId);
              if (!definition) return null;

              return (
                <div
                  key={block.id}
                  className={cn(
                    "absolute rounded-lg border shadow-lg bg-card cursor-move",
                    selectedBlockId === block.id && "ring-2 ring-primary"
                  )}
                  style={{
                    left: block.x,
                    top: block.y,
                    minWidth: 200,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBlockId(block.id);
                  }}
                  onDoubleClick={() => handleDeleteBlock(block.id)}
                >
                  {/* Header */}
                  <div
                    className="px-3 py-2 font-semibold text-white rounded-t-lg text-sm"
                    style={{ backgroundColor: definition.color }}
                  >
                    {definition.label}
                    <Badge
                      variant="secondary"
                      className="ml-2 text-[10px] bg-white/20"
                    >
                      {definition.section}
                    </Badge>
                  </div>

                  {/* Fields */}
                  {Object.keys(definition.fields).length > 0 && (
                    <div className="p-3 space-y-2">
                      {Object.entries(definition.fields).map(([key, field]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Label className="text-xs w-20 shrink-0">
                            {field.label}:
                          </Label>
                          {field.type === "select" ? (
                            <Select
                              value={String(block.fieldValues[key])}
                              onValueChange={(v) =>
                                handleUpdateBlockValues(block.id, {
                                  ...block.fieldValues,
                                  [key]: v,
                                })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "toggle" ? (
                            <Button
                              variant={block.fieldValues[key] ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                handleUpdateBlockValues(block.id, {
                                  ...block.fieldValues,
                                  [key]: !block.fieldValues[key],
                                })
                              }
                            >
                              {block.fieldValues[key] ? "ON" : "OFF"}
                            </Button>
                          ) : (
                            <Input
                              type={field.type}
                              value={block.fieldValues[key]}
                              onChange={(e) =>
                                handleUpdateBlockValues(block.id, {
                                  ...block.fieldValues,
                                  [key]:
                                    field.type === "number"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                })
                              }
                              className="h-7 text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {placedBlocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-lg border">
                  <Cpu className="w-12 h-12 mx-auto mb-4 text-primary opacity-50" />
                  <h3 className="font-semibold mb-1">Start Building</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Select a block from the sidebar and click on the canvas to
                    place it
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT SIDEBAR - Code Panels & Upload
        ════════════════════════════════════════════════════════════════════ */}
        <div className="w-80 border-l border-border bg-card flex flex-col">
          {/* Arduino Status */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Usb className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Arduino Connection</span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    fetchAvailablePorts();
                    checkArduinoStatus();
                  }}
                  title="Refresh ports"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {arduinoStatus ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  {arduinoStatus.cliInstalled ? (
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span>Arduino CLI</span>
                      {arduinoStatus.cliVersion && (
                        <Badge variant="outline" className="text-[9px] px-1">
                          {arduinoStatus.cliVersion}
                        </Badge>
                      )}
                    </div>
                    {!arduinoStatus.cliInstalled && arduinoStatus.cliPath && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Path: {arduinoStatus.cliPath}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {arduinoStatus.coreInstalled ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-500" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={installArduinoCore}
                        disabled={!arduinoStatus.cliInstalled}
                      >
                        Install Core
                      </Button>
                    </>
                  )}
                  <span>AVR Core</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="use-manual-port"
                      checked={useManualPort}
                      onChange={(e) => setUseManualPort(e.target.checked)}
                      className="h-3 w-3"
                    />
                    <Label htmlFor="use-manual-port" className="text-xs cursor-pointer">
                      Enter port manually
                    </Label>
                  </div>
                  
                  {useManualPort ? (
                    <Input
                      type="text"
                      value={manualPort}
                      onChange={(e) => setManualPort(e.target.value.toUpperCase())}
                      placeholder="COM11"
                      className="h-7 text-xs"
                    />
                  ) : (
                    <Select value={selectedPort} onValueChange={(v) => {
                      setSelectedPort(v);
                      setManualPort(v);
                    }}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select port" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePorts.length > 0 ? (
                          availablePorts.map((port) => (
                            <SelectItem key={port} value={port}>
                              {port}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="COM11">COM11 (Manual)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Checking status...</p>
            )}
          </div>

          {/* Upload Button */}
          <div className="p-3 border-b border-border">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={uploadToArduino}
              disabled={isUploading || !arduinoCode.trim()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload to Arduino"}
            </Button>

            {uploadResult && (
              <div
                className={cn(
                  "mt-2 p-2 rounded text-xs",
                  uploadResult.success
                    ? "bg-green-500/10 text-green-600"
                    : "bg-red-500/10 text-red-600"
                )}
              >
                {uploadResult.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {uploadResult.message}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <XCircle className="h-4 w-4" />
                      {uploadResult.error}
                    </div>
                    {uploadResult.details && (
                      <p className="mt-1 text-[10px] opacity-80">
                        {uploadResult.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Python Code Panel (Display Only) */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-border">
            <button
              onClick={() => setShowPythonPanel(!showPythonPanel)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent"
            >
              <Code className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Python Preview</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                Display Only
              </Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  !showPythonPanel && "-rotate-90"
                )}
              />
            </button>
            {showPythonPanel && (
              <div className="flex-1 overflow-auto">
                <pre className="p-3 text-xs font-mono text-muted-foreground bg-muted/30 min-h-full">
                  {pythonCode}
                </pre>
              </div>
            )}
          </div>

          {/* Arduino Code Panel (Upload Code) */}
          <div className="flex-1 flex flex-col min-h-0">
            <button
              onClick={() => setShowArduinoPanel(!showArduinoPanel)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent"
            >
              <Terminal className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Arduino C++ Code</span>
              <Badge variant="default" className="ml-auto text-[10px]">
                Upload
              </Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  !showArduinoPanel && "-rotate-90"
                )}
              />
            </button>
            {showArduinoPanel && (
              <div className="flex-1 overflow-auto">
                <pre className="p-3 text-xs font-mono text-foreground bg-background min-h-full">
                  {arduinoCode || "// Add blocks to generate code"}
                </pre>
              </div>
            )}
          </div>

          {/* Arduino CLI Installation Instructions */}
          {(!arduinoStatus?.cliInstalled || uploadResult?.error?.includes("Arduino CLI") || uploadResult?.error?.includes("not found")) && (
            <div className="p-3 border-t border-border bg-blue-500/10">
              <div className="flex items-start gap-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-blue-700 dark:text-blue-400 flex-1">
                  <p className="font-medium mb-1">Arduino CLI Not Found</p>
                  {arduinoStatus?.cliPath && (
                    <p className="text-[10px] mb-2 opacity-80">
                      Searched: {arduinoStatus.cliPath}
                    </p>
                  )}
                  <div className="opacity-80 space-y-1 text-[10px]">
                    <p><strong>Solution:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Install Arduino CLI:
                        <code className="block bg-background/50 p-1 rounded mt-1 text-[9px]">
                          choco install arduino-cli
                        </code>
                        <span className="text-[9px] block mt-1">Or download from:</span>
                        <a 
                          href="https://arduino.github.io/arduino-cli/installation/" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-[9px]"
                        >
                          arduino-cli installation guide
                        </a>
                      </li>
                      <li className="mt-2">
                        <strong>IMPORTANT:</strong> After installation, you must:
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                          <li>Close this terminal/server</li>
                          <li>Open a NEW terminal</li>
                          <li>Restart the server: <code className="bg-background/50 px-1 rounded text-[9px]">npm run dev</code></li>
                        </ul>
                      </li>
                      <li className="mt-1">
                        Verify installation: <code className="bg-background/50 px-1 rounded text-[9px]">arduino-cli version</code>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="p-3 border-t border-border bg-yellow-500/10">
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-yellow-700 dark:text-yellow-400">
                <p className="font-medium">Python is for display only!</p>
                <p className="opacity-80">
                  Only Arduino C++ code is uploaded to hardware.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

