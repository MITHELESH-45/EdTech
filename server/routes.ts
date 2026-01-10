import type { Express } from "express";
import { storage } from "./storage";
import { registerArduinoRoutes } from "./arduino-routes";
import { registerGrootRoutes } from "./groot-routes";
import { registerCodingRoutes } from "./coding-routes";
import { registerAuthRoutes } from "./routes/auth";
import { registerCourseRoutes } from "./routes/courses";
import careerRoutes from "./routes/career";

export async function registerRoutes(
  app: Express
): Promise<void> {
  // Career API
  app.use("/api/career", careerRoutes);

  // Register Authentication routes
  registerAuthRoutes(app);
  // Register Course tracking routes
  registerCourseRoutes(app);
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

  // Circuits API - save/load/list circuits stored in MongoDB
  app.post("/api/circuits", async (req, res) => {
    try {
      const { name, circuitFile } = req.body as { name?: string; circuitFile?: any };
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Missing circuit name" });
      }
      if (!circuitFile) {
        return res.status(400).json({ error: "Missing circuit file data" });
      }

      const { getDatabase } = await import("./utils/mongodb");
      const db = await getDatabase();
      const collection = db.collection("circuits");

      const doc = {
        name,
        circuitFile,
        createdAt: new Date(),
      } as any;

      const result = await collection.insertOne(doc);
      res.json({ id: result.insertedId, ...doc });
    } catch (error: any) {
      console.error("/api/circuits POST error:", error);
      res.status(500).json({ error: "Failed to save circuit" });
    }
  });

  app.get("/api/circuits", async (_req, res) => {
    try {
      const { getDatabase } = await import("./utils/mongodb");
      const db = await getDatabase();
      const collection = db.collection("circuits");
      const docs = await collection.find().sort({ createdAt: -1 }).limit(200).toArray();
      res.json(docs.map(d => ({ id: d._id, name: d.name, createdAt: d.createdAt })));
    } catch (error: any) {
      console.error("/api/circuits GET error:", error);
      res.status(500).json({ error: "Failed to list circuits" });
    }
  });

  app.get("/api/circuits/:id", async (req, res) => {
    try {
      const { getDatabase } = await import("./utils/mongodb");
      const db = await getDatabase();
      const collection = db.collection("circuits");
      const { ObjectId } = await import("mongodb");
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).json({ error: "Circuit not found" });
      res.json({ id: doc._id, name: doc.name, createdAt: doc.createdAt, circuitFile: doc.circuitFile });
    } catch (error: any) {
      console.error("/api/circuits/:id GET error:", error);
      res.status(500).json({ error: "Failed to fetch circuit" });
    }
  });
}