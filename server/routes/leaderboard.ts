/**
 * Leaderboard API Routes
 * 
 * Returns ranked list of students based on activity points
 */

import type { Express, Request, Response } from "express";
import { getLoginCollection } from "../utils/mongodb";
import { getCoursesInfoCollection } from "../utils/courses-db";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  activityPoints: number;
  completedCourses: number;
  dailyStreak: number;
}

/**
 * Register leaderboard routes
 */
export function registerLeaderboardRoutes(app: Express): void {
  // GET /api/leaderboard - Get ranked list of all students
  app.get("/api/leaderboard", async (_req: Request, res: Response) => {
    try {
      const loginCollection = await getLoginCollection();
      const coursesInfoCollection = await getCoursesInfoCollection();

      // Get all users
      const users = await loginCollection.find({}).toArray();
      
      // Get all courses info (contains activity points)
      const allCoursesInfo = await coursesInfoCollection.find({}).toArray();
      
      // Create a map of userId -> coursesInfo for quick lookup
      const coursesInfoMap = new Map(
        allCoursesInfo.map((info) => [info.userId, info])
      );

      // Build leaderboard entries
      const leaderboard: LeaderboardEntry[] = users.map((user) => {
        const coursesInfo = coursesInfoMap.get(user.userId);
        
        const activityPoints = coursesInfo?.activity?.totalPoints || 0;
        const completedCourses = coursesInfo?.badges?.completedCourses || 0;
        const dailyStreak = coursesInfo?.activity?.dailyLoginStreak || 0;

        return {
          rank: 0, // Will be set after sorting
          userId: user.userId,
          name: user.name || "Anonymous",
          email: user.email || "",
          activityPoints,
          completedCourses,
          dailyStreak,
        };
      });

      // Sort by activity points (descending), then by completed courses
      leaderboard.sort((a, b) => {
        if (b.activityPoints !== a.activityPoints) {
          return b.activityPoints - a.activityPoints;
        }
        return b.completedCourses - a.completedCourses;
      });

      // Assign ranks (handle ties)
      let currentRank = 1;
      leaderboard.forEach((entry, index) => {
        if (index > 0) {
          const prev = leaderboard[index - 1];
          // If points or courses differ, increment rank
          if (
            prev.activityPoints !== entry.activityPoints ||
            prev.completedCourses !== entry.completedCourses
          ) {
            currentRank = index + 1;
          }
        }
        entry.rank = currentRank;
      });

      res.json({
        success: true,
        data: leaderboard,
        total: leaderboard.length,
      });
    } catch (error: any) {
      console.error("[LEADERBOARD] Error fetching leaderboard:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch leaderboard",
        details: error.message,
      });
    }
  });

  // GET /api/leaderboard/user-rank - Get current user's rank
  app.get("/api/leaderboard/user-rank", async (req: Request, res: Response) => {
    try {
      let userId = (req.session as any)?.userId;
      if (!userId) {
        userId = req.headers["x-user-id"] as string;
      }
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const loginCollection = await getLoginCollection();
      const coursesInfoCollection = await getCoursesInfoCollection();

      // Get all users
      const users = await loginCollection.find({}).toArray();
      const allCoursesInfo = await coursesInfoCollection.find({}).toArray();
      const coursesInfoMap = new Map(
        allCoursesInfo.map((info) => [info.userId, info])
      );

      // Build leaderboard
      const leaderboard: LeaderboardEntry[] = users.map((user) => {
        const coursesInfo = coursesInfoMap.get(user.userId);
        
        const activityPoints = coursesInfo?.activity?.totalPoints || 0;
        const completedCourses = coursesInfo?.badges?.completedCourses || 0;
        const dailyStreak = coursesInfo?.activity?.dailyLoginStreak || 0;

        return {
          rank: 0,
          userId: user.userId,
          name: user.name || "Anonymous",
          email: user.email || "",
          activityPoints,
          completedCourses,
          dailyStreak,
        };
      });

      // Sort and rank
      leaderboard.sort((a, b) => {
        if (b.activityPoints !== a.activityPoints) {
          return b.activityPoints - a.activityPoints;
        }
        return b.completedCourses - a.completedCourses;
      });

      let currentRank = 1;
      leaderboard.forEach((entry, index) => {
        if (index > 0) {
          const prev = leaderboard[index - 1];
          if (
            prev.activityPoints !== entry.activityPoints ||
            prev.completedCourses !== entry.completedCourses
          ) {
            currentRank = index + 1;
          }
        }
        entry.rank = currentRank;
      });

      // Find user's entry
      const userEntry = leaderboard.find((entry) => entry.userId === userId);

      if (!userEntry) {
        return res.status(404).json({
          success: false,
          error: "User not found in leaderboard",
        });
      }

      res.json({
        success: true,
        data: {
          ...userEntry,
          totalUsers: leaderboard.length,
        },
      });
    } catch (error: any) {
      console.error("[LEADERBOARD] Error fetching user rank:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user rank",
        details: error.message,
      });
    }
  });
}
