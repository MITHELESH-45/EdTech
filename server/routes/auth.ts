/**
 * Authentication Routes
 * 
 * Handles user login and signup using MongoDB
 */

import type { Express, Request, Response } from "express";
import { getLoginCollection } from "../utils/mongodb";
import { randomUUID } from "crypto";

// Simple password hashing (for production, use bcrypt)
function hashPassword(password: string): string {
  // Simple hash for now - in production use bcrypt
  // This is a placeholder - you should install and use bcryptjs
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
  // POST /api/auth/signup - User registration
  // ==========================================================================
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          error: "Email is required",
        });
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

      // Check if user already exists
      const existingUser = await loginCollection.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "An account with this email already exists. Please login instead.",
        });
      }

      // Create new user
      const userId = randomUUID();
      const hashedPassword = hashPassword(password);
      const joinedDate = new Date().toISOString();

      const newUser = {
        userId,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        joinedDate,
        createdAt: new Date(),
      };

      // Insert into login collection
      const result = await loginCollection.insertOne(newUser);
      
      if (!result.insertedId) {
        throw new Error("Failed to insert user into database");
      }

      console.log(`[AUTH] New user registered in "login" collection: ${email} (ID: ${result.insertedId})`);

      // Return user data (without password)
      res.status(201).json({
        success: true,
        user: {
          userId,
          email: newUser.email,
          name: newUser.name,
          joinedDate,
        },
      });
    } catch (error: any) {
      console.error("[AUTH] Signup error:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while creating your account. Please try again.",
      });
    }
  });

  // ==========================================================================
  // POST /api/auth/login - User login
  // ==========================================================================
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          error: "Email is required",
        });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({
          success: false,
          error: "Password is required",
        });
      }

      const loginCollection = await getLoginCollection();

      // Find user by email
      const user = await loginCollection.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "No account found with this email. Please sign up first.",
        });
      }

      // Verify password
      if (!comparePassword(password, user.password)) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password. Please try again.",
        });
      }

      console.log(`[AUTH] User logged in: ${email}`);

      // Return user data (without password)
      res.json({
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          joinedDate: user.joinedDate,
        },
      });
    } catch (error: any) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while logging in. Please try again.",
      });
    }
  });

  // ==========================================================================
  // GET /api/auth/me - Get current user (optional, for session validation)
  // ==========================================================================
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-user-id"] as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
      }

      const loginCollection = await getLoginCollection();
      const user = await loginCollection.findOne({ userId });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
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
    } catch (error: any) {
      console.error("[AUTH] Get user error:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while fetching user data",
      });
    }
  });
}

