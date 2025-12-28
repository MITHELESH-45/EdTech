import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { componentMetadata } from "@/lib/circuit-types";
import type { PlacedComponent } from "@shared/schema";
import type { SimulationResult, McuPinStateMap, PinLogicState, Net } from "@/lib/simulation-engine";

interface SerialMonitorProps {
  placedComponents: PlacedComponent[];
  mcuPinStates: McuPinStateMap;
  simulationResult: SimulationResult | null;
}

interface PinData {
  pinId: string;
  pinName: string;
  mode: PinLogicState;
  voltage: number | null;
  value: string;
  isAnalog: boolean;
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

function calculateValue(
  voltage: number | null,
  isAnalog: boolean,
  boardType: "arduino-uno" | "esp32"
): string {
  if (voltage === null || isNaN(voltage)) {
    return "—";
  }

  if (isAnalog) {
    // Analog pins: scale voltage to 0-1023
    // Arduino: 0-5V → 0-1023
    // ESP32: 0-3.3V → 0-1023
    const maxVoltage = boardType === "arduino-uno" ? 5.0 : 3.3;
    const scaled = Math.round((voltage / maxVoltage) * 1023);
    return Math.max(0, Math.min(1023, scaled)).toString();
  } else {
    // Digital pins: HIGH if voltage > threshold, LOW otherwise
    // Threshold: ~2.5V for 5V logic (Arduino), ~1.65V for 3.3V logic (ESP32)
    const threshold = boardType === "arduino-uno" ? 2.5 : 1.65;
    return voltage > threshold ? "HIGH" : "LOW";
  }
}

function formatVoltage(voltage: number | null): string {
  if (voltage === null || isNaN(voltage)) {
    return "—";
  }
  return `${voltage.toFixed(2)}V`;
}

export function SerialMonitor({
  placedComponents,
  mcuPinStates,
  simulationResult,
}: SerialMonitorProps) {
  const boards = placedComponents.filter(
    (p) => p.componentId === "arduino-uno" || p.componentId === "esp32"
  );

  if (boards.length === 0) {
    return null;
  }

  const getPinData = (board: PlacedComponent): PinData[] => {
    const meta = componentMetadata[board.componentId];
    if (!meta) return [];

    // Get all pins (both GPIO and signal types, excluding power/ground)
    const pins = meta.terminals.filter(
      (t) =>
        (t.type === "signal" || t.type === "gpio") &&
        !["5v", "3v3", "gnd", "gnd2", "vin", "en", "vp", "vn"].includes(t.id)
    );

    const statesForBoard = mcuPinStates[board.id] ?? {};
    const boardType = board.componentId as "arduino-uno" | "esp32";

    return pins.map((pin) => {
      const mode: PinLogicState = statesForBoard[pin.id] ?? "INPUT";
      const net = findNetForPin(board.id, pin.id, simulationResult);
      const voltage = net ? net.voltage : null;
      const isAnalog = pin.id.startsWith("a") || pin.name.startsWith("A");
      const value = calculateValue(voltage, isAnalog, boardType);

      return {
        pinId: pin.id,
        pinName: pin.name,
        mode,
        voltage,
        value,
        isAnalog,
      };
    });
  };

  return (
    <div className="flex flex-col bg-card border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Serial Monitor</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Live pin readings from simulation
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {boards.map((board) => {
            const pinData = getPinData(board);
            const label = board.componentId === "arduino-uno" ? "Arduino UNO" : "ESP32";

            return (
              <div
                key={board.id}
                className="border border-border rounded-md bg-muted/40 overflow-hidden"
              >
                <div className="p-2 border-b border-border bg-muted/60">
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 px-2 text-[10px] font-semibold">PIN</TableHead>
                      <TableHead className="h-8 px-2 text-[10px] font-semibold">MODE</TableHead>
                      <TableHead className="h-8 px-2 text-[10px] font-semibold">VOLTAGE</TableHead>
                      <TableHead className="h-8 px-2 text-[10px] font-semibold">VALUE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pinData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                          No configurable pins
                        </TableCell>
                      </TableRow>
                    ) : (
                      pinData.map((pin) => (
                        <TableRow key={pin.pinId} className="h-7">
                          <TableCell className="px-2 py-1 text-[11px] font-mono">
                            {pin.pinName}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-[11px]">
                            <span
                              className={
                                pin.mode === "HIGH"
                                  ? "text-red-600"
                                  : pin.mode === "LOW"
                                  ? "text-gray-700"
                                  : "text-muted-foreground"
                              }
                            >
                              {pin.mode}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-[11px] font-mono">
                            {formatVoltage(pin.voltage)}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-[11px] font-mono">
                            {pin.value}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}



