import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MonitorCog, SunMoon, Code2, MessageCircle, ArrowRight, Settings2, Shield, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1">
      <ToolSidebar />

      <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Settings2 className="h-7 w-7 text-primary" />
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account, appearance, and platform preferences
              </p>
            </div>
            {user && (
              <Badge variant="outline" className="text-sm px-4 py-2 bg-card border-border/50">
                <Shield className="h-3 w-3 mr-2" />
                Signed in as <span className="ml-1 font-semibold">{user.email}</span>
              </Badge>
            )}
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MonitorCog className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Account</CardTitle>
                  </div>
                  <CardDescription>
                    Update your basic profile information and account settings
                  </CardDescription>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent className="space-y-4">
                  {user ? (
                    <>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</div>
                        <div className="text-base font-semibold">{user.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</div>
                        <div className="text-base font-semibold break-all">{user.email}</div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You are not signed in.
                    </p>
                  )}
                  <Link href="/profile">
                    <Button size="sm" className="w-full mt-4 group">
                      Manage Profile
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
                      <SunMoon className="h-5 w-5 text-chart-1" />
                    </div>
                    <CardTitle>Appearance</CardTitle>
                  </div>
                  <CardDescription>
                    Control how E-GROOTS looks on your device
                  </CardDescription>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm leading-relaxed">
                      Use the theme toggle in the top navigation bar to switch
                      between light and dark mode. Your choice is remembered on
                      this browser.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-chart-4/5 border border-chart-4/20">
                    <Bell className="h-4 w-4 text-chart-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Tip:</span> Dark mode is recommended when spending long time in the
                      coding playground or simulators.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <Code2 className="h-5 w-5 text-chart-2" />
                    </div>
                    <CardTitle>Coding Tools</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your coding playground experience
                  </CardDescription>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Multi-language Support</p>
                        <p className="text-xs text-muted-foreground">Python, JavaScript, C++, and Java</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Safe Execution</p>
                        <p className="text-xs text-muted-foreground">Runs in secure online sandbox (Piston)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Advanced Editor</p>
                        <p className="text-xs text-muted-foreground">Monaco editor with syntax highlighting</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/coding">
                    <Button size="sm" variant="outline" className="w-full mt-4 group">
                      Open Coding Playground
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="md:col-span-2"
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-chart-5" />
                    </div>
                    <CardTitle>GROOT AI Assistant</CardTitle>
                  </div>
                  <CardDescription>
                    Learn and debug with the built‑in AI helper
                  </CardDescription>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <p className="text-sm font-semibold">Header Chat</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Use the <span className="font-medium text-foreground">Ask GROOT</span> button in the header to chat about electronics and IoT.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-chart-1" />
                        <p className="text-sm font-semibold">Code Help</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        In the coding playground, click <span className="font-medium text-foreground">Ask Groot</span> under the output panel for error explanations.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-chart-4" />
                        <p className="text-sm font-semibold">Secure & Private</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        GROOT uses a secure OpenAI API key configured on the server for your privacy.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}


