/**
 * Arduino Code Generator
 * 
 * CRITICAL RULES:
 * 1. This generator produces ONLY Arduino C++ code
 * 2. Python code is NEVER used here - it's only for display
 * 3. Generated code MUST compile without errors
 * 4. Output follows standard Arduino sketch structure
 */

import {
  type PlacedArduinoBlock,
  type ArduinoBlockDefinition,
  getArduinoBlockById,
  fillTemplate,
} from "./arduino-blocks";

export interface GeneratedCode {
  // Python code for display panel (NOT for execution)
  pythonCode: string;
  // Arduino C++ code for upload (ONLY this goes to hardware)
  arduinoCode: string;
  // Any errors during generation
  errors: string[];
}

/**
 * Generates both Python (display) and Arduino C++ (upload) code from blocks
 */
export function generateCode(blocks: PlacedArduinoBlock[]): GeneratedCode {
  const errors: string[] = [];
  
  // Sort blocks by execution order (following nextBlockId chain)
  const orderedBlocks = getOrderedBlocks(blocks);
  
  // Separate blocks by section
  const globalBlocks: PlacedArduinoBlock[] = [];
  const setupBlocks: PlacedArduinoBlock[] = [];
  const loopBlocks: PlacedArduinoBlock[] = [];
  
  // Track which setup code has been added to avoid duplicates
  const addedSetupCode = new Set<string>();
  const addedGlobalCode = new Set<string>();
  
  for (const block of orderedBlocks) {
    const definition = getArduinoBlockById(block.blockId);
    if (!definition) {
      errors.push(`Unknown block type: ${block.blockId}`);
      continue;
    }
    
    switch (definition.section) {
      case "global":
        globalBlocks.push(block);
        break;
      case "setup":
        setupBlocks.push(block);
        break;
      case "loop":
        loopBlocks.push(block);
        break;
    }
  }
  
  // Generate Python code (display only)
  const pythonCode = generatePythonCode(orderedBlocks);
  
  // Generate Arduino C++ code (for upload)
  const arduinoCode = generateArduinoCode(
    orderedBlocks,
    setupBlocks,
    loopBlocks,
    addedSetupCode,
    addedGlobalCode
  );
  
  return {
    pythonCode,
    arduinoCode,
    errors,
  };
}

/**
 * Order blocks by following the nextBlockId chain
 */
function getOrderedBlocks(blocks: PlacedArduinoBlock[]): PlacedArduinoBlock[] {
  if (blocks.length === 0) return [];
  
  // Find blocks that are not referenced as "next" by any other block
  const referencedIds = new Set(blocks.map(b => b.nextBlockId).filter(Boolean));
  const startBlocks = blocks.filter(b => !referencedIds.has(b.id));
  
  // If no start block found, use the first block
  if (startBlocks.length === 0 && blocks.length > 0) {
    startBlocks.push(blocks[0]);
  }
  
  const ordered: PlacedArduinoBlock[] = [];
  const visited = new Set<string>();
  
  function traverse(block: PlacedArduinoBlock) {
    if (visited.has(block.id)) return;
    visited.add(block.id);
    ordered.push(block);
    
    if (block.nextBlockId) {
      const nextBlock = blocks.find(b => b.id === block.nextBlockId);
      if (nextBlock) {
        traverse(nextBlock);
      }
    }
  }
  
  // Sort start blocks by Y position (top to bottom)
  startBlocks.sort((a, b) => a.y - b.y);
  
  for (const startBlock of startBlocks) {
    traverse(startBlock);
  }
  
  // Add any remaining unvisited blocks
  for (const block of blocks) {
    if (!visited.has(block.id)) {
      ordered.push(block);
    }
  }
  
  return ordered;
}

/**
 * Generate Python code for display (NOT for execution)
 */
function generatePythonCode(blocks: PlacedArduinoBlock[]): string {
  if (blocks.length === 0) {
    return "# No blocks added yet\n# Drag blocks from the sidebar to start";
  }
  
  const lines: string[] = [
    "# Python Preview (Display Only)",
    "# This code is NOT executed - it's just for readability",
    "# Arduino C++ code is what actually runs on hardware",
    "",
  ];
  
  for (const block of blocks) {
    const definition = getArduinoBlockById(block.blockId);
    if (!definition) continue;
    
    const code = fillTemplate(definition.pythonTemplate, block.fieldValues);
    lines.push(code);
  }
  
  return lines.join("\n");
}

/**
 * Generate Arduino C++ code for upload
 * This is the ONLY code that goes to the hardware
 */
function generateArduinoCode(
  allBlocks: PlacedArduinoBlock[],
  setupBlocks: PlacedArduinoBlock[],
  loopBlocks: PlacedArduinoBlock[],
  addedSetupCode: Set<string>,
  addedGlobalCode: Set<string>
): string {
  const globalLines: string[] = [];
  const setupLines: string[] = [];
  const loopLines: string[] = [];
  
  // Collect global declarations (includes, global variables)
  for (const block of allBlocks) {
    const definition = getArduinoBlockById(block.blockId);
    if (!definition) continue;
    
    if (definition.arduinoGlobalTemplate) {
      const globalCode = fillTemplate(definition.arduinoGlobalTemplate, block.fieldValues);
      if (!addedGlobalCode.has(globalCode)) {
        addedGlobalCode.add(globalCode);
        globalLines.push(globalCode);
      }
    }
  }
  
  // Collect setup code from loop blocks that require initialization
  for (const block of loopBlocks) {
    const definition = getArduinoBlockById(block.blockId);
    if (!definition) continue;
    
    if (definition.arduinoSetupTemplate) {
      const setupCode = fillTemplate(definition.arduinoSetupTemplate, block.fieldValues);
      // Split by newline in case there are multiple setup lines
      for (const line of setupCode.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !addedSetupCode.has(trimmed)) {
          addedSetupCode.add(trimmed);
          setupLines.push("  " + trimmed);
        }
      }
    }
  }
  
  // Add explicit setup blocks
  for (const block of setupBlocks) {
    const definition = getArduinoBlockById(block.blockId);
    if (!definition) continue;
    
    const code = fillTemplate(definition.arduinoTemplate, block.fieldValues);
    for (const line of code.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !addedSetupCode.has(trimmed)) {
        addedSetupCode.add(trimmed);
        setupLines.push("  " + trimmed);
      }
    }
  }
  
  // Add loop code
  for (const block of loopBlocks) {
    const definition = getArduinoBlockById(block.blockId);
    if (!definition) continue;
    
    const code = fillTemplate(definition.arduinoTemplate, block.fieldValues);
    for (const line of code.split("\n")) {
      loopLines.push("  " + line.trim());
    }
  }
  
  // Build the final Arduino sketch
  const lines: string[] = [];
  
  // Add header comment
  lines.push("/*");
  lines.push(" * Arduino Sketch - Generated by E-GROOTS");
  lines.push(" * Board: Arduino Nano");
  lines.push(" * Generated: " + new Date().toISOString());
  lines.push(" */");
  lines.push("");
  
  // Add global code (includes, declarations)
  if (globalLines.length > 0) {
    for (const line of globalLines) {
      lines.push(line);
    }
    lines.push("");
  }
  
  // Add setup function
  lines.push("void setup() {");
  if (setupLines.length === 0) {
    lines.push("  // No setup required");
  } else {
    for (const line of setupLines) {
      lines.push(line);
    }
  }
  lines.push("}");
  lines.push("");
  
  // Add loop function
  lines.push("void loop() {");
  if (loopLines.length === 0) {
    lines.push("  // No loop code");
  } else {
    for (const line of loopLines) {
      lines.push(line);
    }
  }
  lines.push("}");
  
  return lines.join("\n");
}

/**
 * Generate minimal LED blink code for testing
 * This is the REFERENCE implementation that MUST work
 */
export function generateLedBlinkCode(pin: number = 13, delayMs: number = 1000): string {
  return `/*
 * LED Blink Test - Arduino Nano
 * Pin: ${pin}
 * Delay: ${delayMs}ms
 */

void setup() {
  pinMode(${pin}, OUTPUT);
}

void loop() {
  digitalWrite(${pin}, HIGH);
  delay(${delayMs});
  digitalWrite(${pin}, LOW);
  delay(${delayMs});
}`;
}

/**
 * Generate LED ON (continuous) code
 * This is the SIMPLEST test case
 */
export function generateLedOnCode(pin: number = 13): string {
  return `/*
 * LED ON Test - Arduino Nano
 * Pin: ${pin}
 * LED will stay ON continuously
 */

void setup() {
  pinMode(${pin}, OUTPUT);
}

void loop() {
  digitalWrite(${pin}, HIGH);
}`;
}

/**
 * Validate Arduino code syntax (basic checks)
 */
export function validateArduinoCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for required functions
  if (!code.includes("void setup()")) {
    errors.push("Missing setup() function");
  }
  if (!code.includes("void loop()")) {
    errors.push("Missing loop() function");
  }
  
  // Check for balanced braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }
  
  // Check for common errors
  if (code.includes("import ") || code.includes("from ")) {
    errors.push("Python import detected - this should be Arduino C++ code");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}









