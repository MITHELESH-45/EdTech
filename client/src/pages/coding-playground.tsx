import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  ArrowRight,
  Sparkles,
  Braces,
  Cpu,
  Repeat,
  FunctionSquare,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface CodingComponent {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  if: Braces,
  loop: Repeat,
  array: Cpu,
  string: Code,
  function: FunctionSquare,
};

export default function CodingPlayground() {
  const [components, setComponents] = useState<CodingComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await fetch("/api/coding/components");
        if (res.ok) {
          const data = await res.json();
          setComponents(data);
        }
      } catch (error) {
        console.error("Failed to fetch components:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header / Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top,_#22c55e33,_transparent_60%),_radial-gradient(circle_at_bottom,_#0ea5e933,_transparent_55%)]" />
          <CardContent className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-3 w-3" />
                Practice coding with real problems
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-400/40">
                  <Code className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Coding Playground
                  </h1>
                  <p className="text-sm md:text-base text-slate-300/90 mt-1">
                    Master programming fundamentals by solving problems. Each component has 3 questions with 6 testcases to pass.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="border-emerald-400/60 bg-emerald-400/10 text-emerald-200">
                  15 Questions
                </Badge>
                <Badge variant="outline" className="border-sky-400/60 bg-sky-400/10 text-sky-200">
                  90 Testcases
                </Badge>
                <Badge variant="outline" className="border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-200">
                  Instant Feedback
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Component Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {components.map((component, index) => {
          const IconComponent = iconMap[component.icon] || Code;
          return (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Link href={`/coding-playground/${component.id}`}>
                <Card className="h-full hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-b from-background to-muted/60">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {component.name}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed">
                      {component.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[11px] border-primary/40 text-primary">
                        3 Questions
                      </Badge>
                      <Badge variant="outline" className="text-[11px] border-slate-400/50 text-slate-600 dark:text-slate-300">
                        18 Testcases
                      </Badge>
                    </div>
                    <Button className="gap-1" size="sm" variant="outline">
                      Start
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Access Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Each question opens in the code editor where you can write, test, and submit your solution.
        </p>
      </motion.div>
    </div>
  );
}

