export type TerminalType = "positive" | "negative" | "signal" | "power" | "ground" | "data" | "gpio";

export interface SimTerminal {
  id: string;
  name: string;
  type: TerminalType;
  offsetX: number;
  offsetY: number;
  voltage: number;
  current: number;
  mode: "INPUT" | "OUTPUT" | "BIDIRECTIONAL";
}

export interface SimComponent {
  id: string;
  placedId: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  terminals: SimTerminal[];
  state: Record<string, unknown>;
}

export interface SimWire {
  id: string;
  startComponentId: string;
  startTerminalId: string;
  endComponentId: string;
  endTerminalId: string;
  resistance: number;
  current: number;
  voltage: number;
}

export interface Net {
  id: string;
  voltage: number;
  terminals: Array<{ componentId: string; terminalId: string }>;
  isGround: boolean;
  isPower: boolean;
  powerVoltage: number;
}

export interface Circuit {
  id: string;
  nets: Net[];
  components: SimComponent[];
  wires: SimWire[];
  isComplete: boolean;
  hasGround: boolean;
  hasPower: boolean;
}

export interface SimulationResult {
  isValid: boolean;
  circuits: Circuit[];
  errors: SimulationError[];
  warnings: SimulationWarning[];
  componentStates: Map<string, ComponentState>;
  netStates: Map<string, NetState>;
}

export interface SimulationError {
  type: "NO_GROUND" | "NO_POWER" | "SHORT_CIRCUIT" | "OPEN_CIRCUIT" | "REVERSE_POLARITY" | "MISSING_RESISTOR" | "OVERCURRENT";
  message: string;
  affectedComponents: string[];
  severity: "error" | "warning";
}

export type SimulationWarning = SimulationError;

export interface ComponentState {
  componentId: string;
  type: string;
  isActive: boolean;
  powered: boolean;
  properties: Record<string, unknown>;
}

export interface NetState {
  netId: string;
  voltage: number;
  current: number;
  isGround: boolean;
  isPower: boolean;
}

type PlacedComponentData = { id: string; componentId: string; x: number; y: number; rotation: number };
type WireData = {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTerminal?: { componentId: string; terminalId: string };
  endTerminal?: { componentId: string; terminalId: string };
};

export class SimulationEngine {
  private components: Map<string, SimComponent> = new Map();
  private wires: SimWire[] = [];
  private nets: Map<string, Net> = new Map();
  private circuits: Circuit[] = [];

  reset(): void {
    this.components.clear();
    this.wires = [];
    this.nets.clear();
    this.circuits = [];
  }

  /**
   * Update the resistance value of a specific placed resistor component.
   * This keeps the simulation state in sync with any UI controls for resistor value.
   */
  setResistorResistance(placedId: string, resistance: number): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "resistor") {
      comp.state = {
        ...comp.state,
        resistance,
      };
    }
  }

  loadCircuit(
    placedComponents: PlacedComponentData[],
    wires: WireData[]
  ): void {
    this.reset();

    for (const placed of placedComponents) {
      const simComponent = this.createSimComponent(placed);
      if (simComponent) {
        this.components.set(placed.id, simComponent);
      }
    }

    for (const wire of wires) {
      if (wire.startTerminal && wire.endTerminal) {
        this.wires.push({
          id: wire.id,
          startComponentId: wire.startTerminal.componentId,
          startTerminalId: wire.startTerminal.terminalId,
          endComponentId: wire.endTerminal.componentId,
          endTerminalId: wire.endTerminal.terminalId,
          resistance: 0.01,
          current: 0,
          voltage: 0,
        });
      }
    }
  }

  private createSimComponent(placed: PlacedComponentData): SimComponent | null {
    const terminalDefs = COMPONENT_TERMINAL_DEFINITIONS[placed.componentId];
    if (!terminalDefs) return null;

    const terminals: SimTerminal[] = terminalDefs.map((def) => ({
      ...def,
      voltage: 0,
      current: 0,
    }));

    return {
      id: placed.componentId,
      placedId: placed.id,
      type: placed.componentId,
      x: placed.x,
      y: placed.y,
      rotation: placed.rotation,
      terminals,
      state: this.getInitialComponentState(placed.componentId),
    };
  }

  private getInitialComponentState(componentType: string): Record<string, unknown> {
    switch (componentType) {
      case "led":
        return { glowing: false, brightness: 0, color: "red" };
      case "resistor":
        return { resistance: 220, powerDissipation: 0 };
      case "button":
        return { pressed: false };
      case "buzzer":
        return { active: false, frequency: 440 };
      case "potentiometer":
        return { position: 0.5, resistance: 10000 };
      case "servo":
        return { angle: 90, powered: false };
      case "ultrasonic":
        return { distance: 0, trigActive: false };
      case "ir-sensor":
        return { detecting: false };
      case "dht11":
        return { temperature: 25, humidity: 50 };
      case "5v":
        return { voltage: 5, enabled: true };
      case "gnd":
        return { voltage: 0 };
      case "arduino-uno":
        return { powered: false, pins: {} };
      case "esp32":
        return { powered: false, pins: {} };
      case "breadboard":
        return { connections: [] };
      default:
        return {};
    }
  }

  buildNets(): void {
    this.nets.clear();
    const visited = new Set<string>();
    let netCounter = 0;

    const getTerminalKey = (compId: string, termId: string) => `${compId}:${termId}`;

    const adjacency = new Map<string, Set<string>>();

    for (const wire of this.wires) {
      const startKey = getTerminalKey(wire.startComponentId, wire.startTerminalId);
      const endKey = getTerminalKey(wire.endComponentId, wire.endTerminalId);

      if (!adjacency.has(startKey)) adjacency.set(startKey, new Set());
      if (!adjacency.has(endKey)) adjacency.set(endKey, new Set());

      adjacency.get(startKey)!.add(endKey);
      adjacency.get(endKey)!.add(startKey);
    }

    for (const component of this.components.values()) {
      for (const terminal of component.terminals) {
        const terminalKey = getTerminalKey(component.placedId, terminal.id);

        if (visited.has(terminalKey)) continue;

        const netTerminals: Array<{ componentId: string; terminalId: string }> = [];
        const stack = [terminalKey];
        let isPower = false;
        let isGround = false;
        let powerVoltage = 0;

        while (stack.length > 0) {
          const current = stack.pop()!;
          if (visited.has(current)) continue;
          visited.add(current);

          const [compId, termId] = current.split(":");
          netTerminals.push({ componentId: compId, terminalId: termId });

          const comp = this.components.get(compId);
          if (comp) {
            const term = comp.terminals.find((t) => t.id === termId);
            if (term) {
              if (comp.type === "5v" && term.type === "power") {
                isPower = true;
                powerVoltage = 5;
              }
              if (comp.type === "gnd" || term.type === "ground") {
                isGround = true;
              }
              if (comp.type === "arduino-uno" && term.id === "5v") {
                isPower = true;
                powerVoltage = 5;
              }
              if (comp.type === "arduino-uno" && term.id === "gnd") {
                isGround = true;
              }
            }
          }

          const neighbors = adjacency.get(current);
          if (neighbors) {
            for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                stack.push(neighbor);
              }
            }
          }
        }

        if (netTerminals.length > 0) {
          const netId = `net-${netCounter++}`;
          this.nets.set(netId, {
            id: netId,
            voltage: isPower ? powerVoltage : isGround ? 0 : NaN,
            terminals: netTerminals,
            isGround,
            isPower,
            powerVoltage,
          });
        }
      }
    }
  }

  buildCircuits(): void {
    this.circuits = [];

    const componentNets = new Map<string, Set<string>>();

    for (const [netId, net] of this.nets) {
      for (const term of net.terminals) {
        if (!componentNets.has(term.componentId)) {
          componentNets.set(term.componentId, new Set());
        }
        componentNets.get(term.componentId)!.add(netId);
      }
    }

    const visited = new Set<string>();
    let circuitCounter = 0;

    for (const componentId of this.components.keys()) {
      if (visited.has(componentId)) continue;

      const circuitComponents = new Set<string>();
      const circuitNetIds = new Set<string>();
      const stack = [componentId];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        circuitComponents.add(current);

        const nets = componentNets.get(current);
        if (nets) {
          for (const netId of nets) {
            circuitNetIds.add(netId);
            const net = this.nets.get(netId)!;
            for (const term of net.terminals) {
              if (!visited.has(term.componentId)) {
                stack.push(term.componentId);
              }
            }
          }
        }
      }

      const circuitNets: Net[] = [];
      for (const netId of circuitNetIds) {
        const net = this.nets.get(netId);
        if (net) circuitNets.push(net);
      }

      const components: SimComponent[] = [];
      for (const compId of circuitComponents) {
        const comp = this.components.get(compId);
        if (comp) components.push(comp);
      }

      const circuitWires = this.wires.filter(
        (w) => circuitComponents.has(w.startComponentId) && circuitComponents.has(w.endComponentId)
      );

      const hasGround = circuitNets.some((n) => n.isGround);
      const hasPower = circuitNets.some((n) => n.isPower);

      this.circuits.push({
        id: `circuit-${circuitCounter++}`,
        nets: circuitNets,
        components,
        wires: circuitWires,
        isComplete: hasGround && hasPower,
        hasGround,
        hasPower,
      });
    }
  }

  propagateVoltages(): void {
    for (const net of this.nets.values()) {
      if (net.isPower) {
        net.voltage = net.powerVoltage;
      } else if (net.isGround) {
        net.voltage = 0;
      }
    }

    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const net of this.nets.values()) {
        if (!isNaN(net.voltage)) continue;

        for (const term of net.terminals) {
          const comp = this.components.get(term.componentId);
          if (!comp) continue;

          if (comp.type === "resistor" || comp.type === "button") {
            const otherTerminal = comp.terminals.find((t) => t.id !== term.terminalId);
            if (otherTerminal) {
              const otherNetId = this.findNetForTerminal(comp.placedId, otherTerminal.id);
              if (otherNetId) {
                const otherNet = this.nets.get(otherNetId);
                if (otherNet && !isNaN(otherNet.voltage)) {
                  if (comp.type === "resistor") {
                    net.voltage = otherNet.voltage;
                    changed = true;
                  } else if (comp.type === "button" && comp.state.pressed) {
                    net.voltage = otherNet.voltage;
                    changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  private findNetForTerminal(componentId: string, terminalId: string): string | null {
    for (const [netId, net] of this.nets) {
      if (net.terminals.some((t) => t.componentId === componentId && t.terminalId === terminalId)) {
        return netId;
      }
    }
    return null;
  }

  evaluateComponents(): Map<string, ComponentState> {
    const states = new Map<string, ComponentState>();

    for (const component of this.components.values()) {
      const state = this.evaluateComponent(component);
      states.set(component.placedId, state);
    }

    return states;
  }

  private evaluateComponent(component: SimComponent): ComponentState {
    const baseState: ComponentState = {
      componentId: component.placedId,
      type: component.type,
      isActive: false,
      powered: false,
      properties: { ...component.state },
    };

    switch (component.type) {
      case "led": {
        // LED should only be considered if both anode and cathode are actually wired
        const isAnodeConnected = this.wires.some(
          (w) =>
            (w.startComponentId === component.placedId && w.startTerminalId === "anode") ||
            (w.endComponentId === component.placedId && w.endTerminalId === "anode")
        );
        const isCathodeConnected = this.wires.some(
          (w) =>
            (w.startComponentId === component.placedId && w.startTerminalId === "cathode") ||
            (w.endComponentId === component.placedId && w.endTerminalId === "cathode")
        );

        if (!isAnodeConnected || !isCathodeConnected) {
          break;
        }

        const anodeNet = this.findNetForTerminal(component.placedId, "anode");
        const cathodeNet = this.findNetForTerminal(component.placedId, "cathode");

        if (anodeNet && cathodeNet) {
          const anode = this.nets.get(anodeNet);
          const cathode = this.nets.get(cathodeNet);

          if (anode && cathode && !isNaN(anode.voltage) && !isNaN(cathode.voltage)) {
            const voltageDrop = anode.voltage - cathode.voltage;
            const ledThreshold = 1.8;

            if (voltageDrop >= ledThreshold) {
              baseState.isActive = true;
              baseState.powered = true;
              baseState.properties.glowing = true;
              baseState.properties.brightness = Math.min(1, (voltageDrop - ledThreshold) / 3);
            }
          }
        }
        break;
      }

      case "buzzer": {
        const posNet = this.findNetForTerminal(component.placedId, "positive");
        const negNet = this.findNetForTerminal(component.placedId, "negative");

        if (posNet && negNet) {
          const pos = this.nets.get(posNet);
          const neg = this.nets.get(negNet);

          if (pos && neg && !isNaN(pos.voltage) && !isNaN(neg.voltage)) {
            const voltageDrop = pos.voltage - neg.voltage;
            if (voltageDrop >= 3) {
              baseState.isActive = true;
              baseState.powered = true;
              baseState.properties.active = true;
            }
          }
        }
        break;
      }

      case "servo": {
        const vccNet = this.findNetForTerminal(component.placedId, "vcc");
        const gndNet = this.findNetForTerminal(component.placedId, "gnd");

        if (vccNet && gndNet) {
          const vcc = this.nets.get(vccNet);
          const gnd = this.nets.get(gndNet);

          if (vcc && gnd && !isNaN(vcc.voltage) && !isNaN(gnd.voltage)) {
            if (vcc.voltage >= 4.5 && gnd.voltage === 0) {
              baseState.powered = true;
              baseState.properties.powered = true;
            }
          }
        }
        break;
      }

      case "5v": {
        baseState.isActive = true;
        baseState.powered = true;
        break;
      }

      case "gnd": {
        baseState.isActive = true;
        break;
      }

      case "arduino-uno":
      case "esp32": {
        const vccTerminal = component.type === "arduino-uno" ? "5v" : "3v3";
        const vccNet = this.findNetForTerminal(component.placedId, vccTerminal);
        const gndNet = this.findNetForTerminal(component.placedId, "gnd");

        if (vccNet && gndNet) {
          baseState.powered = true;
          baseState.isActive = true;
        }
        break;
      }
    }

    return baseState;
  }

  detectErrors(): SimulationError[] {
    const errors: SimulationError[] = [];

    for (const circuit of this.circuits) {
      if (circuit.components.length === 0) continue;

      const hasActiveComponents = circuit.components.some(
        (c) => !["5v", "gnd", "breadboard"].includes(c.type)
      );

      if (!hasActiveComponents) continue;

      if (!circuit.hasGround) {
        errors.push({
          type: "NO_GROUND",
          message: "Circuit is missing a ground connection. Add a GND component.",
          affectedComponents: circuit.components.map((c) => c.placedId),
          severity: "error",
        });
      }

      if (!circuit.hasPower) {
        errors.push({
          type: "NO_POWER",
          message: "Circuit is missing a power source. Add a 5V or use Arduino/ESP32 power pins.",
          affectedComponents: circuit.components.map((c) => c.placedId),
          severity: "error",
        });
      }

      const hasLed = circuit.components.some((c) => c.type === "led");
      const hasResistor = circuit.components.some((c) => c.type === "resistor");

      if (hasLed && !hasResistor && circuit.hasPower) {
        errors.push({
          type: "MISSING_RESISTOR",
          message: "LED requires a resistor in series to limit current and prevent damage.",
          affectedComponents: circuit.components
            .filter((c) => c.type === "led")
            .map((c) => c.placedId),
          severity: "error",
        });
      }

      for (const net of circuit.nets) {
        if (net.isPower && net.isGround) {
          errors.push({
            type: "SHORT_CIRCUIT",
            message: "Short circuit detected! Power and ground are directly connected.",
            affectedComponents: net.terminals.map((t) => t.componentId),
            severity: "error",
          });
        }
      }

      for (const component of circuit.components) {
        if (component.type === "led") {
          const anodeNet = this.findNetForTerminal(component.placedId, "anode");
          const cathodeNet = this.findNetForTerminal(component.placedId, "cathode");

          if (anodeNet && cathodeNet) {
            const anode = this.nets.get(anodeNet);
            const cathode = this.nets.get(cathodeNet);

            if (anode && cathode) {
              if (anode.isGround && cathode.isPower) {
                errors.push({
                  type: "REVERSE_POLARITY",
                  message: "LED is connected in reverse polarity. Swap anode (+) and cathode (-) connections.",
                  affectedComponents: [component.placedId],
                  severity: "error",
                });
              }
            }
          }
        }
      }
    }

    return errors;
  }

  simulate(): SimulationResult {
    this.buildNets();
    this.buildCircuits();
    this.propagateVoltages();

    const errors = this.detectErrors();
    const componentStates = this.evaluateComponents();

    const netStates = new Map<string, NetState>();
    for (const [netId, net] of this.nets) {
      netStates.set(netId, {
        netId,
        voltage: net.voltage,
        current: 0,
        isGround: net.isGround,
        isPower: net.isPower,
      });
    }

    return {
      isValid: errors.filter((e) => e.severity === "error").length === 0,
      circuits: this.circuits,
      errors,
      warnings: errors.filter((e) => e.severity === "warning"),
      componentStates,
      netStates,
    };
  }

  getCircuits(): Circuit[] {
    return this.circuits;
  }

  getNets(): Map<string, Net> {
    return this.nets;
  }

  getComponents(): Map<string, SimComponent> {
    return this.components;
  }
}

interface TerminalDefinition {
  id: string;
  name: string;
  type: TerminalType;
  offsetX: number;
  offsetY: number;
  mode: "INPUT" | "OUTPUT" | "BIDIRECTIONAL";
}

export const COMPONENT_TERMINAL_DEFINITIONS: Record<string, TerminalDefinition[]> = {
  led: [
    { id: "anode", name: "Anode (+)", type: "positive", offsetX: -8, offsetY: 28, mode: "INPUT" },
    { id: "cathode", name: "Cathode (-)", type: "negative", offsetX: 8, offsetY: 28, mode: "INPUT" },
  ],
  resistor: [
    { id: "term-a", name: "Terminal A", type: "signal", offsetX: -30, offsetY: 0, mode: "BIDIRECTIONAL" },
    { id: "term-b", name: "Terminal B", type: "signal", offsetX: 30, offsetY: 0, mode: "BIDIRECTIONAL" },
  ],
  button: [
    { id: "in", name: "Input", type: "signal", offsetX: -26, offsetY: 0, mode: "BIDIRECTIONAL" },
    { id: "out", name: "Output", type: "signal", offsetX: 26, offsetY: 0, mode: "BIDIRECTIONAL" },
  ],
  buzzer: [
    { id: "positive", name: "Positive (+)", type: "positive", offsetX: -6, offsetY: 20, mode: "INPUT" },
    { id: "negative", name: "Negative (-)", type: "negative", offsetX: 6, offsetY: 20, mode: "INPUT" },
  ],
  potentiometer: [
    { id: "vcc", name: "VCC", type: "power", offsetX: -8, offsetY: 20, mode: "INPUT" },
    { id: "signal", name: "Signal", type: "signal", offsetX: 0, offsetY: 20, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 8, offsetY: 20, mode: "INPUT" },
  ],
  ultrasonic: [
    { id: "vcc", name: "VCC", type: "power", offsetX: -15, offsetY: 22, mode: "INPUT" },
    { id: "trig", name: "TRIG", type: "signal", offsetX: -5, offsetY: 22, mode: "INPUT" },
    { id: "echo", name: "ECHO", type: "data", offsetX: 5, offsetY: 22, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 15, offsetY: 22, mode: "INPUT" },
  ],
  "ir-sensor": [
    { id: "vcc", name: "VCC", type: "power", offsetX: -8, offsetY: 24, mode: "INPUT" },
    { id: "out", name: "OUT", type: "data", offsetX: 0, offsetY: 24, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 8, offsetY: 24, mode: "INPUT" },
  ],
  dht11: [
    { id: "vcc", name: "VCC", type: "power", offsetX: -8, offsetY: 28, mode: "INPUT" },
    { id: "data", name: "DATA", type: "data", offsetX: 0, offsetY: 28, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 8, offsetY: 28, mode: "INPUT" },
  ],
  servo: [
    { id: "signal", name: "Signal (Orange)", type: "signal", offsetX: -14, offsetY: 20, mode: "INPUT" },
    { id: "vcc", name: "VCC (Red)", type: "power", offsetX: 0, offsetY: 20, mode: "INPUT" },
    { id: "gnd", name: "GND (Brown)", type: "ground", offsetX: 14, offsetY: 20, mode: "INPUT" },
  ],
  "5v": [
    { id: "out", name: "5V Output", type: "power", offsetX: 0, offsetY: 20, mode: "OUTPUT" },
  ],
  gnd: [
    { id: "in", name: "Ground", type: "ground", offsetX: 0, offsetY: -14, mode: "INPUT" },
  ],
  "arduino-uno": [
    { id: "5v", name: "5V", type: "power", offsetX: -30, offsetY: -28, mode: "OUTPUT" },
    { id: "3v3", name: "3.3V", type: "power", offsetX: -22, offsetY: -28, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: -14, offsetY: -28, mode: "INPUT" },
    { id: "gnd2", name: "GND", type: "ground", offsetX: -6, offsetY: -28, mode: "INPUT" },
    { id: "vin", name: "VIN", type: "power", offsetX: 2, offsetY: -28, mode: "INPUT" },
    { id: "a0", name: "A0", type: "signal", offsetX: 10, offsetY: -28, mode: "BIDIRECTIONAL" },
    { id: "a1", name: "A1", type: "signal", offsetX: 18, offsetY: -28, mode: "BIDIRECTIONAL" },
    { id: "a2", name: "A2", type: "signal", offsetX: 26, offsetY: -28, mode: "BIDIRECTIONAL" },
    { id: "d13", name: "D13", type: "gpio", offsetX: -30, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d12", name: "D12", type: "gpio", offsetX: -22, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d11", name: "D11~", type: "gpio", offsetX: -14, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d10", name: "D10~", type: "gpio", offsetX: -6, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d9", name: "D9~", type: "gpio", offsetX: 2, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d8", name: "D8", type: "gpio", offsetX: 10, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d7", name: "D7", type: "gpio", offsetX: 18, offsetY: 28, mode: "BIDIRECTIONAL" },
    { id: "d6", name: "D6~", type: "gpio", offsetX: 26, offsetY: 28, mode: "BIDIRECTIONAL" },
  ],
  esp32: [
    { id: "3v3", name: "3.3V", type: "power", offsetX: -16, offsetY: -24, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: -8, offsetY: -24, mode: "INPUT" },
    { id: "en", name: "EN", type: "signal", offsetX: 0, offsetY: -24, mode: "INPUT" },
    { id: "vp", name: "VP", type: "signal", offsetX: 8, offsetY: -24, mode: "INPUT" },
    { id: "vn", name: "VN", type: "signal", offsetX: 16, offsetY: -24, mode: "INPUT" },
    { id: "d34", name: "D34", type: "gpio", offsetX: -16, offsetY: 24, mode: "INPUT" },
    { id: "d35", name: "D35", type: "gpio", offsetX: -8, offsetY: 24, mode: "INPUT" },
    { id: "d32", name: "D32", type: "gpio", offsetX: 0, offsetY: 24, mode: "BIDIRECTIONAL" },
    { id: "d33", name: "D33", type: "gpio", offsetX: 8, offsetY: 24, mode: "BIDIRECTIONAL" },
    { id: "d25", name: "D25", type: "gpio", offsetX: 16, offsetY: 24, mode: "BIDIRECTIONAL" },
  ],
  breadboard: generateBreadboardTerminals(),
};

function generateBreadboardTerminals(): TerminalDefinition[] {
  const terminals: TerminalDefinition[] = [];
  const numCols = 30;
  const spacing = 8;
  const startX = -(numCols * spacing) / 2 + spacing / 2;
  
  for (let col = 0; col < numCols; col++) {
    const x = startX + col * spacing;
    
    terminals.push({
      id: `a${col + 1}`,
      name: `A${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: -35,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `b${col + 1}`,
      name: `B${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: -27,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `c${col + 1}`,
      name: `C${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: -19,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `d${col + 1}`,
      name: `D${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: -11,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `e${col + 1}`,
      name: `E${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: -3,
      mode: "BIDIRECTIONAL",
    });
    
    terminals.push({
      id: `f${col + 1}`,
      name: `F${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: 13,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `g${col + 1}`,
      name: `G${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: 21,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `h${col + 1}`,
      name: `H${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: 29,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `i${col + 1}`,
      name: `I${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: 37,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `j${col + 1}`,
      name: `J${col + 1}`,
      type: "signal",
      offsetX: x,
      offsetY: 45,
      mode: "BIDIRECTIONAL",
    });
  }
  
  for (let i = 0; i < numCols; i++) {
    const x = startX + i * spacing;
    terminals.push({
      id: `power-top-${i + 1}`,
      name: `+`,
      type: "power",
      offsetX: x,
      offsetY: -50,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `gnd-top-${i + 1}`,
      name: `-`,
      type: "ground",
      offsetX: x,
      offsetY: -43,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `power-bottom-${i + 1}`,
      name: `+`,
      type: "power",
      offsetX: x,
      offsetY: 52,
      mode: "BIDIRECTIONAL",
    });
    terminals.push({
      id: `gnd-bottom-${i + 1}`,
      name: `-`,
      type: "ground",
      offsetX: x,
      offsetY: 59,
      mode: "BIDIRECTIONAL",
    });
  }
  
  return terminals;
}

export function getBreadboardInternalConnections(): Array<{ terminals: string[] }> {
  const connections: Array<{ terminals: string[] }> = [];
  const numCols = 30;
  
  for (let col = 1; col <= numCols; col++) {
    connections.push({
      terminals: [`a${col}`, `b${col}`, `c${col}`, `d${col}`, `e${col}`],
    });
    connections.push({
      terminals: [`f${col}`, `g${col}`, `h${col}`, `i${col}`, `j${col}`],
    });
  }
  
  const powerTopRow: string[] = [];
  const gndTopRow: string[] = [];
  const powerBottomRow: string[] = [];
  const gndBottomRow: string[] = [];
  
  for (let i = 1; i <= numCols; i++) {
    powerTopRow.push(`power-top-${i}`);
    gndTopRow.push(`gnd-top-${i}`);
    powerBottomRow.push(`power-bottom-${i}`);
    gndBottomRow.push(`gnd-bottom-${i}`);
  }
  
  connections.push({ terminals: powerTopRow });
  connections.push({ terminals: gndTopRow });
  connections.push({ terminals: powerBottomRow });
  connections.push({ terminals: gndBottomRow });
  
  return connections;
}

export const simulationEngine = new SimulationEngine();
