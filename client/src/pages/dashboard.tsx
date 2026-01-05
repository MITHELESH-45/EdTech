import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/dashboard/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  Zap, 
  Target, 
  AlertCircle, 
  Search,
  TrendingUp,
  Cpu,
  Wifi,
  Code,
  BarChart3,
  Sparkles,
  ArrowRight,
  PlayCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Course } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-4">
        <Skeleton className="w-10 h-10 rounded-md" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  delay = 0 
}: { 
  icon: any; 
  value: number | string; 
  label: string; 
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
              <div className="text-sm text-muted-foreground font-medium">{label}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Additional courses related to the three modules
const additionalCourses: Course[] = [
  {
    id: "circuit-design-basics",
    title: "Circuit Design Basics",
    description: "Master the fundamentals of circuit design and analysis using our Electronic Simulation tool.",
    difficulty: "beginner",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "advanced-electronics",
    title: "Advanced Electronics",
    description: "Dive deep into complex electronic circuits and systems with hands-on simulation.",
    difficulty: "advanced",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "iot-fundamentals",
    title: "IoT Fundamentals",
    description: "Learn Internet of Things concepts and build connected devices using our IoT Simulation platform.",
    difficulty: "intermediate",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "smart-home-systems",
    title: "Smart Home Systems",
    description: "Design and simulate smart home automation systems with sensors and actuators.",
    difficulty: "intermediate",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "block-based-programming",
    title: "Block-Based Programming",
    description: "Learn visual programming with our No-Code Editor. Build Arduino projects without writing code.",
    difficulty: "beginner",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "arduino-advanced",
    title: "Arduino Advanced Projects",
    description: "Create complex Arduino projects using the No-Code Editor with advanced blocks and logic.",
    difficulty: "advanced",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "sensors-actuators",
    title: "Sensors & Actuators",
    description: "Understand how sensors and actuators work in electronic and IoT systems.",
    difficulty: "intermediate",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
  {
    id: "embedded-systems",
    title: "Embedded Systems",
    description: "Learn embedded systems design combining electronics, IoT, and programming concepts.",
    difficulty: "advanced",
    progress: 0,
    lessons: [],
    isLocked: false,
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Combine original courses with additional courses and enable all
  const allCourses = useMemo(() => {
    const original = (courses || []).map(c => ({ ...c, isLocked: false }));
    return [...original, ...additionalCourses];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return allCourses;
    const query = searchQuery.toLowerCase();
    return allCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.difficulty.toLowerCase().includes(query)
    );
  }, [allCourses, searchQuery]);

  const activeCourses = filteredCourses.filter((c) => !c.isLocked);
  const inProgressCourses = activeCourses.filter((c) => c.progress > 0);
  const completedCourses = activeCourses.filter((c) => c.progress === 100);
  const coursesByDifficulty = useMemo(() => {
    const beginner = activeCourses.filter((c) => c.difficulty === "beginner").length;
    const intermediate = activeCourses.filter((c) => c.difficulty === "intermediate").length;
    const advanced = activeCourses.filter((c) => c.difficulty === "advanced").length;
    return [
      { name: "Beginner", value: beginner, color: "#10b981" },
      { name: "Intermediate", value: intermediate, color: "#3b82f6" },
      { name: "Advanced", value: advanced, color: "#f59e0b" },
    ];
  }, [activeCourses]);

  const displayName = user?.name?.split(" ")[0] || "Learner";

  return (
    <main className="flex-1 overflow-auto">
        {/* Hero Section with Search */}
        <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-background to-chart-2/10 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-1/5 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                Welcome back, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Learn Electronics. Simulate Visually. Build Confidently.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl"
            >
              <DotLottieReact
                src="https://lottie.host/4359bfa6-6ec9-4e82-a1af-0af127dcdafb/f2Tn5ZA4dp.lottie"
                loop
                autoplay
                style={{
                  width: "350px",
                  height: "350px",
                  position: "absolute",
                  top: "30px",
                  left: "1020px",
                  // left: "100px",
                  zIndex: 1000,
                }}
              />

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses by name, description, or difficulty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary shadow-lg"
                />
              </div>
            </motion.div>
            


            {/* Quick Access Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link href="/electronic-simulation">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Electronic Simulation</div>
                    <div className="text-xs text-muted-foreground">Build circuits visually</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </motion.div>
              </Link>

              <Link href="/iot-simulation">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center group-hover:bg-chart-1/20 transition-colors">
                    <Wifi className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">IoT Simulation</div>
                    <div className="text-xs text-muted-foreground">Connect devices</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-1 group-hover:translate-x-1 transition-all" />
                </motion.div>
              </Link>

              <Link href="/no-code-editor">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center group-hover:bg-chart-4/20 transition-colors">
                    <Code className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">No-Code Editor</div>
                    <div className="text-xs text-muted-foreground">Visual programming</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-4 group-hover:translate-x-1 transition-all" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats and Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={BookOpen}
              value={inProgressCourses.length}
              label="In Progress"
              color="bg-primary"
              delay={0.1}
            />
            <StatCard
              icon={Target}
              value={completedCourses.length}
              label="Completed"
              color="bg-chart-4"
              delay={0.2}
            />
            <StatCard
              icon={Zap}
              value={activeCourses.length}
              label="Available"
              color="bg-chart-1"
              delay={0.3}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-chart-5/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-chart-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">By Difficulty</div>
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={coursesByDifficulty}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {coursesByDifficulty.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-6"
            >
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">Failed to load courses. Please try again.</p>
            </motion.div>
          )}

          {/* Continue Learning Section */}
          {!isLoading && inProgressCourses.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <PlayCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Continue Learning</h2>
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {inProgressCourses.length} course{inProgressCourses.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* All Courses Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">All Courses</h2>
                {!isLoading && filteredCourses && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                    {searchQuery && ` found`}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <>
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </>
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">No courses found</p>
                  <p className="text-muted-foreground">Try adjusting your search query</p>
                </div>
              )}
            </div>
          </motion.section>
        </div>
    </main>
  );
}
