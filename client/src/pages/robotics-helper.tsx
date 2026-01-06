import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Wrench,
  BookOpen,
  Code,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Description } from '@/components/project-gpt/description';
import { Resources } from '@/components/project-gpt/resources';
import { Steps } from '@/components/project-gpt/steps';
import { Code as CodeComponent } from '@/components/project-gpt/code';
import { analyzeProject } from '@/lib/project-ai-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function RoboticsHelper() {
  const { toast } = useToast();
  const [projectDescription, setProjectDescription] = useState('');
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState<Array<{ name: string; description: string }>>([]);
  const [steps, setSteps] = useState<Array<{ instruction: string; subSteps?: string[] }>>([]);
  const [code, setCode] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!projectDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeProject(projectDescription);
      
      // Update state with analysis results
      setResources(analysis.resources || []);
      setSteps(analysis.steps || []);
      setCode(analysis.code || '');

      // Switch to resources tab to show results
      setActiveTab('resources');

      toast({
        title: "Success",
        description: "Project analysis completed successfully!",
      });
    } catch (error) {
      console.error("Error analyzing project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex grid grid-cols-[30%_70%] h-full overflow-y-auto bg-background flex">

      {/* Hero Banner with Gradient */}
      <div className="flex relative bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 overflow-hidden">
        <div className="mx-auto px-3 py-6">
          <div className="flex  gap-10 items-start">
            {/* Hero + Features */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white mb-8"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to GROOT AI</h1>
                <p className="text-lg md:text-xl mb-6">
                  Your ultimate assistant for embedded systems, robotics and IoT projects.
                </p>
              </motion.div>

              {/* Feature Icons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-col items-start md:items-center text-white"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 md:mb-4">
                    <Wrench className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">Required Components</h3>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-col items-start md:items-center text-white"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 md:mb-4">
                    <BookOpen className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">Step-by-step Instructions</h3>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col items-start md:items-center text-white"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 md:mb-4">
                    <Code className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">Ready-to-use Code</h3>
                </motion.div>
              </div>
            </div>
          </div>
          {/* Description / Chat Sidebar */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-background/95 rounded-xl shadow-lg border border-emerald-500/40 backdrop-blur-sm"
            >
              <Card className="bg-transparent border-0 shadow-none h-full">
                  <Description
                    projectDescription={projectDescription}
                    onDescriptionChange={setProjectDescription}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                  />
              </Card>
            </motion.div>
        </div>
      </div>

      {/* Navigation Tabs + Content */}
      <div className="flex-1 bg-card border-l border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-0 h-auto p-0">
              <TabsTrigger
                value="resources"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-500 rounded-none px-6 py-4"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
              <TabsTrigger
                value="steps"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-500 rounded-none px-6 py-4"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Steps
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-500 rounded-none px-6 py-4"
              >
                <Code className="w-4 h-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>

            {/* Tab Content directly below tabs */}
            <div className="mt-6">
              <TabsContent value="resources">
                <Resources resources={resources} />
              </TabsContent>
              <TabsContent value="steps">
                <Steps steps={steps} />
              </TabsContent>
              <TabsContent value="code">
                <CodeComponent code={code} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default RoboticsHelper;
