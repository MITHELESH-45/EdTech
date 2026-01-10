/**
 * Course Tracking Context
 * 
 * Provides user-specific course progress tracking, module completion, and activity points
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    lastLoginDate: string;
    pointsHistory: ActivityPoint[];
  };
  badges: {
    totalBadges: number;
    completedCourses: number;
  };
}

interface CourseTrackingContextType {
  coursesInfo: UserCoursesInfo | null;
  isLoading: boolean;
  enrollCourse: (courseId: string, courseName: string, moduleIds: string[], moduleNames: string[]) => Promise<void>;
  completeModule: (courseId: string, moduleId: string) => Promise<void>;
  getCourseProgress: (courseId: string) => UserCourse | null;
  isModuleCompleted: (courseId: string, moduleId: string) => boolean;
  refreshCoursesInfo: () => Promise<void>;
}

const CourseTrackingContext = createContext<CourseTrackingContextType | null>(null);

export function CourseTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's courses info
  const { data: coursesInfo, isLoading } = useQuery<UserCoursesInfo>({
    queryKey: ["/api/courses/info", user?.userId],
    queryFn: async () => {
      const response = await fetch("/api/courses/info", {
        headers: {
          "x-user-id": user?.userId || "",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch courses info");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!user?.userId,
    retry: 1,
  });

  // Enroll in a course
  const enrollMutation = useMutation({
    mutationFn: async ({
      courseId,
      courseName,
      moduleIds,
      moduleNames,
    }: {
      courseId: string;
      courseName: string;
      moduleIds: string[];
      moduleNames: string[];
    }) => {
      const response = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.userId || "",
        },
        body: JSON.stringify({
          userId: user?.userId,
          courseId,
          courseName,
          moduleIds,
          moduleNames,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll in course");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/info", user?.userId] });
    },
  });

  // Complete a module
  const completeModuleMutation = useMutation({
    mutationFn: async ({ courseId, moduleId }: { courseId: string; moduleId: string }) => {
      const response = await fetch("/api/courses/complete-module", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.userId || "",
        },
        body: JSON.stringify({
          userId: user?.userId,
          courseId,
          moduleId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete module");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/info", user?.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.userId] });
    },
  });

  const enrollCourse = async (
    courseId: string,
    courseName: string,
    moduleIds: string[],
    moduleNames: string[]
  ) => {
    if (!user?.userId) throw new Error("User not authenticated");
    await enrollMutation.mutateAsync({ courseId, courseName, moduleIds, moduleNames });
  };

  const completeModule = async (courseId: string, moduleId: string) => {
    if (!user?.userId) throw new Error("User not authenticated");
    await completeModuleMutation.mutateAsync({ courseId, moduleId });
  };

  const getCourseProgress = (courseId: string): UserCourse | null => {
    if (!coursesInfo) return null;
    return coursesInfo.courses.find((c) => c.courseId === courseId) || null;
  };

  const isModuleCompleted = (courseId: string, moduleId: string): boolean => {
    const course = getCourseProgress(courseId);
    if (!course) return false;
    const module = course.modules.find((m) => m.moduleId === moduleId);
    return module?.completed || false;
  };

  const refreshCoursesInfo = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/courses/info", user?.userId] });
  };

  return (
    <CourseTrackingContext.Provider
      value={{
        coursesInfo: coursesInfo || null,
        isLoading,
        enrollCourse,
        completeModule,
        getCourseProgress,
        isModuleCompleted,
        refreshCoursesInfo,
      }}
    >
      {children}
    </CourseTrackingContext.Provider>
  );
}

export function useCourseTracking() {
  const context = useContext(CourseTrackingContext);
  if (!context) {
    throw new Error("useCourseTracking must be used within CourseTrackingProvider");
  }
  return context;
}
