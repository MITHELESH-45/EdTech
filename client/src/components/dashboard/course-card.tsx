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
    className: "bg-emerald-600 text-white border-emerald-600 font-bold",
    iconColor: "text-emerald-500",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-blue-600 text-white border-blue-600 font-bold",
    iconColor: "text-blue-500",
  },
  advanced: {
    label: "Advanced",
    className: "bg-amber-600 text-white border-amber-600 font-bold",
    iconColor: "text-amber-500",
  },
};

export function CourseCard({ course }: CourseCardProps) {
  const config = difficultyConfig[course.difficulty];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300 h-full flex flex-col",
          "hover:shadow-xl hover:border-primary/50 border-border/50",
          "bg-card/50 backdrop-blur-sm",
          course.isLocked && "opacity-70"
        )}
        data-testid={`card-course-${course.id}`}
      >
        {/* Background Image */}
        {(course as any).image && (
          <div className="absolute inset-0 z-0">
            <img
              src={(course as any).image}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
          </div>
        )}

        {course.isLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Lock className="h-10 w-10" />
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
          </div>
        )}
        
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              (course as any).image
                ? "bg-white/20 backdrop-blur-sm border-white/30"
                : "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/20",
              "group-hover:from-primary/30 group-hover:to-primary/20",
              (course as any).image && "group-hover:bg-white/30",
              "border"
            )}>
              <BookOpen className={cn("h-6 w-6", (course as any).image ? "text-white" : "text-primary")} />
            </div>
            <Badge
              variant="default"
              className={cn("text-xs border px-3 py-1", config.className)}
              data-testid={`badge-difficulty-${course.id}`}
            >
              {config.label}
            </Badge>
          </div>
          <h3 className={cn(
            "font-bold text-lg mt-2 leading-tight transition-colors",
            (course as any).image 
              ? "text-white drop-shadow-lg group-hover:text-white/90" 
              : "group-hover:text-primary"
          )} data-testid={`text-course-title-${course.id}`}>
            {course.title}
          </h3>
        </CardHeader>

        <CardContent className="pb-4 flex-1 relative z-10">
          <p className={cn(
            "text-sm line-clamp-3 leading-relaxed mb-4",
            (course as any).image 
              ? "text-white/90 drop-shadow-md" 
              : "text-muted-foreground"
          )} data-testid={`text-course-description-${course.id}`}>
            {course.description}
          </p>
          
          {!course.isLocked && course.progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  "font-medium",
                  (course as any).image ? "text-white/80" : "text-muted-foreground"
                )}>Progress</span>
                <span className={cn(
                  "font-bold",
                  (course as any).image ? "text-white" : "text-foreground"
                )}>{course.progress}%</span>
              </div>
              <Progress 
                value={course.progress} 
                className={cn(
                  "h-2",
                  (course as any).image ? "bg-white/20" : "bg-muted"
                )}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 relative z-10">
          {!course.isLocked && (
            <Link href={`/courses/${course.id}`} className="w-full" data-testid={`link-course-${course.id}`}>
              <Button
                className={cn(
                  "w-full group/btn relative overflow-hidden",
                  "bg-primary hover:bg-primary/90 font-semibold"
                )}
                variant="default"
                data-testid={`button-start-course-${course.id}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {course.progress > 0 ? "Continue Learning" : "Start Learning"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}