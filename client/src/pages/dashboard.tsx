import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { CourseCard } from "@/components/dashboard/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Zap, Target, AlertCircle } from "lucide-react";
import type { Course } from "@shared/schema";

function CourseCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
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

function StatSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border">
      <Skeleton className="w-10 h-10 rounded-md" />
      <div>
        <Skeleton className="h-6 w-8 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const activeCourses = courses?.filter((c) => !c.isLocked) || [];
  const inProgressCourses = activeCourses.filter((c) => c.progress > 0);
  const coursesCompleted = 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <ToolSidebar />
        
        <main className="flex-1 overflow-auto">
          {/* Hero Section */}
          <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="flex items-start justify-between gap-8 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Welcome back, John
                  </h1>
                  <p className="text-muted-foreground max-w-lg">
                    Learn Electronics. Simulate Visually. Build Confidently.
                  </p>
                </div>
                
                {/* Stats */}
                <div className="flex gap-4 flex-wrap">
                  {isLoading ? (
                    <>
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xl font-bold" data-testid="stat-in-progress">
                            {inProgressCourses.length}
                          </div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-md bg-chart-4/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-chart-4" />
                        </div>
                        <div>
                          <div className="text-xl font-bold" data-testid="stat-completed">
                            {coursesCompleted}
                          </div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-md bg-chart-1/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-chart-1" />
                        </div>
                        <div>
                          <div className="text-xl font-bold" data-testid="stat-available">
                            {activeCourses.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Available</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="max-w-6xl mx-auto px-6 py-8">
            {error ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive">Failed to load courses. Please try again.</p>
              </div>
            ) : null}

            {/* Continue Learning Section */}
            {!isLoading && inProgressCourses.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-foreground" data-testid="heading-continue-learning">Continue Learning</h2>
                  <span className="text-sm text-muted-foreground">
                    ({inProgressCourses.length} course{inProgressCourses.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {/* All Courses Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-foreground" data-testid="heading-all-courses">All Courses</h2>
                {!isLoading && courses && (
                  <span className="text-sm text-muted-foreground">
                    ({courses.length} course{courses.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <>
                    <CourseCardSkeleton />
                    <CourseCardSkeleton />
                    <CourseCardSkeleton />
                    <CourseCardSkeleton />
                    <CourseCardSkeleton />
                    <CourseCardSkeleton />
                  </>
                ) : (
                  courses?.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
