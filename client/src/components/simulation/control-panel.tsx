import { Play, Square, RotateCcw, Zap, AlertTriangle, CheckCircle, MousePointer2, Bug, Volume2, VolumeX, Save, FolderOpen, FileJson, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
  onToggleLogicPanel: () => void;
  showLogicPanel: boolean;
  hasMcu: boolean;
  componentCount: number;
  wireCount: number;
  selectedResistorId: string | null;
  selectedResistorValue: number | null;
  onChangeResistorValue: (id: string, value: number) => void;
  selectedPotentiometerId: string | null;
  potentiometerValue: number | null;
  onChangePotentiometerValue: (id: string, value: number) => void;
  selectedDht11Id: string | null;
  dht11Temperature: number | null;
  dht11Humidity: number | null;
  onChangeDht11Values: (id: string, temperature: number, humidity: number) => void;
  selectedServoId: string | null;
  servoAngle: number | null;
  onChangeServoAngle: (id: string, angle: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  // Circuit file operations
  onSaveCircuit: () => void;
  onLoadCircuit: () => void;
  isDirty: boolean;
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
  onToggleLogicPanel,
  showLogicPanel,
  hasMcu,
  componentCount,
  wireCount,
  selectedResistorId,
  selectedResistorValue,
  onChangeResistorValue,
  selectedPotentiometerId,
  potentiometerValue,
  onChangePotentiometerValue,
  selectedDht11Id,
  dht11Temperature,
  dht11Humidity,
  onChangeDht11Values,
  selectedServoId,
  servoAngle,
  onChangeServoAngle,
  soundEnabled,
  onToggleSound,
  onSaveCircuit,
  onLoadCircuit,
  isDirty,
}: ControlPanelProps) {
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col overflow-y-auto">
      {/* Circuit File Operations - Same style as No-Code Editor */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <FileJson className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Circuit</h2>
          {isDirty && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-0.5 rounded-full">
              Unsaved
            </span>
          )}
        </div>
        <div className="space-y-2">
          <Button
            onClick={onSaveCircuit}
            variant="outline"
            className="w-full justify-start gap-2"
            data-testid="button-save-circuit"
          >
            <Save className="h-4 w-4" />
            Save Circuit
          </Button>
          
          <Button
            onClick={onLoadCircuit}
            variant="outline"
            className="w-full justify-start gap-2"
            data-testid="button-load-circuit"
          >
            <FolderOpen className="h-4 w-4" />
            Load Circuit
          </Button>
        </div>
      </div>

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

          <Button
            onClick={onToggleLogicPanel}
            variant={showLogicPanel ? "default" : "outline"}
            className={cn(
              "w-full justify-start gap-2",
              hasMcu && "ring-1 ring-primary/30"
            )}
            data-testid="button-toggle-logic"
          >
            <Cpu className="h-4 w-4" />
            Logic / Code Panel
            {hasMcu && (
              <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                MCU
              </span>
            )}
          </Button>

          <Button
            onClick={onToggleSound}
            variant={soundEnabled ? "default" : "outline"}
            className="w-full justify-start gap-2"
            data-testid="button-toggle-sound"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            {soundEnabled ? "Buzzer Sound: ON" : "Buzzer Sound: OFF"}
          </Button>
        </div>
      </div>

      {/* Status Panel - Color coded */}
      <div className={`rounded-lg border p-4 ${
        isRunning && !errorMessage
          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
          : errorMessage
          ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
          : "bg-card text-card-foreground"
      }`}>
        <h2 className="font-semibold text-sm mb-3">Status</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-white/50 dark:bg-black/20" data-testid="status-simulation-state">
            <span className="text-sm opacity-80">State</span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isRunning && !errorMessage ? "bg-green-500 animate-pulse" : errorMessage ? "bg-red-500" : "bg-gray-400"
                )}
              />
              <span className="text-sm font-medium" data-testid="text-simulation-state">
                {errorMessage ? "Error" : isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-white/50 dark:bg-black/20" data-testid="status-led-state">
            <span className="text-sm opacity-80">LED</span>
            <div className="flex items-center gap-2">
              <Zap
                className={cn(
                  "h-4 w-4 transition-colors",
                  ledState && isRunning && !errorMessage ? "text-yellow-500" : "text-gray-400"
                )}
              />
              <span className="text-sm font-medium" data-testid="text-led-state">
                {ledState && isRunning && !errorMessage ? "ON" : "OFF"}
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

      {/* Potentiometer Control */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">Potentiometer</h2>
        {selectedPotentiometerId && potentiometerValue !== null ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Position</Label>
              <span className="text-sm font-medium text-primary">
                {Math.round(potentiometerValue * 100)}%
              </span>
            </div>
            <Slider
              value={[potentiometerValue]}
              onValueChange={(values) =>
                onChangePotentiometerValue(selectedPotentiometerId, values[0])
              }
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0V</span>
              <span>{(potentiometerValue * 5).toFixed(1)}V</span>
              <span>5V</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select a potentiometer on the canvas to adjust its value.
          </p>
        )}
      </div>

      {/* DHT11 Control */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">DHT11 Sensor</h2>
        {selectedDht11Id && dht11Temperature !== null && dht11Humidity !== null ? (
          <div className="space-y-4">
            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Temperature (°C)</Label>
                <span className="text-sm font-medium text-primary">
                  {Math.round(dht11Temperature)}°C
                </span>
              </div>
              <Slider
                value={[dht11Temperature]}
                onValueChange={(values) =>
                  onChangeDht11Values(selectedDht11Id, values[0], dht11Humidity)
                }
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0°C</span>
                <span>50°C</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Humidity (%)</Label>
                <span className="text-sm font-medium text-primary">
                  {Math.round(dht11Humidity)}%
                </span>
              </div>
              <Slider
                value={[dht11Humidity]}
                onValueChange={(values) =>
                  onChangeDht11Values(selectedDht11Id, dht11Temperature, values[0])
                }
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select a DHT11 sensor on the canvas to adjust temperature and humidity.
          </p>
        )}
      </div>

      {/* Servo Motor Control */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">Servo Motor</h2>
        {selectedServoId && servoAngle !== null ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Angle</Label>
              <span className="text-sm font-medium text-primary">
                {Math.round(servoAngle)}°
              </span>
            </div>
            <Slider
              value={[servoAngle]}
              onValueChange={(values) =>
                onChangeServoAngle(selectedServoId, values[0])
              }
              min={0}
              max={180}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Manual control. If SIGNAL pin is driven by MCU, angle follows that voltage.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select a servo motor on the canvas to adjust its angle.
          </p>
        )}
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
