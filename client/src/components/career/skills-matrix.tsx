import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Skill, UserCareerData } from "@shared/career-schema";
import { useQuery } from "@tanstack/react-query";

export function SkillsMatrix() {
  const { data: userCareer, isLoading } = useQuery<UserCareerData>({
    queryKey: ["/api/career"],
    enabled: !!localStorage.getItem("userId"),
  });

  const skills = userCareer?.skills || [];

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-500";
      case "intermediate":
        return "bg-yellow-500";
      case "advanced":
        return "bg-orange-500";
      case "expert":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSkillLevelBadge = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400";
      case "advanced":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400";
      case "expert":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  if (skills.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Skills Matrix
          </CardTitle>
          <CardDescription>Complete courses to start building your skills profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Skills Matrix
        </CardTitle>
        <CardDescription>Track your skill development and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(skillsByCategory).map(([category, categorySkills], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
            className="space-y-3"
          >
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {category.replace(/-/g, " ")}
            </h3>
            <div className="space-y-3">
              {categorySkills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (categoryIndex * 0.1) + (index * 0.05) }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{skill.name}</span>
                      <Badge className={`${getSkillLevelBadge(skill.level)} text-xs`} variant="outline">
                        {skill.level}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{skill.progress}%</span>
                  </div>
                  <Progress value={skill.progress} className="h-2" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {Math.round(skills.reduce((sum, skill) => sum + skill.progress, 0) / skills.length)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
