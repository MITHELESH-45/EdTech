/**
 * Arduino Block Definitions
 * 
 * CRITICAL: Each block has TWO code representations:
 * - pythonCode: For visual preview only (NEVER executed or uploaded)
 * - arduinoCode: For actual Arduino upload (compiled to hardware)
 * 
 * Python is ONLY for user-friendly display.
 * Arduino C++ is the ONLY code that gets uploaded to hardware.
 */

export type ArduinoSection = "setup" | "loop" | "global";

export interface ArduinoBlockDefinition {
  id: string;
  label: string;
  category: string;
  color: string;
  section: ArduinoSection;
  fields: Record<string, ArduinoFieldSchema>;
  // Python code template (for display ONLY)
  pythonTemplate: string;
  // Arduino C++ code template (for UPLOAD)
  arduinoTemplate: string;
  // Optional: Additional setup code needed (e.g., pinMode)
  arduinoSetupTemplate?: string;
  // Optional: Global variables/includes needed
  arduinoGlobalTemplate?: string;
}

export interface ArduinoFieldSchema {
  type: "number" | "text" | "select" | "toggle";
  label: string;
  default: any;
  options?: { label: string; value: string }[];
}

export interface PlacedArduinoBlock {
  id: string;
  blockId: string;
  x: number;
  y: number;
  fieldValues: Record<string, any>;
  nextBlockId?: string;
}

// =============================================================================
// ARDUINO BLOCK DEFINITIONS
// =============================================================================

export const arduinoBlocks: ArduinoBlockDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DIGITAL I/O BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "pin_mode",
    label: "Pin Mode",
    category: "digital",
    color: "#22c55e",
    section: "setup",
    fields: {
      pin: { type: "number", label: "Pin", default: 13 },
      mode: {
        type: "select",
        label: "Mode",
        default: "OUTPUT",
        options: [
          { label: "OUTPUT", value: "OUTPUT" },
          { label: "INPUT", value: "INPUT" },
          { label: "INPUT_PULLUP", value: "INPUT_PULLUP" },
        ],
      },
    },
    pythonTemplate: "pin_mode({pin}, {mode})",
    arduinoTemplate: "pinMode({pin}, {mode});",
  },
  {
    id: "digital_write",
    label: "Digital Write",
    category: "digital",
    color: "#3b82f6",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin", default: 13 },
      value: {
        type: "select",
        label: "Value",
        default: "HIGH",
        options: [
          { label: "HIGH", value: "HIGH" },
          { label: "LOW", value: "LOW" },
        ],
      },
    },
    pythonTemplate: "digital_write({pin}, {value})",
    arduinoTemplate: "digitalWrite({pin}, {value});",
    arduinoSetupTemplate: "pinMode({pin}, OUTPUT);",
  },
  {
    id: "digital_read",
    label: "Digital Read",
    category: "digital",
    color: "#8b5cf6",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin", default: 2 },
      variable: { type: "text", label: "Store in", default: "buttonState" },
    },
    pythonTemplate: "{variable} = digital_read({pin})",
    arduinoTemplate: "int {variable} = digitalRead({pin});",
    arduinoSetupTemplate: "pinMode({pin}, INPUT);",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LED CONTROL BLOCKS (MOST COMMON USE CASE)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "led_on",
    label: "LED ON",
    category: "led",
    color: "#eab308",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin", default: 13 },
    },
    pythonTemplate: "led_on({pin})",
    arduinoTemplate: "digitalWrite({pin}, HIGH);",
    arduinoSetupTemplate: "pinMode({pin}, OUTPUT);",
  },
  {
    id: "led_off",
    label: "LED OFF",
    category: "led",
    color: "#6b7280",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin", default: 13 },
    },
    pythonTemplate: "led_off({pin})",
    arduinoTemplate: "digitalWrite({pin}, LOW);",
    arduinoSetupTemplate: "pinMode({pin}, OUTPUT);",
  },
  {
    id: "led_blink",
    label: "LED Blink",
    category: "led",
    color: "#f97316",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin", default: 13 },
      delay_ms: { type: "number", label: "Delay (ms)", default: 1000 },
    },
    pythonTemplate: "led_blink({pin}, {delay_ms})",
    arduinoTemplate: `digitalWrite({pin}, HIGH);
  delay({delay_ms});
  digitalWrite({pin}, LOW);
  delay({delay_ms});`,
    arduinoSetupTemplate: "pinMode({pin}, OUTPUT);",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALOG I/O BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "analog_read",
    label: "Analog Read",
    category: "analog",
    color: "#06b6d4",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin (A0-A7)", default: 0 },
      variable: { type: "text", label: "Store in", default: "sensorValue" },
    },
    pythonTemplate: "{variable} = analog_read(A{pin})",
    arduinoTemplate: "int {variable} = analogRead(A{pin});",
  },
  {
    id: "analog_write",
    label: "Analog Write (PWM)",
    category: "analog",
    color: "#ec4899",
    section: "loop",
    fields: {
      pin: { type: "number", label: "Pin (3,5,6,9,10,11)", default: 9 },
      value: { type: "number", label: "Value (0-255)", default: 128 },
    },
    pythonTemplate: "analog_write({pin}, {value})",
    arduinoTemplate: "analogWrite({pin}, {value});",
    arduinoSetupTemplate: "pinMode({pin}, OUTPUT);",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMING BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "delay_ms",
    label: "Delay (ms)",
    category: "timing",
    color: "#a855f7",
    section: "loop",
    fields: {
      ms: { type: "number", label: "Milliseconds", default: 1000 },
    },
    pythonTemplate: "delay({ms})",
    arduinoTemplate: "delay({ms});",
  },
  {
    id: "delay_us",
    label: "Delay (μs)",
    category: "timing",
    color: "#d946ef",
    section: "loop",
    fields: {
      us: { type: "number", label: "Microseconds", default: 100 },
    },
    pythonTemplate: "delay_us({us})",
    arduinoTemplate: "delayMicroseconds({us});",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIAL COMMUNICATION BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "serial_begin",
    label: "Serial Begin",
    category: "serial",
    color: "#14b8a6",
    section: "setup",
    fields: {
      baud: { type: "number", label: "Baud Rate", default: 9600 },
    },
    pythonTemplate: "serial_begin({baud})",
    arduinoTemplate: "Serial.begin({baud});",
  },
  {
    id: "serial_print",
    label: "Serial Print",
    category: "serial",
    color: "#0ea5e9",
    section: "loop",
    fields: {
      text: { type: "text", label: "Text", default: "Hello" },
    },
    pythonTemplate: 'serial_print("{text}")',
    arduinoTemplate: 'Serial.print("{text}");',
    arduinoSetupTemplate: "Serial.begin(9600);",
  },
  {
    id: "serial_println",
    label: "Serial Print Line",
    category: "serial",
    color: "#0284c7",
    section: "loop",
    fields: {
      text: { type: "text", label: "Text", default: "Hello" },
    },
    pythonTemplate: 'serial_println("{text}")',
    arduinoTemplate: 'Serial.println("{text}");',
    arduinoSetupTemplate: "Serial.begin(9600);",
  },
  {
    id: "serial_print_var",
    label: "Serial Print Variable",
    category: "serial",
    color: "#0369a1",
    section: "loop",
    fields: {
      variable: { type: "text", label: "Variable", default: "sensorValue" },
    },
    pythonTemplate: "serial_print({variable})",
    arduinoTemplate: "Serial.println({variable});",
    arduinoSetupTemplate: "Serial.begin(9600);",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROL FLOW BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "if_condition",
    label: "If Condition",
    category: "control",
    color: "#2563eb",
    section: "loop",
    fields: {
      left: { type: "text", label: "Left", default: "buttonState" },
      operator: {
        type: "select",
        label: "Operator",
        default: "==",
        options: [
          { label: "==", value: "==" },
          { label: "!=", value: "!=" },
          { label: ">", value: ">" },
          { label: "<", value: "<" },
          { label: ">=", value: ">=" },
          { label: "<=", value: "<=" },
        ],
      },
      right: { type: "text", label: "Right", default: "HIGH" },
    },
    pythonTemplate: "if {left} {operator} {right}:",
    arduinoTemplate: "if ({left} {operator} {right}) {",
  },
  {
    id: "end_if",
    label: "End If",
    category: "control",
    color: "#1d4ed8",
    section: "loop",
    fields: {},
    pythonTemplate: "# end if",
    arduinoTemplate: "}",
  },
  {
    id: "else_block",
    label: "Else",
    category: "control",
    color: "#1e40af",
    section: "loop",
    fields: {},
    pythonTemplate: "else:",
    arduinoTemplate: "} else {",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIABLE BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "declare_int",
    label: "Declare Integer",
    category: "variables",
    color: "#84cc16",
    section: "loop",
    fields: {
      name: { type: "text", label: "Name", default: "counter" },
      value: { type: "number", label: "Value", default: 0 },
    },
    pythonTemplate: "{name} = {value}",
    arduinoTemplate: "int {name} = {value};",
  },
  {
    id: "set_variable",
    label: "Set Variable",
    category: "variables",
    color: "#65a30d",
    section: "loop",
    fields: {
      name: { type: "text", label: "Name", default: "counter" },
      value: { type: "text", label: "Value", default: "0" },
    },
    pythonTemplate: "{name} = {value}",
    arduinoTemplate: "{name} = {value};",
  },
  {
    id: "increment",
    label: "Increment",
    category: "variables",
    color: "#4d7c0f",
    section: "loop",
    fields: {
      name: { type: "text", label: "Variable", default: "counter" },
    },
    pythonTemplate: "{name} += 1",
    arduinoTemplate: "{name}++;",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SENSOR BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ultrasonic_read",
    label: "Ultrasonic Distance",
    category: "sensors",
    color: "#3b82f6",
    section: "loop",
    fields: {
      trigPin: { type: "number", label: "Trigger Pin", default: 9 },
      echoPin: { type: "number", label: "Echo Pin", default: 10 },
      variable: { type: "text", label: "Store in", default: "distance" },
    },
    pythonTemplate: "{variable} = ultrasonic_read({trigPin}, {echoPin})",
    arduinoTemplate: `digitalWrite({trigPin}, LOW);
  delayMicroseconds(2);
  digitalWrite({trigPin}, HIGH);
  delayMicroseconds(10);
  digitalWrite({trigPin}, LOW);
  long {variable} = pulseIn({echoPin}, HIGH) * 0.034 / 2;`,
    arduinoSetupTemplate: `pinMode({trigPin}, OUTPUT);
  pinMode({echoPin}, INPUT);`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVO BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "servo_attach",
    label: "Servo Attach",
    category: "motors",
    color: "#f97316",
    section: "setup",
    fields: {
      pin: { type: "number", label: "Pin", default: 9 },
    },
    pythonTemplate: "servo_attach({pin})",
    arduinoTemplate: "myServo.attach({pin});",
    arduinoGlobalTemplate: `#include <Servo.h>
Servo myServo;`,
  },
  {
    id: "servo_write",
    label: "Servo Write",
    category: "motors",
    color: "#ea580c",
    section: "loop",
    fields: {
      angle: { type: "number", label: "Angle (0-180)", default: 90 },
    },
    pythonTemplate: "servo_write({angle})",
    arduinoTemplate: "myServo.write({angle});",
  },
];

// =============================================================================
// BLOCK CATEGORIES
// =============================================================================

export const arduinoBlockCategories = [
  { id: "led", label: "LED", color: "#eab308" },
  { id: "digital", label: "Digital I/O", color: "#22c55e" },
  { id: "analog", label: "Analog I/O", color: "#06b6d4" },
  { id: "timing", label: "Timing", color: "#a855f7" },
  { id: "serial", label: "Serial", color: "#14b8a6" },
  { id: "control", label: "Control Flow", color: "#2563eb" },
  { id: "variables", label: "Variables", color: "#84cc16" },
  { id: "sensors", label: "Sensors", color: "#3b82f6" },
  { id: "motors", label: "Motors", color: "#f97316" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getArduinoBlockById(id: string): ArduinoBlockDefinition | undefined {
  return arduinoBlocks.find((b) => b.id === id);
}

export function getBlocksByCategory(category: string): ArduinoBlockDefinition[] {
  return arduinoBlocks.filter((b) => b.category === category);
}

/**
 * Replace template placeholders with actual field values
 */
export function fillTemplate(template: string, values: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, String(value));
  }
  return result;
}









