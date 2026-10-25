"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Users,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  School,
  Smartphone,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCheck,
  Activity,
  Zap,
  TrendingUp,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { retryNotification } from "@/actions/notification.actions";
import type { DashboardOverviewResult } from "@/lib/services/attendance.service";

type Props = {
  data: DashboardOverviewResult;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: "ADMIN" | "TEACHER";
  };
};

export function DashboardView({ data, user }: Props) {
  const router = useRouter();
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  // Formatted date string for today
  const todayFormatted = React.useMemo(() => {
    const d = new Date(data.todayDate + "T00:00:00Z");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }, [data.todayDate]);

  // Attendance completion percentage across accessible classes
  const classesProgress = React.useMemo(() => {
    const total = data.accessibleClasses.length;
    if (total === 0) return 0;
    const completed = total - data.unmarkedClasses.length;
    return Math.round((completed / total) * 100);
  }, [data.accessibleClasses, data.unmarkedClasses]);

  // SMS acceptance rate
  const smsSuccessRate = React.useMemo(() => {
    const { accepted, failed } = data.smsSummary;
    const total = accepted + failed;
    if (total === 0) return 100;
    return Math.round((accepted / total) * 100);
  }, [data.smsSummary]);

  async function handleRetry(notifId: string, studentName: string) {
    if (!data.isAdmin) {
      toast.error("Only administrators can retry SMS dispatch.");
      return;
    }

    setRetryingId(notifId);
    try {
      const res = await retryNotification(notifId);
      if (res.ok) {
        toast.success(`SMS retry accepted for ${studentName}`);
        router.refresh();
      } else {
        toast.error(`Retry failed: ${res.error || "SMSHub rejection"}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to retry notification");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* SaaS Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 p-6 md:p-8 shadow-xs">
        {/* Ambient background blur elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                SMSHub Gateway Active
              </span>

              <Badge
                variant="outline"
                className={
                  data.isAdmin
                    ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium text-xs px-2.5 py-0.5"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium text-xs px-2.5 py-0.5"
                }
              >
                {data.isAdmin ? "Administrator Workspace" : "Teacher Assigned Portal"}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Good day, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300">{user.name || (data.isAdmin ? "Administrator" : "Teacher")}</span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {todayFormatted} · Real-time attendance monitoring, automatic guardian SMS dispatches, and chronic absence analytics.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {data.accessibleClasses.length > 0 && (
              <Link href={`/attendance?classId=${data.accessibleClasses[0]!.id}&date=${data.todayDate}`}>
                <Button className="h-11 px-5 rounded-xl gap-2 font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 hover-lift">
                  <CalendarCheck className="size-4" />
                  Mark Today&apos;s Attendance
                </Button>
              </Link>
            )}

            {data.accessibleClasses.length > 0 && (
              <Link href={`/attendance/overview?classId=${data.accessibleClasses[0]!.id}`}>
                <Button variant="outline" className="h-11 px-4 rounded-xl gap-2 text-xs font-medium border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs hover-lift">
                  <CalendarDays className="size-4 text-blue-600 dark:text-blue-400" />
                  Two-Week Grid
                </Button>
              </Link>
            )}

            <Link href="/notifications">
              <Button variant="outline" className="h-11 px-4 rounded-xl gap-2 text-xs font-medium border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs hover-lift">
                <History className="size-4 text-purple-600 dark:text-purple-400" />
                SMS Logs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Active Students */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs hover-lift transition-all hover:border-blue-500/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-5">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </CardTitle>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {data.totalActiveStudents}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{data.accessibleClasses.length}</span> {data.accessibleClasses.length === 1 ? "accessible class" : "accessible classes"}
            </div>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white dark:via-slate-900/80 to-transparent shadow-xs hover-lift transition-all hover:border-emerald-500/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-5">
            <CardTitle className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Present Today
            </CardTitle>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-200">
                {data.todayStats.present}
              </span>
              {data.todayStats.attendanceRate !== null && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {data.todayStats.attendanceRate}% Rate
                </span>
              )}
            </div>
            {/* Visual mini-bar */}
            <div className="w-full bg-emerald-100 dark:bg-emerald-950/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${data.todayStats.attendanceRate ?? 0}%` }}
              />
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
              {data.todayStats.totalMarked} students recorded today
            </p>
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-white dark:via-slate-900/80 to-transparent shadow-xs hover-lift transition-all hover:border-rose-500/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-5">
            <CardTitle className="text-xs font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              Absent Today
            </CardTitle>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-300">
              <AlertCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-rose-950 dark:text-rose-200">
                {data.todayStats.absent}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                SMS Alerted
              </span>
            </div>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
              Instant parent notifications dispatched
            </p>
          </CardContent>
        </Card>

        {/* Leave / Late Arrivals */}
        <Card className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-white dark:via-slate-900/80 to-transparent shadow-xs hover-lift transition-all hover:border-amber-500/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-5">
            <CardTitle className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Excused &amp; Late
            </CardTitle>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-300">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold tracking-tight text-amber-950 dark:text-amber-200">
              {data.todayStats.leave + data.todayStats.late}
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
              <span className="font-semibold">{data.todayStats.leave}</span> approved leave · <span className="font-semibold">{data.todayStats.late}</span> tardy arrival
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2): Class Completion Status & Absent Student Matrix */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Class Attendance Status Card */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <School className="size-4" />
                    </div>
                    Class Roster Completion Status
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tracking recorded attendance across accessible classrooms for {data.todayDate}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      {classesProgress}% Complete
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {data.accessibleClasses.length - data.unmarkedClasses.length} of {data.accessibleClasses.length} classes
                    </span>
                  </div>
                  <Badge
                    variant={data.unmarkedClasses.length > 0 ? "outline" : "default"}
                    className={
                      data.unmarkedClasses.length > 0
                        ? "border-amber-500/30 text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 font-medium"
                        : "bg-emerald-600 text-white font-medium"
                    }
                  >
                    {data.unmarkedClasses.length > 0
                      ? `${data.unmarkedClasses.length} Pending`
                      : "All Finished"}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${classesProgress}%` }}
                />
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {data.unmarkedClasses.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The following accessible classes do not have attendance recorded for today yet:
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
                    {data.unmarkedClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3.5 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                            <Clock className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                              {cls.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {cls.studentCount} active students in roster
                            </span>
                          </div>
                        </div>

                        <Link href={`/attendance?classId=${cls.id}&date=${data.todayDate}`}>
                          <Button size="sm" className="h-8.5 px-3.5 text-xs gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover-lift">
                            <CalendarCheck className="size-3.5" />
                            Mark Attendance
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="size-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCheck className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-950 dark:text-emerald-200">
                      Outstanding! All Classroom Rosters Completed
                    </h4>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                      100% of attendance records for today have been submitted and parents notified where applicable.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Absent Students Card */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="size-4" />
                    </div>
                    Today&apos;s Absent Students ({data.todayAbsentStudents.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students flagged absent today with real-time guardian delivery confirmation
                  </CardDescription>
                </div>

                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    <span>Inspect Full SMS Log</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.todayAbsentStudents.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Zero Absences Reported Today
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Full student presence recorded across all completed classroom sessions.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Guardian Contact</th>
                        <th className="py-3 px-4 text-right">SMS Notification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {data.todayAbsentStudents.map((abs) => (
                        <tr key={abs.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                {abs.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {abs.studentName}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  {abs.admissionNo}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="font-medium text-[11px] bg-slate-50 dark:bg-slate-800/60">
                              {abs.className}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="size-3 text-slate-400" />
                              <span>{abs.guardianPhone}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {abs.notificationStatus === "ACCEPTED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <CheckCircle2 className="size-3" />
                                Accepted by Hub
                              </span>
                            )}
                            {abs.notificationStatus === "FAILED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                                <AlertCircle className="size-3" />
                                Delivery Failed
                              </span>
                            )}
                            {abs.notificationStatus === "PENDING" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                <Clock className="size-3" />
                                Dispatch Queued
                              </span>
                            )}
                            {abs.notificationStatus === "SENDING" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                <Loader2 className="size-3 animate-spin" />
                                Dispatching...
                              </span>
                            )}
                            {abs.notificationStatus === "NOT_QUEUED" && (
                              <span className="text-slate-400 text-[11px] italic">Not queued</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Span 1): SMS Health & Failed Dispatch Queue */}
        <div className="space-y-8">
          {/* SMS Notification Summary */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Radio className="size-4" />
                  </div>
                  SMSHub Dispatch Health
                </CardTitle>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {smsSuccessRate}% Success
                </span>
              </div>
              <CardDescription className="text-xs">Overall delivery acceptance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <span className="text-emerald-700 dark:text-emerald-400 block text-xs font-medium">Accepted</span>
                  <span className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-200">
                    {data.smsSummary.accepted}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                  <span className="text-rose-700 dark:text-rose-400 block text-xs font-medium">Failed</span>
                  <span className="text-2xl font-extrabold text-rose-950 dark:text-rose-200">
                    {data.smsSummary.failed}
                  </span>
                </div>
              </div>

              {/* Progress bar showing accepted vs failed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Delivery Success Ratio</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{smsSuccessRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${smsSuccessRate}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${100 - smsSuccessRate}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Total Dispatched: {data.smsSummary.total}</span>
                <Link
                  href="/notifications"
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Full History <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Failed Notifications */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <AlertCircle className="size-4" />
                  </div>
                  Failed SMS Queue ({data.recentFailedNotifications.length})
                </CardTitle>
                {data.recentFailedNotifications.length > 0 && (
                  <Link href="/notifications?status=FAILED">
                    <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">View All</span>
                  </Link>
                )}
              </div>
              <CardDescription className="text-xs">
                {data.isAdmin
                  ? "Admins can retry failed dispatches directly"
                  : "Notifications awaiting administrative review"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {data.recentFailedNotifications.length === 0 ? (
                <div className="py-8 text-center space-y-1.5">
                  <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Clean Dispatch Pipeline
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    All attempted notifications were accepted by SMSHub without rejections.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentFailedNotifications.map((notif) => {
                    const isRetrying = retryingId === notif.id;

                    return (
                      <div
                        key={notif.id}
                        className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {notif.studentName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {notif.className} · {notif.admissionNo}
                            </span>
                          </div>

                          {data.isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(notif.id, notif.studentName)}
                              disabled={isRetrying}
                              className="h-7 px-2.5 text-[11px] rounded-lg border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/50 dark:hover:bg-rose-900/40 gap-1.5 shrink-0"
                            >
                              {isRetrying ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3" />
                              )}
                              Retry
                            </Button>
                          )}
                        </div>

                        {notif.error && (
                          <div className="text-[11px] text-rose-700 dark:text-rose-300 truncate bg-rose-100/60 dark:bg-rose-950/60 p-2 rounded-lg font-mono">
                            {notif.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
