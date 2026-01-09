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
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";
import { getAllTopics } from "@/lib/coding-learning-content";
import { 
  SiC, 
  SiCplusplus, 
  SiPython
} from "react-icons/si";
import { FaJava } from "react-icons/fa";
import { TbBrackets, TbRepeat, TbSquare, TbLetterT, TbFunction } from "react-icons/tb";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const languageBadges = [
  { id: "c", label: "C", color: "bg-gradient-to-br from-sky-500 to-sky-700", sub: "Systems", icon: SiC },
  { id: "cpp", label: "C++", color: "bg-gradient-to-br from-indigo-500 to-indigo-700", sub: "OOP", icon: SiCplusplus },
  { id: "python", label: "Python", color: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black", sub: "Beginner‑friendly", icon: SiPython },
  { id: "java", label: "Java", color: "bg-gradient-to-br from-orange-500 to-orange-700", sub: "Enterprise", icon: FaJava },
];

const topicIcons: Record<string, any> = {
  conditionals: TbBrackets,
  loops: TbRepeat,
  arrays: TbSquare,
  strings: TbLetterT,
  functions: TbFunction,
};

// Three.js Background Component
function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create floating particles
    const particles: THREE.Mesh[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.7, 0.6),
        transparent: true,
        opacity: 0.6,
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      scene.add(particle);
      particles.push(particle);
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      particles.forEach((particle, i) => {
        particle.rotation.x += 0.01;
        particle.rotation.y += 0.01;
        particle.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
        particle.position.x += Math.cos(Date.now() * 0.001 + i) * 0.01;
      });

      camera.rotation.z += 0.001;
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      particles.forEach((particle) => {
        particle.geometry.dispose();
        (particle.material as THREE.Material).dispose();
        scene.remove(particle);
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10 opacity-20 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default function CodingLearning() {
  const topics = getAllTopics();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto relative">
      <AnimatedBackground />
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
              {languageBadges.map((lang, idx) => {
                const IconComponent = lang.icon;
                return (
                  <motion.div
                    key={lang.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-3 rounded-xl bg-slate-900/80 backdrop-blur-sm px-3 py-2.5 border border-slate-700/70 shadow-lg hover:shadow-xl transition-all cursor-default"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${lang.color} shadow-md`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-semibold text-slate-100">{lang.label}</span>
                      <span className="text-[11px] text-slate-400">{lang.sub}</span>
                    </div>
                  </motion.div>
                );
              })}
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
        className="relative bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-start gap-4">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex-shrink-0 shadow-md border border-primary/20"
          >
            <BookOpen className="h-6 w-6" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Why Learn Concepts First?
            </h2>
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
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:border-primary/60 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/40 border-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all shadow-md border border-primary/20"
                      >
                        {(() => {
                          const IconComponent = topicIcons[topic.id] || Code;
                          return <IconComponent className="h-6 w-6 text-primary" />;
                        })()}
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.div>
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2 font-bold">
                      {topic.title}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed">
                      {topic.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 flex items-center justify-between relative">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[11px] border-primary/40 bg-primary/10 text-primary font-medium">
                        Concept
                      </Badge>
                      <Badge variant="outline" className="text-[11px] border-slate-400/50 bg-slate-500/10 text-slate-600 dark:text-slate-300">
                        Language‑independent
                      </Badge>
                    </div>
                    <Button className="gap-1 shadow-md hover:shadow-lg" size="sm" variant="outline">
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Access Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30 rounded-xl p-5 text-center shadow-lg overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-sm text-muted-foreground relative">
          After learning each concept, you can practice directly in the{" "}
          <Link href="/code-editor" className="text-primary hover:text-primary/80 font-semibold underline decoration-2 underline-offset-2 transition-colors">
            Code Editor
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

