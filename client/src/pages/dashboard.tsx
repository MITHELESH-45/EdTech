import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/dashboard/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GrootModelViewer } from "@/components/dashboard/groot-model";
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-4">
        <Skeleton className="w-10 h-10 rounded-md" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4 flex-1" />
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
      <CardContent className="px-2 py-1 pz-0">

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
    image: "/Circuit-Design-Basics.png",
  },
 
  {
    id: "block-based-programming",
    title: "Block-Based Programming",
    description: "Learn visual programming with our No-Code Editor. Build Arduino projects without writing code.",
    difficulty: "beginner",
    progress: 0,
    lessons: [],
    isLocked: false,
    image: "/block-based-Programming.png",
  },
  
];

export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainContentRef = useRef<HTMLElement>(null);
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Set up scroll listener
  useEffect(() => {
    const mainElement = mainContentRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const scrollTop = mainElement.scrollTop;
      const scrollHeight = mainElement.scrollHeight - mainElement.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-primary/10 via-background to-chart-2/10 flex flex-col">

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden mb-10">

        {/* LEFT — STATIC GROOT */}
        <div className="w-[420px] min-w-[420px] bg-gradient-to-br from-primary/10 via-background to-chart-2/10 flex items-center justify-center -ml-12">
          <div className="h-full w-full flex items-center justify-center">
            <GrootModelViewer scrollProgress={scrollProgress} />
          </div>
        </div>

        {/* RIGHT — SCROLLABLE CONTENT */}
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-primary/10 via-background to-chart-2/10 -ml-20"
        >
        {/* Hero Section with Search */}
        <div className="relative border-b border-border overflow-hidden">
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
                  left: "875px",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />

            </motion.div>
            
            {/* Quick Access Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 max-w-2xl grid grid-cols-3 gap-4 relative z-10"
            >
              {[
                {
                  href: "/electronic-simulation",
                  icon: "/icons/technology.png",
                  iconAlt: "Technology",
                  title: "Electronic Simulation",
                  description: "Build circuits visually",
                  hoverColorClass: "group-hover:text-primary"
                },
                {
                  href: "/iot-simulation",
                  icon: "/icons/wifi.png",
                  iconAlt: "Wifi",
                  title: "IoT Simulation",
                  description: "Connect devices",
                  hoverColorClass: "group-hover:text-chart-1"
                },
                {
                  href: "/no-code-editor",
                  icon: "/icons/code.png",
                  iconAlt: "Code",
                  title: "No-Code Editor",
                  description: "Visual programming",
                  hoverColorClass: "group-hover:text-chart-4"
                },
                {
                  href: "/robotics-helper",
                  icon: "/icons/wifi.png",
                  iconAlt: "Robot",
                  title: "Project GPT",
                  description: "Get ideas for your projects",
                  hoverColorClass: "group-hover:text-chart-1"
                },
                {
                  href: "/coding",
                  icon: "/icons/code.png",
                  iconAlt: "Code",
                  title: "Coding Playground",
                  description: "Run code with AI help",
                  hoverColorClass: "group-hover:text-chart-4"
                },
                {
                  href: "/no-code-editor",
                  icon: "/icons/code.png",
                  iconAlt: "Code",
                  title: "No-Code Editor",
                  description: "Visual programming",
                  hoverColorClass: "group-hover:text-chart-4"
                }
              ].map((tool, index) => (
                <Link key={`${tool.href}-${index}`} href={tool.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <img
                        src={tool.icon}
                        alt={tool.iconAlt}
                        className="h-6 w-6"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {tool.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-muted-foreground ${tool.hoverColorClass} group-hover:translate-x-1 transition-all`} />
                  </motion.div>
                </Link>
              ))}
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

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative max-w-2xl">
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
                    className="h-full"
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
                    className="h-full"
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
      </div>
    </div>
  );
}