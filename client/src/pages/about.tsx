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
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-primary"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              About E-GROOTS
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              A learning-first electronics and IoT education platform where you can learn, 
              simulate, and build with confidence.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard" data-testid="link-start-learning">
                <Button size="lg" data-testid="button-start-learning">
                  Start Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/electronic-simulation" data-testid="link-try-simulator">
                <Button size="lg" variant="outline" data-testid="button-try-simulator">
                  Try Simulator
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* What is E-GROOTS */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-3">What is E-GROOTS?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                E-GROOTS is a modern digital electronics lab that combines structured 
                learning with interactive simulation tools.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{feature.title}</h3>
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
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-3">Who is E-GROOTS For?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're just starting out or looking to expand your skills, 
                E-GROOTS is designed for learners at every level.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {targetAudiences.map((audience) => {
                const Icon = audience.icon;
                return (
                  <Card key={audience.title}>
                    <CardContent className="p-5 text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg bg-chart-1/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-chart-1" />
                      </div>
                      <h3 className="font-semibold mb-1">{audience.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
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
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-3">Problems We Solve</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Traditional electronics education can be challenging. We're changing that.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-primary mb-2">01</div>
                <h3 className="font-semibold mb-2">Abstract Concepts</h3>
                <p className="text-sm text-muted-foreground">
                  Visual simulations make complex concepts tangible and easier to understand.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-chart-2 mb-2">02</div>
                <h3 className="font-semibold mb-2">Expensive Hardware</h3>
                <p className="text-sm text-muted-foreground">
                  Practice without buying physical components. Learn and experiment risk-free.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-chart-4 mb-2">03</div>
                <h3 className="font-semibold mb-2">Fragmented Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Integrated courses and tools in one platform for a seamless learning experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Future Vision */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-3">Our Vision</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're building the future of electronics education with exciting features on the roadmap.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {futureVision.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title}>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg bg-chart-5/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-chart-5" />
                      </div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
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
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Ready to Start Learning?
            </h2>
            <p className="text-muted-foreground mb-8">
              Begin your electronics journey today with our structured courses and 
              interactive simulation tools.
            </p>
            <Link href="/dashboard" data-testid="link-get-started">
              <Button size="lg" data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-medium text-sm">E-GROOTS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Learn Electronics. Simulate Visually. Build Confidently.
          </p>
        </div>
      </footer>
    </div>
  );
}
