import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ComponentPalette } from "@/components/simulation/component-palette";
import { CircuitCanvas } from "@/components/simulation/circuit-canvas";
import { ControlPanel } from "@/components/simulation/control-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";

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
  const [selectedComponent, setSelectedComponent] = useState<ElectronicComponent | null>(null);
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [ledState, setLedState] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wireMode, setWireMode] = useState(false);
  const [wireStart, setWireStart] = useState<{ x: number; y: number } | null>(null);

  const { data: components, isLoading } = useQuery<ElectronicComponent[]>({
    queryKey: ["/api/components"],
  });

  const handleSelectComponent = (component: ElectronicComponent) => {
    setSelectedComponent(component);
    setWireMode(false);
    setWireStart(null);
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
    },
    []
  );

  const handleAddWire = useCallback((wire: Omit<Wire, "id">) => {
    const newWire: Wire = {
      ...wire,
      id: `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setWires((prev) => [...prev, newWire]);
  }, []);

  const handleToggleWireMode = () => {
    setWireMode(!wireMode);
    setSelectedComponent(null);
    setWireStart(null);
  };

  const validateCircuit = (): { valid: boolean; error: string | null } => {
    const componentIds = placedComponents.map((p) => p.componentId);
    
    const hasLed = componentIds.includes("led");
    const hasResistor = componentIds.includes("resistor");
    const has5V = componentIds.includes("5v");
    const hasGnd = componentIds.includes("gnd");

    if (hasLed && !hasResistor) {
      return { valid: false, error: "LED requires a resistor in series to prevent damage." };
    }

    if (hasLed && hasResistor && has5V && hasGnd && wires.length >= 3) {
      return { valid: true, error: null };
    }

    if (hasLed && !has5V) {
      return { valid: false, error: "Circuit needs a 5V power source." };
    }

    if (hasLed && !hasGnd) {
      return { valid: false, error: "Circuit needs a ground connection." };
    }

    if (wires.length < 3 && hasLed && hasResistor && has5V && hasGnd) {
      return { valid: false, error: "Components need to be connected with wires." };
    }

    return { valid: false, error: null };
  };

  const handleRun = () => {
    const { valid, error } = validateCircuit();
    
    if (error) {
      setErrorMessage(error);
      setLedState(false);
    } else {
      setErrorMessage(null);
      setLedState(valid);
    }
    
    setIsRunning(true);

    if (valid) {
      setWires((prev) =>
        prev.map((w) => ({ ...w, isActive: true }))
      );
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setLedState(false);
    setWires((prev) =>
      prev.map((w) => ({ ...w, isActive: false }))
    );
  };

  const handleReset = () => {
    setPlacedComponents([]);
    setWires([]);
    setIsRunning(false);
    setLedState(false);
    setErrorMessage(null);
    setSelectedComponent(null);
    setWireMode(false);
    setWireStart(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Component Palette */}
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

        {/* Center Panel - Circuit Canvas */}
        <CircuitCanvas
          placedComponents={placedComponents}
          wires={wires}
          selectedComponent={selectedComponent}
          isRunning={isRunning}
          ledState={ledState}
          onPlaceComponent={handlePlaceComponent}
          onAddWire={handleAddWire}
          wireMode={wireMode}
          wireStart={wireStart}
          onWireStart={setWireStart}
        />

        {/* Right Panel - Controls */}
        <ControlPanel
          isRunning={isRunning}
          ledState={ledState}
          errorMessage={errorMessage}
          wireMode={wireMode}
          onRun={handleRun}
          onStop={handleStop}
          onReset={handleReset}
          onToggleWireMode={handleToggleWireMode}
          componentCount={placedComponents.length}
          wireCount={wires.length}
        />
      </div>
    </div>
  );
}
