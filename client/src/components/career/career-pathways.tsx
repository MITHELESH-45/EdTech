import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Target, TrendingUp, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import type { CareerPathway } from "@shared/career-schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CareerPathwaysProps {
  onSelectPath?: (pathId: string) => void;
}

export function CareerPathways({ onSelectPath }: CareerPathwaysProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const { data: pathways, isLoading } = useQuery<CareerPathway[]>({
    queryKey: ["/api/career/pathways"],
  });

  const { data: userCareer } = useQuery({
    queryKey: ["/api/career"],
    enabled: !!localStorage.getItem("userId"),
  });

  const setGoalMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch("/api/career/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!response.ok) throw new Error("Failed to set career goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/career"] });
      toast({
        title: "Career goal set!",
        description: "Your career pathway has been selected. Check your dashboard for personalized recommendations.",
      });
    },
  });

  const handleSelectPath = (pathId: string) => {
    setSelectedPath(pathId);
    setGoalMutation.mutate(pathId);
    onSelectPath?.(pathId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400";
      case "advanced":
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading career pathways...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Choose Your Career Path</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pathways?.map((pathway, index) => (
          <motion.div
            key={pathway.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{pathway.name}</CardTitle>
                  <Badge className={getDifficultyColor(pathway.difficulty)} variant="outline">
                    {pathway.difficulty}
                  </Badge>
                </div>
                <CardDescription>{pathway.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{pathway.estimatedDuration}</span>
                  </div>
                  {pathway.averageSalary && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        ${pathway.averageSalary.entry.toLocaleString()} - $
                        {pathway.averageSalary.senior.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>{pathway.milestones.length} milestones</span>
                  </div>
                </div>

                <div className="flex-1" />

                <Button
                  onClick={() => handleSelectPath(pathway.id)}
                  disabled={setGoalMutation.isPending || userCareer?.careerGoal?.path === pathway.id}
                  variant={userCareer?.careerGoal?.path === pathway.id ? "default" : "outline"}
                  className="w-full group"
                >
                  {userCareer?.careerGoal?.path === pathway.id ? (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Current Path
                    </>
                  ) : (
                    <>
                      Select Path
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
