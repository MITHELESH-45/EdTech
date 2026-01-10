import { useState } from "react";
import { Play, Square, RotateCcw, Zap, AlertTriangle, CheckCircle, MousePointer2, Bug, ChevronDown, Info, Cpu, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  outputContent?: string;
  onOpenVideoLibrary?: () => void;
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
  outputContent: propOutputContent = '>>> Welcome to the No-Code Editor\n>>> Serial.print output will appear here',
  onOpenVideoLibrary,
}: ControlPanelProps) {
  const [arduinoExpanded, setArduinoExpanded] = useState(true);
  const [circuitExpanded, setCircuitExpanded] = useState(true);

  const expandedCount = [arduinoExpanded, circuitExpanded].filter(Boolean).length;
  
  const arduinoLines = arduinoCode.split('\n').length;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Video Library Button - Top of Panel */}
      {onOpenVideoLibrary && (
        <div className="border-b border-border p-3 shrink-0 bg-muted/30">
          <Button
            onClick={onOpenVideoLibrary}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Video className="h-4 w-4 mr-2" />
            Video Library
          </Button>
        </div>
      )}

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
