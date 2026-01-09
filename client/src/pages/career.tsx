import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CareerPathways } from "@/components/career/career-pathways";
import { SkillsMatrix } from "@/components/career/skills-matrix";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Award, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { generateSkillsFromCourses, calculateCareerProgress, getCareerPathway } from "@/lib/career-utils";
import type { Course } from "@shared/schema";

export default function CareerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pathways");

  // Fetch courses to generate skills
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch career data
  const { data: userCareer, isLoading: careerLoading } = useQuery({
    queryKey: ["/api/career"],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/career", {
          headers: {
            "x-user-id": user?.userId || "",
          },
        });
        if (!response.ok) {
          if (response.status === 401) return null;
          throw new Error("Failed to fetch career data");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching career data:", error);
        return null;
      }
    },
  });

  // Sync skills from courses
  const syncSkillsMutation = useMutation({
    mutationFn: async () => {
      if (!courses) return;
      
      const skills = generateSkillsFromCourses(courses);
      const response = await fetch("/api/career/skills/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      if (!response.ok) throw new Error("Failed to sync skills");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/career"] });
      toast({
        title: "Skills updated!",
        description: "Your skills have been synced from your course progress.",
      });
    },
  });

  // Generate skills when courses load
  const skills = courses ? generateSkillsFromCourses(courses) : [];
  const careerPathway = userCareer?.careerGoal?.path 
    ? getCareerPathway(userCareer.careerGoal.path)
    : null;
  const careerProgress = userCareer?.careerGoal 
    ? calculateCareerProgress(userCareer.careerGoal, skills, courses || [])
    : 0;

  if (!user) {
    return (
      <div className="flex flex-1">
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to view your career profile</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              Career Optimization
            </h1>
            <p className="text-muted-foreground">
              Track your skills, set career goals, and optimize your learning path
            </p>
          </motion.div>

          {/* Career Goal Card */}
          {userCareer?.careerGoal && careerPathway && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Your Career Goal
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {careerPathway.name} - {careerPathway.targetRole}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => syncSkillsMutation.mutate()}
                      disabled={syncSkillsMutation.isPending}
                      size="sm"
                    >
                      {syncSkillsMutation.isPending ? "Syncing..." : "Sync Skills"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Career Progress</span>
                        <span className="text-sm text-muted-foreground">{careerProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${careerProgress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete milestones in your career pathway to advance toward your goal
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="pathways" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Career Paths
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pathways" className="space-y-6">
              <CareerPathways onSelectPath={() => queryClient.invalidateQueries({ queryKey: ["/api/career"] })} />
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              <SkillsMatrix />
              {skills.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">
                      Complete courses to start building your skills profile
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Track your learning milestones and accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  {userCareer?.achievements && userCareer.achievements.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {userCareer.achievements.map((achievement: any) => (
                        <Card key={achievement.id} className="border-border/50">
                          <CardContent className="pt-6">
                            <div className="text-4xl mb-2">{achievement.icon}</div>
                            <h3 className="font-semibold mb-1">{achievement.title}</h3>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Complete courses and projects to unlock achievements
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
