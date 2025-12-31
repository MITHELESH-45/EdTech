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
  clusterId?: string;
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

export type PinLogicState = "HIGH" | "LOW" | "INPUT";

// Map of MCU placedId -> map of pinId -> logic level
export type McuPinStateMap = Record<string, Record<string, PinLogicState>>;

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
  private mcuPinStates: McuPinStateMap = {};

  reset(): void {
    this.components.clear();
    this.wires = [];
    this.nets.clear();
    this.circuits = [];
    this.mcuPinStates = {};
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

  /**
   * Update the pressed state of a specific placed button component.
   */
  setButtonPressed(placedId: string, pressed: boolean): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "button") {
      // Explicitly set pressed state - default to false if not provided
      comp.state = {
        ...comp.state,
        pressed: pressed === true, // Ensure it's explicitly true or false
      };
    }
  }

  /**
   * Update the position (0-1) of a specific placed potentiometer component.
   */
  setPotentiometerPosition(placedId: string, position: number): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "potentiometer") {
      comp.state = {
        ...comp.state,
        position: Math.max(0, Math.min(1, position)),
      };
    }
  }

  /**
   * Update the detection state (true/false) of a specific placed IR sensor component.
   */
  setIrDetected(placedId: string, detected: boolean): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "ir-sensor") {
      comp.state = {
        ...comp.state,
        detected: detected === true, // Ensure it's explicitly true or false
      };
    }
  }

  /**
   * Update the output voltage of a specific placed ultrasonic sensor component.
   */
  setUltrasonicVoltage(placedId: string, voltage: number): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "ultrasonic") {
      comp.state = {
        ...comp.state,
        outputVoltage: Math.max(0.5, Math.min(4.5, voltage)), // Clamp between 0.5V and 4.5V
      };
    }
  }

  /**
   * Update the temperature and humidity values of a specific placed DHT11 sensor component.
   */
  setDht11Values(placedId: string, temperature: number, humidity: number): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "dht11") {
      comp.state = {
        ...comp.state,
        temperature: Math.max(0, Math.min(50, temperature)), // Clamp between 0°C and 50°C
        humidity: Math.max(0, Math.min(100, humidity)), // Clamp between 0% and 100%
      };
    }
  }

  /**
   * Update the angle of a specific placed servo motor component.
   */
  setServoAngle(placedId: string, angle: number): void {
    const comp = this.components.get(placedId);
    if (comp && comp.type === "servo") {
      comp.state = {
        ...comp.state,
        angle: Math.max(0, Math.min(180, angle)), // Clamp between 0° and 180°
      };
    }
  }

  /**
   * Get the signal voltage for a servo motor (used to compute angle from electrical signal).
   */
  getServoSignalVoltage(placedId: string): { voltage: number | null; powered: boolean } {
    const comp = this.components.get(placedId);
    if (!comp || comp.type !== "servo") {
      return { voltage: null, powered: false };
    }

    // Check if servo is powered (VCC and GND connected)
    const vccNetId = this.findNetForTerminal(placedId, "vcc");
    const gndNetId = this.findNetForTerminal(placedId, "gnd");
    const signalNetId = this.findNetForTerminal(placedId, "signal");

    if (!vccNetId || !gndNetId) {
      return { voltage: null, powered: false };
    }

    const vccNet = this.nets.get(vccNetId);
    const gndNet = this.nets.get(gndNetId);

    if (!vccNet || !gndNet || isNaN(vccNet.voltage) || isNaN(gndNet.voltage)) {
      return { voltage: null, powered: false };
    }

    // Check if powered (VCC > GND by at least 4V)
    const powerVoltage = vccNet.voltage - gndNet.voltage;
    if (powerVoltage < 4.0) {
      return { voltage: null, powered: false };
    }

    // Servo is powered - now check signal
    if (!signalNetId) {
      return { voltage: null, powered: true }; // Powered but no signal
    }

    const signalNet = this.nets.get(signalNetId);
    if (!signalNet || isNaN(signalNet.voltage)) {
      return { voltage: null, powered: true }; // Powered but signal is floating
    }

    // Return signal voltage relative to GND
    const signalVoltage = signalNet.voltage - gndNet.voltage;
    return { voltage: Math.max(0, signalVoltage), powered: true };
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
    // CRITICAL: Before building nets, ensure ALL buttons are explicitly set to NOT pressed
    // This prevents buttons from accidentally connecting terminals
    // This is the FINAL check before net building - buttons MUST be false unless explicitly true
    for (const component of this.components.values()) {
      if (component.type === "button") {
        // Initialize state if missing
        if (!component.state) {
          component.state = { pressed: false };
        }
        // CRITICAL: Only true is true - everything else becomes false
        // This is the absolute final check - no exceptions
        if (component.state.pressed !== true) {
          component.state.pressed = false;
        }
        // At this point, component.state.pressed is guaranteed to be either true or false
        // If it's false, terminals will NOT be connected (they remain in separate nets)
        // If it's true, terminals WILL be connected (they become part of the same net)
      }
    }

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

    // Add internal component connections: buttons only connect when pressed
    // Note: Resistors and other components are connected via wires, not internally
    for (const component of this.components.values()) {
      if (component.type === "button") {
        // CRITICAL: Double-check button state - must be explicitly true to connect
        // Re-verify state right before checking (defensive programming)
        if (!component.state) {
          component.state = { pressed: false };
        }
        // Force to false if not explicitly true
        const currentPressed = component.state.pressed;
        if (currentPressed !== true) {
          component.state.pressed = false;
        }
        
        // ONLY connect terminals if button is EXPLICITLY pressed (true)
        // Use the strictest possible check - read the value directly
        const pressedValue = component.state.pressed;
        const isExplicitlyPressed = pressedValue === true;
        
        if (!isExplicitlyPressed) {
          // Button is NOT pressed - ABSOLUTELY do NOT connect terminals
          // Terminals MUST remain in separate nets (open circuit)
          // Skip to next component - do NOT add any adjacency
          continue;
        }
        
        // At this point, we've verified pressed === true
        // Button IS pressed - connect terminals internally
        const terminals = component.terminals;
        if (terminals.length >= 2) {
          const term1Key = getTerminalKey(component.placedId, terminals[0].id);
          const term2Key = getTerminalKey(component.placedId, terminals[1].id);
          
          if (!adjacency.has(term1Key)) adjacency.set(term1Key, new Set());
          if (!adjacency.has(term2Key)) adjacency.set(term2Key, new Set());
          
          adjacency.get(term1Key)!.add(term2Key);
          adjacency.get(term2Key)!.add(term1Key);
        }
      }
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

              // Treat MCU GPIO pins with configured logic-levels as additional
              // power/ground sources in the circuit graph. This allows the
              // logic panel to drive pins HIGH/LOW and participate in loops.
              if (comp.type === "arduino-uno" || comp.type === "esp32") {
                const boardStates = this.mcuPinStates[comp.placedId];
                const pinState = boardStates?.[term.id];
                if (pinState === "HIGH") {
                  isPower = true;
                  powerVoltage = comp.type === "arduino-uno" ? 5 : 3.3;
                } else if (pinState === "LOW") {
                  isGround = true;
                }
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

  /**
   * Detect a direct short circuit between power and ground that has no impedance
   * (i.e. power and ground are merged into the same net through wires / zero-ohm connections).
   *
   * This must be checked immediately after nets are built and MUST block simulation.
   */
  private detectShortCircuit(circuit: Circuit): SimulationError | null {
    for (const net of circuit.nets) {
      if (net.isPower && net.isGround) {
        const affectedComponents = Array.from(
          new Set(net.terminals.map((t) => t.componentId))
        );
        return {
          type: "SHORT_CIRCUIT",
          message: "Short circuit in this circuit cluster! Power and ground are directly connected.",
          affectedComponents,
          severity: "error",
          clusterId: circuit.id,
        };
      }
    }
    return null;
  }

  propagateVoltages(circuit: Circuit): void {
    for (const net of circuit.nets) {
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

      for (const net of circuit.nets) {
        if (!isNaN(net.voltage)) continue;

        for (const term of net.terminals) {
          const comp = this.components.get(term.componentId);
          if (!comp) continue;

          if (comp.type === "resistor") {
            // Resistors always propagate voltage between terminals
            const otherTerminal = comp.terminals.find((t) => t.id !== term.terminalId);
            if (otherTerminal) {
              const otherNetId = this.findNetForTerminal(comp.placedId, otherTerminal.id);
              if (otherNetId) {
                const otherNet = this.nets.get(otherNetId);
                if (otherNet && !isNaN(otherNet.voltage)) {
                  net.voltage = otherNet.voltage;
                  changed = true;
                }
              }
            }
          } else if (comp.type === "button") {
            // Buttons ONLY propagate voltage when explicitly pressed (true)
            // CRITICAL: If not pressed, button acts as open circuit - do NOT propagate voltage
            if (!comp.state) {
              comp.state = { pressed: false };
            }
            const isPressed = comp.state.pressed === true;
            if (isPressed) {
              // Button is pressed: propagate voltage between terminals
              const otherTerminal = comp.terminals.find((t) => t.id !== term.terminalId);
              if (otherTerminal) {
                const otherNetId = this.findNetForTerminal(comp.placedId, otherTerminal.id);
                if (otherNetId) {
                  const otherNet = this.nets.get(otherNetId);
                  if (otherNet && !isNaN(otherNet.voltage)) {
                    net.voltage = otherNet.voltage;
                    changed = true;
                  }
                }
              }
            }
            // If button is NOT pressed, do nothing - terminals are in separate nets (open circuit)
          }

          // Potentiometer: wiper voltage = position × (VCC - GND)
          if (comp.type === "potentiometer") {
            const vccTerminal = comp.terminals.find((t) => t.id === "vcc");
            const gndTerminal = comp.terminals.find((t) => t.id === "gnd");
            const signalTerminal = comp.terminals.find((t) => t.id === "signal");
            
            // FIX: Use term.terminalId instead of term.id (net terminals have terminalId)
            if (vccTerminal && gndTerminal && signalTerminal && term.terminalId === "signal") {
              const vccNetId = this.findNetForTerminal(comp.placedId, "vcc");
              const gndNetId = this.findNetForTerminal(comp.placedId, "gnd");
              
              if (vccNetId && gndNetId) {
                const vccNet = this.nets.get(vccNetId);
                const gndNet = this.nets.get(gndNetId);
                
                if (vccNet && gndNet && !isNaN(vccNet.voltage) && !isNaN(gndNet.voltage)) {
                  const position = (comp.state.position as number) ?? 0.5;
                  const vccVoltage = vccNet.voltage;
                  const gndVoltage = gndNet.voltage;
                  const wiperVoltage = gndVoltage + position * (vccVoltage - gndVoltage);
                  net.voltage = wiperVoltage;
                  changed = true;
                }
              }
            }
          }

          // IR Sensor: output voltage based on detection state and power
          if (comp.type === "ir-sensor") {
            const vccTerminal = comp.terminals.find((t) => t.id === "vcc");
            const gndTerminal = comp.terminals.find((t) => t.id === "gnd");
            const outTerminal = comp.terminals.find((t) => t.id === "out");
            
            if (vccTerminal && gndTerminal && outTerminal && term.terminalId === "out") {
              const vccNetId = this.findNetForTerminal(comp.placedId, "vcc");
              const gndNetId = this.findNetForTerminal(comp.placedId, "gnd");
              
              if (vccNetId && gndNetId) {
                const vccNet = this.nets.get(vccNetId);
                const gndNet = this.nets.get(gndNetId);
                
                // Only output if IR sensor is powered (VCC and GND connected)
                if (vccNet && gndNet && !isNaN(vccNet.voltage) && !isNaN(gndNet.voltage)) {
                  // Check if sensor has enough power (VCC > GND by at least 3V)
                  const powerVoltage = vccNet.voltage - gndNet.voltage;
                  if (powerVoltage >= 3.0) {
                    // Sensor is powered: output based on detection state
                    const detected = (comp.state.detected as boolean) ?? false;
                    // Detected = HIGH (VCC voltage), Not Detected = LOW (GND voltage)
                    net.voltage = detected ? vccNet.voltage : gndNet.voltage;
                    changed = true;
                  }
                  // If not enough power, output remains floating (undefined)
                }
              }
            }
          }

          // Ultrasonic Sensor: output voltage based on distance measurement and power
          if (comp.type === "ultrasonic") {
            const vccTerminal = comp.terminals.find((t) => t.id === "vcc");
            const gndTerminal = comp.terminals.find((t) => t.id === "gnd");
            const echoTerminal = comp.terminals.find((t) => t.id === "echo");
            
            if (vccTerminal && gndTerminal && echoTerminal && term.terminalId === "echo") {
              const vccNetId = this.findNetForTerminal(comp.placedId, "vcc");
              const gndNetId = this.findNetForTerminal(comp.placedId, "gnd");
              
              if (vccNetId && gndNetId) {
                const vccNet = this.nets.get(vccNetId);
                const gndNet = this.nets.get(gndNetId);
                
                // Only output if ultrasonic sensor is powered (VCC and GND connected)
                if (vccNet && gndNet && !isNaN(vccNet.voltage) && !isNaN(gndNet.voltage)) {
                  // Check if sensor has enough power (VCC > GND by at least 4V)
                  const powerVoltage = vccNet.voltage - gndNet.voltage;
                  if (powerVoltage >= 4.0) {
                    // Sensor is powered: output voltage based on distance
                    const outputVoltage = (comp.state.outputVoltage as number) ?? 0.5;
                    // Output is relative to GND (absolute voltage)
                    net.voltage = gndNet.voltage + outputVoltage;
                    changed = true;
                  }
                  // If not enough power, output remains floating (undefined)
                }
              }
            }
          }

          // DHT11 Sensor: output HIGH on DATA pin when powered and values are set
          if (comp.type === "dht11") {
            const vccTerminal = comp.terminals.find((t) => t.id === "vcc");
            const gndTerminal = comp.terminals.find((t) => t.id === "gnd");
            const dataTerminal = comp.terminals.find((t) => t.id === "data");
            
            if (vccTerminal && gndTerminal && dataTerminal && term.terminalId === "data") {
              const vccNetId = this.findNetForTerminal(comp.placedId, "vcc");
              const gndNetId = this.findNetForTerminal(comp.placedId, "gnd");
              
              if (vccNetId && gndNetId) {
                const vccNet = this.nets.get(vccNetId);
                const gndNet = this.nets.get(gndNetId);
                
                // Only output if DHT11 sensor is powered (VCC and GND connected)
                if (vccNet && gndNet && !isNaN(vccNet.voltage) && !isNaN(gndNet.voltage)) {
                  // Check if sensor has enough power (VCC > GND by at least 3V)
                  const powerVoltage = vccNet.voltage - gndNet.voltage;
                  if (powerVoltage >= 3.0) {
                    // Sensor is powered and has values: output HIGH
                    // Values are stored in component state for MCU consumption
                    const hasValues = (comp.state.temperature !== undefined) && (comp.state.humidity !== undefined);
                    if (hasValues) {
                      net.voltage = vccNet.voltage; // HIGH when powered and active
                      changed = true;
                    }
                  }
                  // If not enough power or no values, output remains floating (undefined)
                }
              }
            }
          }
        }
      }
    }
  }

  findNetForTerminal(componentId: string, terminalId: string): string | null {
    for (const [netId, net] of this.nets) {
      if (net.terminals.some((t) => t.componentId === componentId && t.terminalId === terminalId)) {
        return netId;
      }
    }
    return null;
  }

  evaluateComponents(circuit: Circuit): Map<string, ComponentState> {
    const states = new Map<string, ComponentState>();

    for (const component of circuit.components) {
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
        const ledAnalysis = this.analyzeLed(component);
        if (ledAnalysis.powered && ledAnalysis.isOn) {
          baseState.isActive = true;
          baseState.powered = true;
          baseState.properties.glowing = true;
          baseState.properties.brightness = ledAnalysis.brightness;
          if (ledAnalysis.current !== null) {
            baseState.properties.current = ledAnalysis.current;
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
            // FIX: Use voltage difference instead of strict gnd === 0
            // Servo needs at least 4V difference between VCC and GND
            const voltageDiff = vcc.voltage - gnd.voltage;
            if (voltageDiff >= 4.0) {
              baseState.powered = true;
              baseState.properties.powered = true;
              
              // Also get the current angle from state
              const currentAngle = component.state.angle as number ?? 90;
              baseState.properties.angle = currentAngle;
            }
          }
        }
        break;
      }

      case "ir-sensor": {
        const vccNet = this.findNetForTerminal(component.placedId, "vcc");
        const gndNet = this.findNetForTerminal(component.placedId, "gnd");

        if (vccNet && gndNet) {
          const vcc = this.nets.get(vccNet);
          const gnd = this.nets.get(gndNet);

          if (vcc && gnd && !isNaN(vcc.voltage) && !isNaN(gnd.voltage)) {
            const voltageDiff = vcc.voltage - gnd.voltage;
            if (voltageDiff >= 3.0) {
              baseState.powered = true;
              baseState.isActive = true;
              const detected = component.state.detected as boolean ?? false;
              baseState.properties.detected = detected;
            }
          }
        }
        break;
      }

      case "ultrasonic": {
        const vccNet = this.findNetForTerminal(component.placedId, "vcc");
        const gndNet = this.findNetForTerminal(component.placedId, "gnd");

        if (vccNet && gndNet) {
          const vcc = this.nets.get(vccNet);
          const gnd = this.nets.get(gndNet);

          if (vcc && gnd && !isNaN(vcc.voltage) && !isNaN(gnd.voltage)) {
            const voltageDiff = vcc.voltage - gnd.voltage;
            if (voltageDiff >= 4.0) {
              baseState.powered = true;
              baseState.isActive = true;
              const distance = component.state.distance as number ?? 0;
              baseState.properties.distance = distance;
            }
          }
        }
        break;
      }

      case "dht11": {
        const vccNet = this.findNetForTerminal(component.placedId, "vcc");
        const gndNet = this.findNetForTerminal(component.placedId, "gnd");

        if (vccNet && gndNet) {
          const vcc = this.nets.get(vccNet);
          const gnd = this.nets.get(gndNet);

          if (vcc && gnd && !isNaN(vcc.voltage) && !isNaN(gnd.voltage)) {
            const voltageDiff = vcc.voltage - gnd.voltage;
            if (voltageDiff >= 3.0) {
              baseState.powered = true;
              baseState.isActive = true;
              const temperature = component.state.temperature as number ?? 25;
              const humidity = component.state.humidity as number ?? 50;
              baseState.properties.temperature = temperature;
              baseState.properties.humidity = humidity;
            }
          }
        }
        break;
      }

      case "potentiometer": {
        const vccNet = this.findNetForTerminal(component.placedId, "vcc");
        const gndNet = this.findNetForTerminal(component.placedId, "gnd");

        if (vccNet && gndNet) {
          const vcc = this.nets.get(vccNet);
          const gnd = this.nets.get(gndNet);

          if (vcc && gnd && !isNaN(vcc.voltage) && !isNaN(gnd.voltage)) {
            const voltageDiff = vcc.voltage - gnd.voltage;
            if (voltageDiff >= 1.0) {
              baseState.powered = true;
              baseState.isActive = true;
              const position = component.state.position as number ?? 0.5;
              const outputVoltage = gnd.voltage + position * voltageDiff;
              baseState.properties.position = position;
              baseState.properties.outputVoltage = outputVoltage;
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

  detectCircuitErrors(circuit: Circuit): SimulationError[] {
    const errors: SimulationError[] = [];

    if (circuit.components.length === 0) return errors;

    const hasActiveComponents = circuit.components.some(
      (c) => !["5v", "gnd", "breadboard"].includes(c.type)
    );

    if (!hasActiveComponents) return errors;

    if (!circuit.hasGround) {
      errors.push({
        type: "NO_GROUND",
        message: "Circuit is missing a ground connection. Add a GND component.",
        affectedComponents: circuit.components.map((c) => c.placedId),
        severity: "error",
        clusterId: circuit.id,
      });
    }

    if (!circuit.hasPower) {
      errors.push({
        type: "NO_POWER",
        message: "Circuit is missing a power source. Add a 5V or use Arduino/ESP32 power pins.",
        affectedComponents: circuit.components.map((c) => c.placedId),
        severity: "error",
        clusterId: circuit.id,
      });
    }

    for (const net of circuit.nets) {
      if (net.isPower && net.isGround) {
        errors.push({
          type: "SHORT_CIRCUIT",
          message: "Short circuit in this circuit cluster! Power and ground are directly connected.",
          affectedComponents: net.terminals.map((t) => t.componentId),
          severity: "error",
          clusterId: circuit.id,
        });
      }
    }

    // Per-LED rule-based validation (closed loop, series resistor, polarity, current)
    for (const component of circuit.components) {
      if (component.type === "led") {
        const ledResult = this.analyzeLed(component);
        // Add clusterId to led errors
        const ledErrors = ledResult.errors.map(e => ({ ...e, clusterId: circuit.id }));
        errors.push(...ledErrors);
      }
    }

    return errors;
  }

  simulate(mcuPinStates?: McuPinStateMap): SimulationResult {
    this.mcuPinStates = mcuPinStates ?? {};

    // CRITICAL: Force all buttons to NOT pressed (false) unless explicitly set to true
    // This ensures buttons start as open circuit (terminals in separate nets)
    // This MUST happen before buildNets() to prevent terminals from being connected
    for (const component of this.components.values()) {
      if (component.type === "button") {
        // Initialize state if missing
        if (!component.state) {
          component.state = { pressed: false };
        }
        // CRITICAL: If pressed is not EXPLICITLY true, force it to false
        // Use strict equality check - only true is true, everything else is false
        const currentPressed = component.state.pressed;
        if (currentPressed !== true) {
          // Not explicitly true - force to false (not pressed)
          component.state.pressed = false;
        }
        // At this point, component.state.pressed is either true or false, never undefined
      }
    }

    this.buildNets();
    this.buildCircuits();

    const componentStates = new Map<string, ComponentState>();
    const netStates = new Map<string, NetState>();
    const errors: SimulationError[] = [];
    const warnings: SimulationWarning[] = [];

    for (const circuit of this.circuits) {
      // 1. Detect Short Circuit
      const shortCircuit = this.detectShortCircuit(circuit);
      if (shortCircuit) {
        errors.push(shortCircuit);
        
        // Set inactive states for this cluster
        for (const component of circuit.components) {
          componentStates.set(component.placedId, {
            componentId: component.placedId,
            type: component.type,
            isActive: false,
            powered: false,
            properties: { ...component.state },
          });
        }
        
        // Set net states for this cluster
        for (const net of circuit.nets) {
          netStates.set(net.id, {
            netId: net.id,
            voltage: net.voltage,
            current: 0,
            isGround: net.isGround,
            isPower: net.isPower,
          });
        }
        continue;
      }

      // 2. Propagate Voltages
      this.propagateVoltages(circuit);

      // 3. Detect Errors
      const circuitErrors = this.detectCircuitErrors(circuit);
      errors.push(...circuitErrors);
      
      const circuitWarnings = circuitErrors.filter((e) => e.severity === "warning");
      // Note: detectCircuitErrors returns both errors and warnings? 
      // Actually detectCircuitErrors logic only pushes severity "error" in my previous edit?
      // Wait, let's check. detectCircuitErrors logic:
      // severity: "error" for everything I added.
      // analyzeLed might return warnings.
      // I should filter them properly if needed, but for now push all to errors list and filter later.
      // Wait, analyzeLed returns { errors: [] } which are SimulationError. SimulationError has severity.
      
      // 4. Evaluate Components
      const circuitComponentStates = this.evaluateComponents(circuit);
      circuitComponentStates.forEach((state, id) => componentStates.set(id, state));

      // 5. Net States
      for (const net of circuit.nets) {
        netStates.set(net.id, {
          netId: net.id,
          voltage: net.voltage,
          current: 0,
          isGround: net.isGround,
          isPower: net.isPower,
        });
      }
    }

    return {
      isValid: errors.filter((e) => e.severity === "error").length === 0,
      circuits: this.circuits,
      errors: errors.filter((e) => e.severity === "error"),
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

  /**
   * Internal helper used by the rule engine to evaluate a single LED
   * against the current circuit graph.
   */
  private analyzeLed(component: SimComponent): LedAnalysisResult {
    return analyzeLedForEngine(this, component);
  }
}

/**
 * Small helper describing the analysis result for a single LED.
 */
interface LedAnalysisResult {
  isOn: boolean;
  powered: boolean;
  brightness: number;
  current: number | null;
  errors: SimulationError[];
}

/**
 * Per-color defaults for LED electrical characteristics.
 */
const LED_DEFAULTS: Record<
  string,
  {
    forwardVoltage: number;
    maxCurrent: number; // amps
  }
> = {
  red: { forwardVoltage: 1.8, maxCurrent: 0.02 },
  yellow: { forwardVoltage: 2.0, maxCurrent: 0.02 },
  green: { forwardVoltage: 2.2, maxCurrent: 0.02 },
};

/**
 * Analyze a single LED in the context of the current nets & circuits.
 * This enforces:
 * - Closed-loop requirement (power -> LED -> ground)
 * - Presence of at least one series resistor
 * - Correct polarity (anode at higher potential than cathode)
 * - Current within safe limits based on Ohm's law
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _neverUsed() {
  // This function exists only to keep TypeScript happy when tree-shaking
  // in some bundlers; real logic is in SimulationEngine methods below.
}

// Extend SimulationEngine with LED analysis helpers
// (placed here so we can keep the main class definition readable)
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SimulationHelpers {
  export function getLedDefaults(color: string | undefined) {
    const lower = color?.toLowerCase() ?? "red";
    return LED_DEFAULTS[lower] ?? LED_DEFAULTS.red;
  }
}

// We attach the helper as a method on the prototype to keep the file single-class.
function analyzeLedForEngine(
  engine: SimulationEngine,
  component: SimComponent
): LedAnalysisResult {
  const errors: SimulationError[] = [];

  // Ensure LED terminals are actually wired
  const isAnodeConnected = (engine as unknown as { wires: SimWire[] }).wires.some(
    (w) =>
      (w.startComponentId === component.placedId && w.startTerminalId === "anode") ||
      (w.endComponentId === component.placedId && w.endTerminalId === "anode")
  );
  const isCathodeConnected = (engine as unknown as { wires: SimWire[] }).wires.some(
    (w) =>
      (w.startComponentId === component.placedId && w.startTerminalId === "cathode") ||
      (w.endComponentId === component.placedId && w.endTerminalId === "cathode")
  );

  if (!isAnodeConnected || !isCathodeConnected) {
    // LED is simply not in the circuit; don't flag an error, just treat as off.
    return { isOn: false, powered: false, brightness: 0, current: null, errors };
  }

  const anodeNetId = (engine as unknown as SimulationEngine).findNetForTerminal(
    component.placedId,
    "anode"
  );
  const cathodeNetId = (engine as unknown as SimulationEngine).findNetForTerminal(
    component.placedId,
    "cathode"
  );

  if (!anodeNetId || !cathodeNetId) {
    return {
      isOn: false,
      powered: false,
      brightness: 0,
      current: null,
      errors,
    };
  }

  // Locate the circuit that contains this LED
  const circuit = (engine as unknown as SimulationEngine)
    .getCircuits()
    .find((c) => c.components.some((cmp) => cmp.placedId === component.placedId));

  if (!circuit) {
    return {
      isOn: false,
      powered: false,
      brightness: 0,
      current: null,
      errors,
    };
  }

  const powerNets = circuit.nets.filter((n) => n.isPower);
  const groundNets = circuit.nets.filter((n) => n.isGround);

  if (powerNets.length === 0 || groundNets.length === 0) {
    // Check if there's an unpressed button or potentiometer - if so, this might be expected behavior
    const hasUnpressedButton = circuit.components.some(
      (comp) => comp.type === "button" && comp.state?.pressed !== true
    );
    const hasPotentiometer = circuit.components.some(
      (comp) => comp.type === "potentiometer"
    );
    
    if (!hasUnpressedButton && !hasPotentiometer) {
      errors.push({
        type: "OPEN_CIRCUIT",
        message:
          "No closed loop detected for LED. Ensure there is both a power source and ground in the circuit.",
        affectedComponents: [component.placedId],
        severity: "error",
      });
    }
    return {
      isOn: false,
      powered: false,
      brightness: 0,
      current: null,
      errors,
    };
  }

  // Build a simple net graph where edges are 2‑terminal components (resistor, LED, button, etc.)
  type Edge = {
    from: string;
    to: string;
    component: SimComponent;
  };

  const adjacency = new Map<string, Edge[]>();
  const addEdge = (from: string, to: string, comp: SimComponent) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from)!.push({ from, to, component: comp });
  };

  for (const comp of circuit.components) {
    // Only consider simple 2‑terminal components when building the series graph
    if (comp.terminals.length !== 2) continue;
    
    // CRITICAL: Skip buttons that are NOT pressed - they act as open circuits
    // Buttons only connect their terminals when pressed
    if (comp.type === "button") {
      const isPressed = comp.state?.pressed === true;
      if (!isPressed) {
        // Button is not pressed - do NOT add it as an edge (open circuit)
        continue;
      }
    }
    
    const [t1, t2] = comp.terminals;
    const n1 = (engine as unknown as SimulationEngine).findNetForTerminal(
      comp.placedId,
      t1.id
    );
    const n2 = (engine as unknown as SimulationEngine).findNetForTerminal(
      comp.placedId,
      t2.id
    );
    if (!n1 || !n2 || n1 === n2) continue;
    addEdge(n1, n2, comp);
    addEdge(n2, n1, comp);
  }

  // Depth‑first search from each power net to each ground net trying to find
  // a path that passes through this LED and at least one resistor.
  interface PathState {
    netId: string;
    path: Edge[];
  }

  let bestPath: Edge[] | null = null;
  let pathPowerNet: Net | null = null;
  let pathGroundNet: Net | null = null;

  for (const p of powerNets) {
    for (const g of groundNets) {
      const stack: PathState[] = [{ netId: p.id, path: [] }];
      const visited = new Set<string>();

      while (stack.length > 0) {
        const { netId, path } = stack.pop()!;
        if (visited.has(netId)) continue;
        visited.add(netId);

        if (netId === g.id) {
          // Reached ground; see if this path goes through the LED
          const usesLed = path.some((e) => e.component.placedId === component.placedId);
          if (!usesLed) continue;

          bestPath = path;
          pathPowerNet = p;
          pathGroundNet = g;
          break;
        }

        const edges = adjacency.get(netId) ?? [];
        for (const edge of edges) {
          if (!visited.has(edge.to)) {
            stack.push({ netId: edge.to, path: [...path, edge] });
          }
        }
      }

      if (bestPath) break;
    }
    if (bestPath) break;
  }

  if (!bestPath || !pathPowerNet || !pathGroundNet) {
    // LED is wired but not actually part of a closed loop from power to ground.
    // Check if there's an unpressed button in the circuit - if so, this is expected behavior (not an error)
    const hasUnpressedButton = circuit.components.some(
      (comp) => comp.type === "button" && comp.state?.pressed !== true
    );
    
    // Check if there's a potentiometer in the circuit - potentiometers have 3 terminals
    // and are handled differently (voltage is set on signal terminal via propagation)
    const hasPotentiometer = circuit.components.some(
      (comp) => comp.type === "potentiometer"
    );
    
    if (!hasUnpressedButton && !hasPotentiometer) {
      // No button or potentiometer - this is a real wiring error
      errors.push({
        type: "OPEN_CIRCUIT",
        message:
          "No closed loop detected through this LED. Complete the path from power through a resistor and LED to ground.",
        affectedComponents: [component.placedId],
        severity: "error",
      });
    }
    
    // If there's an unpressed button or potentiometer, evaluate LED based on actual voltages
    // Check if LED has valid voltage difference to determine if it should glow
    if (hasPotentiometer) {
      const anodeNet = (engine as unknown as SimulationEngine).getNets().get(anodeNetId);
      const cathodeNet = (engine as unknown as SimulationEngine).getNets().get(cathodeNetId);
      
      if (anodeNet && cathodeNet && !isNaN(anodeNet.voltage) && !isNaN(cathodeNet.voltage)) {
        const voltageDrop = anodeNet.voltage - cathodeNet.voltage;
        // LED needs ~2V forward voltage to light up
        if (voltageDrop >= 1.8) {
          // Check if there's a resistor in the path (simplified check - just needs one in circuit)
          const hasResistor = circuit.components.some((c) => c.type === "resistor");
          if (hasResistor) {
            const brightness = Math.min(1, voltageDrop / 3);
            return {
              isOn: true,
              powered: true,
              brightness,
              current: voltageDrop / 220, // Assume 220Ω resistor
              errors,
            };
          }
        }
      }
    }
    
    return {
      isOn: false,
      powered: false,
      brightness: 0,
      current: null,
      errors,
    };
  }

  // Verify that the path passes the LED with correct polarity and at least one resistor.
  const ledEdgeIndex = bestPath.findIndex((e) => e.component.placedId === component.placedId);
  if (ledEdgeIndex === -1) {
    // Should not happen given earlier check, but guard anyway.
    return {
      isOn: false,
      powered: false,
      brightness: 0,
      current: null,
      errors,
    };
  }

  const ledEdge = bestPath[ledEdgeIndex];
  const pathHasResistor = bestPath.some((e) => e.component.type === "resistor");

  if (!pathHasResistor) {
    errors.push({
      type: "MISSING_RESISTOR",
      message:
        "LED is missing a series resistor in its loop. Add a resistor in series to limit current.",
      affectedComponents: [component.placedId],
      severity: "error",
    });
  }

  // Determine which side of the edge corresponds to anode/cathode.
  const ledAnodeNetId = anodeNetId;
  const ledCathodeNetId = cathodeNetId;

  const traversesAnodeToCathode =
    ledEdge.from === ledAnodeNetId && ledEdge.to === ledCathodeNetId;
  const traversesCathodeToAnode =
    ledEdge.from === ledCathodeNetId && ledEdge.to === ledAnodeNetId;

  if (!traversesAnodeToCathode && !traversesCathodeToAnode) {
    // The path is strange; treat as open circuit.
    errors.push({
      type: "OPEN_CIRCUIT",
      message:
        "LED is wired but not oriented in a valid path between power and ground. Check your wiring.",
      affectedComponents: [component.placedId],
      severity: "error",
    });
    return {
      isOn: false,
      powered: false,
      brightness: 0,
      current: null,
      errors,
    };
  }

  if (traversesCathodeToAnode) {
    errors.push({
      type: "REVERSE_POLARITY",
      message:
        "Wrong LED polarity: anode is at lower potential than cathode in the detected loop. Swap the LED leads.",
      affectedComponents: [component.placedId],
      severity: "error",
    });
    return {
      isOn: false,
      powered: true,
      brightness: 0,
      current: null,
      errors,
    };
  }

  // Compute total series resistance in the path.
  let totalR = 0;
  for (const edge of bestPath) {
    if (edge.component.type === "resistor") {
      const resistance =
        (edge.component.state.resistance as number | undefined) ?? 220;
      totalR += resistance;
    }
  }

  if (totalR <= 0) {
    // No meaningful current limiting; treat as overcurrent risk.
    errors.push({
      type: "OVERCURRENT",
      message:
        "No resistance detected in LED loop. Add a resistor in series to limit current.",
      affectedComponents: [component.placedId],
      severity: "error",
    });
    return {
      isOn: false,
      powered: true,
      brightness: 0,
      current: null,
      errors,
    };
  }

  // Apply basic Ohm's law: I = (Vsupply - Vf) / R
  const { forwardVoltage, maxCurrent } = SimulationHelpers.getLedDefaults(
    (component.state as { color?: string }).color
  );

  const supplyVoltage = pathPowerNet.powerVoltage;
  const availableVoltage = supplyVoltage - forwardVoltage;

  if (availableVoltage <= 0) {
    // Not enough voltage to forward-bias the LED.
    return {
      isOn: false,
      powered: true,
      brightness: 0,
      current: 0,
      errors,
    };
  }

  const current = availableVoltage / totalR; // amps

  if (current <= 0) {
    return {
      isOn: false,
      powered: true,
      brightness: 0,
      current,
      errors,
    };
  }

  if (current > maxCurrent) {
    errors.push({
      type: "OVERCURRENT",
      message: `Current exceeds safe limit for LED. Calculated current is ${(current * 1000).toFixed(
        1
      )} mA (max ${(maxCurrent * 1000).toFixed(0)} mA). Increase the resistor value.`,
      affectedComponents: [component.placedId],
      severity: "error",
    });
    return {
      isOn: false,
      powered: true,
      brightness: 0,
      current,
      errors,
    };
  }

  const brightness = Math.min(1, current / maxCurrent);

  return {
    isOn: true,
    powered: true,
    brightness,
    current,
    errors,
  };
};

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
    { id: "vcc", name: "VCC", type: "power", offsetX: -12, offsetY: 24, mode: "INPUT" },
    { id: "signal", name: "Signal", type: "signal", offsetX: 0, offsetY: 24, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 12, offsetY: 24, mode: "INPUT" },
  ],
  ultrasonic: [
    { id: "vcc", name: "VCC", type: "power", offsetX: -15, offsetY: 24, mode: "INPUT" },
    { id: "trig", name: "TRIG", type: "signal", offsetX: -5, offsetY: 24, mode: "INPUT" },
    { id: "echo", name: "ECHO", type: "data", offsetX: 5, offsetY: 24, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 15, offsetY: 24, mode: "INPUT" },
  ],
  "ir-sensor": [
    { id: "vcc", name: "VCC", type: "power", offsetX: -10, offsetY: 24, mode: "INPUT" },
    { id: "out", name: "OUT", type: "data", offsetX: 0, offsetY: 24, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 10, offsetY: 24, mode: "INPUT" },
  ],
  dht11: [
    { id: "vcc", name: "VCC", type: "power", offsetX: -10, offsetY: 28, mode: "INPUT" },
    { id: "data", name: "DATA", type: "data", offsetX: 0, offsetY: 28, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: 10, offsetY: 28, mode: "INPUT" },
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
  // Arduino UNO terminals - MUST match circuit-types.ts exactly for wiring to work
  "arduino-uno": [
    // Power pins - top row (spaced at 14px for clarity)
    { id: "5v", name: "5V", type: "power", offsetX: -56, offsetY: -38, mode: "OUTPUT" },
    { id: "3v3", name: "3.3V", type: "power", offsetX: -42, offsetY: -38, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: -28, offsetY: -38, mode: "INPUT" },
    { id: "gnd2", name: "GND", type: "ground", offsetX: -14, offsetY: -38, mode: "INPUT" },
    { id: "vin", name: "VIN", type: "power", offsetX: 0, offsetY: -38, mode: "INPUT" },
    // Analog pins - top row continued
    { id: "a0", name: "A0", type: "signal", offsetX: 18, offsetY: -38, mode: "BIDIRECTIONAL" },
    { id: "a1", name: "A1", type: "signal", offsetX: 32, offsetY: -38, mode: "BIDIRECTIONAL" },
    { id: "a2", name: "A2", type: "signal", offsetX: 46, offsetY: -38, mode: "BIDIRECTIONAL" },
    { id: "a3", name: "A3", type: "signal", offsetX: 60, offsetY: -38, mode: "BIDIRECTIONAL" },
    // Digital pins - bottom row (spaced at 14px for clarity)
    { id: "d13", name: "D13", type: "gpio", offsetX: -56, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d12", name: "D12", type: "gpio", offsetX: -42, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d11", name: "D11~", type: "gpio", offsetX: -28, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d10", name: "D10~", type: "gpio", offsetX: -14, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d9", name: "D9~", type: "gpio", offsetX: 0, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d8", name: "D8", type: "gpio", offsetX: 14, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d7", name: "D7", type: "gpio", offsetX: 28, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d6", name: "D6~", type: "gpio", offsetX: 42, offsetY: 38, mode: "BIDIRECTIONAL" },
    { id: "d5", name: "D5~", type: "gpio", offsetX: 56, offsetY: 38, mode: "BIDIRECTIONAL" },
  ],
  // ESP32 terminals - MUST match circuit-types.ts exactly for wiring to work
  esp32: [
    // Left side pins (spaced at 14px vertically)
    { id: "3v3", name: "3.3V", type: "power", offsetX: -38, offsetY: -35, mode: "OUTPUT" },
    { id: "gnd", name: "GND", type: "ground", offsetX: -38, offsetY: -21, mode: "INPUT" },
    { id: "d15", name: "D15", type: "gpio", offsetX: -38, offsetY: -7, mode: "BIDIRECTIONAL" },
    { id: "d2", name: "D2", type: "gpio", offsetX: -38, offsetY: 7, mode: "BIDIRECTIONAL" },
    { id: "d4", name: "D4", type: "gpio", offsetX: -38, offsetY: 21, mode: "BIDIRECTIONAL" },
    { id: "d5", name: "D5", type: "gpio", offsetX: -38, offsetY: 35, mode: "BIDIRECTIONAL" },
    // Right side pins (spaced at 14px vertically)
    { id: "vin", name: "VIN", type: "power", offsetX: 38, offsetY: -35, mode: "INPUT" },
    { id: "gnd2", name: "GND", type: "ground", offsetX: 38, offsetY: -21, mode: "INPUT" },
    { id: "d13", name: "D13", type: "gpio", offsetX: 38, offsetY: -7, mode: "BIDIRECTIONAL" },
    { id: "d12", name: "D12", type: "gpio", offsetX: 38, offsetY: 7, mode: "BIDIRECTIONAL" },
    { id: "d14", name: "D14", type: "gpio", offsetX: 38, offsetY: 21, mode: "BIDIRECTIONAL" },
    { id: "d27", name: "D27", type: "gpio", offsetX: 38, offsetY: 35, mode: "BIDIRECTIONAL" },
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
