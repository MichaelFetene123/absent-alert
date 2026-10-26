"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Laptop } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon-sm"}
        className={`text-muted-foreground hover:text-foreground ${className || ""}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="size-4 block" />
        {showLabel && <span className="text-xs">Theme</span>}
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      onClick={toggleTheme}
      className={`relative text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
        showLabel ? "justify-start gap-2.5 px-3 w-full" : "size-8 p-0"
      } ${className || ""}`}
      title={isDark ? "Switch to Light mode (or press 'D')" : "Switch to Dark mode (or press 'D')"}
      aria-label="Toggle light/dark theme"
    >
      <div className="relative size-4 flex items-center justify-center shrink-0">
        <Sun
          className={`size-4 text-primary transition-all duration-300 ${
            isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`size-4 text-primary transition-all duration-300 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between w-full text-xs font-medium">
          <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {isDark ? "Dark" : "Light"}
          </span>
        </div>
      )}
    </Button>
  );
}

/**
 * Three-state segmented toggle: Light | Dark | System
 */
export function ThemeSegmentedToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className={`h-8 w-24 rounded-lg bg-muted animate-pulse ${className || ""}`} />;
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg bg-muted border border-border ${className || ""}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "light"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light theme"
      >
        <Sun className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "dark"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark theme"
      >
        <Moon className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "system"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="System preference"
      >
        <Laptop className="size-3.5" />
      </button>
    </div>
  );
}
