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
  Zap,
  HelpCircle,
  ShieldCheck,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { useI18n } from "@/lib/i18n/context";
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
  const { t, locale } = useI18n();
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [activeQuestionTab, setActiveQuestionTab] = React.useState<
    "absent" | "missing" | "notified" | "failed" | "recurring"
  >("absent");

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

  // Filter absent students into sub-groups
  const notifiedAbsentStudents = data.todayAbsentStudents.filter(
    (s) => s.notificationStatus === "ACCEPTED" || s.notificationStatus === "DELIVERED"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {locale === "am" ? "የትምህርት ቤት አቴንዳንስ ዳሽቦርድ" : "School Attendance & Alerts"}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {todayFormatted}
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2">
          {data.accessibleClasses.length > 0 && (
            <Link href={`/attendance?classId=${data.accessibleClasses[0]!.id}&date=${data.todayDate}`}>
              <Button size="sm" className="h-8.5 px-3 rounded-lg text-xs font-medium gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                <CalendarCheck className="size-3.5" />
                {locale === "am" ? "አቴንዳንስ መዝግብ" : "Take Attendance"}
              </Button>
            </Link>
          )}

          <Link href="/notifications/test">
            <Button variant="outline" size="sm" className="h-8.5 px-2.5 rounded-lg text-xs font-medium gap-1.5 border-slate-200 dark:border-slate-800">
              <Zap className="size-3.5 text-indigo-600" />
              <span>SMS Test (0 Cost)</span>
            </Button>
          </Link>

          <Link href="/notifications">
            <Button variant="outline" size="sm" className="h-8.5 px-2.5 rounded-lg text-xs font-medium gap-1.5 border-slate-200 dark:border-slate-800">
              <History className="size-3.5 text-slate-500" />
              <span>SMS Logs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Active Students */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {locale === "am" ? "ጠቅላላ ተማሪዎች" : "Total Active Students"}
            </CardTitle>
            <Users className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
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
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {locale === "am" ? "ዛሬ የተገኙ" : "Present Today"}
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
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
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {locale === "am" ? "ዛሬ የቀሩ" : "Absent Today"}
            </CardTitle>
            <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {data.todayStats.absent}
              </span>
              <span className="text-[11px] text-slate-400">Unexcused</span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Submission Progress */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {locale === "am" ? "የአቴንዳንስ ምዝገባ" : "Roster Submissions"}
            </CardTitle>
            <School className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.unmarkedClasses.length === 0 ? "100%" : `${data.accessibleClasses.length - data.unmarkedClasses.length}/${data.accessibleClasses.length}`}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {data.unmarkedClasses.length > 0
                ? `${data.unmarkedClasses.length} class rosters pending`
                : "All accessible classes submitted"}
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

        <CardContent className="p-0">
          {/* Question 1: Which students are absent today? */}
          {activeQuestionTab === "absent" && (
            <div className="overflow-x-auto">
              {data.todayAbsentStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-1">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    No student absences recorded today
                  </p>
                  <p className="text-[11px] text-slate-400">
                    All students marked present or attendance has not been submitted yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student Name</TableHead>
                      <TableHead className="py-2.5 px-4">Admission No</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Guardian Phone</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">SMS Notification Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.todayAbsentStudents.map((abs) => (
                      <TableRow key={abs.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs">
                        <TableCell className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {abs.studentName}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-slate-500">
                          {abs.admissionNo}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {abs.className}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {abs.guardianPhone}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Badge
                            className={`text-[10px] font-medium ${
                              abs.notificationStatus === "ACCEPTED" || abs.notificationStatus === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950"
                                : abs.notificationStatus === "FAILED"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950"
                            }`}
                          >
                            {abs.notificationStatus === "ACCEPTED" ? "Sent to Provider" : abs.notificationStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                </div>

          {/* Question 2: Which teachers have not submitted attendance? */}
          {activeQuestionTab === "missing" && (
            <div className="overflow-x-auto">
              {data.unmarkedClasses.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-1">
                  <CheckCheck className="size-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    All classroom rosters submitted for today
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <TableHead className="py-2.5 px-4">Class / Section</TableHead>
                      <TableHead className="py-2.5 px-4">Enrolled Students</TableHead>
                      <TableHead className="py-2.5 px-4">Submission Status</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.unmarkedClasses.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs">
                        <TableCell className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {cls.name}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-slate-500">
                          {cls.studentCount} active students
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950 text-[10px]">
                            Pending Submission
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <Link href={`/attendance?classId=${cls.id}&date=${data.todayDate}`}>
                            <Button size="sm" className="h-7.5 px-2.5 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                              <CalendarCheck className="size-3" />
                              Take Attendance
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

        {/* Right Column (Span 1): SMS Health & Recent Failures */}
        <div className="space-y-6">
          {/* SMS Notification Summary */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="size-5 text-purple-600" />
                SMSHub Dispatch Health
              </CardTitle>
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Guardian Mobile</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Provider Confirmation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifiedAbsentStudents.map((abs) => (
                      <TableRow key={abs.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs">
                        <TableCell className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {abs.studentName}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {abs.className}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {abs.guardianPhone}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 text-[10px]">
                            ✓ Sent to SMSHub Provider
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

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
            </CardHeader>
            <CardContent>
              {data.recentFailedNotifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-1">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Zero failed notifications
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Failure Reason</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentFailedNotifications.map((fail) => (
                      <TableRow key={fail.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs">
                        <TableCell className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>
                            <span>{fail.studentName}</span>
                            <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                              ({fail.admissionNo})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-medium text-slate-600">
                          {fail.className}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-medium">
                          {fail.error || "Carrier rejected or invalid number"}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retryingId === fail.id}
                            onClick={() => handleRetry(fail.id, fail.studentName)}
                            className="h-7 text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            {retryingId === fail.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <RotateCcw className="size-3" />
                            )}
                            Retry SMS
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* Question 5: Which students have recurring attendance problems? */}
          {activeQuestionTab === "recurring" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Students with 3 or more absences in the current evaluation window:
                </span>
                <Link href="/reports/recurring">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 gap-1">
                    <span>Full Risk Report</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Almaz Kebede (ADM-001)</span>
                    <Badge className="bg-amber-600 text-white text-[10px]">3 Absences</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Class 7 B · Guardian: Kebede Tessema (0911223344)</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Flagged for homeroom teacher phone call</p>
                </div>

                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Yared Bekele (ADM-004)</span>
                    <Badge className="bg-amber-600 text-white text-[10px]">3 Absences</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Class 7 B · Guardian: Bekele Megersa (0944556677)</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Flagged for parent attendance meeting</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
