import { ChevronDown, ChevronRight, Zap, Circle, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { SimulationResult, Net, Circuit } from "@/lib/simulation-engine";

interface DebugPanelProps {
  simulationResult: SimulationResult | null;
  isRunning: boolean;
}

function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 hover-elevate"
        data-testid={`debug-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function NetDisplay({ net, index }: { net: Net; index: number }) {
  const voltageColor = net.isPower
    ? "text-red-500"
    : net.isGround
    ? "text-gray-500"
    : "text-blue-500";

  return (
    <div
      className="p-2 rounded-md bg-muted/50 text-xs space-y-1"
      data-testid={`debug-net-${net.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-medium">Net {index + 1}</span>
        <div className="flex items-center gap-1">
          {net.isPower && (
            <Badge variant="destructive" className="text-xs">
              PWR
            </Badge>
          )}
          {net.isGround && (
            <Badge variant="secondary" className="text-xs">
              GND
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Zap className={cn("h-3 w-3", voltageColor)} />
        <span className={voltageColor}>
          {isNaN(net.voltage) ? "Floating" : `${net.voltage.toFixed(2)}V`}
        </span>
      </div>
      <div className="text-muted-foreground">
        {net.terminals.length} terminal{net.terminals.length !== 1 ? "s" : ""} connected
      </div>
    </div>
  );
}

function CircuitDisplay({ circuit, index }: { circuit: Circuit; index: number }) {
  return (
    <div
      className="p-2 rounded-md bg-muted/50 text-xs space-y-2"
      data-testid={`debug-circuit-${circuit.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-medium">Circuit {index + 1}</span>
        <div className="flex items-center gap-1">
          {circuit.isComplete ? (
            <Badge variant="default" className="bg-green-600 text-xs">
              Complete
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Incomplete
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
        <div className="flex items-center gap-1">
          <Circle className={cn("h-2 w-2", circuit.hasPower ? "fill-red-500 text-red-500" : "fill-gray-400 text-gray-400")} />
          Power: {circuit.hasPower ? "Yes" : "No"}
        </div>
        <div className="flex items-center gap-1">
          <Circle className={cn("h-2 w-2", circuit.hasGround ? "fill-gray-600 text-gray-600" : "fill-gray-400 text-gray-400")} />
          Ground: {circuit.hasGround ? "Yes" : "No"}
        </div>
      </div>
      <div className="text-muted-foreground">
        {circuit.components.length} component{circuit.components.length !== 1 ? "s" : ""}, {circuit.nets.length} net{circuit.nets.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function ComponentStateDisplay({
  componentId,
  state,
}: {
  componentId: string;
  state: { type: string; isActive: boolean; powered: boolean; properties: Record<string, unknown> };
}) {
  return (
    <div
      className="p-2 rounded-md bg-muted/50 text-xs space-y-1"
      data-testid={`debug-component-${componentId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-medium capitalize">{state.type}</span>
        <div className="flex items-center gap-1">
          {state.powered && (
            <Badge variant="default" className="bg-green-600 text-xs">
              Powered
            </Badge>
          )}
          {state.isActive && (
            <Badge variant="default" className="bg-yellow-600 text-xs">
              Active
            </Badge>
          )}
        </div>
      </div>
      {Object.entries(state.properties).length > 0 && (
        <div className="text-muted-foreground font-mono">
          {Object.entries(state.properties)
            .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== "")
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k}>
                {k}: {typeof v === "boolean" ? (v ? "true" : "false") : String(v)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function DebugPanel({ simulationResult, isRunning }: DebugPanelProps) {
  const circuits = simulationResult?.circuits || [];
  const errors = simulationResult?.errors || [];
  const componentStates = simulationResult?.componentStates || new Map();
  const netStates = simulationResult?.netStates || new Map();

  const allNets: Net[] = circuits.flatMap((c) => c.nets);
  const uniqueNets = Array.from(new Map(allNets.map((n) => [n.id, n])).values());

  return (
    <div className="flex flex-col bg-card border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )}
          />
          <h2 className="font-semibold text-sm">Debug Panel</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRunning ? "Simulation active" : "Simulation stopped"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          <CollapsibleSection title="Errors" count={errors.length} defaultOpen={errors.length > 0}>
            {errors.length === 0 ? (
              <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 text-green-700 text-xs">
                <CheckCircle className="h-3 w-3" />
                No errors detected
              </div>
            ) : (
              <div className="space-y-2">
                {errors.map((error, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{error.type.replace(/_/g, " ")}</div>
                      <div className="text-destructive/80">{error.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Circuits" count={circuits.length}>
            {circuits.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">No circuits detected</div>
            ) : (
              <div className="space-y-2">
                {circuits.map((circuit, i) => (
                  <CircuitDisplay key={circuit.id} circuit={circuit} index={i} />
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Nets" count={uniqueNets.length}>
            {uniqueNets.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">No nets detected</div>
            ) : (
              <div className="space-y-2">
                {uniqueNets.map((net, i) => (
                  <NetDisplay key={net.id} net={net} index={i} />
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Components" count={componentStates.size}>
            {componentStates.size === 0 ? (
              <div className="text-xs text-muted-foreground p-2">No components</div>
            ) : (
              <div className="space-y-2">
                {Array.from(componentStates.entries()).map(([id, state]) => (
                  <ComponentStateDisplay key={id} componentId={id} state={state} />
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Net Voltages" count={netStates.size}>
            {netStates.size === 0 ? (
              <div className="text-xs text-muted-foreground p-2">No net voltages</div>
            ) : (
              <div className="space-y-1">
                {Array.from(netStates.entries()).map(([id, state]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs"
                  >
                    <span className="font-mono">{id}</span>
                    <span className={cn(
                      state.isPower ? "text-red-500" : state.isGround ? "text-gray-500" : "text-blue-500"
                    )}>
                      {isNaN(state.voltage) ? "Floating" : `${state.voltage.toFixed(2)}V`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </ScrollArea>
    </div>
  );
}
