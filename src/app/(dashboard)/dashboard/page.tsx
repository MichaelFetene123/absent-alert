import { requireUser } from "@/lib/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCheck, CalendarCheck, Users, History, Bell } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user.name || "Colleague"}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AbsentAlert staff portal · Authenticated as {user.email}
          </p>
        </div>
        <Badge
          className={
            user.role === "ADMIN"
              ? "bg-purple-600 text-white px-3 py-1 text-xs"
              : "bg-blue-600 text-white px-3 py-1 text-xs"
          }
        >
          {user.role === "ADMIN" ? "Administrator Access" : "Teacher Access"}
        </Badge>
      </div>

      {/* Auth & Security Status Banner */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
            Step 4: Authentication & Role Guard Verified
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            NextAuth v5 session active with bcrypt password authentication. Role:{" "}
            <code className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded">
              {user.role}
            </code>
            . Server actions and routes are guarded with strict server-side checks.
          </p>
        </div>
      </div>

      {/* Role Permissions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="size-4 text-blue-600" />
              Active Role Capabilities
            </CardTitle>
            <CardDescription>
              {user.role === "ADMIN"
                ? "Full administrative control over students, staff, and system notifications"
                : "Class-level attendance marking and notification review"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {user.role === "ADMIN" ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>Manage students & guardian phone numbers</li>
                <li>Assign teachers to classes</li>
                <li>Mark attendance across all school classes</li>
                <li>Review all SMS notifications & retry failed attempts</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                <li>View assigned classes ("Class 7 B")</li>
                <li>Mark daily attendance (Present, Absent, Leave, Late)</li>
                <li>Trigger automated SMS notifications for absent students</li>
                <li>View notification logs for assigned students</li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4 text-purple-600" />
              Next Implementation Steps
            </CardTitle>
            <CardDescription>
              Planned features as specified in AbsentAlert Roadmap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Step 5: Zod Validation Schemas
              </span>
              <Badge variant="outline" className="text-xs">
                Upcoming
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Step 6: Student Management CRUD
              </span>
              <Badge variant="outline" className="text-xs">
                Upcoming
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Step 7 & 8: Attendance Service & Daily Screen
              </span>
              <Badge variant="outline" className="text-xs">
                Upcoming
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/students"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all group"
        >
          <div className="size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="size-4" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Students</h3>
          <p className="text-xs text-slate-500 mt-1">Directory and guardian phone numbers</p>
        </Link>

        <Link
          href="/attendance"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all group"
        >
          <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <CalendarCheck className="size-4" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Daily Attendance</h3>
          <p className="text-xs text-slate-500 mt-1">Mark attendance by class & date</p>
        </Link>

        <Link
          href="/notifications"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all group"
        >
          <div className="size-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <History className="size-4" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">SMS History</h3>
          <p className="text-xs text-slate-500 mt-1">SMSHub logs and retry delivery</p>
        </Link>
      </div>
    </div>
  );
}
