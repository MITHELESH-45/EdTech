import { User, ChevronDown, Settings, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggleSwitch } from "@/components/iot-simulation/ThemeToggleSwitch";
import { GrootChatModal } from "@/components/groot/GrootChatModal";
import { useState } from "react";
import GrootSvg from "@/components/ui/groot";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [grootOpen, setGrootOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-logo-home">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">E-GROOTS</span>
        </Link>

        <div className="flex items-center gap-1 ml-auto"> 
          {/* Ask GROOT Button - Only show when authenticated */}
          {isAuthenticated && (
            <div
              onClick={() => setGrootOpen(true)}
              className="flex items-center justify-center cursor-pointer px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:shadow-md transition-all duration-200 hover:scale-105"
              data-testid="button-ask-groot"
            >
              <span className="font-medium text-xs mr-1.5">Ask GROOT</span>
              <GrootSvg width={20} height={20} fill="#6B4F2A" className="dark:fill-emerald-400" />
            </div>
          )}
          <Link href="/about">
            <Button variant="ghost" size="sm" data-testid="link-about">
              About
            </Button>
          </Link>

          <div className="pl-2 border-l border-border">
            <ThemeToggleSwitch />
          </div>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                  data-testid="button-profile-dropdown"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                
                <Link href="/profile">
                  <DropdownMenuItem data-testid="menu-item-profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem data-testid="menu-item-settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <Link href="/help">
                  <DropdownMenuItem data-testid="menu-item-help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleLogout}
                  data-testid="menu-item-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" data-testid="button-login">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* GROOT Chat Modal */}
      <GrootChatModal open={grootOpen} onOpenChange={setGrootOpen} />
    </header>
  );
}