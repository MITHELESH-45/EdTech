// Career optimization types and schemas

export type CareerPath = 
  | "embedded-systems-engineer"
  | "iot-developer"
  | "hardware-engineer"
  | "robotics-engineer"
  | "electronics-designer";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Skill {
  id: string;
  name: string;
  category: "electronics" | "iot" | "programming" | "circuit-design" | "arduino" | "embedded-systems";
  level: SkillLevel;
  progress: number; // 0-100
  lastUpdated: Date;
}

export interface CareerGoal {
  path: CareerPath;
  targetRole: string;
  selectedAt: Date;
  targetDate?: Date;
  progress: number; // 0-100
}

export interface CareerPathway {
  id: CareerPath;
  name: string;
  description: string;
  targetRole: string;
  requiredSkills: string[]; // Skill IDs
  recommendedCourses: string[]; // Course IDs
  estimatedDuration: string; // e.g., "3-6 months"
  difficulty: "beginner" | "intermediate" | "advanced";
  averageSalary?: {
    entry: number;
    mid: number;
    senior: number;
  };
  milestones: PathwayMilestone[];
}

export interface PathwayMilestone {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  courses: string[];
  completed: boolean;
  completedAt?: Date;
}

export interface UserCareerData {
  userId: string;
  careerGoal?: CareerGoal;
  skills: Skill[];
  certificates: Certificate[];
  projects: Project[];
  achievements: Achievement[];
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issuedAt: Date;
  skillLevel: SkillLevel;
  verificationCode: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: "circuit" | "iot" | "code" | "embedded";
  skills: string[];
  completedAt: Date;
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: "learning" | "projects" | "skills" | "community";
}
