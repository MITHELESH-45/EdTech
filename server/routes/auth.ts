/**
 * Authentication Routes
 * 
 * Handles user login and signup using MongoDB
 */

import type { Express, Request, Response } from "express";
import { getLoginCollection } from "../utils/mongodb";
import { handleDailyLogin } from "./courses";
import { randomUUID } from "crypto";

// Simple password hashing (for production, use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password).toString("base64");
}

function comparePassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

/**
 * Register authentication routes
 */
export function registerAuthRoutes(app: Express): void {
  // ==========================================================================
  // POST /api/auth/signup
  // ==========================================================================
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Name must be at least 2 characters",
        });
      }

      const loginCollection = await getLoginCollection();

      const existingUser = await loginCollection.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "An account with this email already exists.",
        });
      }

      const userId = randomUUID();
      const joinedDate = new Date().toISOString();

      const newUser = {
        userId,
        email: email.toLowerCase().trim(),
        password: hashPassword(password),
        name: name.trim(),
        joinedDate,
        createdAt: new Date(),
        courses: [],
        activityPoints: 0,
      };

      const result = await loginCollection.insertOne(newUser);

      if (!result.insertedId) {
        throw new Error("Failed to insert user");
      }

      console.log(`[AUTH] New user registered: ${email}`);

      res.status(201).json({
        success: true,
        user: {
          userId,
          email: newUser.email,
          name: newUser.name,
          joinedDate,
        },
      });
    } catch (error) {
      console.error("[AUTH] Signup error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create account",
      });
    }
  });

  // ==========================================================================
  // POST /api/auth/login
  // ==========================================================================
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ success: false, error: "Password is required" });
      }

      const loginCollection = await getLoginCollection();

      const user = await loginCollection.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "No account found with this email",
        });
      }

      if (!comparePassword(password, user.password)) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password",
        });
      }

      console.log(`[AUTH] User logged in: ${email}`);

      // Ensure new fields exist for old users
      if (user.courses === undefined || user.activityPoints === undefined) {
        await loginCollection.updateOne(
          { userId: user.userId },
          {
            $set: {
              courses: user.courses ?? [],
              activityPoints: user.activityPoints ?? 0,
            },
          }
        );

        user.courses = user.courses ?? [];
        user.activityPoints = user.activityPoints ?? 0;
      }   // ✅ FIXED MISSING BRACE

      // Daily login tracking
      try {
        await handleDailyLogin(user.userId);
      } catch (error) {
        console.error("[AUTH] Daily login tracking error:", error);
      }

      res.json({
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          joinedDate: user.joinedDate,
        },
      });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({
        success: false,
        error: "Login failed",
      });
    }
  });

  // ==========================================================================
  // GET /api/auth/me
  // ==========================================================================
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-user-id"] as string;

      if (!userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const loginCollection = await getLoginCollection();
      const user = await loginCollection.findOne({ userId });

      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      if (user.courses === undefined || user.activityPoints === undefined) {
        await loginCollection.updateOne(
          { userId: user.userId },
          {
            $set: {
              courses: user.courses ?? [],
              activityPoints: user.activityPoints ?? 0,
            },
          }
        );

        user.courses = user.courses ?? [];
        user.activityPoints = user.activityPoints ?? 0;
      }

      res.json({
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          joinedDate: user.joinedDate,
        },
      });
    } catch (error) {
      console.error("[AUTH] Get user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user",
      });
    }
  });
}
