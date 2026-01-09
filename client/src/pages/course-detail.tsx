import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  ChevronRight,
  Cpu,
  AlertCircle,
  Play,
  Download,
  ExternalLink,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, Difficulty } from "@shared/schema";
import type { CourseLevel, ExtendedCourse } from "@/lib/mock-data";
import { useCourseTracking } from "@/lib/course-tracking-context";

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  beginner: {
    label: "Beginner",
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
  advanced: {
    label: "Advanced",
    className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  },
};

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1">
        <ToolSidebar />
        <main className="flex-1 overflow-auto">
          <div className="border-b border-border bg-card">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-7 w-64 mb-2" />
                  <Skeleton className="h-4 w-full max-w-md mb-4" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-6 py-8">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LevelCard({ level, index, courseId }: { level: CourseLevel; index: number; courseId: string }) {
  const { completeModule, isModuleCompleted, isLoading } = useCourseTracking();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  // Use level.isCompleted from prop (which is synced with real data) or check via hook
  const isCompleted = level.isCompleted || isModuleCompleted(courseId, level.id);

  const handleWatchVideo = () => {
    window.open(level.youtubeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadNotes = () => {
    window.open(level.notesUrl, "_blank", "noopener,noreferrer");
  };

  const handleMarkAsCompleted = async () => {
    if (isCompleted || isCompleting) return;

    setIsCompleting(true);
    try {
      await completeModule(courseId, level.id);
      toast({
        title: "Module Completed!",
        description: `You've completed "${level.name}". Great job!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark module as completed",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all",
        level.isCompleted && "border-chart-4/30 bg-chart-4/5"
      )}
      data-testid={`level-${level.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full font-medium flex-shrink-0",
              level.isCompleted
                ? "bg-chart-4/20 text-chart-4"
                : "bg-muted text-muted-foreground"
            )}
          >
            {level.isCompleted ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              index + 1
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">{level.name}</h3>
              {level.isCompleted && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-xs">
                  Completed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {level.description}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {level.duration}
              </span>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWatchVideo}
                  data-testid={`button-watch-${level.id}`}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Watch Video
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownloadNotes}
                  data-testid={`button-notes-${level.id}`}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Notes
                </Button>

                <Button
                  size="sm"
                  variant={isCompleted ? "default" : "outline"}
                  onClick={handleMarkAsCompleted}
                  disabled={isCompleting || isLoading}
                  data-testid={`button-complete-${level.id}`}
                  className={cn(
                    isCompleted && "bg-chart-4/20 text-chart-4 border-chart-4/30 hover:bg-chart-4/30"
                  )}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Completing...
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as Completed
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("levels");
  const { enrollCourse, getCourseProgress, isLoading: isTrackingLoading } = useCourseTracking();

  const { data: course, isLoading, error } = useQuery<ExtendedCourse>({
    queryKey: ["/api/courses", id],
  });

  // Auto-enroll user in course when viewing it (only once)
  const [hasEnrolled, setHasEnrolled] = useState(false);
  useEffect(() => {
    if (course && !isTrackingLoading && !hasEnrolled) {
      const courseProgress = getCourseProgress(course.id);
      if (!courseProgress) {
        // Enroll user in course with all modules
        const moduleIds = course.levels.map((level) => level.id);
        const moduleNames = course.levels.map((level) => level.name);
        enrollCourse(course.id, course.title, moduleIds, moduleNames)
          .then(() => {
            setHasEnrolled(true);
          })
          .catch((error) => {
            console.error("Failed to enroll in course:", error);
          });
      } else {
        setHasEnrolled(true);
      }
    }
  }, [course?.id, isTrackingLoading, hasEnrolled]); // Only depend on course.id, not the whole course object

  // Get real progress from tracking
  const courseProgress = course ? getCourseProgress(course.id) : null;
  const levels = course?.levels || [];
  
  // Merge real completion status with course levels
  const levelsWithProgress = levels.map((level) => {
    const isCompleted = courseProgress
      ? courseProgress.modules.find((m) => m.moduleId === level.id)?.completed || false
      : level.isCompleted;
    return { ...level, isCompleted };
  });

  const completedLevels = levelsWithProgress.filter((l) => l.isCompleted).length;
  const progressPercentage = courseProgress?.progressPercentage || 0;

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or couldn't be loaded.
            </p>
            <Link href="/dashboard">
              <Button data-testid="button-back-dashboard">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const config = difficultyConfig[course.difficulty];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1">
        <ToolSidebar />

        <main className="flex-1 overflow-auto">
          <div className="border-b border-border bg-card">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <Link href="/dashboard" data-testid="link-back-dashboard">
                <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl font-bold" data-testid="text-course-title">
                      {course.title}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium border", config.className)}
                    >
                      {config.label}
                    </Badge>
                    {course.isLocked && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{course.description}</p>

                  <div className="flex items-center gap-6 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{levels.length} levels</span>
                    </div>

                    {levels.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress value={progressPercentage} className="w-32 h-2" />
                        <span className="text-sm font-medium">
                          {completedLevels}/{levels.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="levels" data-testid="tab-levels">
                  Course Levels
                </TabsTrigger>
                <TabsTrigger value="lessons" data-testid="tab-lessons">
                  Lessons
                </TabsTrigger>
              </TabsList>

              <TabsContent value="levels">
                {course.isLocked ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Course Locked</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete prerequisite courses to unlock this content.
                    </p>
                  </div>
                ) : levels.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No levels available yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This course is coming soon. Check back later for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {levelsWithProgress.map((level, index) => (
                      <LevelCard
                        key={level.id}
                        level={level}
                        index={index}
                        courseId={course.id}
                      />
                    ))}
                  </div>
                )}

                {!course.isLocked && levels.length > 0 && (
                  <div className="mt-8">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Cpu className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium mb-0.5">Practice What You Learned</h4>
                            <p className="text-sm text-muted-foreground">
                              Apply your knowledge in the Electronic Simulation
                            </p>
                          </div>
                          <Link href="/electronic-simulation" data-testid="link-practice-simulation">
                            <Button data-testid="button-practice-simulation">
                              Open Simulator
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lessons">
                {course.lessons.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No lessons available yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This course is coming soon. Check back later for updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.lessons.map((lesson, index) => (
                      <Card
                        key={lesson.id}
                        className="hover-elevate active-elevate-2 cursor-pointer transition-all"
                        data-testid={`lesson-${lesson.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-medium">
                              {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{lesson.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {lesson.content.substring(0, 100)}...
                              </p>
                            </div>

                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
