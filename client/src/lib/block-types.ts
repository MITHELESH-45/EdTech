import type { BlockSchema } from "./no-code-blocks";

// Represents a block that has been placed on the canvas
export interface PlacedBlock {
  id: string;
  blockId: string; // The ID from BlockSchema (e.g., "print", "for_loop")
  x: number;
  y: number;
  fieldValues: Record<string, any>; // Field values edited by user
  nextBlockId?: string; // ID of the next block in sequence (for control flow)
}

// Connection between blocks (for data flow, not just sequential)
export interface BlockConnection {
  id: string;
  fromBlockId: string;
  fromField?: string; // Optional field name (for outputs)
  toBlockId: string;
  toField?: string; // Optional field name (for inputs)
}

// Block position and dimensions for rendering
export interface BlockDimensions {
  width: number;
  height: number;
  connectorHeight: number; // Height of connection points
}

