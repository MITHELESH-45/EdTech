import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Clock, CheckCircle, ChevronRight, Cpu, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, Difficulty } from "@shared/schema";

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
      <Header />
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

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: ["/api/courses", id],
  });

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
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
      <Header />
      
      <div className="flex flex-1">
        <ToolSidebar />
        
        <main className="flex-1 overflow-auto">
          {/* Course Header */}
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
                  </div>
                  <p className="text-muted-foreground">{course.description}</p>
                  
                  <div className="flex items-center gap-6 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.lessons.length} lessons</span>
                    </div>
                    
                    {course.progress > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress value={course.progress} className="w-32 h-2" />
                        <span className="text-sm font-medium">{course.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            <h2 className="text-lg font-semibold mb-4">Course Content</h2>
            
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

            {/* Lesson Content Preview (first lesson expanded) */}
            {course.lessons.length > 0 && (
              <div className="mt-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-chart-4" />
                      <span className="text-sm font-medium text-chart-4">Current Lesson</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3">{course.lessons[0].title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {course.lessons[0].content}
                    </p>

                    {/* Diagram Placeholder */}
                    {course.lessons[0].diagramPlaceholder && (
                      <div className="bg-muted/50 rounded-lg p-8 mb-6 flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path d="M2 12h3l3-9 4 18 3-9h3" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Interactive diagram: {course.lessons[0].diagramPlaceholder}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Practice CTA */}
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Cpu className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium mb-0.5">Practice This Concept</h4>
                          <p className="text-sm text-muted-foreground">
                            Apply what you've learned in the Electronic Simulation
                          </p>
                        </div>
                        <Link href="/electronic-simulation" data-testid="link-practice-simulation">
                          <Button data-testid="button-practice-simulation">
                            Open Simulator
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
