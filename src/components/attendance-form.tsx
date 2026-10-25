"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/actions/attendance.actions";
import type { AttendanceStatus } from "@/lib/validations/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar,
  School,
  CheckCircle2,
  XCircle,
  Clock,
  FileQuestion,
  Users,
  Search,
  CheckCheck,
  Save,
  Loader2,
  AlertTriangle,
  History,
  Send,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export type StudentAttendanceItem = {
  studentId: string;
  admissionNo: string;
  fullName: string;
  status: AttendanceStatus | null;
  markedById: string | null;
  recordId: string | null;
};

interface AttendanceFormProps {
  initialStudents: StudentAttendanceItem[];
  classes: Array<{ id: string; name: string }>;
  selectedClassId: string;
  selectedDate: string; // "YYYY-MM-DD"
  hasExistingRecords: boolean;
  todayStr: string;
}

export function AttendanceForm({
  initialStudents,
  classes,
  selectedClassId,
  selectedDate,
  hasExistingRecords,
  todayStr,
}: AttendanceFormProps) {
  const router = useRouter();

  // Initialize status map: if existing status present, use it; otherwise default to PRESENT
  const [statuses, setStatuses] = React.useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const s of initialStudents) {
      map[s.studentId] = s.status || "PRESENT";
    }
    return map;
  });

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | AttendanceStatus>("ALL");
  const [isPending, setIsPending] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  // Sync state if initialStudents changes from server revalidation
  const [prevInitialStudents, setPrevInitialStudents] = React.useState(initialStudents);
  if (initialStudents !== prevInitialStudents) {
    setPrevInitialStudents(initialStudents);
    const map: Record<string, AttendanceStatus> = {};
    for (const s of initialStudents) {
      map[s.studentId] = s.status || "PRESENT";
    }
    setStatuses(map);
  }

  // Live count summary
  const summary = React.useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;

    for (const s of initialStudents) {
      const st = statuses[s.studentId] || "PRESENT";
      if (st === "PRESENT") present++;
      else if (st === "ABSENT") absent++;
      else if (st === "LEAVE") leave++;
      else if (st === "LATE") late++;
    }

    const total = initialStudents.length;
    const absencePercent = total > 0 ? (absent / total) * 100 : 0;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, late, total, absencePercent, attendanceRate };
  }, [initialStudents, statuses]);

  // Filter students by search term and selected status filter
  const filteredStudents = React.useMemo(() => {
    return initialStudents.filter((s) => {
      const st = statuses[s.studentId] || "PRESENT";
      if (statusFilter !== "ALL" && st !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesAdm = s.admissionNo.toLowerCase().includes(q);
        if (!matchesName && !matchesAdm) return false;
      }
      return true;
    });
  }, [initialStudents, search, statusFilter, statuses]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    for (const s of initialStudents) {
      updated[s.studentId] = "PRESENT";
    }
    setStatuses(updated);
    toast.info("All students marked as Present");
  };

  const handleClassChange = (newClassId: string) => {
    router.push(`/attendance?classId=${newClassId}&date=${selectedDate}`);
  };

  const handleDateChange = (newDate: string) => {
    router.push(`/attendance?classId=${selectedClassId}&date=${newDate}`);
  };

  const handleSaveClick = () => {
    if (initialStudents.length === 0) {
      toast.error("No active students to mark in this class");
      return;
    }

    // High absence rate check (> 30%)
    if (summary.absencePercent >= 30) {
      setIsConfirmOpen(true);
      return;
    }

    executeSave();
  };

  const executeSave = async () => {
    setIsConfirmOpen(false);
    setIsPending(true);

    try {
      const entries = initialStudents.map((s) => ({
        studentId: s.studentId,
        status: statuses[s.studentId] || "PRESENT",
      }));

      const res = await markAttendance({
        classId: selectedClassId,
        date: selectedDate,
        entries,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to save attendance");
        return;
      }

      const savedCount = res.data?.saved ?? entries.length;
      toast.success(
        hasExistingRecords
          ? `Updated ${savedCount} attendance records`
          : `Saved ${savedCount} attendance records for ${selectedDate}`
      );

      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  // Keyboard shortcut Ctrl+S or Cmd+S
  const handleSaveRef = React.useRef(handleSaveClick);
  React.useEffect(() => {
    handleSaveRef.current = handleSaveClick;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Filter Controls: Class Selector & Date Picker */}
      <div className="p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Class Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <School className="size-3.5 text-blue-600 dark:text-blue-400" />
                Class Roster
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full sm:w-60 h-10 px-3.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors shadow-xs"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                Session Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full sm:w-48 h-10 text-sm font-medium rounded-xl"
              />
            </div>
          </div>

          {/* Existing Records Indicator & Quick Action */}
          <div className="flex items-center gap-3">
            {hasExistingRecords ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20">
                <History className="size-3.5" />
                Previously Recorded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                New Session Roster
              </span>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold hover-lift"
            >
              <CheckCheck className="size-4" />
              <span>Mark All Present</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Summary Metrics Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Present */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "PRESENT" ? "ALL" : "PRESENT")}
          className={`p-4 rounded-2xl border text-left transition-all hover-lift ${
            statusFilter === "PRESENT"
              ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30"
              : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Present
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-200 mt-2">
            {summary.present}
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
            {summary.attendanceRate}% of roster
          </span>
        </button>

        {/* Absent */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "ABSENT" ? "ALL" : "ABSENT")}
          className={`p-4 rounded-2xl border text-left transition-all hover-lift ${
            statusFilter === "ABSENT"
              ? "border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/30"
              : "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              Absent
            </span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
              <XCircle className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-950 dark:text-rose-200 mt-2">
            {summary.absent}
          </div>
          <span className="text-[11px] text-rose-700/80 dark:text-rose-400">
            Triggers SMS dispatch
          </span>
        </button>

        {/* On Leave */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "LEAVE" ? "ALL" : "LEAVE")}
          className={`p-4 rounded-2xl border text-left transition-all hover-lift ${
            statusFilter === "LEAVE"
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30"
              : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Excused Leave
            </span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <FileQuestion className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-950 dark:text-amber-200 mt-2">
            {summary.leave}
          </div>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400">
            Documented permission
          </span>
        </button>

        {/* Late Arrival */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "LATE" ? "ALL" : "LATE")}
          className={`p-4 rounded-2xl border text-left transition-all hover-lift ${
            statusFilter === "LATE"
              ? "border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/30"
              : "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
              Late Arrival
            </span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 dark:text-blue-200 mt-2">
            {summary.late}
          </div>
          <span className="text-[11px] text-blue-700/80 dark:text-blue-400">
            Arrived after roll-call
          </span>
        </button>
      </div>

      {/* SMS Alert Pipeline Preview Banner */}
      {summary.absent > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-orange-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wider">
                Automated SMS Alert Pipeline Ready
              </h4>
              <p className="text-xs text-rose-800/80 dark:text-rose-300">
                Saving this roster will automatically trigger <strong>{summary.absent} SMS alert{summary.absent > 1 ? "s" : ""}</strong> to parent guardians via the SMSHub gateway.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full shrink-0">
            {summary.absent} queued
          </span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search student by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          {statusFilter !== "ALL" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("ALL")}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Reset Filter
            </Button>
          )}
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length}</span> of {initialStudents.length} students
          </p>
        </div>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold text-xs">
              <TableHead className="w-32 py-3 px-4 font-semibold">Adm No</TableHead>
              <TableHead className="py-3 px-4 font-semibold">Student Name</TableHead>
              <TableHead className="py-3 px-4 text-right font-semibold pr-6">Attendance Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-40 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="size-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold">No students match current search or filter</p>
                    {statusFilter !== "ALL" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusFilter("ALL")}
                        className="text-xs mt-1"
                      >
                        Clear Status Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const currentStatus = statuses[student.studentId] || "PRESENT";

                return (
                  <TableRow
                    key={student.studentId}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                      currentStatus === "ABSENT" ? "bg-rose-500/5 dark:bg-rose-950/10" : ""
                    }`}
                  >
                    {/* Admission Number */}
                    <TableCell className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {student.admissionNo}
                      </span>
                    </TableCell>

                    {/* Student Full Name */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                            currentStatus === "ABSENT"
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                              : currentStatus === "LEAVE"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                              : currentStatus === "LATE"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm block">
                            {student.fullName}
                          </span>
                          {currentStatus === "ABSENT" && (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5 font-medium">
                              <Zap className="size-3" />
                              Guardian SMS notification active
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Segmented Status Controller: P · A · L · T */}
                    <TableCell className="text-right py-3.5 px-4 pr-6">
                      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 gap-1 shadow-inner">
                        {/* PRESENT (P) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            currentStatus === "PRESENT"
                              ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500"
                              : "text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark Present"
                        >
                          P <span className="hidden md:inline font-medium text-[11px] ml-1">Present</span>
                        </button>

                        {/* ABSENT (A) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            currentStatus === "ABSENT"
                              ? "bg-rose-600 text-white shadow-sm ring-1 ring-rose-500"
                              : "text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark Absent"
                        >
                          A <span className="hidden md:inline font-medium text-[11px] ml-1">Absent</span>
                        </button>

                        {/* LEAVE (L) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "LEAVE")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            currentStatus === "LEAVE"
                              ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-400"
                              : "text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark On Leave"
                        >
                          L <span className="hidden md:inline font-medium text-[11px] ml-1">Leave</span>
                        </button>

                        {/* LATE (T) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "LATE")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            currentStatus === "LATE"
                              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500"
                              : "text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark Late"
                        >
                          T <span className="hidden md:inline font-medium text-[11px] ml-1">Late</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bottom Sticky Save Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-30 px-4 md:px-8 max-w-5xl mx-auto pointer-events-none">
        <div className="pointer-events-auto p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-900 dark:text-white mr-1">Roster Summary:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
              {summary.present} Present
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border border-rose-500/20">
              {summary.absent} Absent
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
              {summary.leave} Leave
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold border border-blue-500/20">
              {summary.late} Late
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              disabled={isPending || initialStudents.length === 0}
              className="h-10 px-4 rounded-xl text-xs font-semibold flex-1 sm:flex-initial"
            >
              Mark All Present
            </Button>

            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={isPending || initialStudents.length === 0}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs gap-2 min-w-40 flex-1 sm:flex-initial shadow-md shadow-emerald-600/20 hover-lift"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving &amp; Dispatching...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Save Attendance</span>
                  <span className="hidden lg:inline text-[10px] opacity-75 font-mono ml-1 px-1.5 py-0.5 rounded bg-white/20">
                    ⌘S
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* High Absence Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-rose-600 mb-1">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                High Absence Rate Detected
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-2 leading-relaxed">
              You are about to save attendance with{" "}
              <strong className="text-rose-600 font-bold">
                {summary.absent} out of {summary.total} students ({Math.round(summary.absencePercent)}%)
              </strong>{" "}
              flagged as <span className="font-semibold text-rose-600">Absent</span> for{" "}
              <strong>{selectedDate}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <span className="font-bold block">Important Alert Dispatch Notice:</span>
            <span>Once submitted, SMS alerts will be transmitted directly to all {summary.absent} parents&apos; mobile phones. Please confirm that these absences are accurate.</span>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-xl"
            >
              Review Roster
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeSave}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
            >
              Confirm &amp; Dispatch SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
