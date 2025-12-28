import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { componentMetadata, getTerminalPosition, findNearestTerminal, type Terminal } from "@/lib/circuit-types";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";
import type { SimulationResult, ComponentState, SimulationError } from "@/lib/simulation-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LedVisual } from "./LedVisual";
import { AlertTriangle } from "lucide-react"; // Import AlertTriangle

interface ExtendedWire extends Wire {
  startTerminal?: { componentId: string; terminalId: string };
  endTerminal?: { componentId: string; terminalId: string };
}

interface CircuitCanvasProps {
  placedComponents: PlacedComponent[];
  wires: ExtendedWire[];
  selectedComponent: ElectronicComponent | null;
  selectedPlacedId: string | null;
  isRunning: boolean;
  simulationResult: SimulationResult | null;
  onPlaceComponent: (component: ElectronicComponent, x: number, y: number) => void;
  onAddWire: (wire: Omit<ExtendedWire, "id">) => void;
  onSelectPlaced: (id: string | null) => void;
  onDeleteSelected: () => void;
  wireMode: boolean;
  wireStart: { x: number; y: number; terminal?: { componentId: string; terminalId: string } } | null;
  onWireStart: (point: { x: number; y: number; terminal?: { componentId: string; terminalId: string } } | null) => void;
  resistorValues: Record<string, number>;
  onChangeResistorValue: (id: string, value: number) => void;
  onMovePlaced: (id: string, x: number, y: number) => void;
  selectedWireId: string | null;
  onSelectWire: (id: string | null) => void;
  onDeleteSelectedWire: () => void;
  controlStates: Record<string, { buttonPressed?: boolean; potPosition?: number; irDetected?: boolean; temperature?: number; humidity?: number; servoAngle?: number }>;
  onButtonPress: (id: string, pressed: boolean) => void;
  onPotentiometerChange: (id: string, position: number) => void;
}

function TerminalMarker({
  terminal,
  x,
  y,
  isHovered,
  isWireMode,
}: {
  terminal: Terminal;
  x: number;
  y: number;
  isHovered: boolean;
  isWireMode: boolean;
}) {
  const getColor = () => {
    switch (terminal.type) {
      case "positive":
      case "power":
        return "#dc2626";
      case "negative":
      case "ground":
        return "#1f2937";
      case "signal":
        return "#f59e0b";
      case "data":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <g className="terminal-marker">
      <circle
        cx={x}
        cy={y}
        r={isHovered ? 9 : 6}
        fill={getColor()}
        stroke={isHovered ? "#22c55e" : "white"}
        strokeWidth={isHovered ? 3 : 2}
        className={cn("transition-all duration-150", isWireMode && "cursor-crosshair")}
        data-testid={`terminal-${terminal.id}`}
      />
      <title>{terminal.name}</title>
      {isHovered && (
        <text
          x={x}
          y={y - 12}
          textAnchor="middle"
          fontSize="10"
          fill="hsl(var(--foreground))"
          className="pointer-events-none"
        >
          {terminal.name}
        </text>
      )}
    </g>
  );
}

function PlacedComponentVisual({
  placed,
  component,
  isRunning,
  isSelected,
  showTerminals,
  hoveredTerminal,
  wireMode,
  componentState,
  errors,
  buttonPressed,
  potPosition,
  irDetected,
  ultrasonicDistance,
  dht11Temperature,
  dht11Humidity,
  servoAngle,
  onButtonPress,
  onPotentiometerChange,
}: {
  placed: PlacedComponent;
  component: ElectronicComponent | undefined;
  isRunning: boolean;
  isSelected: boolean;
  showTerminals: boolean;
  hoveredTerminal: string | null;
  wireMode: boolean;
  componentState?: ComponentState;
  errors?: SimulationError[];
  buttonPressed?: boolean;
  potPosition?: number;
  irDetected?: boolean;
  ultrasonicDistance?: number;
  dht11Temperature?: number;
  dht11Humidity?: number;
  servoAngle?: number;
  onButtonPress?: (pressed: boolean) => void;
  onPotentiometerChange?: (position: number) => void;
}) {
  if (!component) return null;

  const metadata = componentMetadata[component.id];
  
  // Find errors affecting this component
  const componentError = errors?.find(e => e.affectedComponents.includes(placed.id));
  const errorColor = componentError?.type === "SHORT_CIRCUIT" ? "#ef4444" : "#f59e0b"; // Red or Amber

  const ledOn =
    isRunning &&
    componentState?.type === "led" &&
    componentState.isActive === true;
  const ledBrightness =
    (typeof componentState?.properties?.brightness === "number"
      ? (componentState.properties.brightness as number)
      : 0) ?? 0;

  const terminals = metadata?.terminals || [];

  return (
    <g
      transform={`translate(${placed.x}, ${placed.y}) rotate(${placed.rotation})`}
      className={cn("cursor-move", isSelected && "drop-shadow-lg")}
      data-testid={`placed-component-${placed.id}`}
    >
      {isSelected && metadata && (
        <rect
          x={-metadata.width / 2 - 4}
          y={-metadata.height / 2 - 4}
          width={metadata.width + 8}
          height={metadata.height + 8}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4 2"
          rx="4"
        />
      )}

      {component.id === "led" && (
        <>
          <LedVisual
            on={ledOn}
            brightness={ledBrightness}
            color={
              (componentState?.properties?.color as
                | "red"
                | "yellow"
                | "green") ?? "red"
            }
          />
          <line x1="-8" y1="16" x2="-8" y2="28" stroke="#dc2626" strokeWidth="2" />
          <line x1="8" y1="16" x2="8" y2="28" stroke="#4b5563" strokeWidth="2" />
          <text x="-8" y="36" textAnchor="middle" fontSize="7" fill="#dc2626">+</text>
          <text x="8" y="36" textAnchor="middle" fontSize="7" fill="#4b5563">-</text>
        </>
      )}
      {component.id === "resistor" && (
        <>
          <rect x="-20" y="-8" width="40" height="16" rx="2" fill="#d4a574" stroke="#92764a" strokeWidth="1.5" />
          <line x1="-30" y1="0" x2="-20" y2="0" stroke="#4b5563" strokeWidth="2" />
          <line x1="20" y1="0" x2="30" y2="0" stroke="#4b5563" strokeWidth="2" />
          <rect x="-16" y="-4" width="6" height="8" fill="#92764a" />
          <rect x="-6" y="-4" width="6" height="8" fill="#1f2937" />
          <rect x="4" y="-4" width="6" height="8" fill="#dc2626" />
          <text x="-30" y="12" textAnchor="middle" fontSize="7" fill="#6b7280">A</text>
          <text x="30" y="12" textAnchor="middle" fontSize="7" fill="#6b7280">B</text>
        </>
      )}
      {component.id === "button" && (
        <g
          onMouseDown={(e) => {
            e.stopPropagation();
            if (!wireMode && onButtonPress) {
              onButtonPress(true);
            }
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            if (!wireMode && onButtonPress) {
              onButtonPress(false);
            }
          }}
          onMouseLeave={() => {
            if (!wireMode && onButtonPress && buttonPressed) {
              onButtonPress(false);
            }
          }}
          style={{ cursor: wireMode ? "default" : "pointer" }}
          onClick={(e) => {
            // Prevent component selection when clicking button
            e.stopPropagation();
          }}
        >
          <rect
            x="-16"
            y={buttonPressed ? -10 : -12}
            width="32"
            height={buttonPressed ? 20 : 24}
            rx="3"
            fill={buttonPressed ? "#4b5563" : "#374151"}
            stroke={buttonPressed ? "#22c55e" : "#1f2937"}
            strokeWidth={buttonPressed ? 2 : 1.5}
            className="transition-all duration-100"
          />
          <circle
            cx="0"
            cy={buttonPressed ? 2 : 0}
            r={buttonPressed ? 6 : 8}
            fill={buttonPressed ? "#22c55e" : "#6b7280"}
            className="transition-all duration-100"
          />
          <line x1="-26" y1="0" x2="-16" y2="0" stroke="#4b5563" strokeWidth="2" />
          <line x1="16" y1="0" x2="26" y2="0" stroke="#4b5563" strokeWidth="2" />
        </g>
      )}
      {component.id === "buzzer" && (
        <>
          <circle cx="0" cy="0" r="14" fill="#374151" stroke="#1f2937" strokeWidth="2" />
          <circle cx="0" cy="0" r="6" fill="#6b7280" />
          <line x1="-6" y1="14" x2="-6" y2="20" stroke="#dc2626" strokeWidth="2" />
          <line x1="6" y1="14" x2="6" y2="20" stroke="#4b5563" strokeWidth="2" />
          <text x="-6" y="28" textAnchor="middle" fontSize="7" fill="#dc2626">+</text>
          <text x="6" y="28" textAnchor="middle" fontSize="7" fill="#4b5563">-</text>
        </>
      )}
      {component.id === "potentiometer" && (
        <>
          <rect x="-16" y="-10" width="32" height="20" rx="2" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="6" fill="#6b7280" />
          <line
            x1="0"
            y1="-6"
            x2="0"
            y2="0"
            stroke="#d4d4d4"
            strokeWidth="2"
            transform={`rotate(${(potPosition ?? 0.5) * 270 - 135} 0 0)`}
            className="transition-all duration-150"
          />
          <line x1="-8" y1="10" x2="-8" y2="20" stroke="#dc2626" strokeWidth="2" />
          <line x1="0" y1="10" x2="0" y2="20" stroke="#f59e0b" strokeWidth="2" />
          <line x1="8" y1="10" x2="8" y2="20" stroke="#4b5563" strokeWidth="2" />
          {!isSelected && (
            <text
              x="0"
              y="-18"
              textAnchor="middle"
              fontSize="7"
              fill="hsl(var(--muted-foreground))"
              className="pointer-events-none"
            >
              {Math.round((potPosition ?? 0.5) * 100)}%
            </text>
          )}
        </>
      )}
      {component.id === "ultrasonic" && (
        <>
          <rect x="-22" y="-12" width="44" height="24" rx="2" fill="#1e40af" stroke="#1e3a8a" strokeWidth="1.5" />
          <circle cx="-8" cy="0" r="7" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" />
          <circle cx="8" cy="0" r="7" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" />
          {/* Distance display */}
          {ultrasonicDistance !== undefined && (
            <text
              x="0"
              y="-20"
              textAnchor="middle"
              fontSize="8"
              fill={isRunning ? "#60a5fa" : "#6b7280"}
              fontWeight="bold"
            >
              {Math.round(ultrasonicDistance)} cm
            </text>
          )}
          <line x1="-15" y1="12" x2="-15" y2="22" stroke="#dc2626" strokeWidth="2" />
          <line x1="-5" y1="12" x2="-5" y2="22" stroke="#f59e0b" strokeWidth="2" />
          <line x1="5" y1="12" x2="5" y2="22" stroke="#22c55e" strokeWidth="2" />
          <line x1="15" y1="12" x2="15" y2="22" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
      {component.id === "ir-sensor" && (
        <>
          {/* Detection radius circle (shown when selected) */}
          {isSelected && (
            <circle
              cx="0"
              cy="0"
              r="80"
              fill="none"
              stroke={irDetected ? "#eab308" : "#ef4444"}
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity="0.3"
            />
          )}
          <rect x="-14" y="-16" width="28" height="32" rx="2" fill="#1f2937" stroke="#111827" strokeWidth="1.5" />
          <circle cx="0" cy="-6" r="5" fill="#ef4444" opacity="0.8" />
          <rect x="-6" y="4" width="12" height="6" fill="#6b7280" />
          {/* Status indicator: bright yellow when detected, red when not detected */}
          <circle
            cx="8"
            cy="-12"
            r="3"
            fill={irDetected ? "#fbbf24" : "#ef4444"}
            stroke={irDetected ? "#eab308" : "#dc2626"}
            strokeWidth="1"
          />
          <line x1="-8" y1="16" x2="-8" y2="24" stroke="#dc2626" strokeWidth="2" />
          <line x1="0" y1="16" x2="0" y2="24" stroke="#22c55e" strokeWidth="2" />
          <line x1="8" y1="16" x2="8" y2="24" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
      {component.id === "dht11" && (
        <>
          <rect x="-14" y="-18" width="28" height="36" rx="2" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5" />
          <rect x="-10" y="-14" width="20" height="18" rx="1" fill="#2563eb" />
          <circle cx="0" cy="-5" r="4" fill="#1e40af" />
          {/* Temperature and Humidity display */}
          {dht11Temperature !== undefined && dht11Humidity !== undefined && (
            <g>
              <text
                x="0"
                y="-24"
                textAnchor="middle"
                fontSize="7"
                fill={isRunning ? "#60a5fa" : "#6b7280"}
                fontWeight="bold"
              >
                Temp: {Math.round(dht11Temperature)}°C
              </text>
              <text
                x="0"
                y="-16"
                textAnchor="middle"
                fontSize="7"
                fill={isRunning ? "#60a5fa" : "#6b7280"}
                fontWeight="bold"
              >
                Hum: {Math.round(dht11Humidity)}%
              </text>
            </g>
          )}
          <line x1="-8" y1="18" x2="-8" y2="28" stroke="#dc2626" strokeWidth="2" />
          <line x1="0" y1="18" x2="0" y2="28" stroke="#f59e0b" strokeWidth="2" />
          <line x1="8" y1="18" x2="8" y2="28" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
      {component.id === "servo" && (() => {
        const angle = servoAngle ?? 90; // Default to 90° (center)
        const isPowered = isRunning && componentState?.powered;
        return (
          <>
            {/* Servo body */}
            <rect x="-20" y="-10" width="40" height="20" rx="2" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
            {/* Servo horn hub */}
            <circle cx="10" cy="0" r="8" fill="#4b5563" stroke="#374151" strokeWidth="1" />
            {/* Rotating horn */}
            <g 
              style={{ 
                transformOrigin: '10px 0px',
                transform: `rotate(${angle - 90}deg)`, // -90 so 0° points left, 180° points right
                transition: isPowered ? 'transform 0.3s ease-out' : 'none'
              }}
            >
              <rect x="8" y="-3" width="18" height="6" rx="2" fill={isPowered ? "#22c55e" : "#6b7280"} stroke="#1f2937" strokeWidth="1" />
              <circle cx="22" cy="0" r="2" fill="#1f2937" />
            </g>
            {/* Wire connectors */}
            <line x1="-14" y1="10" x2="-14" y2="20" stroke="#f59e0b" strokeWidth="2" /> {/* Signal - Orange */}
            <line x1="0" y1="10" x2="0" y2="20" stroke="#dc2626" strokeWidth="2" /> {/* VCC - Red */}
            <line x1="14" y1="10" x2="14" y2="20" stroke="#4b5563" strokeWidth="2" /> {/* GND - Brown */}
            {/* Angle display */}
            <text
              x="0"
              y="-18"
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill={isPowered ? "#22c55e" : "#6b7280"}
            >
              {Math.round(angle)}°
            </text>
          </>
        );
      })()}
      {component.id === "5v" && (
        <>
          <circle cx="0" cy="0" r="14" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">5V</text>
          <line x1="0" y1="14" x2="0" y2="20" stroke="#dc2626" strokeWidth="2" />
        </>
      )}
      {component.id === "gnd" && (
        <>
          <line x1="0" y1="-14" x2="0" y2="-6" stroke="#4b5563" strokeWidth="2" />
          <line x1="-12" y1="-6" x2="12" y2="-6" stroke="#4b5563" strokeWidth="3" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#4b5563" strokeWidth="3" />
          <line x1="-4" y1="6" x2="4" y2="6" stroke="#4b5563" strokeWidth="3" />
        </>
      )}
      {component.id === "object" && (
        <>
          <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <circle cx="0" cy="0" r="8" fill="#fbbf24" opacity="0.5" />
          <text x="0" y="5" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">OBJ</text>
        </>
      )}
      {component.id === "arduino-uno" && (
        <>
          <rect x="-40" y="-25" width="80" height="50" rx="3" fill="#008184" stroke="#006668" strokeWidth="2" />
          <rect x="-35" y="-20" width="12" height="8" fill="#1f2937" />
          <rect x="-35" y="5" width="20" height="10" fill="#c0c0c0" />
          <text x="10" y="5" fontSize="8" fill="white" fontWeight="bold">UNO</text>
          {[-30, -22, -14, -6, 2, 10, 18, 26].map((x, i) => (
            <rect key={i} x={x} y="-28" width="4" height="6" fill="#ffd700" />
          ))}
        </>
      )}
      {component.id === "esp32" && (
        <>
          <rect x="-20" y="-20" width="40" height="40" rx="3" fill="#1f2937" stroke="#111827" strokeWidth="2" />
          <rect x="-14" y="-14" width="28" height="16" fill="#374151" rx="1" />
          <circle cx="0" cy="12" r="3" fill="#22c55e" />
          <text x="0" y="-4" textAnchor="middle" fontSize="6" fill="#9ca3af">ESP32</text>
          {[-12, 0, 12].map((x, i) => (
            <rect key={i} x={x - 2} y="-24" width="4" height="6" fill="#ffd700" />
          ))}
        </>
      )}
      {component.id === "breadboard" && (
        <>
          <rect x="-80" y="-40" width="160" height="80" rx="2" fill="#f5f5dc" stroke="#d4d4a8" strokeWidth="2" />
          <line x1="-80" y1="0" x2="80" y2="0" stroke="#d4d4a8" strokeWidth="1" strokeDasharray="4 2" />
          {Array.from({ length: 15 }).map((_, i) => (
            <g key={i}>
              <circle cx={-70 + i * 10} cy="-20" r="2" fill="#4b5563" />
              <circle cx={-70 + i * 10} cy="-10" r="2" fill="#4b5563" />
              <circle cx={-70 + i * 10} cy="10" r="2" fill="#4b5563" />
              <circle cx={-70 + i * 10} cy="20" r="2" fill="#4b5563" />
            </g>
          ))}
        </>
      )}

      {showTerminals && terminals.map((terminal) => {
        const pos = getTerminalPosition(0, 0, 0, terminal);
        return (
          <TerminalMarker
            key={terminal.id}
            terminal={terminal}
            x={pos.x}
            y={pos.y}
            isHovered={hoveredTerminal === terminal.id}
            isWireMode={wireMode}
          />
        );
      })}

      {/* Error Indicator Overlay */}
      {componentError && (
        <g transform="translate(10, -10)" className="error-indicator">
          <circle r="8" fill={errorColor} stroke="white" strokeWidth="1.5" />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            pointerEvents="none"
          >
            !
          </text>
          <title>{`${componentError.message} (${componentError.type})`}</title>
        </g>
      )}
    </g>
  );
}

export function CircuitCanvas({
  placedComponents,
  wires,
  selectedComponent,
  selectedPlacedId,
  isRunning,
  simulationResult,
  onPlaceComponent,
  onAddWire,
  onSelectPlaced,
  onDeleteSelected,
  wireMode,
  wireStart,
  onWireStart,
  resistorValues,
  onChangeResistorValue,
  onMovePlaced,
  selectedWireId,
  onSelectWire,
  onDeleteSelectedWire,
  controlStates,
  onButtonPress,
  onPotentiometerChange,
}: CircuitCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredTerminal, setHoveredTerminal] = useState<{ componentId: string; terminalId: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedPlacedId) {
          onDeleteSelected();
        } else if (selectedWireId) {
          onDeleteSelectedWire();
        }
      } else if (e.key === "Escape") {
        onSelectPlaced(null);
        onSelectWire(null);
        onWireStart(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlacedId, selectedWireId, onDeleteSelected, onDeleteSelectedWire, onSelectPlaced, onSelectWire, onWireStart]);

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (wireMode) {
      const nearestTerminal = findNearestTerminal(pos.x, pos.y, placedComponents);

      if (nearestTerminal) {
        if (!wireStart) {
          onWireStart({
            x: nearestTerminal.x,
            y: nearestTerminal.y,
            terminal: { componentId: nearestTerminal.componentId, terminalId: nearestTerminal.terminalId },
          });
        } else {
          onAddWire({
            startX: wireStart.x,
            startY: wireStart.y,
            endX: nearestTerminal.x,
            endY: nearestTerminal.y,
            isActive: false,
            startTerminal: wireStart.terminal,
            endTerminal: { componentId: nearestTerminal.componentId, terminalId: nearestTerminal.terminalId },
          });
          onWireStart(null);
        }
      }
    } else if (selectedComponent) {
      onPlaceComponent(selectedComponent, pos.x, pos.y);
    } else {
      onSelectPlaced(null);
      onSelectWire(null);
    }
  };

  const handleComponentMouseDown = (e: React.MouseEvent, placedId: string, x: number, y: number) => {
    e.stopPropagation();
    if (!wireMode && !selectedComponent) {
      onSelectPlaced(placedId);
      onSelectWire(null);
      const pos = getMousePosition(e);
      setDraggingId(placedId);
      setDragOffset({ x: pos.x - x, y: pos.y - y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    setMousePos(pos);

    if (draggingId) {
      const placed = placedComponents.find((p) => p.id === draggingId);
      if (placed) {
        const newX = pos.x - dragOffset.x;
        const newY = pos.y - dragOffset.y;
        onMovePlaced(draggingId, newX, newY);
      }
    }

    if (wireMode) {
      const nearestTerminal = findNearestTerminal(pos.x, pos.y, placedComponents);
      setHoveredTerminal(nearestTerminal ? { componentId: nearestTerminal.componentId, terminalId: nearestTerminal.terminalId } : null);
    } else if (wireMode) {
      setHoveredTerminal(null);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const componentMap = new Map(
    placedComponents.map((p) => {
      const comp = [
        { id: "led", name: "LED", category: "base", icon: "led", description: "" },
        { id: "resistor", name: "Resistor", category: "base", icon: "resistor", description: "" },
        { id: "button", name: "Button", category: "base", icon: "button", description: "" },
        { id: "buzzer", name: "Buzzer", category: "base", icon: "buzzer", description: "" },
        { id: "potentiometer", name: "Potentiometer", category: "base", icon: "potentiometer", description: "" },
        { id: "ultrasonic", name: "Ultrasonic Sensor", category: "base", icon: "ultrasonic", description: "" },
        { id: "ir-sensor", name: "IR Sensor", category: "base", icon: "ir-sensor", description: "" },
        { id: "dht11", name: "DHT11 Sensor", category: "base", icon: "dht11", description: "" },
        { id: "servo", name: "Servo Motor", category: "base", icon: "servo", description: "" },
        { id: "5v", name: "5V Power", category: "power", icon: "power-5v", description: "" },
        { id: "gnd", name: "GND", category: "power", icon: "ground", description: "" },
        { id: "object", name: "Object", category: "base", icon: "object", description: "" },
        { id: "arduino-uno", name: "Arduino UNO", category: "boards", icon: "arduino", description: "" },
        { id: "esp32", name: "ESP32", category: "boards", icon: "esp32", description: "" },
        { id: "breadboard", name: "Breadboard", category: "structure", icon: "breadboard", description: "" },
      ].find((c) => c.id === p.componentId);
      return [p.id, comp];
    })
  );

  return (
    <div className="flex-1 bg-muted/30 relative overflow-hidden" tabIndex={0}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      <svg
        ref={svgRef}
        className="w-full h-full relative z-10"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        data-testid="circuit-canvas"
      >
        <defs>
          <filter id="led-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wire-glow" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="2" result="blur" />
             <feMerge>
               <feMergeNode in="blur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
          </filter>
        </defs>
        {wires.map((wire) => {
          const midX = (wire.startX + wire.endX) / 2;
          const midY = (wire.startY + wire.endY) / 2;
          const controlY = midY - 30;

          return (
            <path
              key={wire.id}
              d={`M ${wire.startX} ${wire.startY} Q ${midX} ${controlY} ${wire.endX} ${wire.endY}`}
              fill="none"
              stroke={
                wire.id === selectedWireId
                  ? "#f97316"
                  : wire.isActive
                  ? "#4ade80" // Slightly brighter green for active
                  : "#4b5563" // Neutral gray for inactive
              }
              strokeWidth={wire.isActive ? "4" : "3"} // Slightly thicker if active
              strokeLinecap="round"
              filter={wire.isActive ? "url(#wire-glow)" : undefined} // Add glow if active
              opacity={wire.isActive ? 1 : 0.8} // Adjust opacity
              className="transition-all duration-300 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire(wire.id);
                onSelectPlaced(null);
              }}
            />
          );
        })}

        {wireMode && wireStart && (
          <path
            d={`M ${wireStart.x} ${wireStart.y} Q ${(wireStart.x + mousePos.x) / 2} ${Math.min(wireStart.y, mousePos.y) - 30} ${mousePos.x} ${mousePos.y}`}
            fill="none"
            stroke={hoveredTerminal ? "#22c55e" : "#3b82f6"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="opacity-70"
          />
        )}

        {placedComponents.map((placed) => {
          // Compute IR detection for this component based on nearby objects
          const IR_DETECTION_RADIUS = 80;
          const objectComponents = placedComponents.filter((p) => p.componentId === "object");
          const irDetectedComputed = placed.componentId === "ir-sensor"
            ? objectComponents.some((obj) => {
                const dx = obj.x - placed.x;
                const dy = obj.y - placed.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= IR_DETECTION_RADIUS;
              })
            : undefined;

          // Compute ultrasonic distance for this component
          const MAX_DETECTION_RADIUS_PX = 400;
          const MIN_CM = 2;
          const MAX_CM = 400;
          let ultrasonicDistanceComputed: number | undefined = undefined;
          if (placed.componentId === "ultrasonic") {
            if (objectComponents.length === 0) {
              ultrasonicDistanceComputed = MAX_CM;
            } else {
              let minDistancePx = Infinity;
              objectComponents.forEach((obj) => {
                const dx = obj.x - placed.x;
                const dy = obj.y - placed.y;
                const distancePx = Math.sqrt(dx * dx + dy * dy);
                if (distancePx < minDistancePx) {
                  minDistancePx = distancePx;
                }
              });
              const distanceCm = MIN_CM + (minDistancePx / MAX_DETECTION_RADIUS_PX) * (MAX_CM - MIN_CM);
              ultrasonicDistanceComputed = Math.max(MIN_CM, Math.min(MAX_CM, distanceCm));
            }
          }

          // Get DHT11 temperature and humidity from control state
          const dht11TemperatureComputed = placed.componentId === "dht11"
            ? controlStates[placed.id]?.temperature
            : undefined;
          const dht11HumidityComputed = placed.componentId === "dht11"
            ? controlStates[placed.id]?.humidity
            : undefined;

          return (
          <g
            key={placed.id}
            onMouseDown={(e) => handleComponentMouseDown(e, placed.id, placed.x, placed.y)}
            // Prevent canvas click handler from immediately clearing the selection
            onClick={(e) => e.stopPropagation()}
          >
            <PlacedComponentVisual
              placed={placed}
              component={componentMap.get(placed.id) as ElectronicComponent | undefined}
              isRunning={isRunning}
              componentState={
                simulationResult?.componentStates.get(placed.id) as
                  | ComponentState
                  | undefined
              }
              errors={simulationResult?.errors}
              isSelected={selectedPlacedId === placed.id}
            // Always show terminals so that all pins/ports remain visible and easy to wire
            showTerminals={true}
              hoveredTerminal={
                hoveredTerminal?.componentId === placed.id ? hoveredTerminal.terminalId : null
              }
              wireMode={wireMode}
              buttonPressed={placed.componentId === "button" ? controlStates[placed.id]?.buttonPressed : undefined}
              potPosition={placed.componentId === "potentiometer" ? controlStates[placed.id]?.potPosition : undefined}
              irDetected={irDetectedComputed ?? (controlStates[placed.id]?.irDetected ?? false)}
              ultrasonicDistance={ultrasonicDistanceComputed}
              dht11Temperature={dht11TemperatureComputed}
              dht11Humidity={dht11HumidityComputed}
              servoAngle={placed.componentId === "servo" ? controlStates[placed.id]?.servoAngle : undefined}
              onButtonPress={placed.componentId === "button" ? (pressed) => onButtonPress(placed.id, pressed) : undefined}
              onPotentiometerChange={placed.componentId === "potentiometer" ? (pos) => onPotentiometerChange(placed.id, pos) : undefined}
            />
          </g>
          );
        })}

        {selectedComponent && !wireMode && (
          <g transform={`translate(${mousePos.x}, ${mousePos.y})`} opacity="0.5">
            <circle r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 2" />
          </g>
        )}
      </svg>

      {placedComponents.length === 0 && wires.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-lg border border-border">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Start Building</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select a component from the palette and click on the canvas to place it
            </p>
          </div>
        </div>
      )}

      {selectedPlacedId && (
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border border-border p-3 text-sm space-y-2 max-w-xs">
          <p className="text-muted-foreground">Selected component</p>
          <p className="font-medium mb-1">Press DELETE or ESC to remove</p>
          {(() => {
            const selected = placedComponents.find((p) => p.id === selectedPlacedId);
            if (!selected) return null;
            
            if (selected.componentId === "resistor") {
              const value = resistorValues[selectedPlacedId] ?? 220;
              return (
                <div className="space-y-1">
                  <Label htmlFor="resistor-value" className="text-xs">
                    Resistor value (Ω)
                  </Label>
                  <Input
                    id="resistor-value"
                    type="number"
                    min={1}
                    max={1000000}
                    step={10}
                    value={value}
                    onChange={(e) => {
                      const next = Number(e.target.value) || 0;
                      onChangeResistorValue(selectedPlacedId, Math.max(1, next));
                    }}
                    className="h-7 text-xs px-2"
                  />
                </div>
              );
            }
            
            if (selected.componentId === "potentiometer") {
              const position = controlStates[selectedPlacedId]?.potPosition ?? 0.5;
              return (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Position: <span className="font-medium text-foreground">{Math.round(position * 100)}%</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use the slider in Control Panel →
                  </p>
                </div>
              );
            }
            
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
