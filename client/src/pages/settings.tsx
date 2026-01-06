import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MonitorCog, SunMoon, Code2, MessageCircle } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1">
      <ToolSidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account, appearance, and coding tools.
              </p>
            </div>
            {user && (
              <Badge variant="outline" className="text-xs">
                Signed in as <span className="ml-1 font-medium">{user.email}</span>
              </Badge>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorCog className="h-4 w-4" />
                  Account
                </CardTitle>
                <CardDescription>
                  Update your basic profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {user ? (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="font-medium">{user.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium break-all">{user.email}</div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You are not signed in.
                  </p>
                )}
                <Link href="/profile">
                  <Button size="sm" className="mt-2">
                    Manage profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SunMoon className="h-4 w-4" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Control how E-GROOTS looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Use the theme toggle in the top navigation bar to switch
                  between light and dark mode. Your choice is remembered on
                  this browser.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tip: Dark mode is recommended when spending long time in the
                  coding playground or simulators.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Coding tools
                </CardTitle>
                <CardDescription>
                  How the coding playground behaves.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Supports Python, JavaScript, C++, and Java.</li>
                  <li>Runs your code safely in an online sandbox (Piston).</li>
                  <li>Shows program output and full error messages.</li>
                  <li>Monaco editor with dark theme, word wrap, and line numbers.</li>
                </ul>
                <Link href="/coding">
                  <Button size="sm" variant="outline" className="mt-2">
                    Open coding playground
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  GROOT AI assistant
                </CardTitle>
                <CardDescription>
                  Learn and debug with the built‑in AI helper.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Use the <span className="font-medium">Ask GROOT</span>{" "}
                    button in the header to chat about electronics and IoT.
                  </li>
                  <li>
                    In the coding playground, click{" "}
                    <span className="font-medium">Ask Groot</span> under the
                    output panel to get explanations for errors and suggestions
                    to fix your code.
                  </li>
                  <li>
                    GROOT uses a secure OpenAI API key configured on the server.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


