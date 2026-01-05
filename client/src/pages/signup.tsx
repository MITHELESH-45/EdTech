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
import { Zap, UserPlus } from "lucide-react";

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

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
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

  const onSubmit = (data: SignupForm) => {
    setIsLoading(true);
    setTimeout(() => {
      const result = signup(data.email, data.password, data.name);
      setIsLoading(false);
      
      if (result.success) {
        toast({
          title: "Account created",
          description: "Welcome to E-GROOTS! Your account has been created successfully.",
        });
        setLocation("/dashboard");
      } else {
        toast({
          title: "Signup failed",
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
            <CardTitle className="text-xl text-white">Create an account</CardTitle>
            <CardDescription className="text-white/80">Start your electronics learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          data-testid="input-name"
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
                          placeholder="At least 6 characters"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirm your password"
                          type="password"
                          data-testid="input-confirm-password"
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
                  data-testid="button-signup"
                >
                  {isLoading ? "Creating account..." : "Create account"}
                  <UserPlus className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-white/80">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:text-white/80 hover:underline font-semibold" data-testid="link-login">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
