import { useState } from "react";
import { ChevronUp, ChevronDown, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { componentMetadata } from "@/lib/circuit-types";
import type { PlacedComponent } from "@shared/schema";
import type { SimulationResult, McuPinStateMap, PinLogicState, Net } from "@/lib/simulation-engine";
import { cn } from "@/lib/utils";

interface SerialMonitorConsoleProps {
  placedComponents: PlacedComponent[];
  mcuPinStates: McuPinStateMap;
  simulationResult: SimulationResult | null;
  controlStates: Record<string, {
    buttonPressed?: boolean;
    potPosition?: number;
    irDetected?: boolean;
    ultrasonicDistance?: number;
    temperature?: number;
    humidity?: number;
    servoAngle?: number;
  }>;
  isRunning: boolean;
}

function findNetForPin(
  placedId: string,
  pinId: string,
  simulationResult: SimulationResult | null
): Net | null {
  if (!simulationResult) return null;

  for (const circuit of simulationResult.circuits) {
    for (const net of circuit.nets) {
      const isConnected = net.terminals.some(
        (term) => term.componentId === placedId && term.terminalId === pinId
      );
      if (isConnected) {
        return net;
      }
    }
  }
  return null;
}

function formatVoltage(voltage: number | null): string {
  if (voltage === null || isNaN(voltage)) {
    return "-.--V";
  }
  return `${voltage.toFixed(2)}V`;
}

function calculateDigitalValue(voltage: number | null, boardType: "arduino-uno" | "esp32"): string {
  if (voltage === null || isNaN(voltage)) return "---";
  const threshold = boardType === "arduino-uno" ? 2.5 : 1.65;
  return voltage > threshold ? "HIGH" : "LOW";
}

function calculateAnalogValue(voltage: number | null, boardType: "arduino-uno" | "esp32"): string {
  if (voltage === null || isNaN(voltage)) return "----";
  const maxVoltage = boardType === "arduino-uno" ? 5.0 : 3.3;
  const scaled = Math.round((voltage / maxVoltage) * 1023);
  return Math.max(0, Math.min(1023, scaled)).toString().padStart(4, " ");
}

export function SerialMonitorConsole({
  placedComponents,
  mcuPinStates,
  simulationResult,
  controlStates,
  isRunning,
}: SerialMonitorConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const boards = placedComponents.filter(
    (p) => p.componentId === "arduino-uno" || p.componentId === "esp32"
  );

  // Don't render if no MCU exists
  if (boards.length === 0) {
    return null;
  }

  // Get connected sensors
  const irSensors = placedComponents.filter((p) => p.componentId === "ir-sensor");
  const ultrasonicSensors = placedComponents.filter((p) => p.componentId === "ultrasonic");
  const dht11Sensors = placedComponents.filter((p) => p.componentId === "dht11");
  
  // Get actuators
  const servos = placedComponents.filter((p) => p.componentId === "servo");
  const buzzers = placedComponents.filter((p) => p.componentId === "buzzer");

  const renderBoardOutput = (board: PlacedComponent) => {
    const meta = componentMetadata[board.componentId];
    if (!meta) return null;

    const boardType = board.componentId as "arduino-uno" | "esp32";
    const boardLabel = boardType === "arduino-uno" ? "Arduino UNO" : "ESP32";
    const statesForBoard = mcuPinStates[board.id] ?? {};

    // Get digital pins (connected only)
    const digitalPins = meta.terminals.filter(
      (t) =>
        (t.type === "signal" || t.type === "data") &&
        !t.id.startsWith("a") &&
        !["5v", "3v3", "gnd", "gnd2", "vin", "en", "vp", "vn"].includes(t.id)
    );

    // Get analog pins
    const analogPins = meta.terminals.filter(
      (t) => t.id.startsWith("a") || t.name.startsWith("A")
    );

    // Filter to only connected pins
    const connectedDigitalPins = digitalPins.filter((pin) => {
      const net = findNetForPin(board.id, pin.id, simulationResult);
      return net !== null;
    });

    const connectedAnalogPins = analogPins.filter((pin) => {
      const net = findNetForPin(board.id, pin.id, simulationResult);
      return net !== null;
    });

    return (
      <div key={board.id} className="mb-4">
        <div className="text-cyan-400 font-bold">
          [BOARD] {boardLabel} ({board.id.slice(0, 12)}...)
        </div>
        
        {/* Digital Pins */}
        {connectedDigitalPins.length > 0 && (
          <>
            <div className="text-yellow-500 mt-2">--- DIGITAL PINS ---</div>
            {connectedDigitalPins.map((pin) => {
              const mode: PinLogicState = statesForBoard[pin.id] ?? "INPUT";
              const net = findNetForPin(board.id, pin.id, simulationResult);
              const voltage = net?.voltage ?? null;
              const value = calculateDigitalValue(voltage, boardType);
              const modeColor = mode === "HIGH" ? "text-red-400" : mode === "LOW" ? "text-blue-400" : "text-gray-400";
              const valueColor = value === "HIGH" ? "text-green-400" : value === "LOW" ? "text-gray-500" : "text-gray-600";

              return (
                <div key={pin.id} className="flex">
                  <span className="w-8 text-white">{pin.name.padEnd(4)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className={cn("w-16", modeColor)}>{mode.padEnd(6)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="w-16 text-orange-300">{formatVoltage(voltage)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className={cn("w-8", valueColor)}>{value}</span>
                </div>
              );
            })}
          </>
        )}

        {/* Analog Pins */}
        {connectedAnalogPins.length > 0 && (
          <>
            <div className="text-yellow-500 mt-2">--- ANALOG PINS ---</div>
            {connectedAnalogPins.map((pin) => {
              const net = findNetForPin(board.id, pin.id, simulationResult);
              const voltage = net?.voltage ?? null;
              const value = calculateAnalogValue(voltage, boardType);

              return (
                <div key={pin.id} className="flex">
                  <span className="w-8 text-white">{pin.name.padEnd(4)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="w-16 text-gray-400">INPUT </span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="w-16 text-orange-300">{formatVoltage(voltage)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="w-8 text-purple-400">{value}</span>
                </div>
              );
            })}
          </>
        )}

        {connectedDigitalPins.length === 0 && connectedAnalogPins.length === 0 && (
          <div className="text-gray-500 mt-2">No connected pins detected</div>
        )}
      </div>
    );
  };

  const renderSensors = () => {
    const hasSensors = irSensors.length > 0 || ultrasonicSensors.length > 0 || dht11Sensors.length > 0;
    if (!hasSensors) return null;

    return (
      <div className="mb-4">
        <div className="text-yellow-500">--- SENSORS ---</div>
        
        {irSensors.map((sensor) => {
          const state = simulationResult?.componentStates.get(sensor.id);
          const detected = controlStates[sensor.id]?.irDetected ?? false;
          const powered = state?.powered ?? false;
          
          return (
            <div key={sensor.id} className="flex">
              <span className="w-24 text-white">IR Sensor</span>
              <span className="text-gray-500 mx-1">:</span>
              <span className={cn(
                powered ? (detected ? "text-green-400" : "text-red-400") : "text-gray-600"
              )}>
                {powered ? (detected ? "DETECTED" : "CLEAR") : "UNPOWERED"}
              </span>
            </div>
          );
        })}

        {ultrasonicSensors.map((sensor) => {
          const state = simulationResult?.componentStates.get(sensor.id);
          const distance = controlStates[sensor.id]?.ultrasonicDistance ?? 400;
          const powered = state?.powered ?? false;
          
          return (
            <div key={sensor.id} className="flex">
              <span className="w-24 text-white">Ultrasonic</span>
              <span className="text-gray-500 mx-1">:</span>
              <span className={cn(powered ? "text-cyan-400" : "text-gray-600")}>
                {powered ? `${Math.round(distance)} cm` : "UNPOWERED"}
              </span>
            </div>
          );
        })}

        {dht11Sensors.map((sensor) => {
          const state = simulationResult?.componentStates.get(sensor.id);
          const temperature = controlStates[sensor.id]?.temperature ?? 25;
          const humidity = controlStates[sensor.id]?.humidity ?? 50;
          const powered = state?.powered ?? false;
          
          return (
            <div key={sensor.id} className="flex">
              <span className="w-24 text-white">DHT11</span>
              <span className="text-gray-500 mx-1">:</span>
              <span className={cn(powered ? "text-green-400" : "text-gray-600")}>
                {powered ? `${Math.round(temperature)}°C , ${Math.round(humidity)}%` : "UNPOWERED"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderActuators = () => {
    const hasActuators = servos.length > 0 || buzzers.length > 0;
    if (!hasActuators) return null;

    return (
      <div className="mb-4">
        <div className="text-yellow-500">--- ACTUATORS ---</div>
        
        {servos.map((servo) => {
          const state = simulationResult?.componentStates.get(servo.id);
          const angle = controlStates[servo.id]?.servoAngle ?? 90;
          const powered = state?.powered ?? false;
          
          return (
            <div key={servo.id} className="flex">
              <span className="w-24 text-white">Servo Angle</span>
              <span className="text-gray-500 mx-1">:</span>
              <span className={cn(powered ? "text-blue-400" : "text-gray-600")}>
                {powered ? `${Math.round(angle)}°` : "UNPOWERED"}
              </span>
            </div>
          );
        })}

        {buzzers.map((buzzer) => {
          const state = simulationResult?.componentStates.get(buzzer.id);
          const powered = state?.powered ?? false;
          
          return (
            <div key={buzzer.id} className="flex">
              <span className="w-24 text-white">Buzzer</span>
              <span className="text-gray-500 mx-1">:</span>
              <span className={cn(powered ? "text-yellow-400" : "text-gray-600")}>
                {powered ? "ACTIVE" : "OFF"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="border-t border-border bg-card">
      {/* Toggle Bar */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 flex items-center justify-between px-4 rounded-none hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Serial Monitor</span>
          {isRunning && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
              RUNNING
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>

      {/* Console Output */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-60" : "max-h-0"
        )}
      >
        <div className="h-60 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-4 overflow-y-auto scrollbar-hide">
          {!simulationResult ? (
            <div className="text-gray-500">
              <div className="text-green-500 font-bold mb-2">=== SERIAL MONITOR ===</div>
              <div>Waiting for simulation...</div>
              <div className="text-gray-600 mt-1">Click "Run Simulation" to see output</div>
            </div>
          ) : (
            <>
              <div className="text-green-500 font-bold mb-3">=== SERIAL MONITOR ===</div>
              
              {boards.map(renderBoardOutput)}
              {renderSensors()}
              {renderActuators()}

              <div className="text-gray-600 mt-4 border-t border-gray-700 pt-2">
                --- END OF OUTPUT ---
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}















