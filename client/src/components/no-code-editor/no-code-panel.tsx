import { useState, useEffect } from "react";
import { Play, Square, RotateCcw, Zap, AlertTriangle, CheckCircle, MousePointer2, Bug, ChevronDown, Terminal, Info, Upload, Cpu, RefreshCw, Loader2, XCircle, Usb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ControlPanelProps {
  isRunning: boolean;
  ledState: boolean;
  errorMessage: string | null;
  wireMode: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleWireMode: () => void;
  onToggleDebugPanel: () => void;
  showDebugPanel: boolean;
  componentCount: number;
  wireCount: number;
  // Arduino code props
  arduinoCode?: string;
  onArduinoCodeChange?: (code: string) => void;
  isUploading?: boolean;
  onUpload?: () => void;
  arduinoStatus?: any;
  selectedPort?: string;
  availablePorts?: string[];
  manualPort?: string;
  useManualPort?: boolean;
  onPortChange?: (port: string) => void;
  onManualPortChange?: (port: string) => void;
  onUseManualPortChange?: (use: boolean) => void;
  onRefreshPorts?: () => void;
  outputContent?: string;
}

export function NocodePanel({
  isRunning,
  ledState,
  errorMessage,
  wireMode,
  onRun,
  onStop,
  onReset,
  onToggleWireMode,
  onToggleDebugPanel,
  showDebugPanel,
  componentCount,
  wireCount,
  arduinoCode = "",
  onArduinoCodeChange,
  isUploading = false,
  onUpload,
  arduinoStatus,
  selectedPort = "COM11",
  availablePorts = [],
  manualPort = "COM11",
  useManualPort = false,
  onPortChange,
  onManualPortChange,
  onUseManualPortChange,
  onRefreshPorts,
  outputContent: propOutputContent = '>>> Welcome to the No-Code Editor\n>>> Serial.print output will appear here',
}: ControlPanelProps) {
  const [arduinoExpanded, setArduinoExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(false);
  const [circuitExpanded, setCircuitExpanded] = useState(true);
  const [arduinoExpandedSection, setArduinoExpandedSection] = useState(false);
  const [outputContent, setOutputContent] = useState(propOutputContent);
  
  // Update output content when prop changes
  useEffect(() => {
    setOutputContent(propOutputContent);
  }, [propOutputContent]);

  const expandedCount = [arduinoExpanded, outputExpanded, circuitExpanded, arduinoExpandedSection].filter(Boolean).length;
  
  const arduinoLines = arduinoCode.split('\n').length;
  const outputLines = outputContent.split('\n').length;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Arduino Upload Button - Top of Panel */}
      <div className="border-b border-border p-3 shrink-0 bg-muted/30">
        <Button
          onClick={onUpload}
          disabled={isUploading || !arduinoCode || arduinoCode.trim().length === 0}
          className="w-full"
          size="sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload to Arduino
            </>
          )}
        </Button>
      </div>

      {/* Arduino Code Section */}
      <div className={cn(
        "border-b border-border flex flex-col min-h-0",
        arduinoExpanded && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setArduinoExpanded(!arduinoExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors shrink-0"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-600" />
            <h2 className="font-semibold text-sm text-foreground">Embedded</h2>
            <Badge variant="outline" className="text-[9px] px-1">Editable</Badge>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              !arduinoExpanded && "-rotate-90"
            )}
          />
        </button>
        {arduinoExpanded && (
          <div className="flex-1 flex flex-col bg-card min-h-0 overflow-hidden border border-border">
            <div className="flex-1 overflow-auto flex items-start">
              {/* Sidebar - Position Sticky keeps numbers visible while scrolling right */}
              <div className="w-10 bg-muted border-r border-border py-2 text-right shrink-0 sticky left-0 z-10">
                {arduinoCode.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-muted-foreground px-2 leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>
              
              <textarea
                value={arduinoCode}
                onChange={(e) => onArduinoCodeChange?.(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none leading-5 bg-background overflow-hidden"
                spellCheck={false}
                rows={arduinoCode.split('\n').length} 
                style={{ minHeight: '100%', whiteSpace: 'pre' }}
              />
            </div>

            {/* Footer */}
            <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border bg-muted shrink-0">
              {arduinoLines} {arduinoLines === 1 ? 'line' : 'lines'} (Editable - Upload uses this code)
            </div>
          </div>
        )}
      </div>

      {/* Output Section */}
      <div className={cn(
        "border-b border-border flex flex-col min-h-0",
        outputExpanded && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setOutputExpanded(!outputExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors shrink-0"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-600" />
            <h2 className="font-semibold text-sm text-foreground">Output</h2>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              !outputExpanded && "-rotate-90"
            )}
          />
        </button>
        {outputExpanded && (
          <div className="flex-1 flex flex-col bg-card min-h-0 overflow-hidden">
            <div className="flex-1 flex overflow-auto min-h-0">
              <div className="w-10 bg-muted border-r border-border py-2 text-right shrink-0 sticky top-0">
                {outputContent.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-muted-foreground px-2 leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                value={outputContent}
                onChange={(e) => setOutputContent(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none leading-5 bg-background"
                spellCheck={false}
                style={{ minHeight: '100%' }}
              />
            </div>
            <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border bg-muted shrink-0">
              {outputLines} {outputLines === 1 ? 'line' : 'lines'}
            </div>
          </div>
        )}
      </div>

      {/* Arduino Upload Section */}
      <div className={cn(
        "border-b border-border flex flex-col min-h-0",
        arduinoExpandedSection && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setArduinoExpandedSection(!arduinoExpandedSection)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors shrink-0"
        >
          <div className="flex items-center gap-2">
            <Usb className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-sm text-foreground">Arduino Upload</h2>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              !arduinoExpandedSection && "-rotate-90"
            )}
          />
        </button>
        {arduinoExpandedSection && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 pb-4 space-y-3">
            {/* Arduino Status */}
            {arduinoStatus && (
              <div className="flex justify-around items-center space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  {arduinoStatus.cliInstalled ? (
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span>Arduino CLI</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {arduinoStatus.coreInstalled ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span>AVR Core</span>
                </div>
              </div>
            )}

            {/* Port Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Serial Port</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manual-port-checkbox"
                  checked={useManualPort}
                  onCheckedChange={(checked) => onUseManualPortChange?.(!!checked)}
                />
                <Label htmlFor="manual-port-checkbox" className="text-xs font-medium leading-none">
                  Enter port manually
                </Label>
              </div>
              {useManualPort ? (
                <Input
                  type="text"
                  value={manualPort}
                  onChange={(e) => onManualPortChange?.(e.target.value)}
                  placeholder="e.g., COM11 or /dev/ttyUSB0"
                  className="h-8 text-xs"
                />
              ) : (
                <Select value={selectedPort} onValueChange={onPortChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select port" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(availablePorts) && availablePorts.length > 0 ? (
                      availablePorts.map((port) => (
                        <SelectItem key={port} value={port}>
                          {port}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No ports available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={onRefreshPorts}
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-2" /> Refresh Ports
              </Button>
            </div>

            {/* Arduino CLI Installation Instructions */}
            {arduinoStatus && !arduinoStatus.cliInstalled && (
              <Alert variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3" />
                <AlertTitle className="text-xs">Arduino CLI Not Found</AlertTitle>
                <AlertDescription className="text-[10px] mt-1">
                  <p>Please install Arduino CLI and restart the server.</p>
                  <p className="mt-1">Windows: <code>choco install arduino-cli</code></p>
                </AlertDescription>
              </Alert>
            )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Circuit Info Section */}
      <div className={cn(
        "border-b border-border flex flex-col min-h-0",
        circuitExpanded && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setCircuitExpanded(!circuitExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors shrink-0"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-sm text-foreground">Circuit Info</h2>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              !circuitExpanded && "-rotate-90"
            )}
          />
        </button>
        {circuitExpanded && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 pb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Components:</span>
              <span className="text-foreground">{componentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections:</span>
              <span className="text-foreground">{wireCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn(
                "flex items-center gap-1",
                isRunning ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}>
                {isRunning ? <CheckCircle className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
