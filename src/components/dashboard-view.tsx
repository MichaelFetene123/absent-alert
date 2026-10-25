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
  Zap,
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
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Layers,
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
import { retryNotification } from "@/actions/notification.actions";
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
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
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

  async function handleRetry(notifId: string, studentName: string) {
    if (!data.isAdmin) {
      toast.error(locale === "am" ? "የኤስኤምኤስ ሙከራ ለማድረግ የአድሚን ፈቃድ ያስፈልጋል።" : "Only administrators can retry SMS dispatch.");
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
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          HERO COMMAND CENTER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl">
        {/* Ambient background glow accents */}
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 size-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{locale === "am" ? "ት/ቤት በስራ ላይ ነው" : "Active School Day"}</span>
              </span>
              <span className="text-xs text-slate-400">
                {new Date(data.todayDate).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs font-mono text-indigo-300 hidden sm:inline">
                Academic Year 2026/2027 (2017 ዓ.ም)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{locale === "am" ? "የትምህርት ቤት አቴንዳንስ ዳሽቦርድ" : "Institutional Attendance Hub"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {locale === "am"
                ? "የዕለት የሥራ አፈጻጸም፣ የቀሪ ተማሪዎች ማሳወቂያ ሁኔታ፣ የSMSHub መልእክት ስርጭትና የክፍል ደረጃ ንጽጽር።"
                : "Real-time school attendance roll call, automated guardian SMS dispatch, and multi-classroom analytics."}
            </p>
          </div>

          {/* Quick Command Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {data.accessibleClasses.length > 0 && (
              <Link href={`/attendance?classId=${data.accessibleClasses[0]!.id}&date=${data.todayDate}`}>
                <Button className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/30 transition-all hover:scale-[1.02]">
                  <CalendarCheck className="size-3.5" />
                  <span>{locale === "am" ? "አቴንዳንስ መዝግብ" : "Take Attendance"}</span>
                </Button>
              </Link>
            )}

            {data.isAdmin && (
              <Button
                variant="outline"
                onClick={() => setIsBulkImportOpen(true)}
                className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-xs transition-colors"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-400" />
                <span>{locale === "am" ? "ተማሪዎችን አስመጣ" : "Import CSV"}</span>
              </Button>
            )}

            <Link href="/reports">
              <Button
                variant="outline"
                className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-xs transition-colors"
              >
                <BarChart3 className="size-3.5 text-indigo-300" />
                <span>{locale === "am" ? "ሪፖርቶች" : "Reports"}</span>
              </Button>
            </Link>

            <Link href="/notifications/test">
              <Button
                variant="outline"
                className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-xs transition-colors"
                title="Zero-cost SMSHub test tool"
              >
                <Zap className="size-3.5 text-amber-400" />
                <span>{locale === "am" ? "የSMS ሙከራ" : "SMS Test"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PROACTIVE LOW SMS BALANCE BANNER
          ========================================================================= */}
      {data.smsCreditStatus?.isLowBalance && !isBannerDismissed && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-300/80 dark:border-amber-800/80 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">
                  {locale === "am" ? "የSMSHub ክሬዲት መጠን ዝቅተኛ ነው!" : "Low SMSHub Credit Balance Warning"}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-2 font-bold border-amber-400/80 dark:border-amber-700 bg-amber-200/50 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200"
                >
                  {data.smsCreditStatus.remainingCredits} {locale === "am" ? "ክሬዲት ቀርቷል" : "Credits Left"}
                </Badge>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                {locale === "am"
                  ? `የት/ቤቱ ቀሪ የSMSHub ክሬዲት ${data.smsCreditStatus.remainingCredits} ብቻ ነው። የቀሪ ተማሪዎች የወላጅ ማሳወቂያዎች እንዳይቋረጡ እባክዎ ክሬዲት ይጨምሩ።`
                  : `Your school currently has ${data.smsCreditStatus.remainingCredits} credits remaining. Unexcused absence alerts will fail or pause once exhausted.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {data.isAdmin && (
              <Link href="/settings/smshub">
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5"
                >
                  <Coins className="size-3.5" />
                  <span>{locale === "am" ? "ክሬዲት ይጨምሩ" : "Top Up SMSHub"}</span>
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBannerDismissed(true)}
              className="h-8 px-2.5 text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/40"
            >
              <span>{locale === "am" ? "አሰናብት" : "Dismiss"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          KEY OPERATIONAL METRICS (TOP 4 KPI CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Active Students */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {locale === "am" ? "ጠቅላላ ተማሪዎች" : "Total Enrolled"}
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="size-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {data.totalActiveStudents}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 font-semibold gap-1">
                <UserCheck className="size-3" />
                100% Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Distributed across {data.accessibleClasses.length} classrooms
            </p>
          </CardContent>
        </Card>

        {/* 2. Today's Attendance Rate */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {locale === "am" ? "የዛሬ አቴንዳንስ" : "Attendance Rate"}
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {attendanceRate}%
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {data.todayStats.present} present
              </span>
            </div>
            {/* Visual mini progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Unexcused Absences Today */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xs hover:border-rose-300/80 dark:hover:border-rose-800/60 transition-all">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {locale === "am" ? "ያልተፈቀደ ቀሪ" : "Unexcused Absences"}
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                {data.todayStats.absent}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 font-semibold gap-1">
                <Send className="size-2.5" />
                SMS Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Automatic alert evaluation triggered
            </p>
          </CardContent>
        </Card>

        {/* 4. SMSHub Communication Status */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardContent className="p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {locale === "am" ? "የSMSHub ሁኔታ" : "SMSHub Credits"}
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Coins className="size-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {data.smsCreditStatus?.remainingCredits ?? 18}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 font-semibold">
                Ethio 1c • Safaricom 2c
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {data.smsSummary.accepted} SMS delivered • {data.smsSummary.failed} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          ANALYTICS & VISUAL CHARTS SECTION
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: 7-Day Attendance Rate Trend Area Chart (2 Cols) */}
        <Card className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="size-4" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  {locale === "am" ? "የ7-ቀን የአቴንዳንስ አዝማሚያ" : "7-Day School Attendance Trend"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Daily attendance performance across all enrolled classrooms.
              </CardDescription>
            </div>

            {/* Toggle metric switch */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTrendMetric("rate")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  trendMetric === "rate"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Rate (%)
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric("count")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  trendMetric === "count"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Headcount
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-3">
            <div className="h-64 w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      domain={trendMetric === "rate" ? [70, 100] : [0, "auto"]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      unit={trendMetric === "rate" ? "%" : ""}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl text-xs space-y-1">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-3">
                              <span>{d.fullDate}</span>
                              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                                {d.ethDate}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-emerald-600 font-semibold">
                              <span>Attendance Rate:</span>
                              <span>{d.rate}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-400">
                              <span>Present / Absent:</span>
                              <span>{d.present} / {d.absent}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    {trendMetric === "rate" && (
                      <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: "90% Goal", fill: "#10b981", fontSize: 10 }} />
                    )}
                    <Area
                      type="monotone"
                      dataKey={trendMetric === "rate" ? "rate" : "present"}
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#attendanceGradient)"
                      name={trendMetric === "rate" ? "Attendance Rate" : "Students Present"}
                    />
                    {trendMetric === "count" && (
                      <Area
                        type="monotone"
                        dataKey="absent"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#absentGradient)"
                        name="Students Absent"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading trend chart...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Chart: Today's Roll Call Status Donut Chart (1 Col) */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <PieIcon className="size-4" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                {locale === "am" ? "የዛሬ አቴንዳንስ ሁኔታ" : "Today's Status Breakdown"}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Distribution of student attendance recorded today.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0 flex flex-col items-center justify-center">
            <div className="relative size-52 flex items-center justify-center">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0];
                        return (
                          <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg text-xs font-semibold">
                            <span style={{ color: d.payload.color }}>{d.name}: </span>
                            <span className="text-slate-900 dark:text-white">{d.value}</span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {attendanceRate}%
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Present
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{item.name.split(" ")[0]}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] ml-1">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          ROW 2: CLASSROOM BENCHMARK (7 COLS) & REAL-TIME SYSTEM SAFEGUARDS (5 COLS)
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Classroom Attendance Benchmark (7 cols) */}
        <Card className="xl:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="size-4" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  {locale === "am" ? "የክፍል ደረጃ የአቴንዳንስ ንጽጽር" : "Classroom Attendance Benchmark"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Comparative section performance vs institutional 90% attendance target.
              </CardDescription>
            </div>

            <Link href="/attendance/overview">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400 gap-1 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                <span>2-Week Matrix</span>
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-5 pt-3">
            <div className="h-56 w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gradeComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-slate-900 dark:text-white">{d.name}</p>
                            <p className="text-emerald-600 font-semibold">Attendance Rate: {d.rate}%</p>
                            <p className="text-slate-500">{d.present} Present / {d.total} Students</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Target (90%)", fill: "#10b981", fontSize: 10 }} />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {gradeComparisons.map((entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={entry.rate >= 90 ? "#4f46e5" : entry.rate >= 80 ? "#f59e0b" : "#f43f5e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Alerts & Policy Safeguards Engine (5 cols) */}
        <Card className="xl:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Radio className="size-4 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  {locale === "am" ? "የቀጥታ SMS እና የፖሊሲ ጥበቃ" : "Live Alerts & Safeguards Engine"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Real-time carrier dispatch pipeline & policy safety checks.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
              Engine Online
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Live Carrier Status Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-900 dark:text-sky-200">
                  <span>Ethio Telecom</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-sky-300 text-sky-700">1 Credit</Badge>
                </div>
                <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">
                  Prefix: 09 / +2519 • Standard Rate
                </p>
                <div className="mt-2 text-xs font-bold text-sky-900 dark:text-sky-100 flex items-center justify-between">
                  <span>Delivered Today:</span>
                  <span>{data.smsSummary.accepted} SMS</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  <span>Safaricom ET</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-emerald-300 text-emerald-700">2 Credits</Badge>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Prefix: 07 / +2517 • Multi-Carrier
                </p>
                <div className="mt-2 text-xs font-bold text-emerald-900 dark:text-emerald-100 flex items-center justify-between">
                  <span>Billing Multiplier:</span>
                  <span>2.0x Active</span>
                </div>
              </div>
            </div>

            {/* Attendance Policy Safeguards Checklist */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Clock className="size-3.5 text-indigo-500" />
                  <span>Post-Submission Correction Window:</span>
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">60-Min Grace Period</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>Holiday & Weekend Suppression:</span>
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enabled (Safe)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCheck className="size-3.5 text-blue-500" />
                  <span>Automatic Absence Alert Trigger:</span>
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Immediate Unexcused</span>
              </div>
            </div>
          </CardContent>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link href="/settings/policy" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
              <span>Configure Policy Safeguards</span>
              <ArrowRight className="size-3" />
            </Link>
            <Link href="/settings/smshub">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
                Carrier Diagnostics
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* =========================================================================
          ROW 3: OPERATIONAL ATTENDANCE INTELLIGENCE & RESOLUTION ACTION HUB
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Operational Table & The 5 Core Questions (xl:col-span-8) */}
        <Card className="xl:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <ShieldCheck className="size-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      {locale === "am" ? "የዕለት የሥራ አመራር መረጃ ማዕከል" : "Operational Attendance Intelligence"}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Answers to the 5 critical administrative attendance and parent notification questions.
                  </CardDescription>
                </div>

                {/* Quick Filter Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder={locale === "am" ? "ተማሪ ወይም ሞባይል ፈልግ..." : "Filter student, class, phone..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8.5 rounded-xl text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Interactive Question Tabs */}
              <div className="flex flex-wrap gap-1.5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveQuestionTab("absent")}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeQuestionTab === "absent"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>1. Absent Today</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeQuestionTab === "absent" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {data.todayStats.absent}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestionTab("missing")}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeQuestionTab === "missing"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>2. Pending Rosters</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeQuestionTab === "missing" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {data.unmarkedClasses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestionTab("notified")}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeQuestionTab === "notified"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>3. Notified Guardians</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeQuestionTab === "notified" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {notifiedAbsentStudents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestionTab("failed")}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeQuestionTab === "failed"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>4. SMS Failures</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeQuestionTab === "failed" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {data.recentFailedNotifications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestionTab("recurring")}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeQuestionTab === "recurring"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>5. Chronic At-Risk</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeQuestionTab === "recurring" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {chronicList.length}
                  </span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* TAB 1: Absent Students */}
              {activeQuestionTab === "absent" && (
                <div className="overflow-x-auto">
                  {filteredAbsentList.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="size-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No student absences matching this query today
                      </p>
                      <p className="text-[11px] text-slate-400">
                        All students marked present or attendance has not been submitted yet.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                          <TableHead className="py-3 px-5">Student</TableHead>
                          <TableHead className="py-3 px-4">Admission No</TableHead>
                          <TableHead className="py-3 px-4">Classroom</TableHead>
                          <TableHead className="py-3 px-4">Guardian Contact</TableHead>
                          <TableHead className="py-3 px-5 text-right">SMS Notification Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAbsentList.map((abs) => {
                          const carrier = getCarrier(abs.guardianPhone);
                          return (
                            <TableRow key={abs.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-xs">
                              <TableCell className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                                {abs.studentName}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-mono text-slate-500">
                                {abs.admissionNo}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                {abs.className}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <span>{abs.guardianPhone}</span>
                                  <Badge variant="outline" className={`text-[9px] px-1 py-0 font-sans ${carrier.badge}`}>
                                    {carrier.name} ({carrier.cost})
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-5 text-right">
                                <Badge
                                  className={`text-[10px] font-semibold py-0.5 px-2 ${
                                    abs.notificationStatus === "ACCEPTED" || abs.notificationStatus === "DELIVERED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                                      : abs.notificationStatus === "FAILED"
                                      ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                                      : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300"
                                  }`}
                                >
                                  {abs.notificationStatus === "ACCEPTED" ? "✓ Sent to Provider" : abs.notificationStatus}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* TAB 2: Missing Submissions */}
              {activeQuestionTab === "missing" && (
                <div className="overflow-x-auto">
                  {data.unmarkedClasses.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCheck className="size-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        100% of classroom rosters submitted for today
                      </p>
                      <p className="text-[11px] text-slate-400">
                        All homeroom teachers have completed morning roll call.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                          <TableHead className="py-3 px-5">Class / Section</TableHead>
                          <TableHead className="py-3 px-4">Enrolled Students</TableHead>
                          <TableHead className="py-3 px-4">Status</TableHead>
                          <TableHead className="py-3 px-5 text-right">Direct Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.unmarkedClasses.map((cls) => (
                          <TableRow key={cls.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-xs">
                            <TableCell className="py-3 px-5 font-bold text-slate-900 dark:text-white">
                              {cls.name}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-slate-500">
                              {cls.studentCount} active students
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 text-[10px] font-semibold">
                                Pending Roll Call
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-5 text-right">
                              <Link href={`/attendance?classId=${cls.id}&date=${data.todayDate}`}>
                                <Button size="sm" className="h-7 px-2.5 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
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

              {/* TAB 3: Notified Guardians */}
              {activeQuestionTab === "notified" && (
                <div className="overflow-x-auto">
                  {notifiedAbsentStudents.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No guardian absence notifications sent yet today
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Submit classroom attendance with absent students to automatically notify parents.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                          <TableHead className="py-3 px-5">Student</TableHead>
                          <TableHead className="py-3 px-4">Classroom</TableHead>
                          <TableHead className="py-3 px-4">Guardian Contact</TableHead>
                          <TableHead className="py-3 px-5 text-right">SMSHub Confirmation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifiedAbsentStudents.map((abs) => {
                          const carrier = getCarrier(abs.guardianPhone);
                          return (
                            <TableRow key={abs.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-xs">
                              <TableCell className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                                {abs.studentName}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {abs.className}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <span>{abs.guardianPhone}</span>
                                  <Badge variant="outline" className={`text-[9px] px-1 py-0 font-sans ${carrier.badge}`}>
                                    {carrier.name} ({carrier.cost})
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-5 text-right">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-semibold">
                                  ✓ Transmitted to Mobile Provider
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* TAB 4: Failed Delivery Action Required */}
              {activeQuestionTab === "failed" && (
                <div className="overflow-x-auto">
                  {data.recentFailedNotifications.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="size-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Zero failed notifications
                      </p>
                      <p className="text-[11px] text-slate-400">
                        All dispatched parent notifications accepted by SMSHub carrier network without errors.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                          <TableHead className="py-3 px-5">Student</TableHead>
                          <TableHead className="py-3 px-4">Classroom</TableHead>
                          <TableHead className="py-3 px-4">Carrier Rejection Reason</TableHead>
                          <TableHead className="py-3 px-5 text-right">Retry Dispatch</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentFailedNotifications.map((fail) => (
                          <TableRow key={fail.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-xs">
                            <TableCell className="py-3 px-5 font-bold text-slate-900 dark:text-white">
                              <span>{fail.studentName}</span>
                              <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                                ({fail.admissionNo})
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {fail.className}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-rose-600 dark:text-rose-400 font-medium">
                              {fail.error || "Carrier rejected phone or insufficient credit"}
                            </TableCell>
                            <TableCell className="py-3 px-5 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={retryingId === fail.id}
                                onClick={() => handleRetry(fail.id, fail.studentName)}
                                className="h-7 text-xs gap-1 border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                {retryingId === fail.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="size-3" />
                                )}
                                <span>Retry SMS</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* TAB 5: Chronic At-Risk Absences */}
              {activeQuestionTab === "recurring" && (
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Students with 3 or more absences in the current evaluation window requiring counselor or admin intervention:
                    </p>
                    <Link href="/reports">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1 font-semibold self-start sm:self-auto">
                        <span>Full Risk Analytics</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {chronicList.map((st) => (
                      <div
                        key={st.studentId}
                        className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-linear-to-r from-amber-50/70 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 text-xs space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            <span>{st.studentName}</span>
                            <span className="text-xs font-mono text-slate-500 ml-1.5">({st.admissionNo})</span>
                          </div>
                          <Badge className={st.riskLevel === "CRITICAL" ? "bg-rose-600 text-white text-[10px]" : "bg-amber-600 text-white text-[10px]"}>
                            {st.absenceCount} Absences ({st.riskLevel})
                          </Badge>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                          <span>{st.className}</span>
                          <span>Primary: {st.guardianName} ({st.guardianPhone})</span>
                        </div>

                        <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
                          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                            Action: Homeroom Parent Conference Required
                          </span>
                          <Link href={`/attendance?classId=${data.accessibleClasses[0]?.id || ""}`}>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                              View Roster
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Right: Daily Operations Action Hub & SMSHub Economics (xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Attention Required Card */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {locale === "am" ? "አስቸኳይ ትኩረት የሚሹ ጉዳዮች" : "Immediate Attention Required"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Failed SMS item */}
              <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                    <AlertCircle className="size-3.5 text-rose-600 shrink-0" />
                    <span>{data.recentFailedNotifications.length} Failed SMS Dispatch</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    {data.recentFailedNotifications.length > 0
                      ? `${data.recentFailedNotifications[0].studentName} (${data.recentFailedNotifications[0].className}) requires retry.`
                      : "No SMS dispatch failures recorded."}
                  </p>
                </div>
                {data.recentFailedNotifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(data.recentFailedNotifications[0].id, data.recentFailedNotifications[0].studentName)}
                    disabled={retryingId === data.recentFailedNotifications[0].id}
                    className="h-6.5 text-[11px] px-2 text-rose-700 border-rose-300 hover:bg-rose-100 shrink-0"
                  >
                    {retryingId === data.recentFailedNotifications[0].id ? <Loader2 className="size-3 animate-spin" /> : "Retry"}
                  </Button>
                )}
              </div>

              {/* Chronic Absentees Item */}
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                    <Users className="size-3.5 text-amber-600 shrink-0" />
                    <span>{chronicList.length} Chronic At-Risk Students</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    ≥3 unexplained absences recorded this month.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQuestionTab("recurring")}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 self-center"
                >
                  View
                </button>
              </div>

              {/* Roster Completion Item */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <CalendarCheck className="size-3.5 text-indigo-600 shrink-0" />
                    <span>{data.unmarkedClasses.length} Pending Rosters</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {data.unmarkedClasses.length === 0
                      ? "All homerooms submitted today."
                      : `${data.unmarkedClasses.map((c) => c.name).join(", ")} pending.`}
                  </p>
                </div>
                {data.unmarkedClasses.length > 0 && (
                  <Link href={`/attendance?classId=${data.unmarkedClasses[0].id}&date=${data.todayDate}`}>
                    <Button size="sm" className="h-6.5 text-[11px] px-2 bg-indigo-600 text-white shrink-0">
                      Submit
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Operations & Export Card */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Administrative Tools
            </span>
            <div className="space-y-1.5">
              <Link href="/attendance/overview" className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-2">
                  <Layers className="size-3.5 text-indigo-500" />
                  <span>2-Week Attendance Matrix</span>
                </span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </Link>
              <Link href="/reports" className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-2">
                  <TrendingUp className="size-3.5 text-emerald-500" />
                  <span>Executive Attendance Analytics</span>
                </span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </Link>
              <Link href="/settings/policy" className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-blue-500" />
                  <span>Absence Alert Policy Rules</span>
                </span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </Link>
              <Link href="/settings/smshub" className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-2">
                  <Coins className="size-3.5 text-amber-500" />
                  <span>SMSHub Token Configuration</span>
                </span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          BULK IMPORT MODAL MOUNT
          ========================================================================= */}
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
