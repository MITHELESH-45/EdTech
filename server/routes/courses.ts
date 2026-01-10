/**
 * Course Tracking API Routes
 * 
 * Handles user-specific course enrollment, module completion, and progress tracking
 */

import type { Express, Request, Response } from "express";
import {
  getOrCreateUserCoursesInfo,
  updateUserCoursesInfo,
  recalculateProgress,
  isCourseCompleted,
  type UserCoursesInfo,
  type UserCourse,
  type CourseModule,
  type ActivityPoint,
} from "../utils/courses-db";

/**
 * Get userId from request headers (set by auth middleware or frontend)
 */
function getUserId(req: Request): string | null {
  // Try to get from header first (if set by middleware)
  const userIdFromHeader = req.headers["x-user-id"] as string;
  if (userIdFromHeader) return userIdFromHeader;
  
  // Try to get from body
  const userIdFromBody = req.body?.userId as string;
  if (userIdFromBody) return userIdFromBody;
  
  // Try to get from query
  const userIdFromQuery = req.query?.userId as string;
  if (userIdFromQuery) return userIdFromQuery;
  
  return null;
}

/**
 * Award activity points to user
 */
async function awardPoints(
  userId: string,
  type: "LOGIN" | "MODULE_COMPLETE" | "COURSE_COMPLETE",
  points: number,
  metadata?: { courseId?: string; moduleId?: string }
): Promise<void> {
  await updateUserCoursesInfo(userId, (info) => {
    const newPoint: ActivityPoint = {
      type,
      points,
      date: new Date(),
      courseId: metadata?.courseId,
      moduleId: metadata?.moduleId,
    };

    return {
      ...info,
      activity: {
        ...info.activity,
        totalPoints: info.activity.totalPoints + points,
        pointsHistory: [...info.activity.pointsHistory, newPoint],
      },
    };
  });
}

/**
 * Handle daily login activity
 * Awards points only once per day
 */
export async function handleDailyLogin(userId: string): Promise<{ pointsAwarded: number; streak: number }> {
  const info = await getOrCreateUserCoursesInfo(userId);
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Check if already logged in today
  if (info.activity.lastLoginDate === today) {
    return { pointsAwarded: 0, streak: info.activity.dailyLoginStreak };
  }
  
  // Calculate streak
  let newStreak = info.activity.dailyLoginStreak;
  if (info.activity.lastLoginDate) {
    const lastLogin = new Date(info.activity.lastLoginDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // If last login was yesterday, increment streak
    if (lastLogin.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]) {
      newStreak += 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }
  } else {
    // First login
    newStreak = 1;
  }
  
  // Award daily login points (5 points)
  const points = 5;
  await awardPoints(userId, "LOGIN", points);
  
  // Update last login date and streak
  await updateUserCoursesInfo(userId, {
    activity: {
      ...info.activity,
      dailyLoginStreak: newStreak,
      lastLoginDate: today,
    },
  });
  
  return { pointsAwarded: points, streak: newStreak };
}

/**
 * Enroll user in a course
 */
export async function enrollCourse(
  userId: string,
  courseId: string,
  courseName: string,
  moduleIds: string[],
  moduleNames: string[]
): Promise<UserCourse> {
  const info = await getOrCreateUserCoursesInfo(userId);
  
  // Check if course already exists
  const existingCourse = info.courses.find(c => c.courseId === courseId);
  if (existingCourse) {
    return existingCourse;
  }
  
  // Create modules from provided IDs and names
  const modules: CourseModule[] = moduleIds.map((moduleId, index) => ({
    moduleId,
    moduleName: moduleNames[index] || `Module ${index + 1}`,
    completed: false,
    completedAt: null,
  }));
  
  const newCourse: UserCourse = {
    courseId,
    courseName,
    modules,
    progressPercentage: 0,
    courseStatus: "IN_PROGRESS",
    startedAt: new Date(),
    completedAt: null,
    badgeEarned: false,
  };
  
  await updateUserCoursesInfo(userId, {
    courses: [...info.courses, newCourse],
  });
  
  return newCourse;
}

/**
 * Complete a module
 */
export async function completeModule(
  userId: string,
  courseId: string,
  moduleId: string
): Promise<{ course: UserCourse; courseCompleted: boolean }> {
  const info = await getOrCreateUserCoursesInfo(userId);
  
  const courseIndex = info.courses.findIndex(c => c.courseId === courseId);
  if (courseIndex === -1) {
    throw new Error("Course not found. Please enroll in the course first.");
  }
  
  const course = info.courses[courseIndex];
  const moduleIndex = course.modules.findIndex(m => m.moduleId === moduleId);
  
  if (moduleIndex === -1) {
    throw new Error("Module not found in course.");
  }
  
  const module = course.modules[moduleIndex];
  
  // If already completed, return current state
  if (module.completed) {
    return { course, courseCompleted: isCourseCompleted(course) };
  }
  
  // Mark module as completed
  const updatedModules = [...course.modules];
  updatedModules[moduleIndex] = {
    ...module,
    completed: true,
    completedAt: new Date(),
  };
  
  // Recalculate progress
  const updatedCourse: UserCourse = {
    ...course,
    modules: updatedModules,
    progressPercentage: recalculateProgress({ ...course, modules: updatedModules }),
  };
  
  // Check if course is completed
  const courseCompleted = isCourseCompleted(updatedCourse);
  
  if (courseCompleted) {
    updatedCourse.courseStatus = "COMPLETED";
    updatedCourse.completedAt = new Date();
    updatedCourse.badgeEarned = true;
  }
  
  // Update courses array
  const updatedCourses = [...info.courses];
  updatedCourses[courseIndex] = updatedCourse;
  
  await updateUserCoursesInfo(userId, {
    courses: updatedCourses,
  });
  
  // Award module completion points (10 points)
  await awardPoints(userId, "MODULE_COMPLETE", 10, { courseId, moduleId });
  
  // If course completed, award course completion points and update badges
  if (courseCompleted) {
    await awardPoints(userId, "COURSE_COMPLETE", 50, { courseId });
    
    // Update badges
    const updatedInfo = await getOrCreateUserCoursesInfo(userId);
    const completedCoursesCount = updatedCourses.filter(c => c.courseStatus === "COMPLETED").length;
    
    await updateUserCoursesInfo(userId, {
      badges: {
        totalBadges: completedCoursesCount,
        completedCourses: completedCoursesCount,
      },
    });
  }
  
  return { course: updatedCourse, courseCompleted };
}

/**
 * Register course tracking routes
 */
export function registerCourseRoutes(app: Express): void {
  // Get user's courses info
  app.get("/api/courses/info", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: "User ID required" });
      }
      
      const info = await getOrCreateUserCoursesInfo(userId);
      res.json({ success: true, data: info });
    } catch (error: any) {
      console.error("[Courses API] Get info error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch courses info" });
    }
  });

  // Handle daily login
  app.post("/api/courses/daily-login", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: "User ID required" });
      }
      
      const result = await handleDailyLogin(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("[Courses API] Daily login error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to process daily login" });
    }
  });

  // Enroll in a course
  app.post("/api/courses/enroll", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: "User ID required" });
      }
      
      const { courseId, courseName, moduleIds, moduleNames } = req.body;
      
      if (!courseId || !courseName) {
        return res.status(400).json({ success: false, error: "courseId and courseName are required" });
      }
      
      if (!Array.isArray(moduleIds) || !Array.isArray(moduleNames)) {
        return res.status(400).json({ success: false, error: "moduleIds and moduleNames must be arrays" });
      }
      
      const course = await enrollCourse(userId, courseId, courseName, moduleIds, moduleNames);
      res.json({ success: true, data: course });
    } catch (error: any) {
      console.error("[Courses API] Enroll error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to enroll in course" });
    }
  });

  // Complete a module
  app.post("/api/courses/complete-module", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: "User ID required" });
      }
      
      const { courseId, moduleId } = req.body;
      
      if (!courseId || !moduleId) {
        return res.status(400).json({ success: false, error: "courseId and moduleId are required" });
      }
      
      const result = await completeModule(userId, courseId, moduleId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("[Courses API] Complete module error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to complete module" });
    }
  });
}
