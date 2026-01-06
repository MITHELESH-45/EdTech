import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
  getBreadboardInternalConnections,
} from "@/lib/simulation-engine";
import { componentMetadata, getTerminalPosition } from "@/lib/circuit-types";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";
import { LogicPanel } from "@/components/simulation/logic-panel";
import { SerialMonitorConsole } from "@/components/simulation/serial-monitor-console";
import {
  startBuzzerSound,
  stopBuzzerSound,
  resumeAudioContext,
  cleanupAudio,
} from "@/lib/audio/buzzer-audio";
import {
  downloadCircuit,
  openFilePicker,
  loadCircuitFile,
  type CircuitData,
} from "@/lib/circuit-file";
import { UnsavedChangesDialog } from "@/components/simulation/unsaved-changes-dialog";

interface ExtendedWire extends Wire {
  startTerminal?: { componentId: string; terminalId: string };
  endTerminal?: { componentId: string; terminalId: string };
}

/**
 * Generates implicit internal wires for breadboard connections.
 * A real breadboard has internal connections:
 * - Terminal strips: holes a-e in same column are connected, f-j in same column are connected
 * - Power rails: entire + rail is connected, entire - rail is connected
 * - Center trench blocks conduction between a-e and f-j
 * 
 * These implicit wires are injected before simulation so the engine sees them as normal wires.
 */
function generateBreadboardImplicitWires(
  placedComponents: PlacedComponent[]
): ExtendedWire[] {
  const implicitWires: ExtendedWire[] = [];
  const breadboards = placedComponents.filter((p) => p.componentId === "breadboard");
  
  if (breadboards.length === 0) return implicitWires;
  
  // Get the breadboard internal connection groups
  const connectionGroups = getBreadboardInternalConnections();
  
  // For each breadboard, create implicit wires for all internal connections
  for (const breadboard of breadboards) {
    const breadboardId = breadboard.id;
    
    // For each connection group, chain-connect all terminals
    // e.g., for [a1, b1, c1, d1, e1], create wires: a1-b1, b1-c1, c1-d1, d1-e1
    for (const group of connectionGroups) {
      const terminals = group.terminals;
      
      // Chain consecutive terminals together
      for (let i = 0; i < terminals.length - 1; i++) {
        const startTerminalId = terminals[i];
        const endTerminalId = terminals[i + 1];
        
        // Create an implicit wire connecting these two terminals
        // The x/y coordinates are not important for simulation, only the terminal references matter
        implicitWires.push({
          id: `implicit-${breadboardId}-${startTerminalId}-${endTerminalId}`,
          startX: 0, // Not used for simulation
          startY: 0,
          endX: 0,
          endY: 0,
          isActive: false,
          startTerminal: { componentId: breadboardId, terminalId: startTerminalId },
          endTerminal: { componentId: breadboardId, terminalId: endTerminalId },
        });
      }
    }
  }
  
  return implicitWires;
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
  const [showLogicPanel, setShowLogicPanel] = useState(false);
  const [resistorValues, setResistorValues] = useState<Record<string, number>>({});
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [mcuPinStates, setMcuPinStates] = useState<McuPinStateMap>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Component control states (button pressed, potentiometer position)
  type ComponentControlState = {
    buttonPressed?: boolean;
    potPosition?: number; // 0-1
    irDetected?: boolean;
    ultrasonicDistance?: number; // in cm
    temperature?: number; // °C
    humidity?: number; // %
    servoAngle?: number; // 0-180 degrees
  };
  const [controlStates, setControlStates] = useState<Record<string, ComponentControlState>>({});

  // Circuit file save/load state
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

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
      setIsDirty(true); // Mark as dirty

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

  // Helper function to check if two wires are duplicates
  const areWiresDuplicate = useCallback((w1: ExtendedWire, w2: ExtendedWire): boolean => {
    // Both wires must have terminals to be considered duplicates
    if (!w1.startTerminal || !w1.endTerminal || !w2.startTerminal || !w2.endTerminal) {
      return false;
    }
    
    const sameDirection = 
      w1.startTerminal.componentId === w2.startTerminal.componentId &&
      w1.startTerminal.terminalId === w2.startTerminal.terminalId &&
      w1.endTerminal.componentId === w2.endTerminal.componentId &&
      w1.endTerminal.terminalId === w2.endTerminal.terminalId;
    
    const reversed = 
      w1.startTerminal.componentId === w2.endTerminal.componentId &&
      w1.startTerminal.terminalId === w2.endTerminal.terminalId &&
      w1.endTerminal.componentId === w2.startTerminal.componentId &&
      w1.endTerminal.terminalId === w2.startTerminal.terminalId;
    
    return sameDirection || reversed;
  }, []);

  // Clean up duplicate wires - run once on mount and when component moves
  const cleanupDuplicates = useCallback(() => {
    setWires((prev) => {
      const uniqueWires: ExtendedWire[] = [];
      
      for (const wire of prev) {
        // Check if this wire is a duplicate of any wire we've already added
        let isDuplicate = false;
        for (const uniqueWire of uniqueWires) {
          if (areWiresDuplicate(wire, uniqueWire)) {
            isDuplicate = true;
            break;
          }
        }
        
        // Only add if not a duplicate
        if (!isDuplicate) {
          uniqueWires.push(wire);
        }
      }
      
      // Only update if duplicates were found
      if (uniqueWires.length !== prev.length) {
        return uniqueWires;
      }
      return prev;
    });
  }, [areWiresDuplicate]);

  // Clean up duplicates on mount
  useEffect(() => {
    cleanupDuplicates();
  }, []); // Only run on mount

  const handleAddWire = useCallback((wire: Omit<ExtendedWire, "id">) => {
    // Check for duplicate wires (same start and end terminals)
    setWires((prev) => {
      // Check if a wire with the same terminals already exists
      const isDuplicate = prev.some((w) => {
        const sameStart = 
          w.startTerminal?.componentId === wire.startTerminal?.componentId &&
          w.startTerminal?.terminalId === wire.startTerminal?.terminalId;
        const sameEnd = 
          w.endTerminal?.componentId === wire.endTerminal?.componentId &&
          w.endTerminal?.terminalId === wire.endTerminal?.terminalId;
        const reversed = 
          w.startTerminal?.componentId === wire.endTerminal?.componentId &&
          w.startTerminal?.terminalId === wire.endTerminal?.terminalId &&
          w.endTerminal?.componentId === wire.startTerminal?.componentId &&
          w.endTerminal?.terminalId === wire.startTerminal?.terminalId;
        
        return (sameStart && sameEnd) || reversed;
      });
      
      if (isDuplicate) {
        // Wire already exists, don't add duplicate
        return prev;
      }
      
      const newWire: ExtendedWire = {
        ...wire,
        id: `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      return [...prev, newWire];
    });
    setIsDirty(true); // Mark as dirty
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
      setIsDirty(true); // Mark as dirty
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
    setIsDirty(true); // Mark as dirty
  }, []);

  const handleMovePlaced = useCallback((id: string, x: number, y: number) => {
    setPlacedComponents((prev) => {
      const current = prev.find((p) => p.id === id);
      if (!current) return prev;

      const metadata = componentMetadata[current.componentId];
      if (!metadata) return prev; // Should not happen but safety check

      // Update wire endpoints connected to this moved component
      setWires((prevWires) => {
        const updatedWires = prevWires.map((w) => {
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
        
        // Remove duplicates after updating wire positions
        const uniqueWires: ExtendedWire[] = [];
        for (const wire of updatedWires) {
          let isDuplicate = false;
          for (const uniqueWire of uniqueWires) {
            if (areWiresDuplicate(wire, uniqueWire)) {
              isDuplicate = true;
              break;
            }
          }
          if (!isDuplicate) {
            uniqueWires.push(wire);
          }
        }
        
        return uniqueWires;
      });

      // Update component itself
      return prev.map((p) =>
        p.id === id ? { ...p, x, y } : p
      );
    });
    setIsDirty(true); // Mark as dirty
  }, [areWiresDuplicate]);

  const handleDeleteSelectedWire = useCallback(() => {
    if (!selectedWireId) return;
    setWires((prev) => prev.filter((w) => w.id !== selectedWireId));
    setSelectedWireId(null);
    setIsDirty(true); // Mark as dirty
  }, [selectedWireId]);

  const runSimulation = useCallback(() => {
    // BREADBOARD NET ENGINE: Generate implicit internal wires for breadboard connections
    // This makes breadboard rows automatically connected (like a real breadboard)
    const breadboardImplicitWires = generateBreadboardImplicitWires(placedComponents);
    
    // Combine user-placed wires with breadboard implicit wires
    const allWires = [...wires, ...breadboardImplicitWires];
    
    // Load circuit with both explicit and implicit wires
    simulationEngine.loadCircuit(placedComponents, allWires);

    // Sync any edited resistor values into the simulation state
    Object.entries(resistorValues).forEach(([placedId, resistance]) => {
      simulationEngine.setResistorResistance(placedId, resistance);
    });

    // PROXIMITY DETECTION: Compute IR sensor detection based on nearby objects
    const IR_DETECTION_RADIUS = 80; // pixels - detection range
    const objectComponents = placedComponents.filter((p) => p.componentId === "object");
    
    // Compute IR detection map based on proximity
    const irDetectionMap = new Map<string, boolean>();
    placedComponents.forEach((placed) => {
      if (placed.componentId === "ir-sensor") {
        const isDetected = objectComponents.some((obj) => {
          const dx = obj.x - placed.x;
          const dy = obj.y - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance <= IR_DETECTION_RADIUS;
        });
        irDetectionMap.set(placed.id, isDetected);
      }
    });

    // ULTRASONIC DISTANCE: Compute distance to nearest object
    const MAX_DETECTION_RADIUS_PX = 400; // pixels - max detection range
    const MIN_CM = 2;
    const MAX_CM = 400;
    
    const ultrasonicDistanceMap = new Map<string, number>();
    placedComponents.forEach((placed) => {
      if (placed.componentId === "ultrasonic") {
        if (objectComponents.length === 0) {
          // No object: max distance
          ultrasonicDistanceMap.set(placed.id, MAX_CM);
        } else {
          // Find nearest object
          let minDistancePx = Infinity;
          objectComponents.forEach((obj) => {
            const dx = obj.x - placed.x;
            const dy = obj.y - placed.y;
            const distancePx = Math.sqrt(dx * dx + dy * dy);
            if (distancePx < minDistancePx) {
              minDistancePx = distancePx;
            }
          });
          
          // Map pixels to centimeters: 0px = 2cm, MAX_DETECTION_RADIUS_PX = 400cm
          const distanceCm = MIN_CM + (minDistancePx / MAX_DETECTION_RADIUS_PX) * (MAX_CM - MIN_CM);
          const clampedDistance = Math.max(MIN_CM, Math.min(MAX_CM, distanceCm));
          ultrasonicDistanceMap.set(placed.id, clampedDistance);
        }
      }
    });

    // Sync control states (button, potentiometer, IR, ultrasonic) into simulation
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
      if (placed.componentId === "ir-sensor") {
        // IR sensor: detection computed from proximity (above)
        const irState = irDetectionMap.get(placed.id) ?? false;
        const finalState = irState === true ? true : false;
        simulationEngine.setIrDetected(placed.id, finalState);
      }
      if (placed.componentId === "ultrasonic") {
        // Ultrasonic: distance computed from proximity (above)
        const distanceCm = ultrasonicDistanceMap.get(placed.id) ?? MAX_CM;
        // Convert distance to voltage: 2cm = 4.5V, 400cm = 0.5V
        const voltage = 4.5 - ((distanceCm - MIN_CM) / (MAX_CM - MIN_CM)) * 4.0;
        const clampedVoltage = Math.max(0.5, Math.min(4.5, voltage));
        simulationEngine.setUltrasonicVoltage(placed.id, clampedVoltage);
      }
      if (placed.componentId === "dht11") {
        // DHT11: temperature and humidity from control state
        const temperature = controlStates[placed.id]?.temperature ?? 25;
        const humidity = controlStates[placed.id]?.humidity ?? 50;
        simulationEngine.setDht11Values(placed.id, temperature, humidity);
      }
    });

    const result = simulationEngine.simulate(mcuPinStates);

    // SERVO ANGLE COMPUTATION: After simulation, compute servo angles from signal voltages
    const servoUpdates: Record<string, number> = {};
    placedComponents.forEach((placed) => {
      if (placed.componentId === "servo") {
        const { voltage, powered } = simulationEngine.getServoSignalVoltage(placed.id);
        if (powered && voltage !== null) {
          // Map voltage to angle: 0V = 0°, 5V = 180°
          // HIGH (5V) → 180°, LOW (0V) → 0°
          const angle = Math.max(0, Math.min(180, (voltage / 5) * 180));
          servoUpdates[placed.id] = angle;
          simulationEngine.setServoAngle(placed.id, angle);
        } else if (powered) {
          // Powered but signal is floating - keep last angle or default to 90°
          const lastAngle = controlStates[placed.id]?.servoAngle ?? 90;
          servoUpdates[placed.id] = lastAngle;
          simulationEngine.setServoAngle(placed.id, lastAngle);
        }
        // If not powered, don't update - servo is frozen
      }
    });

    // Update control states with computed sensor values (IR detection, ultrasonic distance, servo angles)
    // This ensures sensor values are displayed in the serial monitor
    setControlStates((prev) => {
      let hasChanges = false;
      const next = { ...prev };
      
      // Update IR sensor detection states
      irDetectionMap.forEach((detected, placedId) => {
        const currentDetected = prev[placedId]?.irDetected;
        if (currentDetected !== detected) {
          hasChanges = true;
          next[placedId] = { ...(next[placedId] ?? {}), irDetected: detected };
        }
      });
      
      // Update ultrasonic sensor distance values
      ultrasonicDistanceMap.forEach((distance, placedId) => {
        const currentDistance = prev[placedId]?.ultrasonicDistance;
        if (currentDistance !== distance) {
          hasChanges = true;
          next[placedId] = { ...(next[placedId] ?? {}), ultrasonicDistance: distance };
        }
      });
      
      // Update servo angles
      Object.entries(servoUpdates).forEach(([id, angle]) => {
        const currentAngle = prev[id]?.servoAngle;
        if (currentAngle !== angle) {
          hasChanges = true;
          next[id] = { ...(next[id] ?? {}), servoAngle: angle };
        }
      });
      
      return hasChanges ? next : prev;
    });

    setSimulationResult(result);
    return result;
  }, [simulationEngine, placedComponents, wires, resistorValues, controlStates, mcuPinStates]);

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
    stopBuzzerSound(); // Stop buzzer sound immediately
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
    setResistorValues({});
    setControlStates({});
    setMcuPinStates({});
    setIsDirty(false); // Reset clears dirty state
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

  const selectedDht11Id = useMemo(() => {
    if (!selectedPlacedId) return null;
    const placed = placedComponents.find((p) => p.id === selectedPlacedId);
    if (!placed || placed.componentId !== "dht11") return null;
    return selectedPlacedId;
  }, [selectedPlacedId, placedComponents]);

  const selectedDht11Temperature = useMemo(() => {
    if (!selectedDht11Id) return null;
    return controlStates[selectedDht11Id]?.temperature ?? 25;
  }, [selectedDht11Id, controlStates]);

  const selectedDht11Humidity = useMemo(() => {
    if (!selectedDht11Id) return null;
    return controlStates[selectedDht11Id]?.humidity ?? 50;
  }, [selectedDht11Id, controlStates]);

  const selectedServoId = useMemo(() => {
    if (!selectedPlacedId) return null;
    const placed = placedComponents.find((p) => p.id === selectedPlacedId);
    return placed?.componentId === "servo" ? selectedPlacedId : null;
  }, [selectedPlacedId, placedComponents]);

  const selectedServoAngle = useMemo(() => {
    if (!selectedServoId) return null;
    return controlStates[selectedServoId]?.servoAngle ?? 90;
  }, [selectedServoId, controlStates]);

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
      setIsDirty(true); // Mark as dirty
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
    setIsDirty(true); // Mark as dirty
  }, []);

  const handleDht11Change = useCallback((placedId: string, temperature: number, humidity: number) => {
    setControlStates((prev) => ({
      ...prev,
      [placedId]: {
        ...(prev[placedId] ?? {}),
        temperature,
        humidity,
      },
    }));
    setIsDirty(true); // Mark as dirty
  }, []);

  const handleServoAngleChange = useCallback((placedId: string, angle: number) => {
    setControlStates((prev) => ({
      ...prev,
      [placedId]: {
        ...(prev[placedId] ?? {}),
        servoAngle: angle,
      },
    }));
    setIsDirty(true); // Mark as dirty
  }, []);

  // ============== CIRCUIT FILE SAVE/LOAD ==============
  
  // Mark circuit as dirty when changes occur
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Save circuit to local file
  const handleSaveCircuit = useCallback(() => {
    const circuitData: CircuitData = {
      placedComponents,
      wires,
      resistorValues,
      controlStates,
      mcuPinStates,
    };
    
    downloadCircuit(circuitData);
    setIsDirty(false);
    
    toast({
      title: "Circuit Saved",
      description: "Your circuit has been downloaded as a .egroots.json file.",
    });
  }, [placedComponents, wires, resistorValues, controlStates, mcuPinStates, toast]);

  // Load circuit from local file
  const performLoadCircuit = useCallback(async () => {
    const file = await openFilePicker();
    if (!file) return;
    
    const result = await loadCircuitFile(file);
    
    if (!result.valid || !result.data) {
      toast({
        title: "Load Failed",
        description: result.error || "Failed to load circuit file.",
        variant: "destructive",
      });
      return;
    }
    
    // Stop any running simulation
    setIsRunning(false);
    stopBuzzerSound();
    
    // Restore circuit state
    setPlacedComponents(result.data.placedComponents);
    setWires(result.data.wires.map(w => ({ ...w, isActive: false })));
    setResistorValues(result.data.resistorValues);
    setControlStates(result.data.controlStates);
    setMcuPinStates(result.data.mcuPinStates);
    
    // Reset UI state
    setSimulationResult(null);
    setSelectedComponent(null);
    setWireMode(false);
    setWireStart(null);
    setSelectedPlacedId(null);
    setSelectedWireId(null);
    simulationEngine.reset();
    
    // Mark as clean since we just loaded
    setIsDirty(false);
    
    toast({
      title: "Circuit Loaded",
      description: `Loaded ${result.data.placedComponents.length} components and ${result.data.wires.length} wires.`,
    });
  }, [toast, simulationEngine]);

  // Handle load with unsaved changes check
  const handleLoadCircuit = useCallback(() => {
    if (isDirty) {
      pendingActionRef.current = performLoadCircuit;
      setShowUnsavedDialog(true);
    } else {
      performLoadCircuit();
    }
  }, [isDirty, performLoadCircuit]);

  // Unsaved changes dialog handlers
  const handleDialogSave = useCallback(() => {
    handleSaveCircuit();
    setShowUnsavedDialog(false);
    // Execute pending action after save
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  }, [handleSaveCircuit]);

  const handleDialogDiscard = useCallback(() => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    // Execute pending action
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  }, []);

  const handleDialogCancel = useCallback(() => {
    setShowUnsavedDialog(false);
    pendingActionRef.current = null;
  }, []);

  // Browser beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Auto-update simulation when control states change, components move, or simulation is running
  useEffect(() => {
    if (isRunning && simulationResult) {
      const result = runSimulation();
      setSimulationResult(result);
    }
  }, [controlStates, placedComponents, isRunning, runSimulation, simulationResult]);

  // Handle sound toggle
  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      if (newValue) {
        resumeAudioContext();
      } else {
        stopBuzzerSound();
      }
      return newValue;
    });
  }, []);

  // Buzzer sound effect - plays when buzzer is powered and sound is enabled
  useEffect(() => {
    if (!isRunning || !soundEnabled || !simulationResult) {
      stopBuzzerSound();
      return;
    }

    // Check if any buzzer is powered
    let buzzerPowered = false;
    let maxVoltageDrop = 0;

    placedComponents.forEach((placed) => {
      if (placed.componentId === "buzzer") {
        const state = simulationResult.componentStates.get(placed.id);
        if (state?.powered) {
          buzzerPowered = true;
          // Get voltage drop from component state or estimate from net voltages
          const vd = state.properties?.voltageDrop;
          const voltageDrop = typeof vd === 'number' ? vd : 5; // Default to 5V if powered
          maxVoltageDrop = Math.max(maxVoltageDrop, voltageDrop);
        }
      }
    });

    if (buzzerPowered && maxVoltageDrop > 0) {
      // Normalize voltage drop: 0V = 0, 5V = 1
      const intensity = Math.max(0, Math.min(1, maxVoltageDrop / 5));
      startBuzzerSound(intensity);
    } else {
      stopBuzzerSound();
    }
  }, [isRunning, soundEnabled, simulationResult, placedComponents]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Unsaved Changes Warning Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
      />

      {/* Logic / Code Panel - Slide-out Sheet */}
      <LogicPanel
        placedComponents={placedComponents}
        mcuPinStates={mcuPinStates}
        onChangePinState={handleChangePinState}
        open={showLogicPanel}
        onOpenChange={setShowLogicPanel}
      />

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Main content row: Palette | Canvas | Controls */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-56 flex-shrink-0 h-full overflow-y-auto scrollbar-hide">
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

          {/* Center area: Canvas + Serial Monitor below */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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

            {/* Serial Monitor Console - Below Canvas */}
            <SerialMonitorConsole
              placedComponents={placedComponents}
              mcuPinStates={mcuPinStates}
              simulationResult={simulationResult}
              controlStates={controlStates}
              isRunning={isRunning}
            />
          </div>

          <div className="flex flex-shrink-0 min-h-0">
            <div className="h-full min-h-0 overflow-y-auto scrollbar-hide">
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
                onToggleLogicPanel={() => setShowLogicPanel(!showLogicPanel)}
                showLogicPanel={showLogicPanel}
                hasMcu={hasMcu}
                componentCount={placedComponents.length}
                wireCount={wires.length}
                selectedResistorId={selectedResistorId}
                selectedResistorValue={selectedResistorValue}
                onChangeResistorValue={handleChangeResistorValue}
                selectedPotentiometerId={selectedPotentiometerId}
                potentiometerValue={selectedPotentiometerValue}
                onChangePotentiometerValue={handlePotentiometerChange}
                selectedDht11Id={selectedDht11Id}
                dht11Temperature={selectedDht11Temperature}
                dht11Humidity={selectedDht11Humidity}
                onChangeDht11Values={handleDht11Change}
                selectedServoId={selectedServoId}
                servoAngle={selectedServoAngle}
                onChangeServoAngle={handleServoAngleChange}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onSaveCircuit={handleSaveCircuit}
                onLoadCircuit={handleLoadCircuit}
                isDirty={isDirty}
              />
            </div>

            {showDebugPanel && (
              <div className="h-full w-72 overflow-y-auto scrollbar-hide">
                <DebugPanel
                  simulationResult={simulationResult}
                  isRunning={isRunning}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}