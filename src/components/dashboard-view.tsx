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
  Loader2,
  CheckCheck,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      month: "short",
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
      {/* Streamlined Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {todayFormatted} · Daily roll-call and SMS alert status
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2">
          {data.accessibleClasses.length > 0 && (
            <Link href={`/attendance?classId=${data.accessibleClasses[0]!.id}&date=${data.todayDate}`}>
              <Button size="sm" className="h-8.5 px-3 rounded-lg text-xs font-medium gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                <CalendarCheck className="size-3.5" />
                Take Attendance
              </Button>
            </Link>
          )}

          {data.accessibleClasses.length > 0 && (
            <Link href={`/attendance/overview?classId=${data.accessibleClasses[0]!.id}`}>
              <Button variant="outline" size="sm" className="h-8.5 px-3 rounded-lg text-xs font-medium gap-1.5">
                <CalendarDays className="size-3.5 text-slate-500" />
                Two-Week Grid
              </Button>
            </Link>
          )}

          <Link href="/notifications">
            <Button variant="outline" size="sm" className="h-8.5 px-3 rounded-lg text-xs font-medium gap-1.5">
              <History className="size-3.5 text-slate-500" />
              SMS Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Minimal Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Students */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Students
            </CardTitle>
            <Users className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.totalActiveStudents}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across {data.accessibleClasses.length} {data.accessibleClasses.length === 1 ? "class" : "classes"}
            </p>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Present Today
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.todayStats.present}
              </span>
              {data.todayStats.attendanceRate !== null && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                  {data.todayStats.attendanceRate}%
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {data.todayStats.totalMarked} recorded today
            </p>
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Absent Today
            </CardTitle>
            <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {data.todayStats.absent}
              </span>
              {data.todayStats.absent > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40">
                  SMS Queued
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Parent alert pipeline
            </p>
          </CardContent>
        </Card>

        {/* Leave / Late Today */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Leave &amp; Late
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.todayStats.leave + data.todayStats.late}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {data.todayStats.leave} leave · {data.todayStats.late} late
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Class Roll-Call Status & Today's Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Class Attendance Status & Absences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Attendance Status Table */}
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <School className="size-4 text-blue-600" />
                    Today&apos;s Class Attendance Status
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roster completion tracking for {data.todayDate}
                  </CardDescription>
                </div>

                <Badge
                  variant={data.unmarkedClasses.length > 0 ? "outline" : "default"}
                  className={
                    data.unmarkedClasses.length > 0
                      ? "border-amber-500/30 text-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs"
                      : "bg-emerald-600 text-white text-xs"
                  }
                >
                  {data.unmarkedClasses.length > 0
                    ? `${data.unmarkedClasses.length} Pending`
                    : "Completed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.unmarkedClasses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Students</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.unmarkedClasses.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="py-3 px-4 font-semibold text-sm text-slate-900 dark:text-white">
                          {cls.name}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs text-slate-500">
                          {cls.studentCount} active students
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <Link href={`/attendance?classId=${cls.id}&date=${data.todayDate}`}>
                            <Button size="sm" className="h-7.5 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                              <CalendarCheck className="size-3" />
                              Mark Attendance
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-slate-500 space-y-1">
                  <CheckCheck className="size-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    All classroom attendance records completed
                  </p>
                  <p className="text-[11px] text-slate-400">
                    100% of accessible rosters are marked for today.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Absent Students Table */}
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="size-4 text-rose-600" />
                    Today&apos;s Absent Students ({data.todayAbsentStudents.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students marked absent and their automated SMS status
                  </CardDescription>
                </div>

                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="h-7.5 px-2 text-xs text-blue-600 hover:text-blue-700 gap-1">
                    <span>All Logs</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.todayAbsentStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-1">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Zero absences recorded today
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Full student presence recorded across completed rosters.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Guardian Phone</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">SMS Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.todayAbsentStudents.map((abs) => (
                      <TableRow key={abs.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="py-2.5 px-4">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block">
                            {abs.studentName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {abs.admissionNo}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[11px] font-medium">
                            {abs.className}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {abs.guardianPhone}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          {abs.notificationStatus === "ACCEPTED" && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                              Accepted
                            </Badge>
                          )}
                          {abs.notificationStatus === "FAILED" && (
                            <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px]">
                              Failed
                            </Badge>
                          )}
                          {abs.notificationStatus === "PENDING" && (
                            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                              Queued
                            </Badge>
                          )}
                          {abs.notificationStatus === "SENDING" && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                              Sending
                            </Badge>
                          )}
                          {abs.notificationStatus === "NOT_QUEUED" && (
                            <span className="text-slate-400 text-[11px]">Not queued</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Span 1): SMS Health & Failed Dispatch Queue */}
        <div className="space-y-6">
          {/* SMS Notification Summary Card */}
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="size-4 text-slate-600 dark:text-slate-400" />
                SMSHub Gateway
              </CardTitle>
              <CardDescription className="text-xs">Overall delivery health</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Accepted</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.smsSummary.accepted}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Failed</span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {data.smsSummary.failed}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Total Dispatched: {data.smsSummary.total}</span>
                <Link
                  href="/notifications"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
                >
                  View Logs <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Failed SMS Queue Card */}
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="size-4 text-rose-600" />
                  Failed SMS Queue ({data.recentFailedNotifications.length})
                </CardTitle>
                {data.recentFailedNotifications.length > 0 && (
                  <Link href="/notifications?status=FAILED">
                    <span className="text-xs text-blue-600 hover:underline">View All</span>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {data.recentFailedNotifications.length === 0 ? (
                <div className="py-6 text-center text-slate-500 space-y-1">
                  <CheckCircle2 className="size-5 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Zero failed notifications
                  </p>
                  <p className="text-[11px] text-slate-400">
                    All SMS dispatches accepted without errors.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.recentFailedNotifications.map((notif) => {
                    const isRetrying = retryingId === notif.id;

                    return (
                      <div
                        key={notif.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {notif.studentName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {notif.className} · {notif.admissionNo}
                            </span>
                          </div>

                          {data.isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(notif.id, notif.studentName)}
                              disabled={isRetrying}
                              className="h-7 px-2 text-[11px] rounded-lg gap-1 shrink-0"
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
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 truncate font-mono">
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
