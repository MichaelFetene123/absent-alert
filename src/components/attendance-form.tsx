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
  const [isPending, setIsPending] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  // Sync state if initialStudents changes from server revalidation
  React.useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const s of initialStudents) {
      map[s.studentId] = s.status || "PRESENT";
    }
    setStatuses(map);
  }, [initialStudents]);

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
    return { present, absent, leave, late, total, absencePercent };
  }, [initialStudents, statuses]);

  // Filter students by search term
  const filteredStudents = React.useMemo(() => {
    if (!search.trim()) return initialStudents;
    const q = search.toLowerCase().trim();
    return initialStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q)
    );
  }, [initialStudents, search]);

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
    toast.info("All students set to Present");
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

  return (
    <div className="space-y-6">
      {/* Top Filter Controls: Class Selector & Date Picker */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <School className="size-3.5 text-blue-600" />
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full sm:w-56 h-9 px-3 text-sm rounded-lg border border-input bg-transparent text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors dark:bg-input/30 font-medium"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-blue-600" />
                Attendance Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full sm:w-44 h-9 text-sm"
              />
            </div>
          </div>

          {/* Existing Records Indicator & Quick Action */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {hasExistingRecords ? (
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 gap-1 text-xs py-1">
                <History className="size-3" />
                Previously Marked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 bg-slate-50 dark:bg-slate-800/40 text-xs py-1">
                New Roster for {selectedDate}
              </Badge>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5 h-9"
            >
              <CheckCheck className="size-4" />
              <span>Mark All Present</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Summary Chips Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Present */}
        <Card className="border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Present
              </p>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {summary.present}
              </h3>
            </div>
            <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="border-red-200/80 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider">
                Absent
              </p>
              <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mt-0.5">
                {summary.absent}
              </h3>
            </div>
            <div className="size-9 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Leave */}
        <Card className="border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                On Leave
              </p>
              <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                {summary.leave}
              </h3>
            </div>
            <div className="size-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <FileQuestion className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Late */}
        <Card className="border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                Late Arrival
              </p>
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                {summary.late}
              </h3>
            </div>
            <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster Table Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search student in roster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> of {initialStudents.length} students
        </p>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 dark:bg-slate-800/50">
              <TableHead className="w-28 font-semibold">Adm No</TableHead>
              <TableHead className="font-semibold">Student Name</TableHead>
              <TableHead className="text-right font-semibold pr-6">Attendance Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Users className="size-7 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No students found matching your search</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const currentStatus = statuses[student.studentId] || "PRESENT";

                return (
                  <TableRow key={student.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    {/* Admission Number */}
                    <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-800">
                        {student.admissionNo}
                      </Badge>
                    </TableCell>

                    {/* Student Full Name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {student.fullName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Segmented Status Controller: P · A · L · T */}
                    <TableCell className="text-right pr-4">
                      <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 gap-1">
                        {/* PRESENT (P) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            currentStatus === "PRESENT"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark Present"
                        >
                          P <span className="hidden md:inline font-normal text-[11px] ml-1">Present</span>
                        </button>

                        {/* ABSENT (A) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            currentStatus === "ABSENT"
                              ? "bg-red-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark Absent"
                        >
                          A <span className="hidden md:inline font-normal text-[11px] ml-1">Absent</span>
                        </button>

                        {/* LEAVE (L) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "LEAVE")}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            currentStatus === "LEAVE"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark On Leave"
                        >
                          L <span className="hidden md:inline font-normal text-[11px] ml-1">Leave</span>
                        </button>

                        {/* LATE (T) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "LATE")}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            currentStatus === "LATE"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                          }`}
                          title="Mark Late"
                        >
                          T <span className="hidden md:inline font-normal text-[11px] ml-1">Late</span>
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

      {/* Sticky Bottom Save Action Bar (Mobile & Desktop) */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">Summary:</span>
          <span className="text-emerald-600 font-bold">{summary.present} Present</span> ·
          <span className="text-red-600 font-bold">{summary.absent} Absent</span> ·
          <span className="text-amber-600 font-bold">{summary.leave} Leave</span> ·
          <span className="text-blue-600 font-bold">{summary.late} Late</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllPresent}
            disabled={isPending || initialStudents.length === 0}
            className="flex-1 sm:flex-initial"
          >
            Mark All Present
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveClick}
            disabled={isPending || initialStudents.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 min-w-36 flex-1 sm:flex-initial shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Attendance</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* High Absence Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle className="size-5" />
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                High Absence Rate Detected
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
              You are about to save attendance with{" "}
              <strong className="text-red-600 font-semibold">
                {summary.absent} out of {summary.total} students ({Math.round(summary.absencePercent)}%)
              </strong>{" "}
              marked as <span className="font-semibold text-red-600">Absent</span> for{" "}
              <strong>{selectedDate}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
            >
              Review Roster
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeSave}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
