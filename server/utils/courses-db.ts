/**
 * MongoDB Utility for Courses Info Collection
 * 
 * Handles user-specific course tracking, progress, and activity points
 */

import { getDatabase } from "./mongodb";
import type { Collection, ObjectId } from "mongodb";

export interface CourseModule {
  moduleId: string;
  moduleName: string;
  completed: boolean;
  completedAt: Date | null;
}

export interface UserCourse {
  courseId: string;
  courseName: string;
  modules: CourseModule[];
  progressPercentage: number;
  courseStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startedAt: Date | null;
  completedAt: Date | null;
  badgeEarned: boolean;
}

export interface ActivityPoint {
  type: "LOGIN" | "MODULE_COMPLETE" | "COURSE_COMPLETE";
  points: number;
  date: Date;
  courseId?: string;
  moduleId?: string;
}

export interface UserCoursesInfo {
  userId: string;
  courses: UserCourse[];
  activity: {
    totalPoints: number;
    dailyLoginStreak: number;
    lastLoginDate: string; // YYYY-MM-DD format
    pointsHistory: ActivityPoint[];
  };
  badges: {
    totalBadges: number;
    completedCourses: number;
  };
  completedProblems?: string[]; // Format: "topicId-questionIndex"
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = "courses_info";

/**
 * Get the courses_info collection
 */
export async function getCoursesInfoCollection(): Promise<Collection<UserCoursesInfo>> {
  const database = await getDatabase();
  const collection = database.collection<UserCoursesInfo>(COLLECTION_NAME);
  
  // Ensure collection exists
  const collections = await database.listCollections({ name: COLLECTION_NAME }).toArray();
  if (collections.length === 0) {
    await database.createCollection(COLLECTION_NAME);
    // Create index on userId for faster queries
    await collection.createIndex({ userId: 1 });
    console.log(`[Courses DB] Created collection: ${COLLECTION_NAME}`);
  }
  
  return collection;
}

/**
 * Initialize user's courses info with default structure
 */
export async function initUserCoursesInfo(userId: string): Promise<UserCoursesInfo> {
  const collection = await getCoursesInfoCollection();
  
  const defaultInfo: UserCoursesInfo = {
    userId,
    courses: [],
    activity: {
      totalPoints: 0,
      dailyLoginStreak: 0,
      lastLoginDate: "",
      pointsHistory: [],
    },
    badges: {
      totalBadges: 0,
      completedCourses: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(defaultInfo);
  if (result.acknowledged) {
    console.log(`[Courses DB] Initialized courses info for user: ${userId}`);
    return defaultInfo;
  }
  
  throw new Error("Failed to initialize user courses info");
}

/**
 * Get user's courses info
 */
export async function getUserCoursesInfo(userId: string): Promise<UserCoursesInfo | null> {
  const collection = await getCoursesInfoCollection();
  const info = await collection.findOne({ userId });
  return info;
}

/**
 * Get or create user's courses info
 */
export async function getOrCreateUserCoursesInfo(userId: string): Promise<UserCoursesInfo> {
  let info = await getUserCoursesInfo(userId);
  
  if (!info) {
    info = await initUserCoursesInfo(userId);
  }
  
  return info;
}

/**
 * Update user's courses info
 */
export async function updateUserCoursesInfo(
  userId: string,
  update: Partial<UserCoursesInfo> | ((info: UserCoursesInfo) => UserCoursesInfo)
): Promise<UserCoursesInfo> {
  const collection = await getCoursesInfoCollection();
  
  let updatedInfo: UserCoursesInfo;
  
  if (typeof update === "function") {
    const currentInfo = await getOrCreateUserCoursesInfo(userId);
    updatedInfo = update(currentInfo);
  } else {
    const currentInfo = await getOrCreateUserCoursesInfo(userId);
    updatedInfo = { ...currentInfo, ...update };
  }
  
  updatedInfo.updatedAt = new Date();
  
  const result = await collection.updateOne(
    { userId },
    { $set: updatedInfo },
    { upsert: true }
  );
  
  if (result.acknowledged) {
    return updatedInfo;
  }
  
  throw new Error("Failed to update user courses info");
}

/**
 * Recalculate course progress percentage
 */
export function recalculateProgress(course: UserCourse): number {
  if (course.modules.length === 0) return 0;
  const completedModules = course.modules.filter(m => m.completed).length;
  return Math.round((completedModules / course.modules.length) * 100);
}

/**
 * Check if course is completed (all modules completed)
 */
export function isCourseCompleted(course: UserCourse): boolean {
  return course.modules.length > 0 && course.modules.every(m => m.completed);
}
