"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMarkAttendanceMutation } from "@/hooks/use-attendance";
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
  Save,
  Loader2,
  AlertTriangle,
  History,
  Send,
  Zap,
  ArrowRight,
  Printer,
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
  const markAttendanceMutation = useMarkAttendanceMutation();
  const isPending = markAttendanceMutation.isPending;
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [activeRowIndex, setActiveRowIndex] = React.useState<number>(0);

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
    toast.success("All students marked as Present");
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

  const executeSave = () => {
    setIsConfirmOpen(false);

    const entries = initialStudents.map((s) => ({
      studentId: s.studentId,
      status: statuses[s.studentId] || "PRESENT",
    }));

    markAttendanceMutation.mutate(
      {
        classId: selectedClassId,
        date: selectedDate,
        entries,
      },
      {
        onSuccess: (res: any) => {
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
        },
        onError: (err: any) => {
          toast.error(err.message || "An unexpected error occurred");
        },
      }
    );
  };

  // Keyboard shortcuts: Rapid marking (P, A, L, E), navigation (Up, Down), and save (Ctrl+S, Ctrl+Enter)
  const handleSaveRef = React.useRef(handleSaveClick);
  React.useEffect(() => {
    handleSaveRef.current = handleSaveClick;
  });

  const filteredStudentsRef = React.useRef(filteredStudents);
  React.useEffect(() => {
    filteredStudentsRef.current = filteredStudents;
  });

  const activeRowIndexRef = React.useRef(activeRowIndex);
  React.useEffect(() => {
    activeRowIndexRef.current = activeRowIndex;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Save shortcut works from anywhere
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter")) {
        e.preventDefault();
        handleSaveRef.current();
        return;
      }

      // Ignore single-key shortcuts when typing in search or text boxes
      if (isInput) return;

      const currentList = filteredStudentsRef.current;
      const curIdx = activeRowIndexRef.current;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveRowIndex((i) => Math.min(currentList.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveRowIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        const student = currentList[curIdx];
        if (student) {
          handleStatusChange(student.studentId, "PRESENT");
          setActiveRowIndex((i) => Math.min(currentList.length - 1, i + 1));
        }
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const student = currentList[curIdx];
        if (student) {
          handleStatusChange(student.studentId, "ABSENT");
          setActiveRowIndex((i) => Math.min(currentList.length - 1, i + 1));
        }
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const student = currentList[curIdx];
        if (student) {
          handleStatusChange(student.studentId, "LATE");
          setActiveRowIndex((i) => Math.min(currentList.length - 1, i + 1));
        }
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        const student = currentList[curIdx];
        if (student) {
          handleStatusChange(student.studentId, "LEAVE");
          setActiveRowIndex((i) => Math.min(currentList.length - 1, i + 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-6 pb-24">
      {/* Filter Controls: Class Selector & Date Picker */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <School className="size-3.5 text-muted-foreground" />
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full sm:w-56 h-9 px-3 text-sm font-medium rounded-lg border border-border bg-background text-foreground outline-none transition-colors"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="size-3.5 text-muted-foreground" />
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full sm:w-44 h-9 text-sm rounded-lg"
              />
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2.5">
            {hasExistingRecords ? (
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1.5 py-1 px-2.5">
                <History className="size-3 text-muted-foreground" />
                <span>Recorded</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1.5 py-1 px-2.5">
                <span>New Session</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Present */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "PRESENT" ? "ALL" : "PRESENT")}
          className={`p-3.5 rounded-xl border text-left transition-colors ${
            statusFilter === "PRESENT"
              ? "border-primary bg-primary/10 ring-1 ring-primary"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Present
            </span>
            <CheckCircle2 className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {summary.present}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {summary.attendanceRate}% of roster
          </span>
        </button>

        {/* Absent */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "ABSENT" ? "ALL" : "ABSENT")}
          className={`p-3.5 rounded-xl border text-left transition-colors ${
            statusFilter === "ABSENT"
              ? "border-destructive bg-destructive/10 ring-1 ring-destructive"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Absent
            </span>
            <XCircle className="size-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {summary.absent}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Triggers SMS dispatch
          </span>
        </button>

        {/* On Leave */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "LEAVE" ? "ALL" : "LEAVE")}
          className={`p-3.5 rounded-xl border text-left transition-colors ${
            statusFilter === "LEAVE"
              ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Excused Leave
            </span>
            <FileQuestion className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {summary.leave}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Excused absence
          </span>
        </button>

        {/* Late Arrival */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "LATE" ? "ALL" : "LATE")}
          className={`p-3.5 rounded-xl border text-left transition-colors ${
            statusFilter === "LATE"
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Late Arrival
            </span>
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {summary.late}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Arrived after roll call
          </span>
        </button>
      </div>


      {/* Printable Institutional Header (Visible only when printed) */}
      <div className="print-only mb-6">
        <div className="text-center border-b border-slate-300 pb-4 mb-3">
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
            AbsentAlert Official School Attendance Roster
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Class: <strong>{classes.find((c) => c.id === selectedClassId)?.name || selectedClassId}</strong> | Date: <strong>{selectedDate}</strong> | Total Enrolled: <strong>{initialStudents.length} Students</strong>
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filter
            </Button>
          )}
          <p className="text-xs font-medium text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredStudents.length}</span> of {initialStudents.length} students
          </p>
        </div>
      </div>


      {/* Student Attendance Roster Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <tr className="border-b border-border bg-muted/50 text-foreground font-medium text-xs">
              <TableHead className="w-28 py-2.5 px-4 font-semibold">Adm No</TableHead>
              <TableHead className="py-2.5 px-4 font-semibold">Student Name</TableHead>
              <TableHead className="py-2.5 px-4 text-right font-semibold pr-6">Attendance Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Users className="size-6 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No students match current search or filter</p>
                    {statusFilter !== "ALL" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusFilter("ALL")}
                        className="text-xs h-7 px-2.5 mt-1"
                      >
                        Clear Status Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, idx) => {
                const currentStatus = statuses[student.studentId] || "PRESENT";
                const isActiveRow = idx === activeRowIndex;

                return (
                  <TableRow
                    key={student.studentId}
                    className={`hover:bg-muted/50 transition-colors ${
                      currentStatus === "ABSENT"
                        ? "bg-destructive/5 dark:bg-destructive/10"
                        : currentStatus === "LEAVE"
                        ? "bg-purple-500/5 dark:bg-purple-500/10"
                        : currentStatus === "LATE"
                        ? "bg-amber-500/5 dark:bg-amber-500/10"
                        : ""
                    }`}
                  >
                    {/* Admission Number */}
                    <TableCell className="py-2.5 px-4">
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        {student.admissionNo}
                      </span>
                    </TableCell>

                    {/* Student Full Name */}
                    <TableCell className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-foreground text-sm">
                          {student.fullName}
                        </span>
                        {currentStatus === "ABSENT" && (
                          <span className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                            <Send className="size-2.5" />
                            SMS active
                          </span>
                        )}
                        {currentStatus === "LEAVE" && (
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                            Excused
                          </span>
                        )}
                        {currentStatus === "LATE" && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Tardy
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Segmented Status Controller: P · A · L · T */}
                    <TableCell className="text-right py-2.5 px-4 pr-6">
                      <div className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border gap-0.5">
                        {/* PRESENT (P) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                            currentStatus === "PRESENT"
                              ? "bg-primary text-primary-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Mark Present"
                        >
                          P <span className="hidden sm:inline font-normal text-[11px] ml-1">Present</span>
                        </button>

                        {/* ABSENT (A) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                            currentStatus === "ABSENT"
                              ? "bg-destructive text-destructive-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Mark Absent"
                        >
                          A <span className="hidden sm:inline font-normal text-[11px] ml-1">Absent</span>
                        </button>

                        {/* LEAVE (L) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "LEAVE")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                            currentStatus === "LEAVE"
                              ? "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Mark On Leave"
                        >
                          L <span className="hidden sm:inline font-normal text-[11px] ml-1">Leave</span>
                        </button>

                        {/* LATE (T) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "LATE")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                            currentStatus === "LATE"
                              ? "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Mark Late"
                        >
                          T <span className="hidden sm:inline font-normal text-[11px] ml-1">Late</span>
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

      {/* Printable Institutional Signature Block (Visible only when printed) */}
      <div className="print-only mt-8 pt-6 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-semibold text-slate-800">Homeroom Teacher Signature:</p>
            <div className="mt-8 border-b border-slate-400 w-56"></div>
            <p className="text-xs text-slate-500 mt-1">Date: ____________________</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">School Administrator / Principal Signature:</p>
            <div className="mt-8 border-b border-slate-400 w-56"></div>
            <p className="text-xs text-slate-500 mt-1">Date: ____________________</p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Save Action Bar */}
      <div className="fixed bottom-4 left-0 right-0 md:left-(--sidebar-width,15rem) z-30 px-3 sm:px-6 md:px-8 pointer-events-none flex justify-center transition-all duration-200 ease-in-out">
        <div className="pointer-events-auto w-full max-w-4xl p-2.5 sm:p-3 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-lg flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium text-muted-foreground mr-1">Roster:</span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">
              {summary.present} P
            </span>
            <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold border border-destructive/20">
              {summary.absent} A
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold border border-purple-500/20">
              {summary.leave} L
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
              {summary.late} T
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-foreground border-border hover:bg-muted"
              title="Print official classroom attendance sheet"
            >
              <Printer className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              disabled={isPending || initialStudents.length === 0}
              className="h-8.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium shrink-0"
            >
              Mark All Present
            </Button>

            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={isPending || initialStudents.length === 0}
              className="h-8.5 px-3 sm:px-4 rounded-lg font-medium text-xs gap-1.5 shrink-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save Attendance</span>
                  <span className="hidden lg:inline text-[10px] opacity-75 font-mono ml-1 px-1 rounded bg-primary-foreground/20">
                    Ctrl+S
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
            <div className="flex items-center gap-2.5 text-destructive mb-1">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                High Absence Rate Detected
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-2 leading-relaxed">
              You are about to save attendance with{" "}
              <strong className="text-destructive font-bold">
                {summary.absent} out of {summary.total} students ({Math.round(summary.absencePercent)}%)
              </strong>{" "}
              flagged as <span className="font-semibold text-destructive">Absent</span> for{" "}
              <strong>{selectedDate}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
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
              variant="destructive"
              size="sm"
              onClick={executeSave}
              className="font-semibold rounded-xl"
            >
              Confirm &amp; Dispatch SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
