import { useState, useCallback, useMemo, useEffect } from "react";
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
import { SerialMonitor } from "@/components/simulation/serial-monitor";

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
  
  // Component control states (button pressed, potentiometer position)
  type ComponentControlState = {
    buttonPressed?: boolean;
    potPosition?: number; // 0-1
  };
  const [controlStates, setControlStates] = useState<Record<string, ComponentControlState>>({});

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
      if (component.id === "button") {
        setControlStates((prev) => ({
          ...prev,
          [newPlaced.id]: { buttonPressed: false },
        }));
      }
      if (component.id === "potentiometer") {
        setControlStates((prev) => ({
          ...prev,
          [newPlaced.id]: { potPosition: 0.5 },
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
      setControlStates((prev) => {
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

      const metadata = componentMetadata[current.componentId];
      if (!metadata) return prev; // Should not happen but safety check

      // Update wire endpoints connected to this moved component
      setWires((prevWires) => {
        return prevWires.map((w) => {
          let startX = w.startX;
          let startY = w.startY;
          let endX = w.endX;
          let endY = w.endY;
          let modified = false;

          // Update START terminal if connected
          if (w.startTerminal?.componentId === id) {
            const term = metadata.terminals.find(
              (t) => t.id === w.startTerminal!.terminalId
            );
            if (term) {
              const pos = getTerminalPosition(x, y, current.rotation, term);
              startX = pos.x;
              startY = pos.y;
              modified = true;
            }
          }

          // Update END terminal if connected
          if (w.endTerminal?.componentId === id) {
            const term = metadata.terminals.find(
              (t) => t.id === w.endTerminal!.terminalId
            );
            if (term) {
              const pos = getTerminalPosition(x, y, current.rotation, term);
              endX = pos.x;
              endY = pos.y;
              modified = true;
            }
          }

          if (modified) {
            return { ...w, startX, startY, endX, endY };
          }
          return w;
        });
      });

      // Update component itself
      return prev.map((p) =>
        p.id === id ? { ...p, x, y } : p
      );
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

    // Sync control states (button pressed, potentiometer position) into simulation
    // CRITICAL: Ensure ALL buttons are explicitly set to NOT pressed (false) before simulation
    // This prevents buttons from accidentally connecting terminals
    placedComponents.forEach((placed) => {
      if (placed.componentId === "button") {
        // Explicitly default to false if not in controlStates
        // This ensures buttons start as open circuit (not pressed)
        const buttonState = controlStates[placed.id]?.buttonPressed ?? false;
        // Force to false if not explicitly true
        const finalState = buttonState === true ? true : false;
        simulationEngine.setButtonPressed(placed.id, finalState);
      }
      if (placed.componentId === "potentiometer") {
        const potState = controlStates[placed.id]?.potPosition ?? 0.5;
        simulationEngine.setPotentiometerPosition(placed.id, potState);
      }
    });

    const result = simulationEngine.simulate(mcuPinStates);
    setSimulationResult(result);
    return result;
  }, [simulationEngine, placedComponents, wires, resistorValues, controlStates]);

  const handleRun = () => {
    const result = runSimulation();
    
    // Check for SHORT_CIRCUIT first - this must block simulation completely
    const shortCircuitError = result.errors.find(e => e.type === "SHORT_CIRCUIT");
    if (shortCircuitError) {
      setIsRunning(false);
      toast({
        title: "Short Circuit Detected",
        description: shortCircuitError.message,
        variant: "destructive",
      });
      setWires((prev) => prev.map((w) => ({ ...w, isActive: false })));
      return;
    }
    
    const hasActiveComponent = Array.from(result.componentStates.values()).some(
      (state) => state.isActive
    );

    // Check if there's a button in the circuit (simulation should run even if nothing is active yet)
    const hasButton = placedComponents.some((p) => p.componentId === "button");

    // If nothing is actually active/powered and there's no button, don't run.
    // If there's a button, allow the simulation to run so the user can press it.
    if (!hasActiveComponent && !hasButton) {
      setIsRunning(false);
      // If there are errors, show the first one
      if (result.errors.length > 0) {
        toast({
          title: "Circuit Error",
          description: result.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Circuit Incomplete",
          description: "No components are actually powered or active. Check your wiring and try again.",
          variant: "default",
        });
      }
      setWires((prev) => prev.map((w) => ({ ...w, isActive: false })));
      return;
    }

    // Check if all circuits have errors
    const clustersWithErrors = new Set(result.errors.map(e => e.clusterId).filter(Boolean));
    const totalClusters = result.circuits.length;
    const allFailed = totalClusters > 0 && clustersWithErrors.size === totalClusters;

    if (allFailed) {
      setIsRunning(false);
      toast({
        title: "Circuit Error",
        description: result.errors[0].message,
        variant: "destructive",
      });
      setWires((prev) => prev.map((w) => ({ ...w, isActive: false })));
      return;
    }

    setIsRunning(true);
    setWires((prev) =>
      prev.map((w) => ({ ...w, isActive: true }))
    );
    
    if (result.errors.length > 0) {
       toast({
        title: "Simulation Started (Partial)",
        description: "Some clusters have errors, but valid circuits are running.",
        variant: "default", // Or warning?
      });
    } else {
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

  const contextClusterId = useMemo(() => {
    if (!selectedPlacedId || !simulationResult) return null;
    const cluster = simulationResult.circuits.find((c) =>
      c.components.some((comp) => comp.placedId === selectedPlacedId)
    );
    return cluster ? cluster.id : null;
  }, [selectedPlacedId, simulationResult]);

  const ledActive = useMemo(() => {
    if (!simulationResult || !isRunning) return false;
    
    if (contextClusterId) {
       const hasError = simulationResult.errors.some(e => e.clusterId === contextClusterId);
       if (hasError) return false;

       const cluster = simulationResult.circuits.find(c => c.id === contextClusterId);
       if (!cluster) return false;
       
       return cluster.components.some(c => {
           const state = simulationResult.componentStates.get(c.placedId);
           return state && state.type === "led" && state.isActive;
       });
    }

    for (const [, state] of simulationResult.componentStates) {
      if (state.type === "led" && state.isActive) {
        return true;
      }
    }
    return false;
  }, [simulationResult, isRunning, contextClusterId]);

  const errorMessage = useMemo(() => {
    if (!simulationResult) return null;
    if (contextClusterId) {
      const err = simulationResult.errors.find((e) => e.clusterId === contextClusterId);
      return err ? err.message : null;
    }
    if (!isRunning && simulationResult.errors.length > 0) {
      return simulationResult.errors[0].message;
    }
    return null;
  }, [simulationResult, contextClusterId, isRunning]);

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

  const selectedPotentiometerId = useMemo(() => {
    if (!selectedPlacedId) return null;
    const placed = placedComponents.find((p) => p.id === selectedPlacedId);
    if (!placed || placed.componentId !== "potentiometer") return null;
    return selectedPlacedId;
  }, [selectedPlacedId, placedComponents]);

  const selectedPotentiometerValue = useMemo(() => {
    if (!selectedPotentiometerId) return null;
    return controlStates[selectedPotentiometerId]?.potPosition ?? 0.5;
  }, [selectedPotentiometerId, controlStates]);

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

  const handleButtonPress = useCallback((placedId: string, pressed: boolean) => {
    setControlStates((prev) => ({
      ...prev,
      [placedId]: {
        ...(prev[placedId] ?? {}),
        buttonPressed: pressed,
      },
    }));
  }, []);

  const handlePotentiometerChange = useCallback((placedId: string, position: number) => {
    setControlStates((prev) => ({
      ...prev,
      [placedId]: {
        ...(prev[placedId] ?? {}),
        potPosition: position,
      },
    }));
  }, []);

  // Auto-update simulation when control states change and simulation is running
  useEffect(() => {
    if (isRunning && simulationResult) {
      const result = runSimulation();
      setSimulationResult(result);
    }
  }, [controlStates, isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

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
          controlStates={controlStates}
          onButtonPress={handleButtonPress}
          onPotentiometerChange={handlePotentiometerChange}
        />

        <div className="flex flex-shrink-0">
          <ControlPanel
            isRunning={isRunning}
            ledState={ledActive}
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
            selectedPotentiometerId={selectedPotentiometerId}
            potentiometerValue={selectedPotentiometerValue}
            onChangePotentiometerValue={handlePotentiometerChange}
          />

          {hasMcu && (
            <>
              <div className="w-72">
                <LogicPanel
                  placedComponents={placedComponents}
                  mcuPinStates={mcuPinStates}
                  onChangePinState={handleChangePinState}
                />
              </div>
              <div className="w-72">
                <SerialMonitor
                  placedComponents={placedComponents}
                  mcuPinStates={mcuPinStates}
                  simulationResult={simulationResult}
                />
              </div>
            </>
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
