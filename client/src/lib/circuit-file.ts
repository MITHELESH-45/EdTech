/**
 * Circuit File Format and Save/Load Utilities for Electronic Simulation
 * 
 * File format: .egroots.json
 * This module handles serialization and deserialization of circuit state
 * for local file save/load functionality.
 */

import type { PlacedComponent, Wire } from "@shared/schema";
import type { McuPinStateMap } from "./simulation-engine";

// Extended wire type with terminal references
export interface ExtendedWire extends Wire {
  startTerminal?: { componentId: string; terminalId: string };
  endTerminal?: { componentId: string; terminalId: string };
}

// Component control state (button, potentiometer, sensors, etc.)
export interface ComponentControlState {
  buttonPressed?: boolean;
  potPosition?: number; // 0-1
  irDetected?: boolean;
  ultrasonicDistance?: number; // in cm
  temperature?: number; // °C
  humidity?: number; // %
  servoAngle?: number; // 0-180 degrees
}

// Complete circuit data structure for save/load
export interface CircuitData {
  placedComponents: PlacedComponent[];
  wires: ExtendedWire[];
  resistorValues: Record<string, number>;
  controlStates: Record<string, ComponentControlState>;
  mcuPinStates: McuPinStateMap;
}

// File format schema
export interface CircuitFile {
  version: string;
  type: "electronic-simulation";
  timestamp: number;
  data: CircuitData;
}

// Current file format version
export const CIRCUIT_FILE_VERSION = "1.0";

/**
 * Serialize circuit state to JSON file format
 */
export function serializeCircuit(data: CircuitData): CircuitFile {
  return {
    version: CIRCUIT_FILE_VERSION,
    type: "electronic-simulation",
    timestamp: Date.now(),
    data: {
      placedComponents: data.placedComponents,
      wires: data.wires,
      resistorValues: data.resistorValues,
      controlStates: data.controlStates,
      mcuPinStates: data.mcuPinStates,
    },
  };
}

/**
 * Generate filename with timestamp
 * Format: egroots-circuit-YYYY-MM-DD-HHMM.egroots.json
 */
export function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  
  return `egroots-circuit-${year}-${month}-${day}-${hours}${minutes}.egroots.json`;
}

/**
 * Download circuit as JSON file
 */
export function downloadCircuit(data: CircuitData): void {
  const circuitFile = serializeCircuit(data);
  const jsonString = JSON.stringify(circuitFile, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = generateFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validation result for loaded circuit files
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: CircuitData;
}

/**
 * Validate and parse a circuit file
 */
export function validateCircuitFile(content: string): ValidationResult {
  try {
    const parsed = JSON.parse(content);
    
    // Check required top-level fields
    if (!parsed.version) {
      return { valid: false, error: "Missing version field" };
    }
    
    if (parsed.type !== "electronic-simulation") {
      return { valid: false, error: "Invalid file type. Expected 'electronic-simulation'" };
    }
    
    if (!parsed.data) {
      return { valid: false, error: "Missing data field" };
    }
    
    const data = parsed.data;
    
    // Validate data structure
    if (!Array.isArray(data.placedComponents)) {
      return { valid: false, error: "Invalid placedComponents format" };
    }
    
    if (!Array.isArray(data.wires)) {
      return { valid: false, error: "Invalid wires format" };
    }
    
    // Validate each placed component has required fields
    for (const comp of data.placedComponents) {
      if (!comp.id || !comp.componentId || typeof comp.x !== "number" || typeof comp.y !== "number") {
        return { valid: false, error: "Invalid component data structure" };
      }
    }
    
    // Validate each wire has required fields
    for (const wire of data.wires) {
      if (!wire.id || typeof wire.startX !== "number" || typeof wire.startY !== "number" ||
          typeof wire.endX !== "number" || typeof wire.endY !== "number") {
        return { valid: false, error: "Invalid wire data structure" };
      }
    }
    
    // Ensure optional fields have defaults
    const circuitData: CircuitData = {
      placedComponents: data.placedComponents,
      wires: data.wires,
      resistorValues: data.resistorValues || {},
      controlStates: data.controlStates || {},
      mcuPinStates: data.mcuPinStates || {},
    };
    
    return { valid: true, data: circuitData };
    
  } catch (e) {
    return { valid: false, error: "Invalid JSON format" };
  }
}

/**
 * Read and validate a circuit file from File object
 */
export function loadCircuitFile(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    // Check file extension
    if (!file.name.endsWith(".egroots.json")) {
      resolve({ valid: false, error: "Invalid file type. Please select a .egroots.json file" });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        resolve({ valid: false, error: "Failed to read file content" });
        return;
      }
      
      resolve(validateCircuitFile(content));
    };
    
    reader.onerror = () => {
      resolve({ valid: false, error: "Failed to read file" });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Open file picker and load circuit
 */
export function openFilePicker(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".egroots.json";
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      resolve(file);
    };
    
    input.oncancel = () => {
      resolve(null);
    };
    
    input.click();
  });
}











