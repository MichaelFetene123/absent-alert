"use client";

import { useState } from "react";
import { useLoginMutation } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Bell,
  Lock,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const isPending = loginMutation.isPending;
  const state = loginMutation.data;

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
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background text-foreground overflow-hidden select-none">
      {/* Ambient Radial Gradient Mesh Background */}
      <div className="absolute top-1/4 -left-40 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-20">
        <div className="p-1 rounded-xl bg-card/80 border border-border backdrop-blur-md shadow-xs">
          <ThemeToggle />
        </div>
      </header>

      <div className="relative w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-4 ring-primary/10 transform hover:scale-105 transition-transform duration-200">
            <Bell className="size-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            AbsentAlert
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
            Attendance tracking &amp; automated guardian SMS alerts
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border bg-card text-card-foreground shadow-xl rounded-2xl overflow-hidden">
          {/* Quick Demo Switcher Tabs */}
          <div className="p-2 border-b border-border bg-muted/40">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
                  activeTab === "admin"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("teacher")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
                  activeTab === "teacher"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GraduationCap className="size-3.5 text-primary" />
                <span>Teacher Login</span>
              </button>
            </div>
          </div>

          <CardHeader className="pt-3 pb-2 px-6">
            <CardTitle className="text-lg font-bold text-foreground">
              {activeTab === "admin" ? "Administrator Access" : "Teacher Access"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6 pt-0">
            {state?.error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex items-start gap-2.5 animate-in fade-in duration-200">
                <ShieldAlert className="size-4 shrink-0 text-destructive mt-0.5" />
                <span>{state?.error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                loginMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@school.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 text-xs rounded-xl"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 text-xs rounded-xl"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl font-semibold text-xs shadow-md transition-all duration-200 active:scale-98 gap-1.5"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
