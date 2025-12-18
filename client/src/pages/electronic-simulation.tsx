import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ComponentPalette } from "@/components/simulation/component-palette";
import { CircuitCanvas } from "@/components/simulation/circuit-canvas";
import { ControlPanel } from "@/components/simulation/control-panel";
import { DebugPanel } from "@/components/simulation/debug-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SimulationEngine,
  type SimulationResult,
  type McuPinStateMap,
  type PinLogicState,
} from "@/lib/simulation-engine";
import { componentMetadata, getTerminalPosition } from "@/lib/circuit-types";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";
import { LogicPanel } from "@/components/simulation/logic-panel";

interface ExtendedWire extends Wire {
  startTerminal?: { componentId: string; terminalId: string };
  endTerminal?: { componentId: string; terminalId: string };
}

function PaletteSkeleton() {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
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

export default function ElectronicSimulation() {
  const { toast } = useToast();
  const [selectedComponent, setSelectedComponent] = useState<ElectronicComponent | null>(null);
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [wires, setWires] = useState<ExtendedWire[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [wireMode, setWireMode] = useState(false);
  const [wireStart, setWireStart] = useState<{ x: number; y: number; terminal?: { componentId: string; terminalId: string } } | null>(null);
  const [selectedPlacedId, setSelectedPlacedId] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [resistorValues, setResistorValues] = useState<Record<string, number>>({});
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [mcuPinStates, setMcuPinStates] = useState<McuPinStateMap>({});

  const simulationEngine = useMemo(() => new SimulationEngine(), []);

  const { data: components, isLoading } = useQuery<ElectronicComponent[]>({
    queryKey: ["/api/components"],
  });

  const handleSelectComponent = (component: ElectronicComponent) => {
    setSelectedComponent(component);
    setWireMode(false);
    setWireStart(null);
    setSelectedPlacedId(null);
  };

  const handlePlaceComponent = useCallback(
    (component: ElectronicComponent, x: number, y: number) => {
      const newPlaced: PlacedComponent = {
        id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentId: component.id,
        x,
        y,
        rotation: 0,
      };
      setPlacedComponents((prev) => [...prev, newPlaced]);

      if (component.id === "resistor") {
        setResistorValues((prev) => ({
          ...prev,
          [newPlaced.id]: 220,
        }));
      }
    },
    []
  );

  const handleAddWire = useCallback((wire: Omit<ExtendedWire, "id">) => {
    const newWire: ExtendedWire = {
      ...wire,
      id: `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setWires((prev) => [...prev, newWire]);
  }, []);

  const handleToggleWireMode = () => {
    setWireMode(!wireMode);
    setSelectedComponent(null);
    setWireStart(null);
    setSelectedPlacedId(null);
    setSelectedWireId(null);
  };

  const handleSelectPlaced = (id: string | null) => {
    setSelectedPlacedId(id);
    setSelectedComponent(null);
    if (id) {
      setSelectedWireId(null);
    }
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedPlacedId) {
      setPlacedComponents((prev) => prev.filter((p) => p.id !== selectedPlacedId));
      setWires((prev) =>
        prev.filter(
          (w) =>
            w.startTerminal?.componentId !== selectedPlacedId &&
            w.endTerminal?.componentId !== selectedPlacedId
        )
      );
      setResistorValues((prev) => {
        const updated = { ...prev };
        delete updated[selectedPlacedId];
        return updated;
      });
      setSelectedPlacedId(null);
      toast({
        title: "Component deleted",
        description: "The component and its connected wires have been removed.",
      });
    }
  }, [selectedPlacedId, toast]);

  const handleChangeResistorValue = useCallback((id: string, value: number) => {
    setResistorValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const handleMovePlaced = useCallback((id: string, x: number, y: number) => {
    setPlacedComponents((prev) => {
      const current = prev.find((p) => p.id === id);
      if (!current) return prev;

      const updatedPlaced = prev.map((p) =>
        p.id === id ? { ...p, x, y } : p
      );

      const metadata = componentMetadata[current.componentId];
      if (!metadata) {
        return updatedPlaced;
      }

      // Update wire endpoints connected to this moved component
      setWires((prevWires) => {
        return prevWires.map((w) => {
          let startX = w.startX;
          let startY = w.startY;
          let endX = w.endX;
          let endY = w.endY;

          if (w.startTerminal?.componentId === id) {
            const term = metadata.terminals.find(
              (t) => t.id === w.startTerminal!.terminalId
            );
            if (term) {
              const pos = getTerminalPosition(x, y, current.rotation, term);
              startX = pos.x;
              startY = pos.y;
            }
          }

          if (w.endTerminal?.componentId === id) {
            const term = metadata.terminals.find(
              (t) => t.id === w.endTerminal!.terminalId
            );
            if (term) {
              const pos = getTerminalPosition(x, y, current.rotation, term);
              endX = pos.x;
              endY = pos.y;
            }
          }

          if (
            startX !== w.startX ||
            startY !== w.startY ||
            endX !== w.endX ||
            endY !== w.endY
          ) {
            return { ...w, startX, startY, endX, endY };
          }
          return w;
        });
      });

      return updatedPlaced;
    });
  }, []);

  const handleDeleteSelectedWire = useCallback(() => {
    if (!selectedWireId) return;
    setWires((prev) => prev.filter((w) => w.id !== selectedWireId));
    setSelectedWireId(null);
  }, [selectedWireId]);

  const runSimulation = useCallback(() => {
    simulationEngine.loadCircuit(placedComponents, wires);

    // Sync any edited resistor values into the simulation state
    Object.entries(resistorValues).forEach(([placedId, resistance]) => {
      simulationEngine.setResistorResistance(placedId, resistance);
    });

    const result = simulationEngine.simulate(mcuPinStates);
    setSimulationResult(result);
    return result;
  }, [simulationEngine, placedComponents, wires, resistorValues]);

  const handleRun = () => {
    const result = runSimulation();
    const hasBlockingError = result.errors.some((e) => e.severity === "error");
    const hasActiveComponent = Array.from(result.componentStates.values()).some(
      (state) => state.isActive
    );

    if (hasBlockingError || !result.isValid || !hasActiveComponent) {
      setIsRunning(false);
      const firstError = result.errors[0];
      toast({
        title: hasBlockingError || !result.isValid ? "Circuit Error" : "Circuit Incomplete",
        description:
          firstError?.message ??
          (hasActiveComponent
            ? "There is a problem with your circuit. Please fix the wiring and try again."
            : "No components are actually powered or active. Check your wiring and try again."),
        variant: hasBlockingError || !result.isValid ? "destructive" : "default",
      });
      // Ensure wires are not shown as active when the circuit is invalid
      setWires((prev) =>
        prev.map((w) => ({ ...w, isActive: false }))
      );
    } else if (result.isValid) {
      setIsRunning(true);
      setWires((prev) =>
        prev.map((w) => ({ ...w, isActive: true }))
      );
      toast({
        title: "Simulation Started",
        description: "Your circuit is now running.",
      });
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setWires((prev) =>
      prev.map((w) => ({ ...w, isActive: false }))
    );
    toast({
      title: "Simulation Stopped",
      description: "The simulation has been stopped.",
    });
  };

  const handleReset = () => {
    setPlacedComponents([]);
    setWires([]);
    setIsRunning(false);
    setSimulationResult(null);
    setSelectedComponent(null);
    setWireMode(false);
    setWireStart(null);
    setSelectedPlacedId(null);
    simulationEngine.reset();
    toast({
      title: "Circuit Reset",
      description: "All components and wires have been cleared.",
    });
  };

  const anyLedOn = useMemo(() => {
    if (!simulationResult) return false;
    for (const [, state] of simulationResult.componentStates) {
      if (state.type === "led" && state.isActive) {
        return true;
      }
    }
    return false;
  }, [simulationResult]);

  const errorMessage = useMemo(() => {
    if (!simulationResult) return null;
    if (simulationResult.errors.length > 0) {
      return simulationResult.errors[0].message;
    }
    return null;
  }, [simulationResult]);

  const selectedResistorId = useMemo(() => {
    if (!selectedPlacedId) return null;
    const placed = placedComponents.find((p) => p.id === selectedPlacedId);
    if (!placed || placed.componentId !== "resistor") return null;
    return selectedPlacedId;
  }, [selectedPlacedId, placedComponents]);

  const selectedResistorValue = useMemo(() => {
    if (!selectedResistorId) return null;
    return resistorValues[selectedResistorId] ?? 220;
  }, [selectedResistorId, resistorValues]);

  const hasMcu = useMemo(
    () =>
      placedComponents.some(
        (p) => p.componentId === "arduino-uno" || p.componentId === "esp32"
      ),
    [placedComponents]
  );

  const handleChangePinState = useCallback(
    (placedId: string, pinId: string, state: PinLogicState) => {
      setMcuPinStates((prev) => ({
        ...prev,
        [placedId]: {
          ...(prev[placedId] ?? {}),
          [pinId]: state,
        },
      }));
    },
    []
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 flex-shrink-0">
          {isLoading ? (
            <PaletteSkeleton />
          ) : (
            <ComponentPalette
              onSelectComponent={handleSelectComponent}
              selectedComponent={selectedComponent}
              components={components}
            />
          )}
        </div>

        <CircuitCanvas
          placedComponents={placedComponents}
          wires={wires}
          selectedComponent={selectedComponent}
          selectedPlacedId={selectedPlacedId}
          isRunning={isRunning}
          simulationResult={simulationResult}
          onPlaceComponent={handlePlaceComponent}
          onAddWire={handleAddWire}
          onSelectPlaced={handleSelectPlaced}
          onDeleteSelected={handleDeleteSelected}
          wireMode={wireMode}
          wireStart={wireStart}
          onWireStart={setWireStart}
          resistorValues={resistorValues}
          onChangeResistorValue={handleChangeResistorValue}
          onMovePlaced={handleMovePlaced}
          selectedWireId={selectedWireId}
          onSelectWire={setSelectedWireId}
          onDeleteSelectedWire={handleDeleteSelectedWire}
        />

        <div className="flex flex-shrink-0">
          <ControlPanel
            isRunning={isRunning}
            ledState={anyLedOn && isRunning}
            errorMessage={errorMessage}
            wireMode={wireMode}
            onRun={handleRun}
            onStop={handleStop}
            onReset={handleReset}
            onToggleWireMode={handleToggleWireMode}
            onToggleDebugPanel={() => setShowDebugPanel(!showDebugPanel)}
            showDebugPanel={showDebugPanel}
            componentCount={placedComponents.length}
            wireCount={wires.length}
            selectedResistorId={selectedResistorId}
            selectedResistorValue={selectedResistorValue}
            onChangeResistorValue={handleChangeResistorValue}
          />

          {hasMcu && (
            <div className="w-72">
              <LogicPanel
                placedComponents={placedComponents}
                mcuPinStates={mcuPinStates}
                onChangePinState={handleChangePinState}
              />
            </div>
          )}

          {showDebugPanel && (
            <div className="w-72">
              <DebugPanel
                simulationResult={simulationResult}
                isRunning={isRunning}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
