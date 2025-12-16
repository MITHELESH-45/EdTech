export interface Terminal {
  id: string;
  name: string;
  type: "positive" | "negative" | "signal" | "power" | "ground" | "data";
  offsetX: number;
  offsetY: number;
}

export interface ComponentMetadata {
  id: string;
  terminals: Terminal[];
  width: number;
  height: number;
}

export const componentMetadata: Record<string, ComponentMetadata> = {
  led: {
    id: "led",
    terminals: [
      { id: "anode", name: "Anode (+)", type: "positive", offsetX: -8, offsetY: 28 },
      { id: "cathode", name: "Cathode (-)", type: "negative", offsetX: 8, offsetY: 28 },
    ],
    width: 32,
    height: 44,
  },
  resistor: {
    id: "resistor",
    terminals: [
      { id: "term-a", name: "Terminal A", type: "signal", offsetX: -30, offsetY: 0 },
      { id: "term-b", name: "Terminal B", type: "signal", offsetX: 30, offsetY: 0 },
    ],
    width: 60,
    height: 16,
  },
  button: {
    id: "button",
    terminals: [
      { id: "in", name: "Input", type: "signal", offsetX: -26, offsetY: 0 },
      { id: "out", name: "Output", type: "signal", offsetX: 26, offsetY: 0 },
    ],
    width: 52,
    height: 24,
  },
  buzzer: {
    id: "buzzer",
    terminals: [
      { id: "positive", name: "Positive (+)", type: "positive", offsetX: -8, offsetY: 20 },
      { id: "negative", name: "Negative (-)", type: "negative", offsetX: 8, offsetY: 20 },
    ],
    width: 32,
    height: 40,
  },
  potentiometer: {
    id: "potentiometer",
    terminals: [
      { id: "vcc", name: "VCC", type: "power", offsetX: -12, offsetY: 24 },
      { id: "signal", name: "Signal", type: "signal", offsetX: 0, offsetY: 24 },
      { id: "gnd", name: "GND", type: "ground", offsetX: 12, offsetY: 24 },
    ],
    width: 48,
    height: 32,
  },
  ultrasonic: {
    id: "ultrasonic",
    terminals: [
      { id: "vcc", name: "VCC", type: "power", offsetX: -15, offsetY: 24 },
      { id: "trig", name: "TRIG", type: "signal", offsetX: -5, offsetY: 24 },
      { id: "echo", name: "ECHO", type: "data", offsetX: 5, offsetY: 24 },
      { id: "gnd", name: "GND", type: "ground", offsetX: 15, offsetY: 24 },
    ],
    width: 56,
    height: 36,
  },
  "ir-sensor": {
    id: "ir-sensor",
    terminals: [
      { id: "vcc", name: "VCC", type: "power", offsetX: -10, offsetY: 24 },
      { id: "out", name: "OUT", type: "data", offsetX: 0, offsetY: 24 },
      { id: "gnd", name: "GND", type: "ground", offsetX: 10, offsetY: 24 },
    ],
    width: 40,
    height: 48,
  },
  dht11: {
    id: "dht11",
    terminals: [
      { id: "vcc", name: "VCC", type: "power", offsetX: -10, offsetY: 28 },
      { id: "data", name: "DATA", type: "data", offsetX: 0, offsetY: 28 },
      { id: "gnd", name: "GND", type: "ground", offsetX: 10, offsetY: 28 },
    ],
    width: 40,
    height: 52,
  },
  servo: {
    id: "servo",
    terminals: [
      { id: "signal", name: "Signal (Orange)", type: "signal", offsetX: -14, offsetY: 20 },
      { id: "vcc", name: "VCC (Red)", type: "power", offsetX: 0, offsetY: 20 },
      { id: "gnd", name: "GND (Brown)", type: "ground", offsetX: 14, offsetY: 20 },
    ],
    width: 56,
    height: 32,
  },
  "5v": {
    id: "5v",
    terminals: [
      { id: "out", name: "5V Output", type: "power", offsetX: 0, offsetY: 14 },
    ],
    width: 28,
    height: 28,
  },
  gnd: {
    id: "gnd",
    terminals: [
      { id: "in", name: "Ground", type: "ground", offsetX: 0, offsetY: -14 },
    ],
    width: 24,
    height: 20,
  },
  "arduino-uno": {
    id: "arduino-uno",
    terminals: [
      { id: "5v", name: "5V", type: "power", offsetX: -30, offsetY: -28 },
      { id: "gnd", name: "GND", type: "ground", offsetX: -22, offsetY: -28 },
      { id: "d13", name: "D13", type: "signal", offsetX: -14, offsetY: -28 },
      { id: "d12", name: "D12", type: "signal", offsetX: -6, offsetY: -28 },
      { id: "d11", name: "D11", type: "signal", offsetX: 2, offsetY: -28 },
      { id: "d10", name: "D10", type: "signal", offsetX: 10, offsetY: -28 },
      { id: "d9", name: "D9", type: "signal", offsetX: 18, offsetY: -28 },
      { id: "d8", name: "D8", type: "signal", offsetX: 26, offsetY: -28 },
    ],
    width: 80,
    height: 50,
  },
  esp32: {
    id: "esp32",
    terminals: [
      { id: "3v3", name: "3.3V", type: "power", offsetX: -12, offsetY: -16 },
      { id: "gnd", name: "GND", type: "ground", offsetX: 0, offsetY: -16 },
      { id: "gpio", name: "GPIO", type: "signal", offsetX: 12, offsetY: -16 },
    ],
    width: 48,
    height: 48,
  },
  breadboard: {
    id: "breadboard",
    terminals: [],
    width: 160,
    height: 80,
  },
  "jumper-wire": {
    id: "jumper-wire",
    terminals: [],
    width: 40,
    height: 20,
  },
};

export function getTerminalPosition(
  componentX: number,
  componentY: number,
  rotation: number,
  terminal: Terminal
): { x: number; y: number } {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const rotatedX = terminal.offsetX * cos - terminal.offsetY * sin;
  const rotatedY = terminal.offsetX * sin + terminal.offsetY * cos;

  return {
    x: componentX + rotatedX,
    y: componentY + rotatedY,
  };
}

export function findNearestTerminal(
  x: number,
  y: number,
  placedComponents: Array<{ id: string; componentId: string; x: number; y: number; rotation: number }>,
  threshold: number = 20
): { componentId: string; terminalId: string; x: number; y: number } | null {
  let nearest: { componentId: string; terminalId: string; x: number; y: number; distance: number } | null = null;

  for (const placed of placedComponents) {
    const metadata = componentMetadata[placed.componentId];
    if (!metadata) continue;

    for (const terminal of metadata.terminals) {
      const pos = getTerminalPosition(placed.x, placed.y, placed.rotation, terminal);
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));

      if (distance < threshold && (!nearest || distance < nearest.distance)) {
        nearest = {
          componentId: placed.id,
          terminalId: terminal.id,
          x: pos.x,
          y: pos.y,
          distance,
        };
      }
    }
  }

  return nearest ? { componentId: nearest.componentId, terminalId: nearest.terminalId, x: nearest.x, y: nearest.y } : null;
}

export function validateCircuitConnections(
  placedComponents: Array<{ id: string; componentId: string; x: number; y: number; rotation: number }>,
  wires: Array<{ startX: number; startY: number; endX: number; endY: number; startTerminal?: { componentId: string; terminalId: string }; endTerminal?: { componentId: string; terminalId: string } }>
): { isValid: boolean; ledShouldGlow: boolean; error: string | null } {
  const componentIds = placedComponents.map((p) => p.componentId);

  const hasLed = componentIds.includes("led");
  const hasResistor = componentIds.includes("resistor");
  const has5V = componentIds.includes("5v");
  const hasGnd = componentIds.includes("gnd");

  if (!hasLed) {
    return { isValid: true, ledShouldGlow: false, error: null };
  }

  if (hasLed && !hasResistor) {
    return { isValid: false, ledShouldGlow: false, error: "LED requires a resistor in series to prevent damage." };
  }

  if (!has5V) {
    return { isValid: false, ledShouldGlow: false, error: "Circuit needs a 5V power source." };
  }

  if (!hasGnd) {
    return { isValid: false, ledShouldGlow: false, error: "Circuit needs a ground connection." };
  }

  const validWires = wires.filter((w) => w.startTerminal && w.endTerminal);
  if (validWires.length < 3) {
    return { isValid: false, ledShouldGlow: false, error: "Components need to be connected via terminals with wires." };
  }

  return { isValid: true, ledShouldGlow: true, error: null };
}
