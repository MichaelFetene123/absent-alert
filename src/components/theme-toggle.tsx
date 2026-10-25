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
        className={`text-slate-500 hover:text-slate-900 dark:hover:text-white ${className || ""}`}
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
      className={`relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
        showLabel ? "justify-start gap-2.5 px-3 w-full" : "size-8 p-0"
      } ${className || ""}`}
      title={isDark ? "Switch to Light mode (or press 'D')" : "Switch to Dark mode (or press 'D')"}
      aria-label="Toggle light/dark theme"
    >
      <div className="relative size-4 flex items-center justify-center shrink-0">
        <Sun
          className={`size-4 text-amber-500 transition-all duration-300 ${
            isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`size-4 text-blue-400 transition-all duration-300 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between w-full text-xs font-medium">
          <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
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
    return <div className={`h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse ${className || ""}`} />;
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 ${className || ""}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "light"
            ? "bg-white text-amber-600 shadow-xs dark:bg-slate-700"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
            ? "bg-white text-blue-500 shadow-xs dark:bg-slate-700 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        title="System preference"
      >
        <Laptop className="size-3.5" />
      </button>
    </div>
  );
}
