import { useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ElectronicSimulation from "@/pages/electronic-simulation";
import IoTSimulatorPage from "@/pages/iot-simulator";
import CourseDetail from "@/pages/course-detail";
import About from "@/pages/about";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import Help from "@/pages/help";
import NocodeEditor from "./pages/no-code-editor";
import CodingLearning from "@/pages/coding-learning";
import CodingLearnTopic from "@/pages/coding-learn-topic";
import CodeEditorPage from "@/pages/code-editor";
import RoboticsHelper from "./pages/robotics-helper";
import Settings from "@/pages/settings";
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, useLayout = true }: { component: () => JSX.Element; useLayout?: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setIsRedirecting(true);
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || isRedirecting) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  if (useLayout) {
    return (
      <AppLayout>
        <Component />
      </AppLayout>
    );
  }

  return <Component />;
}

function PublicOnlyRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setIsRedirecting(true);
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || isRedirecting) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <LoadingScreen />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/login">
        <PublicOnlyRoute component={Login} />
      </Route>
      <Route path="/signup">
        <PublicOnlyRoute component={Signup} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/electronic-simulation">
        <ProtectedRoute component={ElectronicSimulation} />
      </Route>
      <Route path="/iot-simulation">
        <ProtectedRoute component={IoTSimulatorPage} />
      </Route>
      <Route path="/no-code-editor">
        <ProtectedRoute component={NocodeEditor} />
      </Route>
      <Route path="/robotics-helper">
        <ProtectedRoute component={RoboticsHelper} />
      </Route>
      <Route path="/coding">
        <ProtectedRoute component={CodingLearning} />
      </Route>
      <Route path="/coding/learn/:topic">
        <ProtectedRoute component={CodingLearnTopic} />
      </Route>
      <Route path="/code-editor">
        <ProtectedRoute component={CodeEditorPage} />
      </Route>
      <Route path="/courses/:id">
        <ProtectedRoute component={CourseDetail} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/help">
        <ProtectedRoute component={Help} />
      </Route>
      <Route path="/about">
        <AppLayout>
          <About />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
