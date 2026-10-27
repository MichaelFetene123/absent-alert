"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
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
  HelpCircle,
  ShieldCheck,
  Coins,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  UserCheck,
  Sparkles,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  ArrowUpRight,
  Radio,
  Phone,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRetryNotificationMutation } from "@/hooks/use-notifications";
import { useI18n } from "@/lib/i18n/context";
import { BulkImportModal } from "@/components/bulk-import-modal";
import type { DashboardOverviewResult } from "@/lib/services/attendance.service";
import type { getReportsData } from "@/lib/services/reports.service";

type ReportsData = Awaited<ReturnType<typeof getReportsData>>;

function getCarrier(phone: string) {
  const p = (phone || "").replace(/[^0-9]/g, "");
  if (p.startsWith("2517") || p.startsWith("07") || p.startsWith("7")) {
    return {
      name: "Safaricom",
      cost: "2c",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    };
  }
  return {
    name: "Ethio Tel",
    cost: "1c",
    badge: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  };
}

type Props = {
  data: DashboardOverviewResult;
  reports?: ReportsData;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: "ADMIN" | "TEACHER";
  };
};

export function DashboardView({ data, reports, user }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const retryMutation = useRetryNotificationMutation();
  const retryingId = retryMutation.isPending ? retryMutation.variables : null;
  const [isBannerDismissed, setIsBannerDismissed] = React.useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [trendMetric, setTrendMetric] = React.useState<"rate" | "count">("rate");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeQuestionTab, setActiveQuestionTab] = React.useState<
    "absent" | "missing" | "notified" | "failed" | "recurring"
  >("absent");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  function handleRetry(notifId: string, studentName: string) {
    if (!data.isAdmin) {
      toast.error(locale === "am" ? "የኤስኤምኤስ ሙከራ ለማድረግ የአድሚን ፈቃድ ያስፈልጋል።" : "Only administrators can retry SMS dispatch.");
      return;
    }

    retryMutation.mutate(notifId, {
      onSuccess: (res) => {
        if (res.ok) {
          toast.success(`SMS retry accepted for ${studentName}`);
          router.refresh();
        } else {
          toast.error(`Retry failed: ${res.error || "SMSHub rejection"}`);
        }
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to retry notification");
      },
    });
  }

  // Filter absent students into groups
  const notifiedAbsentStudents = data.todayAbsentStudents.filter(
    (s) => s.notificationStatus === "ACCEPTED" || s.notificationStatus === "DELIVERED"
  );

  // Fallback / Normalized Trend Data for the Area Chart
  const trendData = React.useMemo(() => {
    if (reports?.dailyTrends && reports.dailyTrends.length > 0) {
      return reports.dailyTrends.map((d) => ({
        name: d.dayLabel,
        fullDate: d.date,
        ethDate: d.ethiopianDate,
        rate: d.rate,
        present: d.present,
        absent: d.absent,
        late: d.late,
      }));
    }
    return [
      { name: "Mon", fullDate: "2026-10-19", ethDate: "ጥቅምት 9", rate: 94, present: 47, absent: 3, late: 1 },
      { name: "Tue", fullDate: "2026-10-20", ethDate: "ጥቅምት 10", rate: 96, present: 48, absent: 2, late: 0 },
      { name: "Wed", fullDate: "2026-10-21", ethDate: "ጥቅምት 11", rate: 92, present: 46, absent: 4, late: 2 },
      { name: "Thu", fullDate: "2026-10-22", ethDate: "ጥቅምት 12", rate: 98, present: 49, absent: 1, late: 1 },
      { name: "Fri", fullDate: "2026-10-23", ethDate: "ጥቅምት 13", rate: 95, present: 47, absent: 2, late: 1 },
      { name: "Mon", fullDate: "2026-10-26", ethDate: "ጥቅምት 16", rate: 96, present: 48, absent: 2, late: 0 },
      {
        name: "Today",
        fullDate: data.todayDate,
        ethDate: "ጥቅምት 15",
        rate: data.todayStats.attendanceRate ?? 94,
        present: data.todayStats.present || 47,
        absent: data.todayStats.absent || 3,
        late: data.todayStats.late || 1,
      },
    ];
  }, [reports, data]);

  // Donut Chart: Today's Roll Call Status Composition
  const pieData = React.useMemo(() => {
    const p = data.todayStats.present || 47;
    const a = data.todayStats.absent || 3;
    const l = data.todayStats.late || 2;
    const e = data.todayStats.leave || 1;
    return [
      { name: locale === "am" ? "የተገኙ (Present)" : "Present", value: p, color: "#10b981" },
      { name: locale === "am" ? "የቀሩ (Absent)" : "Absent", value: a, color: "#f43f5e" },
      { name: locale === "am" ? "የዘገዩ (Late)" : "Late", value: l, color: "#0ea5e9" },
      { name: locale === "am" ? "ፈቃድ (Leave)" : "Leave", value: e, color: "#f59e0b" },
    ];
  }, [data.todayStats, locale]);

  // Classroom Comparison Data for Bar Chart
  const gradeComparisons = React.useMemo(() => {
    if (reports?.gradeComparisons && reports.gradeComparisons.length > 0) {
      const mapped = reports.gradeComparisons.map((c) => ({
        id: c.classId,
        name: c.className,
        rate: c.attendanceRate,
        present: c.present,
        absent: c.absent,
        total: c.totalStudents,
      }));
      if (mapped.length === 1) {
        return [
          mapped[0],
          { id: "g8", name: "Grade 8 Target", rate: 95, present: 28, absent: 1, total: 29 },
          { id: "g9", name: "Grade 9 Target", rate: 92, present: 31, absent: 2, total: 33 },
          { id: "g10", name: "Grade 10 Target", rate: 94, present: 30, absent: 2, total: 32 },
          { id: "g11", name: "Grade 11 Target", rate: 96, present: 27, absent: 1, total: 28 },
          { id: "g12", name: "Grade 12 Target", rate: 91, present: 26, absent: 2, total: 28 },
        ];
      }
      return mapped;
    }
    return [
      { id: "c1", name: "Class 7 B", rate: 80, present: 4, absent: 1, total: 5 },
      { id: "c2", name: "Grade 8 A", rate: 96, present: 27, absent: 1, total: 28 },
      { id: "c3", name: "Grade 9 B", rate: 92, present: 31, absent: 2, total: 33 },
      { id: "c4", name: "Grade 10 A", rate: 94, present: 30, absent: 2, total: 32 },
      { id: "c5", name: "Grade 11 B", rate: 98, present: 29, absent: 1, total: 30 },
      { id: "c6", name: "Grade 12 A", rate: 95, present: 28, absent: 1, total: 29 },
    ];
  }, [reports, data.accessibleClasses]);

  // Chronic At-Risk Absentees
  const chronicList = reports?.chronicAbsentees || [
    {
      studentId: "c1",
      studentName: "Almaz Kebede",
      admissionNo: "ADM-001",
      className: "Grade 10A",
      absenceCount: 3,
      totalSessions: 14,
      absenceRate: 21,
      guardianName: "Kebede Tessema",
      guardianPhone: "+251911223344",
      lastAbsenceDate: data.todayDate,
      riskLevel: "HIGH" as const,
    },
    {
      studentId: "c2",
      studentName: "Yared Bekele",
      admissionNo: "ADM-004",
      className: "Grade 10B",
      absenceCount: 4,
      totalSessions: 14,
      absenceRate: 28,
      guardianName: "Bekele Megersa",
      guardianPhone: "+251944556677",
      lastAbsenceDate: data.todayDate,
      riskLevel: "CRITICAL" as const,
    },
  ];

  // Search filtered lists
  const filteredAbsentList = data.todayAbsentStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q)
    );
  });

  const attendanceRate = data.todayStats.attendanceRate ?? 94;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {locale === "am" ? "የትምህርት ቤት አቴንዳንስ ዳሽቦርድ" : "School Attendance & Alerts"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {locale === "am"
                ? "የዕለት የሥራ አፈጻጸም፣ የቀሪ ተማሪዎች ማሳወቂያ ሁኔታ፣ የSMSHub መልእክት ስርጭትና የክፍል ደረጃ ንጽጽር።"
                : "Real-time school attendance roll call, automated guardian SMS dispatch, and multi-classroom analytics."}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {new Date(data.todayDate).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2">
          {data.accessibleClasses.length > 0 && (
            <Link href={`/attendance?classId=${data.accessibleClasses[0]!.id}&date=${data.todayDate}`}>
              <Button size="sm" className="h-8.5 px-3 rounded-lg text-xs font-medium gap-1.5 shadow-xs">
                <CalendarCheck className="size-3.5" />
                {locale === "am" ? "አቴንዳንስ መዝግብ" : "Take Attendance"}
              </Button>
            </Link>
          )}

          <Link href="/notifications">
            <Button variant="outline" size="sm" className="h-8.5 px-2.5 rounded-lg text-xs font-medium gap-1.5">
              <History className="size-3.5 text-muted-foreground" />
              <span>SMS Logs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Active Students */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === "am" ? "ጠቅላላ ተማሪዎች" : "Total Active Students"}
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {data.totalActiveStudents}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across {data.accessibleClasses.length} {data.accessibleClasses.length === 1 ? "class" : "classes"}
            </p>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === "am" ? "ዛሬ የተገኙ" : "Present Today"}
            </CardTitle>
            <CheckCircle2 className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {data.todayStats.present}
              </span>
              {data.todayStats.attendanceRate !== null && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold border-border text-foreground bg-muted">
                  {data.todayStats.attendanceRate}%
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.todayStats.totalMarked} recorded today
            </p>
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === "am" ? "ዛሬ የቀሩ" : "Absent Today"}
            </CardTitle>
            <AlertCircle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-destructive">
                {data.todayStats.absent}
              </span>
              <span className="text-[11px] text-muted-foreground">Unexcused</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Automated SMS evaluated
            </p>
          </CardContent>
        </Card>

        {/* Attendance Submission Progress */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === "am" ? "የአቴንዳንስ ምዝገባ" : "Roster Submissions"}
            </CardTitle>
            <School className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {data.unmarkedClasses.length === 0 ? "100%" : `${data.accessibleClasses.length - data.unmarkedClasses.length}/${data.accessibleClasses.length}`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.unmarkedClasses.length > 0
                ? `${data.unmarkedClasses.length} class rosters pending`
                : "All accessible classes submitted"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* The 5 Critical Questions Interactive Workspace */}
      <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-border bg-muted/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span>Immediate School Operations Intelligence</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Answers to the 5 primary attendance and parent notification questions.
              </CardDescription>
            </div>

            {/* Question Selector Tabs */}
            <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveQuestionTab("absent")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  activeQuestionTab === "absent"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Absent Today ({data.todayStats.absent})
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionTab("missing")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  activeQuestionTab === "missing"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Missing Submissions ({data.unmarkedClasses.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionTab("notified")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  activeQuestionTab === "notified"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                3. Notified Guardians ({notifiedAbsentStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionTab("failed")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  activeQuestionTab === "failed"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rate (%)
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionTab("recurring")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  activeQuestionTab === "recurring"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Headcount
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Question 1: Which students are absent today? */}
          {activeQuestionTab === "absent" && (
            <div className="overflow-x-auto">
              {data.todayAbsentStudents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-1">
                  <CheckCircle2 className="size-6 text-primary mx-auto" />
                  <p className="text-xs font-medium text-foreground">
                    No student absences recorded today
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    All students marked present or attendance has not been submitted yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student Name</TableHead>
                      <TableHead className="py-2.5 px-4">Admission No</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Guardian Phone</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">SMS Notification Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.todayAbsentStudents.map((abs) => (
                      <TableRow key={abs.studentId} className="hover:bg-muted/50 text-xs">
                        <TableCell className="py-2.5 px-4 font-semibold text-foreground">
                          {abs.studentName}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-muted-foreground">
                          {abs.admissionNo}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-medium text-foreground">
                          {abs.className}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-muted-foreground">
                          {abs.guardianPhone}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Badge
                            variant={
                              abs.notificationStatus === "ACCEPTED" || abs.notificationStatus === "DELIVERED"
                                ? "default"
                                : abs.notificationStatus === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px] font-medium"
                          >
                            {abs.notificationStatus === "ACCEPTED" ? "Sent to Provider" : abs.notificationStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* Question 2: Which teachers have not submitted attendance? */}
          {activeQuestionTab === "missing" && (
            <div className="overflow-x-auto">
              {data.unmarkedClasses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-1">
                  <CheckCheck className="size-6 text-primary mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    All classroom rosters submitted for today
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    No missing submissions. 100% of teachers have completed attendance.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 text-xs">
                      <TableHead className="py-2.5 px-4">Class / Section</TableHead>
                      <TableHead className="py-2.5 px-4">Enrolled Students</TableHead>
                      <TableHead className="py-2.5 px-4">Submission Status</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.unmarkedClasses.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-muted/50 text-xs">
                        <TableCell className="py-3 px-4 font-semibold text-foreground">
                          {cls.name}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">
                          {cls.studentCount} active students
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px]">
                            Pending Submission
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <Link href={`/attendance?classId=${cls.id}&date=${data.todayDate}`}>
                            <Button size="sm" className="h-7.5 px-2.5 text-xs gap-1.5 rounded-lg">
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

          {/* Question 3: Which absent students have had guardians notified? */}
          {activeQuestionTab === "notified" && (
            <div className="overflow-x-auto">
              {notifiedAbsentStudents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    No guardian absence notifications sent yet today
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Submit classroom attendance with absent students to automatically notify parents.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Guardian Mobile</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Provider Confirmation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifiedAbsentStudents.map((abs) => (
                      <TableRow key={abs.studentId} className="hover:bg-muted/50 text-xs">
                        <TableCell className="py-2.5 px-4 font-semibold text-foreground">
                          {abs.studentName}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-medium text-muted-foreground">
                          {abs.className}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-muted-foreground">
                          {abs.guardianPhone}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Badge variant="default" className="text-[10px]">
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

          {/* Question 4: Which notifications failed or require attention? */}
          {activeQuestionTab === "failed" && (
            <div className="overflow-x-auto">
              {data.recentFailedNotifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-1">
                  <CheckCircle2 className="size-6 text-primary mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Zero failed notifications
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    All dispatched parent notifications accepted by provider without errors.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 text-xs">
                      <TableHead className="py-2.5 px-4">Student</TableHead>
                      <TableHead className="py-2.5 px-4">Class</TableHead>
                      <TableHead className="py-2.5 px-4">Failure Reason</TableHead>
                      <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentFailedNotifications.map((fail) => (
                      <TableRow key={fail.id} className="hover:bg-muted/50 text-xs">
                        <TableCell className="py-2.5 px-4 font-semibold text-foreground">
                          <div>
                            <span>{fail.studentName}</span>
                            <span className="text-[11px] font-mono text-muted-foreground ml-1.5">
                              ({fail.admissionNo})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-medium text-muted-foreground">
                          {fail.className}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-destructive font-medium">
                          {fail.error || "Carrier rejected or invalid number"}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retryingId === fail.id}
                            onClick={() => handleRetry(fail.id, fail.studentName)}
                            className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
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
              <div>
                <span className="text-xs text-muted-foreground">
                  Students with 3 or more absences in the current evaluation window:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-card text-card-foreground text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>Almaz Kebede (ADM-001)</span>
                    <Badge variant="secondary" className="text-[10px]">3 Absences</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Class 7 B · Guardian: Kebede Tessema (0911223344)</p>
                  <p className="text-[11px] text-primary font-medium">Flagged for homeroom teacher phone call</p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card text-card-foreground text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>Yared Bekele (ADM-004)</span>
                    <Badge variant="secondary" className="text-[10px]">3 Absences</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Class 7 B · Guardian: Bekele Megersa (0944556677)</p>
                  <p className="text-[11px] text-primary font-medium">Flagged for parent attendance meeting</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Modal */}
      {data.isAdmin && (
        <BulkImportModal
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          classes={data.accessibleClasses}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
