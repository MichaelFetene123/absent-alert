"use client";

import { useActionState, useState } from "react";
import { loginAction, type AuthActionResult } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, Lock, Mail, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "teacher">("admin");

  const fillCredentials = (role: "admin" | "teacher") => {
    setActiveTab(role);
    if (role === "admin") {
      setEmail("admin@gmail.com");
      setPassword("admin@123");
    } else {
      setEmail("teacher@gmail.com");
      setPassword("teacher@123");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      {/* Ambient Radial Gradient Mesh Background */}
      <div className="absolute top-1/4 -left-40 size-96 rounded-full bg-blue-500/15 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 size-96 rounded-full bg-indigo-500/15 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 size-80 rounded-full bg-emerald-500/10 dark:bg-emerald-600/5 blur-3xl pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-20">
        <div className="p-1 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-xs">
          <ThemeToggle />
        </div>
      </header>

      <div className="relative w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/10 dark:ring-blue-500/20 transform hover:scale-105 transition-transform duration-200">
            <Bell className="size-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AbsentAlert
          </h1>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6 pt-0">
            {state?.error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 animate-in fade-in duration-200">
                <ShieldAlert className="size-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@school.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {activeTab === "admin" ? "admin@123" : "teacher@123"}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-98 gap-1.5"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Sign in to Dashboard</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Demo Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3 text-amber-500" /> Demo credentials auto-filled
                </span>
                <span className="font-mono text-slate-400">v0.0.1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
