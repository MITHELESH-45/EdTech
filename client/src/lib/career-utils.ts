// Career utility functions

import type { Skill, CareerGoal, CareerPathway, UserCareerData, SkillLevel } from "@shared/career-schema";
import { careerPathways } from "@shared/career-paths";
import type { Course } from "@shared/schema";

/**
 * Calculate skill level based on course completions and progress
 */
export function calculateSkillLevel(courses: Course[], skillId: string): SkillLevel {
  // Map course IDs to skills
  const skillCourseMap: Record<string, string[]> = {
    "electronics-basics": ["basics-of-electronics"],
    "circuit-design": ["circuit-design-basics", "digital-electronics-fundamentals"],
    "arduino": ["arduino-basics", "block-based-programming"],
    "iot": ["iot-basics"],
    "sensors": ["sensors-actuators"],
    "programming": ["arduino-basics", "block-based-programming"],
  };

  const relatedCourses = skillCourseMap[skillId] || [];
  const completedCourses = courses.filter(
    (c) => relatedCourses.some((rc) => c.id.includes(rc.toLowerCase().replace(/\s+/g, "-"))) && c.progress === 100
  );
  const inProgressCourses = courses.filter(
    (c) => relatedCourses.some((rc) => c.id.includes(rc.toLowerCase().replace(/\s+/g, "-"))) && c.progress > 0 && c.progress < 100
  );

  if (completedCourses.length >= 2) return "advanced";
  if (completedCourses.length === 1 || (inProgressCourses.length > 0 && completedCourses.length > 0)) return "intermediate";
  if (inProgressCourses.length > 0) return "beginner";
  return "beginner";
}

/**
 * Calculate skill progress percentage
 */
export function calculateSkillProgress(courses: Course[], skillId: string): number {
  const skillCourseMap: Record<string, string[]> = {
    "electronics-basics": ["basics-of-electronics"],
    "circuit-design": ["circuit-design-basics", "digital-electronics-fundamentals"],
    "arduino": ["arduino-basics", "block-based-programming"],
    "iot": ["iot-basics"],
    "sensors": ["sensors-actuators"],
  };

  const relatedCourses = skillCourseMap[skillId] || [];
  const relevantCourses = courses.filter((c) =>
    relatedCourses.some((rc) => c.id.includes(rc.toLowerCase().replace(/\s+/g, "-")))
  );

  if (relevantCourses.length === 0) return 0;

  const totalProgress = relevantCourses.reduce((sum, course) => sum + course.progress, 0);
  return Math.round(totalProgress / relevantCourses.length);
}

/**
 * Get career pathway by ID
 */
export function getCareerPathway(pathId: string): CareerPathway | undefined {
  return careerPathways.find((path) => path.id === pathId);
}

/**
 * Calculate career goal progress
 */
export function calculateCareerProgress(
  goal: CareerGoal | undefined,
  skills: Skill[],
  courses: Course[]
): number {
  if (!goal) return 0;

  const pathway = getCareerPathway(goal.path);
  if (!pathway) return 0;

  // Calculate progress based on milestone completion
  const completedMilestones = pathway.milestones.filter((m) => m.completed).length;
  const totalMilestones = pathway.milestones.length;

  if (totalMilestones === 0) return 0;

  return Math.round((completedMilestones / totalMilestones) * 100);
}

/**
 * Get recommended courses for career path
 */
export function getRecommendedCourses(pathId: string, allCourses: Course[]): Course[] {
  const pathway = getCareerPathway(pathId);
  if (!pathway) return [];

  return allCourses.filter((course) =>
    pathway.recommendedCourses.some((rc) => course.id.includes(rc.toLowerCase().replace(/\s+/g, "-")))
  );
}

/**
 * Generate skills from user's course progress
 */
export function generateSkillsFromCourses(courses: Course[]): Skill[] {
  const skillDefinitions = [
    { id: "electronics-basics", name: "Electronics Basics", category: "electronics" as const },
    { id: "circuit-design", name: "Circuit Design", category: "circuit-design" as const },
    { id: "arduino", name: "Arduino Programming", category: "arduino" as const },
    { id: "iot", name: "IoT Development", category: "iot" as const },
    { id: "sensors", name: "Sensors & Actuators", category: "electronics" as const },
    { id: "programming", name: "Programming", category: "programming" as const },
  ];

  return skillDefinitions.map((skillDef) => {
    const level = calculateSkillLevel(courses, skillDef.id);
    const progress = calculateSkillProgress(courses, skillDef.id);

    return {
      ...skillDef,
      level,
      progress,
      lastUpdated: new Date(),
    };
  });
}

/**
 * Calculate overall career readiness score
 */
export function calculateCareerReadinessScore(userData: Partial<UserCareerData>, courses: Course[]): number {
  let score = 0;
  let maxScore = 0;

  // Skills component (40%)
  maxScore += 40;
  if (userData.skills && userData.skills.length > 0) {
    const avgSkillLevel = userData.skills.reduce((sum, skill) => {
      const levelScores = { beginner: 10, intermediate: 20, advanced: 30, expert: 40 };
      return sum + levelScores[skill.level];
    }, 0) / userData.skills.length;
    score += avgSkillLevel;
  }

  // Course completion (30%)
  maxScore += 30;
  const completedCourses = courses.filter((c) => c.progress === 100).length;
  const completionRate = courses.length > 0 ? (completedCourses / courses.length) * 100 : 0;
  score += (completionRate / 100) * 30;

  // Projects (20%)
  maxScore += 20;
  if (userData.projects && userData.projects.length > 0) {
    score += Math.min(userData.projects.length * 5, 20);
  }

  // Certificates (10%)
  maxScore += 10;
  if (userData.certificates && userData.certificates.length > 0) {
    score += Math.min(userData.certificates.length * 2.5, 10);
  }

  return Math.round((score / maxScore) * 100);
}
