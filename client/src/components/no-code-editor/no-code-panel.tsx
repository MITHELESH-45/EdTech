import { useState } from "react";
import { Play, Square, RotateCcw, Zap, AlertTriangle, CheckCircle, MousePointer2, Bug, ChevronDown, Code, Terminal, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  generatedCode?: string;
  onCodeChange?: (code: string) => void;
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
  generatedCode = "# No code generated yet\n",
  onCodeChange,
}: ControlPanelProps) {
  const [codeExpanded, setCodeExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [circuitExpanded, setCircuitExpanded] = useState(true);
  const [outputContent, setOutputContent] = useState('>>> Welcome to the No-Code Editor\n>>> Generated Python code will appear here');

  const expandedCount = [codeExpanded, outputExpanded, circuitExpanded].filter(Boolean).length;
  
  const codeLines = generatedCode.split('\n').length;
  const outputLines = outputContent.split('\n').length;

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-[100vh]">
      {/* Generated Code Section */}
      <div className={cn(
        "border-b border-border flex flex-col",
        codeExpanded && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setCodeExpanded(!codeExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-sm text-foreground">Generated Code</h2>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              !codeExpanded && "-rotate-90"
            )}
          />
        </button>
        {codeExpanded && (
          <div className="flex-1 flex flex-col bg-card">
            <div className="flex-1 flex">
              <div className="w-10 bg-muted border-r border-border py-2 text-right">
                {generatedCode.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-muted-foreground px-2 leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                value={generatedCode}
                onChange={(e) => onCodeChange?.(e.target.value)}
                readOnly={!onCodeChange}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none leading-5 bg-background",
                  !onCodeChange && "bg-muted cursor-default"
                )}
                spellCheck={false}
              />
            </div>
            <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border bg-muted">
              {codeLines} {codeLines === 1 ? 'line' : 'lines'}
            </div>
          </div>
        )}
      </div>

      {/* Output Section */}
      <div className={cn(
        "border-b border-border flex flex-col",
        outputExpanded && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setOutputExpanded(!outputExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors"
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
          <div className="flex-1 flex flex-col bg-card">
            <div className="flex-1 flex">
              <div className="w-10 bg-muted border-r border-border py-2 text-right">
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
              />
            </div>
            <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border bg-muted">
              {outputLines} {outputLines === 1 ? 'line' : 'lines'}
            </div>
          </div>
        )}
      </div>

      {/* Circuit Info Section */}
      <div className={cn(
        "border-b border-border flex flex-col",
        circuitExpanded && expandedCount > 0 && "flex-1"
      )}>
        <button
          onClick={() => setCircuitExpanded(!circuitExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors"
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
          <div className="px-4 pb-4 flex-1 overflow-auto space-y-2 text-sm">
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
        )}
      </div>
    </div>
  );
}
