"use client";

import * as React from "react";
import Link from "next/link";
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
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { retryNotification } from "@/actions/notification.actions";
import type { DashboardOverviewResult } from "@/lib/services/attendance.service";
import { useRouter } from "next/navigation";

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
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome, {user.name || (data.isAdmin ? "Administrator" : "Teacher")}!
            </h1>
            <Badge
              className={
                data.isAdmin
                  ? "bg-purple-600 text-white font-medium text-xs px-2.5 py-0.5"
                  : "bg-blue-600 text-white font-medium text-xs px-2.5 py-0.5"
              }
            >
              {data.isAdmin ? "Admin Portal" : "Teacher Access"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {todayFormatted} · Daily Attendance &amp; Instant SMS Alert Management
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {data.accessibleClasses.length > 0 && (
            <Link href={`/attendance?classId=${data.accessibleClasses[0]!.id}&date=${data.todayDate}`}>
              <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <CalendarCheck className="size-4" />
                Mark Today&apos;s Attendance
              </Button>
            </Link>
          )}

          {data.accessibleClasses.length > 0 && (
            <Link href={`/attendance/overview?classId=${data.accessibleClasses[0]!.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <CalendarDays className="size-4 text-blue-600 dark:text-blue-400" />
                Two-Week Overview
              </Button>
            </Link>
          )}

          <Link href="/notifications">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <History className="size-4 text-purple-600 dark:text-purple-400" />
              SMS Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Students */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Accessible Students
            </CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.totalActiveStudents}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across {data.accessibleClasses.length} {data.accessibleClasses.length === 1 ? "class" : "classes"}
            </p>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
              Present Today
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                {data.todayStats.present}
              </span>
              {data.todayStats.attendanceRate !== null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300">
                  {data.todayStats.attendanceRate}% Rate
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              {data.todayStats.totalMarked} students marked today
            </p>
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-rose-800 dark:text-rose-400">
              Absent Today
            </CardTitle>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-300">
              <AlertCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-200">
              {data.todayStats.absent}
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
              Instant SMS alert pipeline active
            </p>
          </CardContent>
        </Card>

        {/* Leave / Late Today */}
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-amber-800 dark:text-amber-400">
              Leave &amp; Late Arrivals
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-300">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
              {data.todayStats.leave + data.todayStats.late}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {data.todayStats.leave} on leave · {data.todayStats.late} late arrival
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Unmarked Classes & Today's Absent Students */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending / Unmarked Classes Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <School className="size-5 text-emerald-600" />
                    Today&apos;s Class Attendance Status
                  </CardTitle>
                  <CardDescription>
                    Tracking completed rosters and pending classes for {data.todayDate}
                  </CardDescription>
                </div>

                <Badge
                  variant={data.unmarkedClasses.length > 0 ? "outline" : "default"}
                  className={
                    data.unmarkedClasses.length > 0
                      ? "border-amber-300 text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-emerald-600 text-white"
                  }
                >
                  {data.unmarkedClasses.length > 0
                    ? `${data.unmarkedClasses.length} Pending`
                    : "All Marked"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.unmarkedClasses.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    The following accessible classes do not have attendance recorded for today yet:
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {data.unmarkedClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded text-amber-600">
                            <Clock className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                              {cls.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {cls.studentCount} active students
                            </span>
                          </div>
                        </div>

                        <Link href={`/attendance?classId=${cls.id}&date=${data.todayDate}`}>
                          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CalendarCheck className="size-3.5" />
                            Mark Attendance
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
                  <CheckCheck className="size-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Excellent! All accessible classes have attendance records saved for today.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Absent Students Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="size-5 text-rose-600" />
                    Today&apos;s Absent Students ({data.todayAbsentStudents.length})
                  </CardTitle>
                  <CardDescription>
                    Students marked absent today and their automated SMS delivery status
                  </CardDescription>
                </div>

                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-600 hover:text-purple-700">
                    View All Logs
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.todayAbsentStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No students marked absent today
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    100% attendance recorded across marked classes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500">
                        <th className="pb-2 font-medium">Student Name</th>
                        <th className="pb-2 font-medium">Class</th>
                        <th className="pb-2 font-medium">Guardian Phone</th>
                        <th className="pb-2 font-medium text-right">SMS Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.todayAbsentStudents.map((abs) => (
                        <tr key={abs.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="py-2.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {abs.studentName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {abs.admissionNo}
                            </div>
                          </td>
                          <td className="py-2.5">
                            <Badge variant="secondary" className="font-normal text-[11px]">
                              {abs.className}
                            </Badge>
                          </td>
                          <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Smartphone className="size-3 text-slate-400" />
                              {abs.guardianPhone}
                            </div>
                          </td>
                          <td className="py-2.5 text-right">
                            {abs.notificationStatus === "ACCEPTED" && (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                                <CheckCircle2 className="size-2.5 mr-1" />
                                Accepted
                              </Badge>
                            )}
                            {abs.notificationStatus === "FAILED" && (
                              <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
                                <AlertCircle className="size-2.5 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {abs.notificationStatus === "PENDING" && (
                              <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                                <Clock className="size-2.5 mr-1" />
                                Queued
                              </Badge>
                            )}
                            {abs.notificationStatus === "SENDING" && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                                <Loader2 className="size-2.5 mr-1 animate-spin" />
                                Sending
                              </Badge>
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

        {/* Right Column (Span 1): SMS Health & Recent Failures */}
        <div className="space-y-6">
          {/* SMS Notification Summary */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="size-5 text-purple-600" />
                SMSHub Dispatch Health
              </CardTitle>
              <CardDescription>Overall notification metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-700 dark:text-emerald-400 block font-medium">Accepted</span>
                  <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                    {data.smsSummary.accepted}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-rose-700 dark:text-rose-400 block font-medium">Failed</span>
                  <span className="text-xl font-bold text-rose-900 dark:text-rose-200">
                    {data.smsSummary.failed}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Total Dispatched: {data.smsSummary.total}</span>
                <Link
                  href="/notifications"
                  className="text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center gap-1"
                >
                  Inspect History <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Failed Notifications */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="size-5 text-rose-600" />
                  Failed SMS Queue ({data.recentFailedNotifications.length})
                </CardTitle>
                {data.recentFailedNotifications.length > 0 && (
                  <Link href="/notifications?status=FAILED">
                    <span className="text-xs text-purple-600 hover:underline">View All</span>
                  </Link>
                )}
              </div>
              <CardDescription>
                {data.isAdmin
                  ? "Admins can retry failed deliveries directly"
                  : "Notifications awaiting review"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentFailedNotifications.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Zero failed notifications
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All processed SMS notifications were accepted by SMSHub.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentFailedNotifications.map((notif) => {
                    const isRetrying = retryingId === notif.id;

                    return (
                      <div
                        key={notif.id}
                        className="p-3 rounded-lg border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20 space-y-2 text-xs"
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
                              className="h-7 px-2 text-[11px] border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 shrink-0"
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
                          <div className="text-[11px] text-rose-700 dark:text-rose-300 truncate bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded font-mono">
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
