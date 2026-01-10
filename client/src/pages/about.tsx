import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  BookOpen,
  Cpu,
  Globe,
  Blocks,
  Users,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  Zap,
  Target,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Structured Learning",
    description: "Progressive courses from basics to advanced topics, designed for self-paced learning.",
  },
  {
    icon: Cpu,
    title: "Visual Simulation",
    description: "Interactive circuit builder to practice and visualize electronic concepts in real-time.",
  },
  {
    icon: Globe,
    title: "IoT Integration",
    description: "Coming soon: Learn IoT concepts with connected device simulations.",
  },
  {
    icon: Blocks,
    title: "No-Code Workflows",
    description: "Coming soon: Build automation and workflows without writing code.",
  },
];

const targetAudiences = [
  {
    icon: GraduationCap,
    title: "Students",
    description: "Perfect for electronics and engineering students learning fundamentals.",
  },
  {
    icon: Lightbulb,
    title: "Beginners",
    description: "Start from zero with guided tutorials and hands-on practice.",
  },
  {
    icon: Zap,
    title: "Makers & Hobbyists",
    description: "Prototype and test circuits before building physical projects.",
  },
  {
    icon: Target,
    title: "Educators",
    description: "Teaching tool for classrooms and online courses.",
  },
];

const futureVision = [
  {
    icon: Layers,
    title: "AI-Powered Learning",
    description: "Personalized learning paths and intelligent circuit analysis.",
  },
  {
    icon: Globe,
    title: "Cloud Projects",
    description: "Save, share, and collaborate on circuit designs online.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Join a community of learners and share your projects.",
  },
];

export default function About() {
  return (
    <div className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[600px] md:h-[700px] border-b border-border overflow-hidden">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          >
            <source src="/landing.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
          
          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-6 text-center">

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-grey mb-4 drop-shadow-lg">
                About E-GROOTS
              </h1>

              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed drop-shadow-md">
                A learning-first electronics and IoT education platform where you can learn,
                simulate, and build with confidence.
              </p>

              <div className="flex items-center justify-center gap-4">
                <Link href="/login" data-testid="link-start-learning">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" data-testid="button-start-learning">
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/login" data-testid="link-try-simulator">
                  <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm" data-testid="button-try-simulator">
                    Try Simulator
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* What is E-GROOTS */}
        <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-background to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_2px,transparent_2px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-90"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What is E-GROOTS?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                E-GROOTS is a modern digital electronics lab that combines structured 
                learning with interactive simulation tools.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Who is it for */}
        <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-br from-muted/50 via-muted/30 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_100%)]"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Who is E-GROOTS For?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Whether you're just starting out or looking to expand your skills, 
                E-GROOTS is designed for learners at every level.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {targetAudiences.map((audience) => {
                const Icon = audience.icon;
                return (
                  <Card key={audience.title} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-chart-1/20 to-chart-1/10 flex items-center justify-center mb-4 border border-chart-1/20">
                        <Icon className="h-8 w-8 text-chart-1" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{audience.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {audience.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Problems We Solve */}
        <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-br from-orange-50/30 via-background to-red-50/20 dark:from-orange-950/10 dark:via-background dark:to-red-950/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Problems We Solve</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Traditional electronics education can be challenging. We're changing that.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-8 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="text-5xl font-bold text-primary mb-3">01</div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Abstract Concepts</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Visual simulations make complex concepts tangible and easier to understand.
                  </p>
                </div>
              </div>
              <div className="text-center p-8 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="text-5xl font-bold text-chart-2 mb-3">02</div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Expensive Hardware</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Practice without buying physical components. Learn and experiment risk-free.
                  </p>
                </div>
              </div>
              <div className="text-center p-8 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="text-5xl font-bold text-chart-4 mb-3">03</div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Fragmented Learning</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Integrated courses and tools in one platform for a seamless learning experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Future Vision */}
        <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-br from-green-50/30 via-muted/30 to-emerald-50/20 dark:from-green-950/10 dark:via-muted/30 dark:to-emerald-950/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_50%)]"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Vision</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                We're building the future of electronics education with exciting features on the roadmap.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {futureVision.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-chart-5/20 to-chart-5/10 flex items-center justify-center mb-4 border border-chart-5/20">
                        <Icon className="h-8 w-8 text-chart-5" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-chart-1/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Begin your electronics journey today with our structured courses and 
              interactive simulation tools.
            </p>
            <Link href="/login" data-testid="link-get-started">
              <Button size="lg" className="text-lg px-4 py-2 h-auto shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-gradient-to-b from-background to-muted/20 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} E-GROOTS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
