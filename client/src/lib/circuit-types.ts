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

function generateSimpleBreadboardTerminals(): Terminal[] {
  const terminals: Terminal[] = [];
  const spacing = 8;
  const numCols = 30;
  const startX = -(numCols * spacing) / 2 + spacing / 2;
  
  for (let col = 0; col < numCols; col++) {
    const x = startX + col * spacing;
    
    terminals.push({ id: `a${col + 1}`, name: `A${col + 1}`, type: "signal", offsetX: x, offsetY: -35 });
    terminals.push({ id: `b${col + 1}`, name: `B${col + 1}`, type: "signal", offsetX: x, offsetY: -27 });
    terminals.push({ id: `c${col + 1}`, name: `C${col + 1}`, type: "signal", offsetX: x, offsetY: -19 });
    terminals.push({ id: `d${col + 1}`, name: `D${col + 1}`, type: "signal", offsetX: x, offsetY: -11 });
    terminals.push({ id: `e${col + 1}`, name: `E${col + 1}`, type: "signal", offsetX: x, offsetY: -3 });
    
    terminals.push({ id: `f${col + 1}`, name: `F${col + 1}`, type: "signal", offsetX: x, offsetY: 13 });
    terminals.push({ id: `g${col + 1}`, name: `G${col + 1}`, type: "signal", offsetX: x, offsetY: 21 });
    terminals.push({ id: `h${col + 1}`, name: `H${col + 1}`, type: "signal", offsetX: x, offsetY: 29 });
    terminals.push({ id: `i${col + 1}`, name: `I${col + 1}`, type: "signal", offsetX: x, offsetY: 37 });
    terminals.push({ id: `j${col + 1}`, name: `J${col + 1}`, type: "signal", offsetX: x, offsetY: 45 });
  }
  
  for (let i = 0; i < numCols; i++) {
    const x = startX + i * spacing;
    terminals.push({ id: `power-top-${i + 1}`, name: `+`, type: "power", offsetX: x, offsetY: -50 });
    terminals.push({ id: `gnd-top-${i + 1}`, name: `-`, type: "ground", offsetX: x, offsetY: -43 });
    terminals.push({ id: `power-bottom-${i + 1}`, name: `+`, type: "power", offsetX: x, offsetY: 52 });
    terminals.push({ id: `gnd-bottom-${i + 1}`, name: `-`, type: "ground", offsetX: x, offsetY: 59 });
  }
  
  return terminals;
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
  object: {
    id: "object",
    terminals: [],
    width: 32,
    height: 32,
  },
  "arduino-uno": {
    id: "arduino-uno",
    terminals: [
      // Power pins - top row (spaced at 14px for clarity)
      { id: "5v", name: "5V", type: "power", offsetX: -56, offsetY: -38 },
      { id: "3v3", name: "3.3V", type: "power", offsetX: -42, offsetY: -38 },
      { id: "gnd", name: "GND", type: "ground", offsetX: -28, offsetY: -38 },
      { id: "gnd2", name: "GND", type: "ground", offsetX: -14, offsetY: -38 },
      { id: "vin", name: "VIN", type: "power", offsetX: 0, offsetY: -38 },
      // Analog pins - top row continued
      { id: "a0", name: "A0", type: "signal", offsetX: 18, offsetY: -38 },
      { id: "a1", name: "A1", type: "signal", offsetX: 32, offsetY: -38 },
      { id: "a2", name: "A2", type: "signal", offsetX: 46, offsetY: -38 },
      { id: "a3", name: "A3", type: "signal", offsetX: 60, offsetY: -38 },
      // Digital pins - bottom row (spaced at 14px for clarity)
      { id: "d13", name: "D13", type: "signal", offsetX: -56, offsetY: 38 },
      { id: "d12", name: "D12", type: "signal", offsetX: -42, offsetY: 38 },
      { id: "d11", name: "D11~", type: "signal", offsetX: -28, offsetY: 38 },
      { id: "d10", name: "D10~", type: "signal", offsetX: -14, offsetY: 38 },
      { id: "d9", name: "D9~", type: "signal", offsetX: 0, offsetY: 38 },
      { id: "d8", name: "D8", type: "signal", offsetX: 14, offsetY: 38 },
      { id: "d7", name: "D7", type: "signal", offsetX: 28, offsetY: 38 },
      { id: "d6", name: "D6~", type: "signal", offsetX: 42, offsetY: 38 },
      { id: "d5", name: "D5~", type: "signal", offsetX: 56, offsetY: 38 },
    ],
    width: 140,
    height: 85,
  },
  esp32: {
    id: "esp32",
    terminals: [
      // Left side pins (spaced at 14px vertically)
      { id: "3v3", name: "3.3V", type: "power", offsetX: -38, offsetY: -35 },
      { id: "gnd", name: "GND", type: "ground", offsetX: -38, offsetY: -21 },
      { id: "d15", name: "D15", type: "signal", offsetX: -38, offsetY: -7 },
      { id: "d2", name: "D2", type: "signal", offsetX: -38, offsetY: 7 },
      { id: "d4", name: "D4", type: "signal", offsetX: -38, offsetY: 21 },
      { id: "d5", name: "D5", type: "signal", offsetX: -38, offsetY: 35 },
      // Right side pins (spaced at 14px vertically)
      { id: "vin", name: "VIN", type: "power", offsetX: 38, offsetY: -35 },
      { id: "gnd2", name: "GND", type: "ground", offsetX: 38, offsetY: -21 },
      { id: "d13", name: "D13", type: "signal", offsetX: 38, offsetY: -7 },
      { id: "d12", name: "D12", type: "signal", offsetX: 38, offsetY: 7 },
      { id: "d14", name: "D14", type: "signal", offsetX: 38, offsetY: 21 },
      { id: "d27", name: "D27", type: "signal", offsetX: 38, offsetY: 35 },
    ],
    width: 90,
    height: 90,
  },
  breadboard: {
    id: "breadboard",
    terminals: generateSimpleBreadboardTerminals(),
    width: 260,
    height: 140,
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
  threshold: number = 32
): { componentId: string; terminalId: string; x: number; y: number } | null {
  let nearest: { componentId: string; terminalId: string; x: number; y: number; distance: number; isBreadboard: boolean } | null = null;

  // Single pass: find the absolutely closest terminal
  // Breadboard pins are 8px apart, so we use a threshold that allows clicking anywhere
  // in the "cell" around a pin (half the spacing = 4px, but we use slightly more for comfort)
  for (const placed of placedComponents) {
    const metadata = componentMetadata[placed.componentId];
    if (!metadata) continue;

    const isBreadboard = placed.componentId === "breadboard";
    // For breadboard: use the full threshold but always pick the closest pin
    // For other components: use the provided threshold
    const effectiveThreshold = threshold;

    for (const terminal of metadata.terminals) {
      const pos = getTerminalPosition(placed.x, placed.y, placed.rotation, terminal);
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));

      if (distance < effectiveThreshold) {
        // Always prefer the closer terminal, regardless of type
        if (!nearest || distance < nearest.distance) {
          nearest = {
            componentId: placed.id,
            terminalId: terminal.id,
            x: pos.x,
            y: pos.y,
            distance,
            isBreadboard,
          };
        }
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
