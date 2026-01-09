import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { componentMetadata, getTerminalPosition, findNearestTerminal, type Terminal } from "@/lib/circuit-types";
import type { ElectronicComponent, PlacedComponent, Wire } from "@shared/schema";
import type { SimulationResult, ComponentState, SimulationError } from "@/lib/simulation-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LedVisual } from "./LedVisual";
import { BreadboardVisual } from "./BreadboardVisual";
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

  const baseRadius = 7;
  const hoverRadius = 10;
  const hitAreaRadius = 14; // Minimum 12x12 px hit area (14px radius = 28px diameter)

  return (
    <g className="terminal-marker" style={{ cursor: isWireMode ? 'crosshair' : 'pointer' }}>
      {/* Large invisible hit area for easier clicking */}
      <circle
        cx={x}
        cy={y}
        r={hitAreaRadius}
        fill="transparent"
        style={{ cursor: isWireMode ? 'crosshair' : 'pointer' }}
      />
      
      {/* Outer glow when hovered */}
      {isHovered && (
        <circle
          cx={x}
          cy={y}
          r={hoverRadius + 6}
          fill="rgba(34, 197, 94, 0.25)"
          className="pointer-events-none animate-pulse"
        />
      )}
      
      {/* Main terminal circle */}
      <circle
        cx={x}
        cy={y}
        r={isHovered ? hoverRadius : baseRadius}
        fill={getColor()}
        stroke={isHovered ? "#22c55e" : "white"}
        strokeWidth={isHovered ? 3 : 2}
        className="transition-all duration-150 pointer-events-none"
        data-testid={`terminal-${terminal.id}`}
      />
      
      {/* Inner highlight for depth effect */}
      <circle
        cx={x}
        cy={y}
        r={isHovered ? 4 : 3}
        fill="rgba(255,255,255,0.3)"
        className="pointer-events-none"
      />
      
      <title>{terminal.name}</title>
      
      {/* Terminal name label on hover */}
      {isHovered && (
        <g className="pointer-events-none">
          {/* Label background */}
          <rect
            x={x - 20}
            y={y - 25}
            width="40"
            height="14"
            rx="3"
            fill="rgba(0,0,0,0.8)"
          />
          <text
            x={x}
            y={y - 14}
            textAnchor="middle"
            fontSize="9"
            fill="#ffffff"
            fontWeight="500"
          >
            {terminal.name}
          </text>
        </g>
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
          {/* Main board body - enlarged for better pin spacing */}
          <rect x="-70" y="-42" width="140" height="84" rx="4" fill="#008184" stroke="#006668" strokeWidth="2.5" />
          {/* USB connector */}
          <rect x="-65" y="-35" width="18" height="14" rx="2" fill="#1f2937" stroke="#111827" strokeWidth="1" />
          {/* Power jack */}
          <rect x="-65" y="15" width="22" height="16" rx="2" fill="#1f2937" stroke="#111827" strokeWidth="1" />
          {/* Reset button */}
          <circle cx="-45" cy="0" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          {/* Main chip */}
          <rect x="-10" y="-15" width="40" height="30" rx="2" fill="#1f2937" stroke="#111827" strokeWidth="1" />
          {/* Arduino branding */}
          <text x="30" y="5" fontSize="12" fill="white" fontWeight="bold">UNO</text>
          <text x="30" y="-8" fontSize="7" fill="#a0dade">ARDUINO</text>
          {/* LED indicators */}
          <circle cx="50" cy="-25" r="3" fill="#22c55e" opacity="0.7" />
          <circle cx="50" cy="-15" r="3" fill="#f59e0b" opacity="0.7" />
          {/* Top pin header background - Power & Analog */}
          <rect x="-62" y="-42" width="128" height="8" fill="#2d6b6d" rx="1" />
          {/* Bottom pin header background - Digital */}
          <rect x="-62" y="34" width="124" height="8" fill="#2d6b6d" rx="1" />
          {/* Pin labels for top row */}
          <text x="-56" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">5V</text>
          <text x="-42" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">3.3V</text>
          <text x="-28" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">GND</text>
          <text x="-14" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">GND</text>
          <text x="0" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">VIN</text>
          <text x="18" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">A0</text>
          <text x="32" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">A1</text>
          <text x="46" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">A2</text>
          <text x="60" y="-29" fontSize="5" fill="#a0dade" textAnchor="middle">A3</text>
          {/* Pin labels for bottom row */}
          <text x="-56" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">13</text>
          <text x="-42" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">12</text>
          <text x="-28" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">~11</text>
          <text x="-14" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">~10</text>
          <text x="0" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">~9</text>
          <text x="14" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">8</text>
          <text x="28" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">7</text>
          <text x="42" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">~6</text>
          <text x="56" y="31" fontSize="5" fill="#a0dade" textAnchor="middle">~5</text>
        </>
      )}
      {component.id === "esp32" && (
        <>
          {/* Main board body - enlarged for better pin spacing */}
          <rect x="-45" y="-45" width="90" height="90" rx="4" fill="#1f2937" stroke="#111827" strokeWidth="2.5" />
          {/* WiFi antenna area */}
          <rect x="-35" y="-40" width="70" height="25" rx="2" fill="#374151" stroke="#4b5563" strokeWidth="1" />
          <text x="0" y="-24" textAnchor="middle" fontSize="7" fill="#9ca3af">WIFI/BT</text>
          {/* Main chip */}
          <rect x="-20" y="-10" width="40" height="30" rx="2" fill="#111827" stroke="#374151" strokeWidth="1" />
          {/* ESP32 branding */}
          <text x="0" y="8" textAnchor="middle" fontSize="8" fill="#9ca3af" fontWeight="bold">ESP32</text>
          {/* LED indicator */}
          <circle cx="0" cy="30" r="4" fill="#22c55e" opacity="0.8" />
          {/* USB connector */}
          <rect x="-10" y="35" width="20" height="8" rx="1" fill="#6b7280" stroke="#4b5563" strokeWidth="0.5" />
          {/* Left side pin header background */}
          <rect x="-45" y="-40" width="10" height="80" fill="#2a2a2a" rx="1" />
          {/* Right side pin header background */}
          <rect x="35" y="-40" width="10" height="80" fill="#2a2a2a" rx="1" />
          {/* Left pin labels */}
          <text x="-30" y="-33" fontSize="5" fill="#9ca3af" textAnchor="start">3.3V</text>
          <text x="-30" y="-19" fontSize="5" fill="#9ca3af" textAnchor="start">GND</text>
          <text x="-30" y="-5" fontSize="5" fill="#9ca3af" textAnchor="start">D15</text>
          <text x="-30" y="9" fontSize="5" fill="#9ca3af" textAnchor="start">D2</text>
          <text x="-30" y="23" fontSize="5" fill="#9ca3af" textAnchor="start">D4</text>
          <text x="-30" y="37" fontSize="5" fill="#9ca3af" textAnchor="start">D5</text>
          {/* Right pin labels */}
          <text x="30" y="-33" fontSize="5" fill="#9ca3af" textAnchor="end">VIN</text>
          <text x="30" y="-19" fontSize="5" fill="#9ca3af" textAnchor="end">GND</text>
          <text x="30" y="-5" fontSize="5" fill="#9ca3af" textAnchor="end">D13</text>
          <text x="30" y="9" fontSize="5" fill="#9ca3af" textAnchor="end">D12</text>
          <text x="30" y="23" fontSize="5" fill="#9ca3af" textAnchor="end">D14</text>
          <text x="30" y="37" fontSize="5" fill="#9ca3af" textAnchor="end">D27</text>
        </>
      )}
      {component.id === "breadboard" && (
        <BreadboardVisual
          hoveredTerminal={hoveredTerminal}
          wireMode={wireMode}
        />
      )}

      {/* Breadboard has its own pin rendering in BreadboardVisual */}
      {showTerminals && component.id !== "breadboard" && terminals.map((terminal) => {
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
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

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
      // Use a generous threshold for click detection - makes it easier to click on pins
      const nearestTerminal = findNearestTerminal(pos.x, pos.y, placedComponents, 24);

      if (nearestTerminal) {
        if (!wireStart) {
          // Start a new wire from this terminal
          onWireStart({
            x: nearestTerminal.x,
            y: nearestTerminal.y,
            terminal: { componentId: nearestTerminal.componentId, terminalId: nearestTerminal.terminalId },
          });
        } else {
          // Complete the wire to this terminal
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
      } else if (wireStart) {
        // Clicked empty space while drawing wire - cancel the wire
        onWireStart(null);
      }
      // If no terminal found and no wire started, just ignore the click
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
        setDragPosition({ x: newX, y: newY }); // Store drag position for wire calculation
        onMovePlaced(draggingId, newX, newY);
      }
    }

    if (wireMode) {
      // Use a threshold that balances precision with ease of use
      // 20px allows hovering near pins while still being precise enough for breadboards (8px spacing)
      const nearestTerminal = findNearestTerminal(pos.x, pos.y, placedComponents, 20);
      setHoveredTerminal(nearestTerminal ? { componentId: nearestTerminal.componentId, terminalId: nearestTerminal.terminalId } : null);
    } else {
      setHoveredTerminal(null);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setDragPosition(null); // Clear drag position when drag ends
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
    <div 
      className={cn(
        "flex-1 bg-muted/30 relative overflow-hidden",
        wireMode && "cursor-crosshair"
      )} 
      tabIndex={0}
    >
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
             <feGaussianBlur stdDeviation="3" result="blur" />
             <feMerge>
               <feMergeNode in="blur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
          </filter>
          <filter id="wire-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* RENDER ORDER: Components first (background), then wires on top */}
        
        {/* ═══════════════ COMPONENTS LAYER ═══════════════ */}
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
            // In wire mode, let clicks propagate to canvas for wire connections
            // Otherwise, stop propagation to prevent clearing selection
            onClick={(e) => {
              if (!wireMode) {
                e.stopPropagation();
              }
              // In wire mode, let the click bubble up to handleCanvasClick
            }}
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

        {/* ═══════════════ WIRES LAYER (renders ON TOP of components) ═══════════════ */}
        {wires.map((wire) => {
          // Calculate wire positions - use drag position if component is being dragged
          let startX = wire.startX;
          let startY = wire.startY;
          let endX = wire.endX;
          let endY = wire.endY;
          
          // If dragging, recalculate wire positions based on drag position
          if (draggingId && dragPosition) {
            const draggedComponent = placedComponents.find((p) => p.id === draggingId);
            if (draggedComponent) {
              const metadata = componentMetadata[draggedComponent.componentId];
              if (metadata) {
                // Update start position if connected to dragged component
                if (wire.startTerminal?.componentId === draggingId) {
                  const term = metadata.terminals.find((t) => t.id === wire.startTerminal!.terminalId);
                  if (term) {
                    const pos = getTerminalPosition(dragPosition.x, dragPosition.y, draggedComponent.rotation, term);
                    startX = pos.x;
                    startY = pos.y;
                  }
                }
                // Update end position if connected to dragged component
                if (wire.endTerminal?.componentId === draggingId) {
                  const term = metadata.terminals.find((t) => t.id === wire.endTerminal!.terminalId);
                  if (term) {
                    const pos = getTerminalPosition(dragPosition.x, dragPosition.y, draggedComponent.rotation, term);
                    endX = pos.x;
                    endY = pos.y;
                  }
                }
              }
            }
          }
          
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const controlY = midY - 30;
          const isSelected = wire.id === selectedWireId;
          
          // High contrast wire colors - very visible
          const wireColor = isSelected
            ? "#f97316" // Orange for selected
            : wire.isActive
            ? "#22c55e" // Bright green for active
            : "#059669"; // Emerald green for inactive (high contrast)

          return (
            <g key={wire.id} className="wire-group" filter="url(#wire-shadow)">
              {/* Wire shadow for depth */}
              <path
                d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={wire.isActive ? 8 : 7}
                strokeLinecap="round"
                className="pointer-events-none"
                transform="translate(1, 2)"
              />
              
              {/* Wire outer stroke for thickness */}
              <path
                d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke={isSelected ? "#c2410c" : "#064e3b"}
                strokeWidth={wire.isActive ? 6 : 5}
                strokeLinecap="round"
                className="pointer-events-none"
              />
              
              {/* Main wire stroke - very visible */}
              <path
                d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke={wireColor}
                strokeWidth={wire.isActive ? 4.5 : 3.5}
                strokeLinecap="round"
                filter={wire.isActive ? "url(#wire-glow)" : undefined}
                className={draggingId ? "cursor-pointer" : "transition-all duration-200 cursor-pointer"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectPlaced(null);
                }}
              />
              
              {/* Wire highlight line for 3D effect */}
              <path
                d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="pointer-events-none"
                transform="translate(-0.5, -1)"
              />
              
              {/* Start endpoint circle */}
              <circle
                cx={startX}
                cy={startY}
                r={isSelected ? 8 : 6}
                fill={wireColor}
                stroke="#ffffff"
                strokeWidth={2.5}
                className={draggingId ? "cursor-pointer" : "transition-all duration-200 cursor-pointer"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectPlaced(null);
                }}
              />
              <circle
                cx={startX}
                cy={startY}
                r={2.5}
                fill="rgba(255,255,255,0.6)"
                className="pointer-events-none"
              />
              
              {/* End endpoint circle */}
              <circle
                cx={endX}
                cy={endY}
                r={isSelected ? 8 : 6}
                fill={wireColor}
                stroke="#ffffff"
                strokeWidth={2.5}
                className={draggingId ? "cursor-pointer" : "transition-all duration-200 cursor-pointer"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectPlaced(null);
                }}
              />
              <circle
                cx={endX}
                cy={endY}
                r={2.5}
                fill="rgba(255,255,255,0.6)"
                className="pointer-events-none"
              />
              
              {/* Selection indicator ring */}
              {isSelected && (
                <>
                  <circle
                    cx={startX}
                    cy={startY}
                    r={12}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    className="animate-pulse pointer-events-none"
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r={12}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    className="animate-pulse pointer-events-none"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* ═══════════════ WIRE PREVIEW (while drawing) ═══════════════ */}
        {wireMode && wireStart && (
          <g className="wire-preview">
            {/* Preview wire shadow */}
            <path
              d={`M ${wireStart.x} ${wireStart.y} Q ${(wireStart.x + mousePos.x) / 2} ${Math.min(wireStart.y, mousePos.y) - 30} ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="6"
              strokeLinecap="round"
              className="pointer-events-none"
              transform="translate(1, 2)"
            />
            
            {/* Main preview wire */}
            <path
              d={`M ${wireStart.x} ${wireStart.y} Q ${(wireStart.x + mousePos.x) / 2} ${Math.min(wireStart.y, mousePos.y) - 30} ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke={hoveredTerminal ? "#22c55e" : "#3b82f6"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8 4"
              className="pointer-events-none"
            />
            
            {/* Start point indicator */}
            <circle
              cx={wireStart.x}
              cy={wireStart.y}
              r={9}
              fill={hoveredTerminal ? "#22c55e" : "#3b82f6"}
              stroke="#ffffff"
              strokeWidth={2.5}
              className="pointer-events-none"
            />
            <circle
              cx={wireStart.x}
              cy={wireStart.y}
              r={3.5}
              fill="#ffffff"
              className="pointer-events-none"
            />
            
            {/* Cursor endpoint indicator */}
            <circle
              cx={mousePos.x}
              cy={mousePos.y}
              r={hoveredTerminal ? 11 : 7}
              fill={hoveredTerminal ? "#22c55e" : "transparent"}
              stroke={hoveredTerminal ? "#ffffff" : "#3b82f6"}
              strokeWidth={2.5}
              className="pointer-events-none transition-all duration-100"
            />
            {hoveredTerminal && (
              <circle
                cx={mousePos.x}
                cy={mousePos.y}
                r={16}
                fill="none"
                stroke="#22c55e"
                strokeWidth={2}
                className="pointer-events-none animate-ping"
              />
            )}
          </g>
        )}

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

      {/* Wire Mode Status Indicator */}
      {wireMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-primary/50 z-20">
          <div className="flex items-center gap-2 text-primary-foreground">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">
              {wireStart 
                ? "Click a pin or breadboard hole to complete wire" 
                : "Click a pin or breadboard hole to start wiring"}
            </span>
            <span className="text-xs opacity-70 ml-2">(ESC to cancel)</span>
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