import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerArduinoRoutes } from "./arduino-routes";
import { registerGrootRoutes } from "./groot-routes";
import { registerCodingRoutes } from "./coding-routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Arduino upload routes
  registerArduinoRoutes(app);
  // Register GROOT chat routes
  registerGrootRoutes(app);
  // Courses API
  app.get("/api/courses", async (_req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.patch("/api/courses/:id/progress", async (req, res) => {
    try {
      const { progress } = req.body;
      if (typeof progress !== "number" || progress < 0 || progress > 100) {
        return res.status(400).json({ error: "Invalid progress value" });
      }
      
      const course = await storage.updateCourseProgress(req.params.id, progress);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course progress" });
    }
  });

  // Components API
  app.get("/api/components", async (_req, res) => {
    try {
      const components = await storage.getComponents();
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch components" });
    }
  });

  app.get("/api/components/:id", async (req, res) => {
    try {
      const component = await storage.getComponent(req.params.id);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch component" });
    }
  });

  // Coding playground API (code runner)
  registerCodingRoutes(app);

  return httpServer;
}