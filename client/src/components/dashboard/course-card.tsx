import { BookOpen, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Course, Difficulty } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface CourseCardProps {
  course: Course;
}

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

export function CourseCard({ course }: CourseCardProps) {
  const config = difficultyConfig[course.difficulty];

  return (
    <Card
      className={cn(
        "group relative overflow-visible transition-all duration-200",
        course.isLocked && "opacity-70"
      )}
      data-testid={`card-course-${course.id}`}
    >
      {course.isLocked && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Lock className="h-8 w-8" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs font-medium border", config.className)}
            data-testid={`badge-difficulty-${course.id}`}
          >
            {config.label}
          </Badge>
        </div>
        <h3 className="font-semibold text-base mt-3 leading-tight" data-testid={`text-course-title-${course.id}`}>
          {course.title}
        </h3>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed" data-testid={`text-course-description-${course.id}`}>
          {course.description}
        </p>
        
        {!course.isLocked && course.progress > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {!course.isLocked && (
          <Link href={`/courses/${course.id}`} className="w-full" data-testid={`link-course-${course.id}`}>
            <Button
              className="w-full group/btn"
              variant={course.progress > 0 ? "default" : "outline"}
              data-testid={`button-start-course-${course.id}`}
            >
              {course.progress > 0 ? "Continue Learning" : "Start Learning"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
