import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggleSwitch() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-16 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full" />;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className={`
              relative flex items-center w-16 h-8 p-1 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
              ${isDark ? "bg-slate-950 border border-slate-800" : "bg-sky-100 border border-sky-200"}
            `}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {/* Background Glow */}
            <div
              className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                isDark ? "opacity-0" : "opacity-100"
              }`}
            />

            {/* Sliding Thumb */}
            <motion.div
              layout
              transition={{
                type: "spring",
                stiffness: 700,
                damping: 30,
              }}
              className={`
                relative z-10 flex items-center justify-center w-6 h-6 rounded-full shadow-md
                ${isDark ? "bg-slate-800 text-blue-400" : "bg-white text-orange-500"}
              `}
              animate={{
                x: isDark ? 32 : 0,
              }}
            >
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? (
                  <Moon className="w-4 h-4 fill-current" />
                ) : (
                  <Sun className="w-4 h-4 fill-current" />
                )}
              </motion.div>
            </motion.div>
            
            {/* Background Icons (Static) */}
            <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                <Sun className={`w-3 h-3 text-orange-400/50 ${!isDark ? 'opacity-0' : 'opacity-100'}`} />
                <Moon className={`w-3 h-3 text-slate-400/50 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
