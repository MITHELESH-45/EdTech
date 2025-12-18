import { Play, Square, RotateCcw, Zap, AlertTriangle, CheckCircle, MousePointer2, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  selectedResistorId: string | null;
  selectedResistorValue: number | null;
  onChangeResistorValue: (id: string, value: number) => void;
}

export function ControlPanel({
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
  selectedResistorId,
  selectedResistorValue,
  onChangeResistorValue,
}: ControlPanelProps) {
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">Controls</h2>
        <div className="space-y-2">
          <Button
            onClick={onToggleWireMode}
            variant={wireMode ? "default" : "outline"}
            className="w-full justify-start gap-2"
            data-testid="button-wire-mode"
          >
            <MousePointer2 className="h-4 w-4" />
            {wireMode ? "Wire Mode Active" : "Wire Mode"}
          </Button>
          
          <Separator className="my-3" />
          
          {!isRunning ? (
            <Button
              onClick={onRun}
              className="w-full justify-start gap-2"
              data-testid="button-run-simulation"
            >
              <Play className="h-4 w-4" />
              Run Simulation
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="w-full justify-start gap-2"
              data-testid="button-stop-simulation"
            >
              <Square className="h-4 w-4" />
              Stop Simulation
            </Button>
          )}
          
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full justify-start gap-2"
            data-testid="button-reset-circuit"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Circuit
          </Button>

          <Separator className="my-3" />

          <Button
            onClick={onToggleDebugPanel}
            variant={showDebugPanel ? "default" : "outline"}
            className="w-full justify-start gap-2"
            data-testid="button-toggle-debug"
          >
            <Bug className="h-4 w-4" />
            {showDebugPanel ? "Hide Debug Panel" : "Show Debug Panel"}
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">Status</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid="status-simulation-state">
            <span className="text-sm text-muted-foreground">State</span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )}
              />
              <span className="text-sm font-medium" data-testid="text-simulation-state">
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid="status-led-state">
            <span className="text-sm text-muted-foreground">LED</span>
            <div className="flex items-center gap-2">
              <Zap
                className={cn(
                  "h-4 w-4 transition-colors",
                  ledState && isRunning ? "text-yellow-500" : "text-gray-400"
                )}
              />
              <span className="text-sm font-medium" data-testid="text-led-state">
                {ledState && isRunning ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <h2 className="font-semibold text-sm mb-3">Circuit Info</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-muted/50 text-center">
            <div className="text-2xl font-bold text-foreground" data-testid="stat-component-count">{componentCount}</div>
            <div className="text-xs text-muted-foreground">Components</div>
          </div>
          <div className="p-3 rounded-md bg-muted/50 text-center">
            <div className="text-2xl font-bold text-foreground" data-testid="stat-wire-count">{wireCount}</div>
            <div className="text-xs text-muted-foreground">Wires</div>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Resistor Value
          </p>
          {selectedResistorId && selectedResistorValue !== null ? (
            <Input
              type="number"
              min={1}
              max={1000000}
              step={10}
              value={selectedResistorValue}
              onChange={(e) =>
                onChangeResistorValue(
                  selectedResistorId,
                  Math.max(1, Number(e.target.value) || 0)
                )
              }
              className="h-8 text-xs"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a resistor on the canvas to edit its value.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        <h2 className="font-semibold text-sm mb-3">Messages</h2>
        
        {errorMessage ? (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : isRunning && ledState ? (
          <div className="flex items-start gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Circuit is working correctly! LED is powered.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {componentCount === 0
                ? "Add components to build your circuit."
                : "Connect components and run the simulation to test your circuit."}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Quick Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>Connect LED + Resistor + 5V + GND for a basic circuit</li>
          <li>Use Wire Mode to connect component terminals</li>
          <li>Click Run to test your circuit</li>
        </ul>
      </div>
    </div>
  );
}
