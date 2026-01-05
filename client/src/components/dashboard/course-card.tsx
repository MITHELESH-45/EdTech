import { BookOpen, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Course, Difficulty } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface CourseCardProps {
  course: Course;
}

const difficultyConfig: Record<Difficulty, { label: string; className: string; iconColor: string }> = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconColor: "text-blue-500",
  },
  advanced: {
    label: "Advanced",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    iconColor: "text-amber-500",
  },
};

export function CourseCard({ course }: CourseCardProps) {
  const config = difficultyConfig[course.difficulty];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group relative overflow-visible transition-all duration-300 h-full flex flex-col",
          "hover:shadow-xl hover:border-primary/50 border-border/50",
          "bg-card/50 backdrop-blur-sm",
          course.isLocked && "opacity-70"
        )}
        data-testid={`card-course-${course.id}`}
      >
        {course.isLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Lock className="h-10 w-10" />
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
          </div>
        )}
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              "bg-gradient-to-br from-primary/20 to-primary/10",
              "group-hover:from-primary/30 group-hover:to-primary/20",
              "border border-primary/20"
            )}>
              <BookOpen className={cn("h-6 w-6 text-primary")} />
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs font-semibold border px-3 py-1", config.className)}
              data-testid={`badge-difficulty-${course.id}`}
            >
              {config.label}
            </Badge>
          </div>
          <h3 className="font-bold text-lg mt-2 leading-tight group-hover:text-primary transition-colors" data-testid={`text-course-title-${course.id}`}>
            {course.title}
          </h3>
        </CardHeader>

        <CardContent className="pb-4 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4" data-testid={`text-course-description-${course.id}`}>
            {course.description}
          </p>
          
          {!course.isLocked && course.progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold text-foreground">{course.progress}%</span>
              </div>
              <Progress 
                value={course.progress} 
                className="h-2 bg-muted"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          {!course.isLocked && (
            <Link href={`/courses/${course.id}`} className="w-full" data-testid={`link-course-${course.id}`}>
              <Button
                className={cn(
                  "w-full group/btn relative overflow-hidden",
                  course.progress > 0 
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                )}
                variant={course.progress > 0 ? "default" : "outline"}
                data-testid={`button-start-course-${course.id}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {course.progress > 0 ? "Continue Learning" : "Start Learning"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
                {course.progress > 0 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
