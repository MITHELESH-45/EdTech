import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Course types
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  progress: number;
  lessons: Lesson[];
  isLocked: boolean;
  image?: string; // Optional background image URL
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  diagramPlaceholder?: string;
}

// Electronic Component types
export type ComponentCategory = "base" | "power" | "boards" | "structure";

export interface ElectronicComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  icon: string;
  description: string;
}

// Circuit Canvas types
export interface PlacedComponent {
  id: string;
  componentId: string;
  x: number;
  y: number;
  rotation: number;
}

export interface Wire {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
}

export interface CircuitState {
  placedComponents: PlacedComponent[];
  wires: Wire[];
  isRunning: boolean;
  ledState: boolean;
  errorMessage: string | null;
}

// Simulation status
export type SimulationStatus = "idle" | "running" | "stopped" | "error";
