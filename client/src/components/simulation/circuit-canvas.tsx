import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";

interface CircuitCanvasProps {
  placedComponents: PlacedComponent[];
  wires: Wire[];
  selectedComponent: ElectronicComponent | null;
  isRunning: boolean;
  ledState: boolean;
  onPlaceComponent: (component: ElectronicComponent, x: number, y: number) => void;
  onAddWire: (wire: Omit<Wire, "id">) => void;
  wireMode: boolean;
  wireStart: { x: number; y: number } | null;
  onWireStart: (point: { x: number; y: number } | null) => void;
}

function PlacedComponentVisual({
  placed,
  component,
  isRunning,
  ledState,
}: {
  placed: PlacedComponent;
  component: ElectronicComponent | undefined;
  isRunning: boolean;
  ledState: boolean;
}) {
  if (!component) return null;

  const isLed = component.id === "led";
  const ledOn = isLed && isRunning && ledState;

  return (
    <g
      transform={`translate(${placed.x}, ${placed.y}) rotate(${placed.rotation})`}
      className="cursor-move"
    >
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
          <line x1="-8" y1="16" x2="-8" y2="28" stroke="#4b5563" strokeWidth="2" />
          <line x1="8" y1="16" x2="8" y2="28" stroke="#4b5563" strokeWidth="2" />
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
      {component.id === "5v" && (
        <>
          <circle cx="0" cy="0" r="14" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">5V</text>
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
    </g>
  );
}

export function CircuitCanvas({
  placedComponents,
  wires,
  selectedComponent,
  isRunning,
  ledState,
  onPlaceComponent,
  onAddWire,
  wireMode,
  wireStart,
  onWireStart,
}: CircuitCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      if (!wireStart) {
        onWireStart(pos);
      } else {
        onAddWire({
          startX: wireStart.x,
          startY: wireStart.y,
          endX: pos.x,
          endY: pos.y,
          isActive: false,
        });
        onWireStart(null);
      }
    } else if (selectedComponent) {
      onPlaceComponent(selectedComponent, pos.x, pos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos(getMousePosition(e));
  };

  const componentMap = new Map(
    placedComponents.map((p) => {
      const comp = [
        { id: "led", name: "LED", category: "base", icon: "led", description: "" },
        { id: "resistor", name: "Resistor", category: "base", icon: "resistor", description: "" },
        { id: "button", name: "Button", category: "base", icon: "button", description: "" },
        { id: "5v", name: "5V Power", category: "power", icon: "power-5v", description: "" },
        { id: "gnd", name: "GND", category: "power", icon: "ground", description: "" },
        { id: "arduino-uno", name: "Arduino UNO", category: "boards", icon: "arduino", description: "" },
        { id: "breadboard", name: "Breadboard", category: "structure", icon: "breadboard", description: "" },
      ].find((c) => c.id === p.componentId);
      return [p.id, comp];
    })
  );

  return (
    <div className="flex-1 bg-muted/30 relative overflow-hidden">
      {/* Grid Background */}
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
        {/* Wires */}
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

        {/* Wire in progress */}
        {wireMode && wireStart && (
          <path
            d={`M ${wireStart.x} ${wireStart.y} Q ${(wireStart.x + mousePos.x) / 2} ${Math.min(wireStart.y, mousePos.y) - 30} ${mousePos.x} ${mousePos.y}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="opacity-70"
          />
        )}

        {/* Placed Components */}
        {placedComponents.map((placed) => (
          <PlacedComponentVisual
            key={placed.id}
            placed={placed}
            component={componentMap.get(placed.id) as ElectronicComponent | undefined}
            isRunning={isRunning}
            ledState={ledState}
          />
        ))}

        {/* Ghost component following cursor */}
        {selectedComponent && !wireMode && (
          <g transform={`translate(${mousePos.x}, ${mousePos.y})`} opacity="0.5">
            <circle r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 2" />
          </g>
        )}
      </svg>

      {/* Instructions overlay */}
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
    </div>
  );
}
