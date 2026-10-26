"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  AlertTriangle,
  Smartphone,
  Users,
  CheckCircle2,
  Phone,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import type {
  DailyTrendItem,
  GradeComparisonItem,
  ChronicAbsenteeItem,
  SmsAnalyticsData,
} from "@/lib/services/reports.service";

interface ReportsManagerProps {
  dailyTrends: DailyTrendItem[];
  gradeComparisons: GradeComparisonItem[];
  chronicAbsentees: ChronicAbsenteeItem[];
  smsAnalytics: SmsAnalyticsData;
  overallAttendanceRate: number;
  initialTab?: "daily" | "grades" | "recurring" | "sms";
}

export function ReportsManager({
  dailyTrends,
  gradeComparisons,
  chronicAbsentees,
  smsAnalytics,
  overallAttendanceRate,
  initialTab = "daily",
}: ReportsManagerProps) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = React.useState<"daily" | "grades" | "recurring" | "sms">(
    initialTab
  );

  const carrierPieData = [
    { name: "Ethio Telecom", value: smsAnalytics.ethioCredits, color: "#10b981" },
    { name: "Safaricom", value: smsAnalytics.safaricomCredits, color: "#3b82f6" },
  ];

  const exportCsv = () => {
    let csv = "data:text/csv;charset=utf-8,";
    if (activeTab === "daily") {
      csv += "Date,Day,Present,Absent,Late,Rate\n";
      dailyTrends.forEach((d) => {
        csv += `${d.date},${d.dayLabel},${d.present},${d.absent},${d.late},${d.rate}%\n`;
      });
    } else if (activeTab === "grades") {
      csv += "Class,Total Students,Present,Absent,Attendance Rate\n";
      gradeComparisons.forEach((g) => {
        csv += `"${g.className}",${g.totalStudents},${g.present},${g.absent},${g.attendanceRate}%\n`;
      });
    } else if (activeTab === "recurring") {
      csv += "Student,Admission No,Class,Absences,Rate,Guardian Phone\n";
      chronicAbsentees.forEach((c) => {
        csv += `"${c.studentName}",${c.admissionNo},"${c.className}",${c.absenceCount},${c.absenceRate}%,${c.guardianPhone}\n`;
      });
    } else {
      csv += "Network,Count,Credits Used\n";
      csv += `Ethio Telecom,${smsAnalytics.ethioCount},${smsAnalytics.ethioCredits}\n`;
      csv += `Safaricom,${smsAnalytics.safaricomCount},${smsAnalytics.safaricomCredits}\n`;
    }

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `absentalert-${activeTab}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully.");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="size-5 text-indigo-600 dark:text-indigo-400" />
            {locale === "am" ? "የትምህርት ትንታኔዎችና ሪፖርቶች" : "Educational Analytics & Reports"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {locale === "am"
              ? "የዕለት አቴንዳንስ አዝማሚያ፣ የክፍሎች ንጽጽር፣ ተደጋጋሚ ቀሪዎችና የSMSHub ክሬዲት ወጪ።"
              : "Institutional attendance percentages, chronic absenteeism risk queue, and carrier credit metrics."}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-800"
        >
          <Download className="size-3.5 text-indigo-600" />
          <span>Export Report (CSV)</span>
        </Button>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            activeTab === "daily"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {locale === "am" ? "የዕለት አዝማሚያ" : "Daily Attendance Trend"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("grades")}
          className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            activeTab === "grades"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {locale === "am" ? "የክፍሎች ንጽጽር" : "Grade Comparison"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recurring")}
          className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            activeTab === "recurring"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {locale === "am" ? "ተደጋጋሚ ቀሪዎች" : "Recurring Absences"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sms")}
          className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            activeTab === "sms"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {locale === "am" ? "የኤስኤምኤስ ክሬዲት" : "SMS & Carrier Analytics"}
        </button>
      </div>

      {/* Tab 1: Daily Trend */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    7-Day Attendance Trajectory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Present vs. Absent count across all enrolled classrooms.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="size-2 rounded-full bg-indigo-600" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="size-2 rounded-full bg-rose-500" />
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="dayLabel" tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-md text-xs space-y-1">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {data.date} ({data.ethiopianDate})
                              </p>
                              <p className="text-indigo-600 dark:text-indigo-400">
                                Present: {data.present} ({data.rate}%)
                              </p>
                              <p className="text-rose-600 dark:text-rose-400">
                                Absent: {data.absent}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPresent)"
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAbsent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Grade Comparison */}
      {activeTab === "grades" && (
        <div className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Classroom Attendance Rate Comparison (%)
              </CardTitle>
              <CardDescription className="text-xs">
                Comparing attendance performance across active grade sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="className" tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-md text-xs space-y-1">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {data.className}
                              </p>
                              <p className="text-emerald-600">
                                Attendance Rate: {data.attendanceRate}%
                              </p>
                              <p className="text-slate-500">
                                Present: {data.present} / {data.totalStudents}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="attendanceRate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Recurring Absences */}
      {activeTab === "recurring" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Chronic Absenteeism Roster (3+ Absences)
                </CardTitle>
                <CardDescription className="text-xs">
                  Students at academic risk requiring parental conference or homeroom intervention.
                </CardDescription>
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-xs">
                {chronicAbsentees.length} at risk
              </Badge>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <TableRow>
                  <TableHead className="text-xs font-semibold py-3">Student Name</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Class</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Total Absences</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Absence Rate</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Guardian Contact</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chronicAbsentees.map((item) => (
                  <TableRow key={item.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs">
                    <TableCell className="font-semibold text-slate-900 dark:text-white py-3">
                      <div>
                        <span>{item.studentName}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-1.5">
                          ({item.admissionNo})
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                      {item.className}
                    </TableCell>

                    <TableCell className="py-3 font-bold text-rose-600 dark:text-rose-400">
                      {item.absenceCount} days
                    </TableCell>

                    <TableCell className="py-3 font-mono">
                      {item.absenceRate}%
                    </TableCell>

                    <TableCell className="py-3 font-mono text-slate-700 dark:text-slate-300">
                      {item.guardianName} ({item.guardianPhone})
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${
                          item.riskLevel === "CRITICAL"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {item.riskLevel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 4: SMS Analytics */}
      {activeTab === "sms" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-6 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Carrier Credit Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Ethio Telecom (1 credit/SMS) vs Safaricom (2 credits/SMS) consumption.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carrierPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {carrierPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Ethio Telecom ({smsAnalytics.ethioCredits} cr)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Safaricom ({smsAnalytics.safaricomCredits} cr)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-6 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold">
                SMS Delivery Performance &amp; Credits Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Total Notifications Sent to Provider</span>
                <span className="font-bold text-slate-900 dark:text-white">{smsAnalytics.totalSent}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Total Credits Consumed</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{smsAnalytics.totalCredits} credits</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Current Provider Balance</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{smsAnalytics.estimatedRemainingBalance} credits</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 dark:text-slate-400">Failure / Exception Rate</span>
                <span className="font-bold text-slate-900 dark:text-white">{smsAnalytics.failureRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
