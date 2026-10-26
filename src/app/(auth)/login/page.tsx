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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillCredentials = (role: "admin" | "teacher") => {
    if (role === "admin") {
      setEmail("admin@gmail.com");
      setPassword("admin@123");
    } else {
      setEmail("teacher@gmail.com");
      setPassword("teacher@123");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Bell className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AbsentAlert
          </h1>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {state?.error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-start gap-2.5">
                <ShieldAlert className="size-5 shrink-0 text-red-600 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@school.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isPending}
              >
                {isPending ? "Signing in..." : "Sign in to AbsentAlert"}
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Quick Test Accounts (Seeded)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("admin")}
                  className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Admin
                  </span>
                  <span className="text-slate-500 block truncate">admin@gmail.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("teacher")}
                  className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Teacher
                  </span>
                  <span className="text-slate-500 block truncate">teacher@gmail.com</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
