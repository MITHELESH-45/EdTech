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
  BookOpen,
  Sparkles,
  Braces,
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";
import { getAllTopics } from "@/lib/coding-learning-content";

const languageBadges = [
  { id: "c", label: "C", color: "bg-sky-600", sub: "Systems" },
  { id: "cpp", label: "C++", color: "bg-indigo-600", sub: "OOP" },
  { id: "python", label: "Python", color: "bg-yellow-500 text-black", sub: "Beginner‑friendly" },
  { id: "java", label: "Java", color: "bg-orange-500", sub: "Enterprise" },
];

export default function CodingLearning() {
  const topics = getAllTopics();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header / Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top,_#22c55e33,_transparent_60%),_radial-gradient(circle_at_bottom,_#0ea5e933,_transparent_55%)]" />
          <CardContent className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-3 w-3" />
                Concept‑first coding journey
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-400/40">
                  <Code className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Coding Fundamentals
                  </h1>
                  <p className="text-sm md:text-base text-slate-300/90 mt-1">
                    Learn the core ideas behind every language—conditionals, loops,
                    arrays, strings, and functions—before you ever touch the editor.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Cpu className="h-3 w-3" />
                  Practice concepts that apply to all languages:
                </span>
                <Badge variant="outline" className="border-emerald-400/60 bg-emerald-400/10 text-emerald-200">
                  Conditionals
                </Badge>
                <Badge variant="outline" className="border-sky-400/60 bg-sky-400/10 text-sky-200">
                  Loops
                </Badge>
                <Badge variant="outline" className="border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-200">
                  Arrays & Strings
                </Badge>
                <Badge variant="outline" className="border-amber-400/60 bg-amber-400/10 text-amber-200">
                  Functions
                </Badge>
              </div>
            </div>

            {/* Language logos */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
              {languageBadges.map((lang) => (
                <div
                  key={lang.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-900/70 px-3 py-2 border border-slate-700/70 shadow-sm"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold uppercase ${lang.color}`}
                  >
                    {lang.label}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-slate-100">{lang.label}</span>
                    <span className="text-[11px] text-slate-400">{lang.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        {/* <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Coding Playground</span> */}
      </motion.div>

      {/* Description / Onboarding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Why Learn Concepts First?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Before diving into coding, it's essential to understand the fundamental concepts that apply across all programming languages. 
              This module teaches you the core ideas behind conditionals, loops, arrays, strings, and functions - concepts that are universal 
              whether you're coding in C, Python, Java, or any other language. Once you understand these concepts, you'll be able to write 
              code more confidently and solve problems more effectively.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Topic Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <Link href={`/coding/learn/${topic.id}`}>
              <Card className="h-full hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-b from-background to-muted/60">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {topic.id === "conditionals" && <Braces className="h-5 w-5 text-primary" />}
                      {topic.id === "loops" && <Code className="h-5 w-5 text-primary" />}
                      {topic.id === "arrays" && <Cpu className="h-5 w-5 text-primary" />}
                      {topic.id === "strings" && <Code className="h-5 w-5 text-primary rotate-90" />}
                      {topic.id === "functions" && <Sparkles className="h-5 w-5 text-primary" />}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {topic.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">
                    {topic.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[11px] border-primary/40 text-primary">
                      Concept
                    </Badge>
                    <Badge variant="outline" className="text-[11px] border-slate-400/50 text-slate-600 dark:text-slate-300">
                      Language‑independent
                    </Badge>
                  </div>
                  <Button className="gap-1" size="sm" variant="outline">
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Access Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center"
      >
        <p className="text-sm text-muted-foreground">
          After learning each concept, you can practice directly in the{" "}
          <Link href="/code-editor" className="text-primary hover:underline font-medium">
            Code Editor
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

