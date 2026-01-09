import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import type { UserCareerData, CareerGoal } from "@shared/career-schema";
import { careerPathways } from "@shared/career-paths";

/**
 * Register career optimization routes
 */
export function registerCareerRoutes(app: Express): void {
  // Get user's career data
  app.get("/api/career", async (req: Request, res: Response) => {
    try {
      let userId = (req.session as any)?.userId;
      
      // Try to get from request header as fallback (for client-side storage)
      if (!userId) {
        userId = req.headers["x-user-id"] as string;
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const db = await getDb();
      const careerCollection = db.collection<UserCareerData>("userCareer");

      let careerData = await careerCollection.findOne({ userId });

      // If no career data exists, create default
      if (!careerData) {
        careerData = {
          userId,
          skills: [],
          certificates: [],
          projects: [],
          achievements: [],
          updatedAt: new Date(),
        };
        await careerCollection.insertOne(careerData);
      }

      res.json(careerData);
    } catch (error) {
      console.error("[CAREER] Error fetching career data:", error);
      res.status(500).json({ error: "Failed to fetch career data" });
    }
  });

  // Set career goal
  app.post("/api/career/goal", async (req: Request, res: Response) => {
    try {
      let userId = (req.session as any)?.userId;
      if (!userId) {
        userId = req.headers["x-user-id"] as string;
      }
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { path, targetDate } = req.body;

      const pathway = careerPathways.find((p) => p.id === path);
      if (!pathway) {
        return res.status(400).json({ error: "Invalid career path" });
      }

      const goal: CareerGoal = {
        path,
        targetRole: pathway.targetRole,
        selectedAt: new Date(),
        targetDate: targetDate ? new Date(targetDate) : undefined,
        progress: 0,
      };

      const db = await getDb();
      const careerCollection = db.collection<UserCareerData>("userCareer");

      await careerCollection.updateOne(
        { userId },
        {
          $set: {
            careerGoal: goal,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      res.json({ success: true, goal });
    } catch (error) {
      console.error("[CAREER] Error setting career goal:", error);
      res.status(500).json({ error: "Failed to set career goal" });
    }
  });

  // Get all career pathways
  app.get("/api/career/pathways", async (_req: Request, res: Response) => {
    try {
      res.json(careerPathways);
    } catch (error) {
      console.error("[CAREER] Error fetching pathways:", error);
      res.status(500).json({ error: "Failed to fetch career pathways" });
    }
  });

  // Update skill progress
  app.patch("/api/career/skills/:skillId", async (req: Request, res: Response) => {
    try {
      let userId = (req.session as any)?.userId;
      if (!userId) {
        userId = req.headers["x-user-id"] as string;
      }
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { skillId } = req.params;
      const { level, progress } = req.body;

      const db = await getDb();
      const careerCollection = db.collection<UserCareerData>("userCareer");

      await careerCollection.updateOne(
        { userId },
        {
          $set: {
            "skills.$[skill].level": level,
            "skills.$[skill].progress": progress,
            "skills.$[skill].lastUpdated": new Date(),
            updatedAt: new Date(),
          },
        },
        {
          arrayFilters: [{ "skill.id": skillId }],
          upsert: true,
        }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("[CAREER] Error updating skill:", error);
      res.status(500).json({ error: "Failed to update skill" });
    }
  });

  // Sync skills from courses
  app.post("/api/career/skills/sync", async (req: Request, res: Response) => {
    try {
      let userId = (req.session as any)?.userId;
      if (!userId) {
        userId = req.headers["x-user-id"] as string;
      }
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { skills } = req.body;

      const db = await getDb();
      const careerCollection = db.collection<UserCareerData>("userCareer");

      await careerCollection.updateOne(
        { userId },
        {
          $set: {
            skills,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      res.json({ success: true, skills });
    } catch (error) {
      console.error("[CAREER] Error syncing skills:", error);
      res.status(500).json({ error: "Failed to sync skills" });
    }
  });
}
