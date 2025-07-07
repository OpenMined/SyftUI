"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FloatingThemeToggleProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

export function FloatingThemeToggle({
  position = "bottom-right",
  className = "",
}: FloatingThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-background rounded-full border p-1 shadow-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className={cn(
                  "relative flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none",
                  theme === "dark" ? "bg-slate-700" : "bg-yellow-100",
                  className,
                )}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <div
                  className={cn(
                    "bg-background absolute flex h-4 w-4 items-center justify-center rounded-full shadow-md transition-all duration-300",
                    theme === "dark" ? "translate-x-7" : "translate-x-1",
                  )}
                >
                  {theme === "dark" ? (
                    <Moon className="h-2.5 w-2.5 text-slate-700" />
                  ) : (
                    <Sun className="h-2.5 w-2.5 text-yellow-500" />
                  )}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{theme === "dark" ? "Dark" : "Light"} mode active</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
