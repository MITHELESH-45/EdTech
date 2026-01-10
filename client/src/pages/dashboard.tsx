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
  PlayCircle,
  Briefcase,
  Trophy,
  Medal,
  Crown
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCourseTracking } from "@/lib/course-tracking-context";
import type { Course } from "@shared/schema";
import { generateSkillsFromCourses, calculateCareerProgress, getCareerPathway } from "@/lib/career-utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery as useRQ } from "@tanstack/react-query";
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
  const { coursesInfo, getCourseProgress } = useCourseTracking();
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch career data for dashboard widget
  const { data: userCareerPaths } = useQuery<any[]>({
    queryKey: ["/api/career", user?.userId],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      try {
        if (!user?.userId) return [];
        const response = await fetch(`/api/career?userId=${user.userId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : (data ? [data] : []);
      } catch {
        return [];
      }
    },
  });

  // Fetch user's leaderboard rank
  const { data: userRankData } = useQuery<{
    success: boolean;
    data: {
      rank: number;
      activityPoints: number;
      completedCourses: number;
      dailyStreak: number;
      totalUsers: number;
    };
  }>({
    queryKey: ["/api/leaderboard/user-rank"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch("/api/leaderboard/user-rank", {
          headers: {
            "x-user-id": user?.userId || "",
          },
        });
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Generate skills from courses for career progress
  const skills = courses ? generateSkillsFromCourses(courses) : [];
  const careerGoal = userCareerPaths?.[0]?.careerGoal;
  const careerPathway = careerGoal?.path 
    ? getCareerPathway(careerGoal.path)
    : null;
  const careerProgress = careerGoal 
    ? calculateCareerProgress(careerGoal, skills, courses || [])
    : 0;
  // Calculate generic progress (optional, or just show first one)
  // For now, we won't calculate aggregate progress here to keep it simple.
  
  // ... existing code ...

  // Fetch saved circuits
  const { data: circuits } = useRQ<{ id: string; name: string; createdAt: string }[]>({
    queryKey: ["/api/circuits"],
    queryFn: async () => {
      const res = await fetch('/api/circuits');
      if (!res.ok) return [];
      return (await res.json()) as { id: string; name: string; createdAt: string }[];
    },
  });
  const [showCircuits, setShowCircuits] = useState(false);

  // Set up scroll listener on AppLayout's scroll container
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleScroll = () => {
      const scrollTop = mainContent.scrollTop;
      const scrollHeight = mainContent.scrollHeight - mainContent.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  // Combine original courses with additional courses and merge with real progress data
  const allCourses = useMemo(() => {
    const original = (courses || []).map(c => {
      const courseProgress = getCourseProgress(c.id);
      return {
        ...c,
        isLocked: false,
        progress: courseProgress ? courseProgress.progressPercentage : 0,
      };
    });
    
    const additional = additionalCourses.map(c => {
      const courseProgress = getCourseProgress(c.id);
      return {
        ...c,
        progress: courseProgress ? courseProgress.progressPercentage : 0,
      };
    });
    
    return [...original, ...additional];
  }, [courses, getCourseProgress]);

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
  const inProgressCourses = activeCourses.filter((c) => c.progress > 0 && c.progress < 100);
  const activeCareerPaths = (userCareerPaths || []).filter((p: any) => (p.progress?.totalProgress || 0) < 100);
  const completedCourses = activeCourses.filter((c) => c.progress === 100);
  const notStartedCourses = activeCourses.filter((c) => c.progress === 0);
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
    <div ref={dashboardRef} className="h-full w-full bg-gradient-to-br from-primary/10 via-background to-chart-2/10 flex flex-col overflow-hidden">

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 min-h-0 relative">

        {/* LEFT — STATIC GROOT */}
        <div className="fixed left-0 top-16 bottom-0 w-[320px] bg-gradient-to-br from-primary/10 via-background to-chart-2/10 flex items-center justify-center flex-shrink-0 pointer-events-none z-10">
          <div className="h-full w-full flex items-center justify-center">
            <GrootModelViewer scrollProgress={scrollProgress} />
          </div>
        </div>

        {/* RIGHT — CONTENT */}
        <main ref={mainContentRef} className="flex-1 bg-gradient-to-br from-primary/10 via-background to-chart-2/10 ml-[320px] overflow-y-auto scrollbar-hide"
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
                
              ].map((tool, index) => (
                <Link key={`${tool.href}-${index}`} href={tool.href} className="h-full">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-full flex items-center gap-3 px-6 py-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <img
                        src={tool.icon}
                        alt={tool.iconAlt}
                        className="h-6 w-6"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground mb-1">
                        {tool.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-muted-foreground ${tool.hoverColorClass} group-hover:translate-x-1 transition-all flex-shrink-0`} />
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
              value={coursesInfo?.badges.completedCourses || completedCourses.length}
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
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div onClick={() => setShowCircuits(!showCircuits)}>
                <StatCard
                  icon={Cpu}
                  value={circuits ? circuits.length : 0}
                  label="Circuits Designed"
                  color="bg-emerald-500"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >         
            </motion.div>
          </div>

          {/* Circuits List (toggle) */}
          {showCircuits && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">Saved Circuits</h3>
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">{circuits ? circuits.length : 0}</span>
              </div>

              <div className="space-y-2">
                {(circuits || []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 p-3 rounded-md border border-border bg-card">
                    <div>
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 rounded bg-primary text-white text-sm"
                        onClick={() => {
                          // Open circuit in simulator by navigating with loadCircuitId param
                          window.location.href = `/electronic-simulation?loadCircuitId=${encodeURIComponent(c.id)}`;
                        }}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
                {(!circuits || circuits.length === 0) && (
                  <div className="text-sm text-muted-foreground">No saved circuits yet. Save circuits from the simulator.</div>
                )}
              </div>
            </motion.section>
          )}

          {/* Leaderboard Widget */}
          {userRankData?.data && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mb-8"
            >
              <Card className="border-border/50 bg-gradient-to-br from-yellow-500/5 via-card to-card/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Your Ranking</h3>
                        <p className="text-sm text-muted-foreground">
                          Rank #{userRankData.data.rank} out of {userRankData.data.totalUsers} students
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                          {userRankData.data.rank === 1 ? (
                            <Crown className="h-6 w-6 text-yellow-500" />
                          ) : userRankData.data.rank === 2 ? (
                            <Medal className="h-6 w-6 text-gray-400" />
                          ) : userRankData.data.rank === 3 ? (
                            <Medal className="h-6 w-6 text-orange-600" />
                          ) : (
                            <span className="text-lg font-bold text-primary">#{userRankData.data.rank}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">Your Position</p>
                          <p className="text-xs text-muted-foreground">
                            {userRankData.data.activityPoints} points • {userRankData.data.completedCourses} courses
                          </p>
                        </div>
                      </div>
                      {userRankData.data.totalUsers > 0 && (
                        <Badge variant="outline" className="bg-primary/10 border-primary/30">
                          Top {Math.round((userRankData.data.rank / userRankData.data.totalUsers) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Activity Points</p>
                        <p className="text-xl font-bold flex items-center justify-center gap-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          {userRankData.data.activityPoints}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Courses</p>
                        <p className="text-xl font-bold flex items-center justify-center gap-1">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          {userRankData.data.completedCourses}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Streak</p>
                        <p className="text-xl font-bold flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          {userRankData.data.dailyStreak}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* Career Progress Widget */}
          {/* Career Progress Widget - Now Supports Multiple Paths */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
             <div className="flex items-center gap-3 mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Your Career Paths</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {userCareerPaths && userCareerPaths.length > 0 ? (
                 userCareerPaths.map((path: any, idx: number) => {
                    const progress = path.progress?.totalProgress || 0;
                    
                    return (
                      <Card key={idx} className="border-border/50 bg-gradient-to-br from-primary/5 via-card to-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{path.careerDecision?.role || "Career Path"}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {progress}% complete
                                </p>
                              </div>
                            </div>
                            <Link href={`/career?role=${encodeURIComponent(path.careerDecision?.role)}`}>
                              <Button variant="outline" size="sm" className="group">
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                          
                          <div className="space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                              {path.progress?.completedDays?.length || 0} of {path.summary?.totalDays || 20} days completed
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                 })
               ) : (
                 <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-card to-card/80 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center text-center py-6">
                         <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                           <Sparkles className="h-6 w-6 text-primary" />
                         </div>
                         <h3 className="font-semibold text-lg mb-2">Discover Your Path</h3>
                         <p className="text-sm text-muted-foreground mb-4 max-w-md">
                           Not sure which tech career is right for you? Chat with our AI mentor to build a personalized roadmap.
                         </p>
                         <Link href="/career">
                           <Button className="group">
                             Start Career Journey
                             <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                           </Button>
                         </Link>
                      </div>
                    </CardContent>
                 </Card>
               )}
               
               {/* Add New Path Button (if paths exist) */}
               {userCareerPaths && userCareerPaths.length > 0 && (
                 <Link href="/career">
                    <Card className="border-dashed border-2 border-border/50 bg-transparent hover:bg-accent/5 transition-colors h-full flex items-center justify-center cursor-pointer min-h-[150px]">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <span className="font-medium">Explore Another Role</span>
                      </div>
                    </Card>
                 </Link>
               )}
             </div>
          </motion.section>

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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
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
          {!isLoading && (inProgressCourses.length > 0 || activeCareerPaths.length > 0) && (
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
                  {inProgressCourses.length + activeCareerPaths.length} item{(inProgressCourses.length + activeCareerPaths.length) !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Career Paths */}
                {activeCareerPaths.map((path: any, index: number) => {
                   const progress = path.progress?.totalProgress || 0;
                   return (
                    <motion.div
                      key={`career-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full"
                    >
                      <Card className="h-full border-border/50 bg-gradient-to-br from-primary/5 via-card to-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all flex flex-col">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg line-clamp-1">{path.careerDecision?.role || "Career Path"}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {progress}% complete
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4 flex-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                              {path.progress?.completedDays?.length || 0} of {path.summary?.totalDays || 20} days completed
                            </p>
                          </div>

                          <Link href={`/career?role=${encodeURIComponent(path.careerDecision?.role)}`}>
                            <Button variant="outline" size="sm" className="w-full group mt-auto">
                              Continue Roadmap
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                   );
                })}

                {/* Courses */}
                {inProgressCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: (index + activeCareerPaths.length) * 0.1 }}
                    className="h-full"
                  >
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Completed Courses Section */}
          {!isLoading && completedCourses.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-6 w-6 text-chart-4" />
                <h2 className="text-2xl font-bold text-foreground">Completed Courses</h2>
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {completedCourses.length} course{completedCourses.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCourses.map((course, index) => (
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

          {/* All Courses Section - Only show courses not in progress or completed */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">All Courses</h2>
                {!isLoading && notStartedCourses && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {searchQuery ? filteredCourses.length : notStartedCourses.length} course{(searchQuery ? filteredCourses.length : notStartedCourses.length) !== 1 ? "s" : ""}
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
              ) : (searchQuery ? filteredCourses : notStartedCourses).length > 0 ? (
                (searchQuery ? filteredCourses : notStartedCourses).map((course, index) => (
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