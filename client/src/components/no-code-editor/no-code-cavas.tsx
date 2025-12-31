import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { componentMetadata, getTerminalPosition, findNearestTerminal, type Terminal } from "@/lib/circuit-types";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";
import type { SimulationResult } from "@/lib/simulation-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExtendedWire extends Wire {
  startTerminal?: { componentId: string; terminalId: string };
  endTerminal?: { componentId: string; terminalId: string };
}

interface NoCodeCanvasProps {
  placedComponents: PlacedComponent[];
  wires: ExtendedWire[];
  selectedComponent: ElectronicComponent | null;
  selectedPlacedId: string | null;
  isRunning: boolean;
  ledState: boolean;
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
      {(isHovered || isWireMode) && (
        <text
          x={x}
          y={y - 12}
          textAnchor="middle"
          fontSize="9"
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
  ledState,
  isSelected,
  showTerminals,
  hoveredTerminal,
  wireMode,
}: {
  placed: PlacedComponent;
  component: ElectronicComponent | undefined;
  isRunning: boolean;
  ledState: boolean;
  isSelected: boolean;
  showTerminals: boolean;
  hoveredTerminal: string | null;
  wireMode: boolean;
}) {
  if (!component) return null;

  const metadata = componentMetadata[component.id];
  const isLed = component.id === "led";
  const ledOn = isLed && isRunning && ledState;

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
          <circle
            cx="0"
            cy="0"
            r="16"
            className={cn(
              "transition-all duration-300",
              ledOn ? "fill-red-500" : "fill-gray-300"
            )}
            stroke={ledOn ? "#ef4444" : "#9ca3af"}
            strokeWidth="2"
          />
          {ledOn && (
            <circle
              cx="0"
              cy="0"
              r="24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1"
              opacity="0.3"
            />
          )}
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
        <>
          <rect x="-16" y="-12" width="32" height="24" rx="3" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="8" fill="#6b7280" />
          <line x1="-26" y1="0" x2="-16" y2="0" stroke="#4b5563" strokeWidth="2" />
          <line x1="16" y1="0" x2="26" y2="0" stroke="#4b5563" strokeWidth="2" />
        </>
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
          <line x1="0" y1="-6" x2="0" y2="0" stroke="#d4d4d4" strokeWidth="2" />
          <line x1="-8" y1="10" x2="-8" y2="20" stroke="#dc2626" strokeWidth="2" />
          <line x1="0" y1="10" x2="0" y2="20" stroke="#f59e0b" strokeWidth="2" />
          <line x1="8" y1="10" x2="8" y2="20" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
      {component.id === "ultrasonic" && (
        <>
          <rect x="-22" y="-12" width="44" height="24" rx="2" fill="#1e40af" stroke="#1e3a8a" strokeWidth="1.5" />
          <circle cx="-8" cy="0" r="7" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" />
          <circle cx="8" cy="0" r="7" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" />
          <line x1="-15" y1="12" x2="-15" y2="22" stroke="#dc2626" strokeWidth="2" />
          <line x1="-5" y1="12" x2="-5" y2="22" stroke="#f59e0b" strokeWidth="2" />
          <line x1="5" y1="12" x2="5" y2="22" stroke="#22c55e" strokeWidth="2" />
          <line x1="15" y1="12" x2="15" y2="22" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
      {component.id === "ir-sensor" && (
        <>
          <rect x="-14" y="-16" width="28" height="32" rx="2" fill="#1f2937" stroke="#111827" strokeWidth="1.5" />
          <circle cx="0" cy="-6" r="5" fill="#ef4444" opacity="0.8" />
          <rect x="-6" y="4" width="12" height="6" fill="#6b7280" />
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
          <line x1="-8" y1="18" x2="-8" y2="28" stroke="#dc2626" strokeWidth="2" />
          <line x1="0" y1="18" x2="0" y2="28" stroke="#f59e0b" strokeWidth="2" />
          <line x1="8" y1="18" x2="8" y2="28" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
      {component.id === "servo" && (
        <>
          <rect x="-20" y="-10" width="40" height="20" rx="2" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
          <circle cx="14" cy="0" r="6" fill="#6b7280" />
          <line x1="14" y1="-6" x2="20" y2="-14" stroke="#4b5563" strokeWidth="3" strokeLinecap="round" />
          <line x1="-14" y1="10" x2="-14" y2="20" stroke="#f59e0b" strokeWidth="2" />
          <line x1="0" y1="10" x2="0" y2="20" stroke="#dc2626" strokeWidth="2" />
          <line x1="14" y1="10" x2="14" y2="20" stroke="#4b5563" strokeWidth="2" />
        </>
      )}
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
    </g>
  );
}

export function NoCodeCanvas({
  placedComponents,
  wires,
  selectedComponent,
  selectedPlacedId,
  isRunning,
  ledState,
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
}: NoCodeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredTerminal, setHoveredTerminal] = useState<{ componentId: string; terminalId: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace" || e.key === "Escape") && selectedPlacedId) {
        e.preventDefault();
        onDeleteSelected();
      }
      if (e.key === "Escape") {
        onSelectPlaced(null);
        onWireStart(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlacedId, onDeleteSelected, onSelectPlaced, onWireStart]);

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
    }
  };

  const handleComponentClick = (e: React.MouseEvent, placedId: string) => {
    e.stopPropagation();
    if (!wireMode && !selectedComponent) {
      onSelectPlaced(placedId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    setMousePos(pos);

    if (wireMode) {
      const nearestTerminal = findNearestTerminal(pos.x, pos.y, placedComponents);
      setHoveredTerminal(nearestTerminal ? { componentId: nearestTerminal.componentId, terminalId: nearestTerminal.terminalId } : null);
    } else {
      setHoveredTerminal(null);
    }
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
        data-testid="circuit-canvas"
      >
        {wires.map((wire) => {
          const midX = (wire.startX + wire.endX) / 2;
          const midY = (wire.startY + wire.endY) / 2;
          const controlY = midY - 30;

          return (
            <path
              key={wire.id}
              d={`M ${wire.startX} ${wire.startY} Q ${midX} ${controlY} ${wire.endX} ${wire.endY}`}
              fill="none"
              stroke={wire.isActive ? "#22c55e" : "#4b5563"}
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-colors duration-300"
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

        {placedComponents.map((placed) => (
          <g key={placed.id} onClick={(e) => handleComponentClick(e, placed.id)}>
            <PlacedComponentVisual
              placed={placed}
              component={componentMap.get(placed.id) as ElectronicComponent | undefined}
              isRunning={isRunning}
              ledState={ledState}
              isSelected={selectedPlacedId === placed.id}
            // Always show terminals so that all pins/ports remain visible and easy to wire
            showTerminals={true}
              hoveredTerminal={
                hoveredTerminal?.componentId === placed.id ? hoveredTerminal.terminalId : null
              }
              wireMode={wireMode}
            />
          </g>
        ))}

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
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border border-border p-3 text-sm space-y-2">
          <p className="text-muted-foreground">Selected component</p>
          <p className="font-medium mb-1">Press DELETE or ESC to remove</p>
          {(() => {
            const selected = placedComponents.find((p) => p.id === selectedPlacedId);
            if (selected?.componentId !== "resistor") return null;
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
          })()}
        </div>
      )}
    </div>
  );
}