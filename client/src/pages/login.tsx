import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Zap, LogIn } from "lucide-react";

// Type declaration for Vanta.js
declare global {
  interface Window {
    VANTA?: {
      GLOBE?: (options: {
        el: HTMLElement | string;
        mouseControls?: boolean;
        touchControls?: boolean;
        gyroControls?: boolean;
        minHeight?: number;
        minWidth?: number;
        scale?: number;
        scaleMobile?: number;
        backgroundColor?: string | number;
        color?: string | number;
        color2?: string | number;
      }) => {
        destroy: () => void;
      };
    };
  }
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Load Vanta.js scripts dynamically
    const loadVantaScripts = () => {
      return new Promise<void>((resolve) => {
        // Check if scripts are already loaded
        if (window.VANTA && window.VANTA.GLOBE) {
          resolve();
          return;
        }

        // Load Three.js
        const threeScript = document.createElement("script");
        threeScript.src = "https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js";
        threeScript.async = true;
        threeScript.onload = () => {
          // Load Vanta Globe after Three.js
          const vantaScript = document.createElement("script");
          vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js";
          vantaScript.async = true;
          vantaScript.onload = () => resolve();
          document.body.appendChild(vantaScript);
        };
        document.body.appendChild(threeScript);
      });
    };

    // Initialize Vanta effect
    loadVantaScripts().then(() => {
      if (vantaRef.current && window.VANTA && window.VANTA.GLOBE) {
        vantaEffect.current = window.VANTA.GLOBE({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: 0x0a0e27,
          color: 0x5f9ea0,
          color2: 0x87ceeb
        });
      }
    });

    // Cleanup function
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => {
      const result = login(data.email, data.password);
      setIsLoading(false);
      
      if (result.success) {
        setLocation("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        });
      }
    }, 300);
  };

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 -translate-x-8 md:-translate-x-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-white drop-shadow-lg">E-GROOTS</span>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-white/80">Sign in to continue learning electronics</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          data-testid="input-email"
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          data-testid="input-password"
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                  <LogIn className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-white/80">
              Don't have an account?{" "}
              <Link href="/signup" className="text-white hover:text-white/80 hover:underline font-semibold" data-testid="link-signup">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
