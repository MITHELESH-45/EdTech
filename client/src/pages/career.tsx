import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, User as UserIcon, Send, CheckCircle2, Circle, 
  Cpu, Wifi, PenTool, Code, CircuitBoard, HelpCircle,
  ArrowRight, BookOpen, Wrench, Trophy, Loader2, RotateCcw,
  PlusCircle, LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const ROLES = [
  { title: "Embedded Systems Engineer", icon: Cpu, desc: "Design hardware-software systems." },
  { title: "IoT Developer", icon: Wifi, desc: "Connect devices to the cloud." },
  { title: "Hardware Engineer", icon: CircuitBoard, desc: "Design physical electronics." },
  { title: "Robotics Engineer", icon: Bot, desc: "Build autonomous machines." },
  { title: "Electronics Designer", icon: PenTool, desc: "Create circuit schematics & PCBs." },
  { title: "Software Engineer", icon: Code, desc: "Build scalable software solutions." },
];

type ViewState = "loading" | "selection" | "chat" | "roadmap";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RoadmapDay {
  day: number;
  title: string;
  concept: string;
  learn: {
    explanation: string;
    videoTopic: string;
    notes: string;
  };
  practice: string;
  tool: string;
  completionCriteria: string;
}

interface CareerPath {
  userId: string;
  careerDecision: {
    role: string;
    reasoning: string[];
    readinessLevel: number;
  };
  roadmap: RoadmapDay[];
  progress: {
    completedDays: number[];
    currentDay: number;
    totalProgress: number;
  };
}

export default function CareerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [view, setView] = useState<ViewState>("loading");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [allPaths, setAllPaths] = useState<CareerPath[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse query params helper
  const getQueryParam = (param: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
  };

  // Fetch existing career paths
  useEffect(() => {
    if (!user?.userId) return;
    
    const roleParam = getQueryParam("role");

    fetch(`/api/career?userId=${user.userId}`)
      .then(res => res.json())
      .then(data => {
        const paths = Array.isArray(data) ? data : (data ? [data] : []);
        setAllPaths(paths);

        if (roleParam) {
          const matchedPath = paths.find((p: CareerPath) => p.careerDecision?.role === roleParam);
          if (matchedPath) {
            setCareerPath(matchedPath);
            setView("roadmap");
            return;
          }
        }
        
        // Default behavior if no role param or not found
        setView("selection");
      })
      .catch(err => {
        console.error("Failed to load career paths", err);
        setView("selection");
      });
  }, [user?.userId]); 

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleStartChat = (role: string) => {
    // Check if we already have a path for this role
    const existingPath = allPaths.find(p => p.careerDecision?.role === role);
    if (existingPath) {
      setCareerPath(existingPath);
      setView("roadmap");
      setLocation(`/career?role=${encodeURIComponent(role)}`);
      return;
    }

    setSelectedRole(role);
    setView("chat");
    setMessages([]); // Clear previous messages
    
    const initialContextMsg = role === "Know Your Path" 
      ? "I need help finding my career path." 
      : `I want to be a ${role}.`;

    const msgs: Message[] = [{ role: "user", content: initialContextMsg }];
    // We don't setMessages(msgs) visibly to keep it clean.
    
    setIsTyping(true);
    fetch("/api/career/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, userId: user?.userId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        toast({ title: "Error", description: data.details || "Failed to start chat", variant: "destructive" });
        setIsTyping(false);
        return;
      }
      setMessages([...msgs, { role: "assistant", content: data.reply }]);
      setIsTyping(false);
    })
    .catch((err) => {
      console.error("Chat start error:", err);
      setIsTyping(false);
      toast({ title: "Error", description: "Failed to connect to AI mentor", variant: "destructive" });
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMsgs = [...messages, { role: "user" as const, content: inputMessage }];
    setMessages(newMsgs);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/career/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, userId: user?.userId })
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      if (data.reply === "READY_TO_GENERATE_ROADMAP" || data.reply.includes("READY_TO_GENERATE_ROADMAP")) {
        // Trigger generation
        generateRoadmap(newMsgs);
      } else {
        setMessages([...newMsgs, { role: "assistant", content: data.reply }]);
        setIsTyping(false);
      }
    } catch (error: any) {
      console.error(error);
      setIsTyping(false);
      toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
    }
  };

  const generateRoadmap = async (msgs: Message[]) => {
    setIsTyping(true);
    toast({ title: "Analyzing...", description: "Creating your personalized 20-day roadmap." });

    try {
      const res = await fetch("/api/career/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, userId: user?.userId })
      });
      
      if (!res.ok) throw new Error("Generation failed");
      
      const data = await res.json();
      setCareerPath(data);
      setAllPaths([...allPaths, data]); // Add to local list
      setView("roadmap");
      
      // Update URL
      if (data.careerDecision?.role) {
         setLocation(`/career?role=${encodeURIComponent(data.careerDecision.role)}`);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate roadmap", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleDayCompletion = async (day: number, currentStatus: boolean) => {
    if (!careerPath) return;

    // Optimistic update
    const newCompleted = currentStatus
      ? careerPath.progress.completedDays.filter(d => d !== day)
      : [...careerPath.progress.completedDays, day];
    
    const newProgress = Math.round((newCompleted.length / 20) * 100);

    const updatedPath = {
      ...careerPath,
      progress: {
        ...careerPath.progress,
        completedDays: newCompleted,
        totalProgress: newProgress
      }
    };

    setCareerPath(updatedPath);
    // Update in allPaths too
    setAllPaths(allPaths.map(p => 
      p.careerDecision.role === careerPath.careerDecision.role ? updatedPath : p
    ));

    try {
      await fetch("/api/career/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.userId, 
          day, 
          completed: !currentStatus,
          role: careerPath.careerDecision.role 
        })
      });
      
      if (!currentStatus) {
        toast({ title: "Great job!", description: `Day ${day} completed! +50 Points` });
      }
    } catch (error) {
      // Revert if failed (omitted for brevity)
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to delete this career path? This cannot be undone.")) return;
    
    if (!careerPath) return;

    try {
      await fetch("/api/career/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.userId,
          role: careerPath.careerDecision.role
        })
      });
      
      // Remove from allPaths
      const newPaths = allPaths.filter(p => p.careerDecision.role !== careerPath.careerDecision.role);
      setAllPaths(newPaths);
      setCareerPath(null);
      setView("selection");
      setMessages([]);
      setLocation("/career");
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete path", variant: "destructive" });
    }
  };

  const handleBackToSelection = () => {
    setView("selection");
    setCareerPath(null);
    setLocation("/career");
  };

  if (view === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      
      {/* SELECTION VIEW */}
      {view === "selection" && (
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-12">
              <h1 className="text-4xl font-bold tracking-tight">Choose Your Career Path</h1>
              <p className="text-xl text-muted-foreground">
                Select a role to start your journey or let our AI mentor guide you.
              </p>
            </div>

            {/* Existing Paths Section */}
            {allPaths.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                  Your Active Journeys
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPaths.map((path, idx) => (
                    <Card 
                      key={idx} 
                      className="cursor-pointer border-primary/20 bg-primary/5 hover:border-primary hover:shadow-lg transition-all"
                      onClick={() => {
                        setCareerPath(path);
                        setView("roadmap");
                        setLocation(`/career?role=${encodeURIComponent(path.careerDecision.role)}`);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          {path.careerDecision.role}
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>
                          {path.progress.totalProgress}% Complete
                        </CardDescription>
                        <Progress value={path.progress.totalProgress} className="h-2 mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                <Separator className="my-8" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ROLES.map((role) => (
                <Card 
                  key={role.title} 
                  className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
                  onClick={() => handleStartChat(role.title)}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <role.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{role.title}</CardTitle>
                    <CardDescription>{role.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
              
              {/* Know Your Path Card */}
              <Card 
                className="cursor-pointer border-primary/50 bg-primary/5 hover:bg-primary/10 hover:shadow-lg transition-all md:col-span-2 lg:col-span-3"
                onClick={() => handleStartChat("Know Your Path")}
              >
                <CardHeader className="flex flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <HelpCircle className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Not sure where to start?</CardTitle>
                    <CardDescription className="text-lg">
                      Talk to our AI Career Mentor to discover the perfect role for you based on your skills and interests.
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary ml-auto" />
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
      )}

      {/* CHAT VIEW */}
      {view === "chat" && (
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full h-full p-4">
          <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-primary/20">
            <CardHeader className="bg-muted/50 border-b pb-4">
              <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" onClick={() => setView("selection")}>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                 </Button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>AI Career Mentor</CardTitle>
                  <CardDescription>
                    {selectedRole === "Know Your Path" ? "Discovering your path..." : `Path: ${selectedRole}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.filter(m => m.role !== "system").map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}>
                      {msg.role === "user" ? null : <Bot className="h-4 w-4 mb-2 opacity-50" />}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-75" />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 bg-background border-t">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <Input 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button type="submit" disabled={!inputMessage.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </main>
      )}

      {/* ROADMAP VIEW */}
      {view === "roadmap" && careerPath && (
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            
             <Button variant="ghost" onClick={handleBackToSelection} className="mb-4">
                <ArrowRight className="h-4 w-4 rotate-180 mr-2" /> Back to Paths
             </Button>

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl mb-2">{careerPath.careerDecision.role}</CardTitle>
                      <CardDescription className="text-lg">
                        Readiness Level: <span className="text-primary font-bold">{careerPath.careerDecision.readinessLevel}%</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {careerPath.progress.completedDays.length} / {careerPath.summary.totalDays} Days
                    </Badge>
                  </div>
                  <Progress value={careerPath.progress.totalProgress} className="h-2 mt-4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-muted-foreground">Why this role?</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {careerPath.careerDecision.reasoning.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col justify-center items-center text-center p-6 space-y-4">
                <Trophy className="h-12 w-12 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-lg">Completion Reward</h3>
                  <p className="text-sm text-muted-foreground">
                    {careerPath.summary.completionReward.skill}
                  </p>
                  <Badge variant="outline" className="mt-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    +{careerPath.summary.completionReward.points} Points
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
                  <RotateCcw className="h-3 w-3 mr-2" /> Delete Path
                </Button>
              </Card>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Your 20-Day Roadmap
              </h2>
              
              <div className="grid gap-4">
                {careerPath.roadmap.map((day) => {
                  const isCompleted = careerPath.progress.completedDays.includes(day.day);
                  
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: day.day * 0.05 }}
                    >
                      <Card className={`transition-all ${isCompleted ? 'bg-muted/50 border-green-500/30' : 'hover:border-primary/50'}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 
                                ${isCompleted 
                                  ? 'bg-green-500 text-white border-green-500' 
                                  : 'bg-background border-muted-foreground/30 text-muted-foreground'}`}>
                                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : day.day}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{day.title}</CardTitle>
                                <CardDescription className="font-medium text-primary/80">{day.concept}</CardDescription>
                              </div>
                            </div>
                            <Button
                              variant={isCompleted ? "outline" : "default"}
                              size="sm"
                              onClick={() => toggleDayCompletion(day.day, isCompleted)}
                              className={isCompleted ? "text-green-600 hover:text-green-700 border-green-200" : ""}
                            >
                              {isCompleted ? "Completed" : "Mark Complete"}
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pl-16 grid md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                                <BookOpen className="h-3 w-3" /> Learn
                              </h4>
                              <p className="text-sm text-muted-foreground">{day.learn.explanation}</p>
                            </div>
                            <div className="bg-muted/30 p-2 rounded text-xs border">
                              <span className="font-semibold">Video Topic:</span> {day.learn.videoTopic}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div>
                              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                                <Wrench className="h-3 w-3" /> Practice
                              </h4>
                              <p className="text-sm text-muted-foreground">{day.practice}</p>
                            </div>
                             <div className="flex gap-2">
                               <Badge variant="outline" className="text-xs bg-primary/5">
                                 Tool: {day.tool}
                               </Badge>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}