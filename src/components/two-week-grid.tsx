"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  School,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Users,
  RotateCcw,
  ExternalLink,
  Download,
  Flame,
  Check,
  Printer,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { TwoWeekOverviewResult } from "@/lib/services/attendance.service";

type Props = {
  data: TwoWeekOverviewResult;
  selectedClassId: string;
};

export function TwoWeekGrid({ data, selectedClassId }: Props) {
  const router = useRouter();

  function handleClassChange(newClassId: string) {
    const params = new URLSearchParams();
    params.set("classId", newClassId);
    if (data.startDate) {
      params.set("startDate", data.startDate);
    }
    router.push(`/attendance/overview?${params.toString()}`);
  }

  function handleDateNav(targetStartDate: string) {
    const params = new URLSearchParams();
    params.set("classId", selectedClassId);
    params.set("startDate", targetStartDate);
    router.push(`/attendance/overview?${params.toString()}`);
  }

  // Format date range for header
  function formatDateRange(start: string, end: string) {
    if (!start || !end) return "";
    const s = new Date(start + "T00:00:00Z");
    const e = new Date(end + "T00:00:00Z");
    const sStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const eStr = e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    return `${sStr} – ${eStr}`;
  }

  const highAbsenceStudents = data.students.filter((s) => s.isHighAbsence);

  // Client-side CSV export
  function exportToCSV() {
    if (data.students.length === 0) {
      toast.error("No student data available to export");
      return;
    }

    const header = ["Admission No", "Student Name", "Total Absences", "Total Leaves", ...data.days.map((d) => d.date)];
    const rows = data.students.map((s) => [
      s.admissionNo,
      `"${s.fullName.replace(/"/g, '""')}"`,
      s.totalAbsent,
      s.totalLeave,
      ...data.days.map((d) => s.records[d.date] || (d.isWeekend ? "WEEKEND" : "UNMARKED")),
    ]);

    const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${data.classInfo?.name || "Class"}_${data.startDate}_to_${data.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully");
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="size-6 text-primary" />
              Two-Week Attendance Overview
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              14-Day View
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="h-8 px-2.5 text-xs font-medium gap-1.5"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-2.5 text-xs font-medium gap-1.5"
            title="Print 2-week classroom attendance matrix"
          >
            <Printer className="size-3.5 text-slate-500" />
            <span>Print Grid</span>
          </Button>

          <Link href={`/attendance?classId=${selectedClassId}`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-medium gap-1.5">
              <CalendarCheck className="size-3.5 text-primary" />
              <span>Daily Roster</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Class & Date Selector Controls */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Class Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="class-select" className="text-xs font-medium text-muted-foreground shrink-0">
            Class:
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="h-8 min-w-52 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none"
          >
            {data.accessibleClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateNav(data.prevStartDate)}
            className="h-8 px-2.5 text-xs font-medium gap-1"
            title="Go to previous 2 weeks"
          >
            <ChevronLeft className="size-3.5" />
            <span>Prev 2 Weeks</span>
          </Button>

          <span className="px-3 py-1 rounded-lg bg-muted text-foreground font-medium text-xs border border-border">
            {formatDateRange(data.startDate, data.endDate)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateNav(data.nextStartDate)}
            className="h-8 px-2.5 text-xs font-medium gap-1"
            title="Go to next 2 weeks"
          >
            <span>Next 2 Weeks</span>
            <ChevronRight className="size-3.5" />
          </Button>

          {data.startDate !== data.currentStartDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateNav(data.currentStartDate)}
              className="text-xs h-8 px-2 text-primary gap-1 font-medium"
            >
              <RotateCcw className="size-3" />
              <span>Current</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards for the 2-Week Window */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Active Students */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled
            </p>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data.totals.totalStudents}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.classInfo?.name}
            </p>
          </CardContent>
        </Card>

        {/* Overall Attendance Rate */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Attendance Rate
            </p>
            <div className="text-2xl font-bold text-primary mt-1">
              {data.totals.overallAttendanceRate !== null ? `${data.totals.overallAttendanceRate}%` : "—"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.totals.totalPresent} presence marks
            </p>
          </CardContent>
        </Card>

        {/* Total Absences */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Absences
            </p>
            <div className="text-2xl font-bold text-destructive mt-1">
              {data.totals.totalAbsent}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              14-day window
            </p>
          </CardContent>
        </Card>

        {/* Chronic Absence Alert Count */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Chronic Absence
            </p>
            <div className={`text-2xl font-bold mt-1 ${highAbsenceStudents.length > 0 ? "text-destructive" : "text-foreground"}`}>
              {highAbsenceStudents.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              &ge; 3 absences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chronic Absence Warning (if applicable) */}
      {highAbsenceStudents.length > 0 && (
        <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-destructive">
              Chronic Absence Warning:
            </span>
            <p className="text-foreground">
              <strong>{highAbsenceStudents.length} student(s)</strong> ({highAbsenceStudents.map((s) => s.fullName).join(", ")}) have reached 3 or more absences during this window.
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-card p-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-foreground">Legend:</span>
          <div className="flex items-center gap-1">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[10px] bg-primary/10 text-primary border border-primary/20">
              P
            </span>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[10px] bg-destructive/10 text-destructive border border-destructive/20">
              A
            </span>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
              L
            </span>
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              T
            </span>
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[10px] bg-muted text-muted-foreground border border-border">
              H
            </span>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-bold px-1">—</span>
            <span>Unrecorded</span>
          </div>
        </div>
      </div>

      {/* Two-Week Grid Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              {/* Header Row: Column Titles & Dates */}
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-3 font-bold text-foreground sticky left-0 z-20 bg-card min-w-28 border-r border-border uppercase tracking-wider text-[11px]">
                  Adm No
                </th>
                <th className="p-3 font-bold text-foreground sticky left-28 z-20 bg-card min-w-48 border-r border-border uppercase tracking-wider text-[11px]">
                  Student Name
                </th>
                <th
                  className="p-2 text-center font-bold text-destructive bg-destructive/5 w-12 border-r border-border"
                  title="Total Absences in 2 weeks"
                >
                  Abs
                </th>
                <th
                  className="p-2 text-center font-bold text-muted-foreground bg-muted/40 w-12 border-r border-border"
                  title="Total Leaves in 2 weeks"
                >
                  Lve
                </th>

                {/* 14 Day Column Headers */}
                {data.days.map((d) => (
                  <th
                    key={d.date}
                    className={`p-2 text-center min-w-12 border-r border-border transition-colors ${
                      d.isWeekend
                        ? "bg-muted/30 text-muted-foreground"
                        : "hover:bg-muted/80 cursor-pointer"
                    }`}
                  >
                    <Link
                      href={`/attendance?classId=${selectedClassId}&date=${d.date}`}
                      className="block group"
                      title={`Open attendance roster for ${d.date}`}
                    >
                      <div className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary">
                        {d.dayOfWeek}
                      </div>
                      <div className="text-xs font-extrabold text-foreground group-hover:text-primary">
                        {d.dayOfMonth}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>

              {/* Summary Rows Directly Below Headers */}
              {/* Row 1: Total Present */}
              <tr className="bg-primary/5 border-b border-border font-semibold text-[11px]">
                <td
                  colSpan={2}
                  className="p-2.5 text-primary sticky left-0 z-20 bg-card border-r border-border font-bold"
                >
                  Total Present
                </td>
                <td className="p-1 text-center font-extrabold text-primary border-r border-border">
                  {data.totals.totalPresent}
                </td>
                <td className="p-1 text-center text-muted-foreground border-r border-border">
                  —
                </td>
                {data.dailySummaries.map((s) => (
                  <td
                    key={`present-${s.date}`}
                    className={`p-1 text-center border-r border-border ${
                      s.isWeekend ? "bg-muted/20 text-muted-foreground" : "text-primary font-bold"
                    }`}
                  >
                    {s.isWeekend ? "—" : s.present}
                  </td>
                ))}
              </tr>

              {/* Row 2: Total Absent */}
              <tr className="bg-destructive/5 border-b border-border font-semibold text-[11px]">
                <td
                  colSpan={2}
                  className="p-2.5 text-destructive sticky left-0 z-20 bg-card border-r border-border font-bold"
                >
                  Total Absent
                </td>
                <td className="p-1 text-center font-extrabold text-destructive border-r border-border">
                  {data.totals.totalAbsent}
                </td>
                <td className="p-1 text-center text-muted-foreground border-r border-border">
                  —
                </td>
                {data.dailySummaries.map((s) => (
                  <td
                    key={`absent-${s.date}`}
                    className={`p-1 text-center border-r border-border ${
                      s.isWeekend ? "bg-muted/20 text-muted-foreground" : s.absent > 0 ? "text-destructive font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {s.isWeekend ? "—" : s.absent}
                  </td>
                ))}
              </tr>

              {/* Row 3: Daily Attendance % */}
              <tr className="bg-muted/30 border-b border-border text-[11px] font-semibold">
                <td
                  colSpan={2}
                  className="p-2.5 text-foreground sticky left-0 z-20 bg-card border-r border-border font-bold"
                >
                  Daily Attendance Rate
                </td>
                <td className="p-1 text-center font-extrabold text-primary border-r border-border">
                  {data.totals.overallAttendanceRate !== null ? `${data.totals.overallAttendanceRate}%` : "—"}
                </td>
                <td className="p-1 text-center text-muted-foreground border-r border-border">
                  —
                </td>
                {data.dailySummaries.map((s) => (
                  <td
                    key={`rate-${s.date}`}
                    className={`p-1 text-center border-r border-border ${
                      s.isWeekend
                        ? "bg-muted/20 text-muted-foreground"
                        : s.attendanceRate !== null
                        ? "text-foreground font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.isWeekend ? "—" : s.attendanceRate !== null ? `${s.attendanceRate}%` : "—"}
                  </td>
                ))}
              </tr>
            </thead>

            {/* Student Attendance Rows */}
            <tbody className="divide-y divide-border bg-card">
              {data.students.length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-16 text-muted-foreground">
                    No active students enrolled in this class.
                  </td>
                </tr>
              ) : (
                data.students.map((student) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Admission No */}
                    <td className="p-2.5 font-mono text-muted-foreground sticky left-0 z-10 bg-card border-r border-border">
                      <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-semibold text-foreground">
                        {student.admissionNo}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="p-2.5 font-semibold text-foreground sticky left-28 z-10 bg-card border-r border-border">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{student.fullName}</span>
                        {student.isHighAbsence && (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1.5 py-0 h-4 font-semibold shrink-0"
                            title="Persistent Absence Alert (&ge; 3 days)"
                          >
                            &ge;3 Abs
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Total Absences */}
                    <td
                      className={`p-1.5 text-center font-bold border-r border-border ${
                        student.totalAbsent > 0
                          ? "text-destructive bg-destructive/10"
                          : "text-muted-foreground"
                      }`}
                    >
                      {student.totalAbsent}
                    </td>

                    {/* Total Leaves */}
                    <td
                      className={`p-1.5 text-center font-semibold border-r border-border ${
                        student.totalLeave > 0
                          ? "text-foreground bg-muted"
                          : "text-muted-foreground"
                      }`}
                    >
                      {student.totalLeave}
                    </td>

                    {/* 14 Day Cells */}
                    {data.days.map((d) => {
                      const status = student.records[d.date];

                      return (
                        <td
                          key={`${student.studentId}-${d.date}`}
                          className={`p-1 text-center border-r border-border ${
                            d.isWeekend ? "bg-muted/20" : ""
                          }`}
                        >
                          <Link
                            href={`/attendance?classId=${selectedClassId}&date=${d.date}`}
                            className="inline-flex items-center justify-center size-7 rounded-lg hover:ring-2 hover:ring-ring transition-all"
                            title={`${student.fullName} on ${d.date}: ${status || "No record"} (Click to edit roster)`}
                          >
                            {status === "PRESENT" && (
                              <span className="size-6 rounded-md flex items-center justify-center font-bold text-[11px] bg-primary/10 text-primary border border-primary/20">
                                P
                              </span>
                            )}

                            {status === "ABSENT" && (
                              <span className="size-6 rounded-md flex items-center justify-center font-bold text-[11px] bg-destructive/10 text-destructive border border-destructive/20">
                                A
                              </span>
                            )}

                            {status === "LEAVE" && (
                              <span className="size-6 rounded-md flex items-center justify-center font-bold text-[11px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                                L
                              </span>
                            )}

                            {status === "LATE" && (
                              <span className="size-6 rounded-md flex items-center justify-center font-bold text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                T
                              </span>
                            )}

                            {status === null && d.isWeekend && (
                              <span className="font-semibold text-xs text-muted-foreground">
                                H
                              </span>
                            )}

                            {status === null && !d.isWeekend && (
                              <span className="text-muted-foreground/40 font-bold">
                                —
                              </span>
                            )}
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
