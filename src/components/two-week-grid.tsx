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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="size-6 text-blue-600 dark:text-blue-400" />
              Two-Week Attendance Overview
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              14-Day View
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive bi-weekly grid, student trend analysis, and direct roster access.
          </p>
        </div>

        {/* View Toggle (Daily vs Two-Week) */}
        <div className="flex items-center gap-2">
          <Link href={`/attendance?classId=${selectedClassId}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CalendarCheck className="size-4" />
              Daily Roster
            </Button>
          </Link>
          <Button variant="default" size="sm" className="gap-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700">
            <CalendarDays className="size-4" />
            Two-Week Grid
          </Button>
        </div>
      </div>

      {/* Class & Date Selector Controls */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Class Dropdown */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                <School className="size-5" />
              </div>
              <div>
                <label htmlFor="class-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Select Class Roster
                </label>
                <select
                  id="class-select"
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="h-9 min-w-56 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {data.accessibleClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateNav(data.prevStartDate)}
                className="gap-1 h-9 text-xs"
                title="Go to previous 2 weeks"
              >
                <ChevronLeft className="size-4" />
                Previous 2 Weeks
              </Button>

              <div className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs tracking-tight text-center min-w-40">
                {formatDateRange(data.startDate, data.endDate)}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateNav(data.nextStartDate)}
                className="gap-1 h-9 text-xs"
                title="Go to next 2 weeks"
              >
                Next 2 Weeks
                <ChevronRight className="size-4" />
              </Button>

              {data.startDate !== data.currentStartDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateNav(data.currentStartDate)}
                  className="text-xs h-9 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1"
                >
                  <RotateCcw className="size-3.5" />
                  Current
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards for the 2-Week Window */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Students Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.totals.totalStudents}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active roster in {data.classInfo?.name}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {data.totals.overallAttendanceRate !== null ? `${data.totals.overallAttendanceRate}%` : "—"}
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              {data.totals.totalPresent} present entries
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-xs font-medium text-rose-800 dark:text-rose-400">
              Total Absences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-200">
              {data.totals.totalAbsent}
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
              Logged in 2-week window
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-xs font-medium text-amber-800 dark:text-amber-400">
              High Absence Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
              {highAbsenceStudents.length}
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
              Students with &ge; 3 absences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Absence Banner (if applicable) */}
      {highAbsenceStudents.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-3">
          <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              Persistent Absence Warning
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              {highAbsenceStudents.length} student(s) ({highAbsenceStudents.map((s) => s.fullName).join(", ")}) have 3 or more absences during this 14-day window. Please verify parent contact details and check SMS dispatch status.
            </p>
          </div>
        </div>
      )}

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              P
            </span>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[11px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              A
            </span>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              L
            </span>
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              T
            </span>
            <span>Late Arrival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-5 rounded flex items-center justify-center font-bold text-[11px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              H
            </span>
            <span>Weekend / Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
            <span>Unmarked</span>
          </div>
        </div>

        <div className="text-[11px] italic text-slate-400">
          * Click on any cell or date header to open the daily attendance roster.
        </div>
      </div>

      {/* Two-Week Grid Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              {/* Header Row: Column Titles & Dates */}
              <tr className="bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 min-w-24 border-r border-slate-200 dark:border-slate-800">
                  Adm No
                </th>
                <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300 sticky left-24 z-20 bg-slate-100 dark:bg-slate-900 min-w-44 border-r border-slate-200 dark:border-slate-800">
                  Student Name
                </th>
                <th
                  className="p-2 text-center font-bold text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 w-12 border-r border-slate-200 dark:border-slate-800"
                  title="Total Absences in 2 weeks"
                >
                  Abs
                </th>
                <th
                  className="p-2 text-center font-bold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 w-12 border-r border-slate-200 dark:border-slate-800"
                  title="Total Leaves in 2 weeks"
                >
                  Lve
                </th>

                {/* 14 Day Column Headers */}
                {data.days.map((d) => (
                  <th
                    key={d.date}
                    className={`p-1.5 text-center min-w-11 border-r border-slate-200 dark:border-slate-800 transition-colors ${
                      d.isWeekend
                        ? "bg-slate-200/50 dark:bg-slate-800/40 text-slate-400"
                        : "hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                    }`}
                  >
                    <Link
                      href={`/attendance?classId=${selectedClassId}&date=${d.date}`}
                      className="block group"
                      title={`Open attendance roster for ${d.date}`}
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600">
                        {d.dayOfWeek}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                        {d.dayOfMonth}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>

              {/* Summary Rows Directly Below Headers */}
              {/* Row 1: Total Present */}
              <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 font-semibold text-[11px]">
                <td
                  colSpan={2}
                  className="p-2 text-emerald-900 dark:text-emerald-300 sticky left-0 z-20 bg-emerald-50 dark:bg-emerald-950/90 border-r border-slate-200 dark:border-slate-800 font-bold"
                >
                  Total Present
                </td>
                <td className="p-1 text-center font-bold text-emerald-800 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                  {data.totals.totalPresent}
                </td>
                <td className="p-1 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  —
                </td>
                {data.dailySummaries.map((s) => (
                  <td
                    key={`present-${s.date}`}
                    className={`p-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                      s.isWeekend ? "bg-slate-200/30 dark:bg-slate-800/20 text-slate-400" : "text-emerald-700 dark:text-emerald-300 font-bold"
                    }`}
                  >
                    {s.isWeekend ? "—" : s.present}
                  </td>
                ))}
              </tr>

              {/* Row 2: Total Absent */}
              <tr className="bg-rose-50/40 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 font-semibold text-[11px]">
                <td
                  colSpan={2}
                  className="p-2 text-rose-900 dark:text-rose-300 sticky left-0 z-20 bg-rose-50 dark:bg-rose-950/90 border-r border-slate-200 dark:border-slate-800 font-bold"
                >
                  Total Absent
                </td>
                <td className="p-1 text-center font-bold text-rose-800 dark:text-rose-300 border-r border-slate-200 dark:border-slate-800">
                  {data.totals.totalAbsent}
                </td>
                <td className="p-1 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  —
                </td>
                {data.dailySummaries.map((s) => (
                  <td
                    key={`absent-${s.date}`}
                    className={`p-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                      s.isWeekend ? "bg-slate-200/30 dark:bg-slate-800/20 text-slate-400" : s.absent > 0 ? "text-rose-700 dark:text-rose-300 font-bold" : "text-slate-400"
                    }`}
                  >
                    {s.isWeekend ? "—" : s.absent}
                  </td>
                ))}
              </tr>

              {/* Row 3: Daily Attendance % */}
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                <td
                  colSpan={2}
                  className="p-2 text-slate-700 dark:text-slate-300 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-bold"
                >
                  Daily Attendance %
                </td>
                <td className="p-1 text-center font-bold text-blue-700 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800">
                  {data.totals.overallAttendanceRate !== null ? `${data.totals.overallAttendanceRate}%` : "—"}
                </td>
                <td className="p-1 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  —
                </td>
                {data.dailySummaries.map((s) => (
                  <td
                    key={`rate-${s.date}`}
                    className={`p-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                      s.isWeekend
                        ? "bg-slate-200/30 dark:bg-slate-800/20 text-slate-400"
                        : s.attendanceRate !== null
                        ? "text-slate-800 dark:text-slate-200 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {s.isWeekend ? "—" : s.attendanceRate !== null ? `${s.attendanceRate}%` : "—"}
                  </td>
                ))}
              </tr>
            </thead>

            {/* Student Attendance Rows */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
              {data.students.length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-12 text-slate-500">
                    No active students enrolled in this class.
                  </td>
                </tr>
              ) : (
                data.students.map((student) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Admission No */}
                    <td className="p-2 font-mono text-slate-600 dark:text-slate-400 sticky left-0 z-10 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                      {student.admissionNo}
                    </td>

                    {/* Student Name */}
                    <td className="p-2 font-medium text-slate-900 dark:text-slate-100 sticky left-24 z-10 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{student.fullName}</span>
                        {student.isHighAbsence && (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1 py-0 h-4 font-normal shrink-0"
                            title="Persistent Absence Alert (&ge; 3 days)"
                          >
                            &ge;3 Abs
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Total Absences */}
                    <td
                      className={`p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-800 ${
                        student.totalAbsent > 0
                          ? "text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20"
                          : "text-slate-400"
                      }`}
                    >
                      {student.totalAbsent}
                    </td>

                    {/* Total Leaves */}
                    <td
                      className={`p-1.5 text-center font-semibold border-r border-slate-200 dark:border-slate-800 ${
                        student.totalLeave > 0
                          ? "text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                          : "text-slate-400"
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
                          className={`p-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            d.isWeekend ? "bg-slate-50/80 dark:bg-slate-900/30" : ""
                          }`}
                        >
                          <Link
                            href={`/attendance?classId=${selectedClassId}&date=${d.date}`}
                            className="inline-flex items-center justify-center size-7 rounded hover:ring-2 hover:ring-blue-400 transition-all"
                            title={`${student.fullName} on ${d.date}: ${status || "No record"} (Click to edit roster)`}
                          >
                            {status === "PRESENT" && (
                              <span className="size-6 rounded flex items-center justify-center font-bold text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                                P
                              </span>
                            )}

                            {status === "ABSENT" && (
                              <span className="size-6 rounded flex items-center justify-center font-bold text-[11px] bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800">
                                A
                              </span>
                            )}

                            {status === "LEAVE" && (
                              <span className="size-6 rounded flex items-center justify-center font-bold text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
                                L
                              </span>
                            )}

                            {status === "LATE" && (
                              <span className="size-6 rounded flex items-center justify-center font-bold text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800">
                                T
                              </span>
                            )}

                            {status === null && d.isWeekend && (
                              <span className="font-semibold text-xs text-slate-400 dark:text-slate-600">
                                H
                              </span>
                            )}

                            {status === null && !d.isWeekend && (
                              <span className="text-slate-300 dark:text-slate-700 font-bold">
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
      </Card>
    </div>
  );
}
