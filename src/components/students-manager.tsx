"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StudentForm, type StudentItem } from "@/components/student-form";
import { toggleStudentActive } from "@/actions/student.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Edit2,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  School,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

interface StudentsManagerProps {
  initialStudents: StudentItem[];
  classes: Array<{ id: string; name: string }>;
  isAdmin: boolean;
}

export function StudentsManager({
  initialStudents,
  classes,
  isAdmin,
}: StudentsManagerProps) {
  const router = useRouter();
  const [students, setStudents] = React.useState<StudentItem[]>(initialStudents);
  const [search, setSearch] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("ALL");
  const [showInactive, setShowInactive] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<StudentItem | null>(null);
  const [isTogglingId, setIsTogglingId] = React.useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = React.useState<string | null>(null);

  // Sync state if props change from server revalidation
  const [prevInitialStudents, setPrevInitialStudents] = React.useState(initialStudents);
  if (initialStudents !== prevInitialStudents) {
    setPrevInitialStudents(initialStudents);
    setStudents(initialStudents);
  }

  // Filter students based on search, class, and active status
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      // Status filter
      if (!showInactive && !s.active) return false;

      // Class filter
      if (selectedClassId !== "ALL" && s.classId !== selectedClassId) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesAdm = s.admissionNo.toLowerCase().includes(q);
        const matchesGuardian = s.guardianName.toLowerCase().includes(q);
        const matchesPhone = s.guardianPhone.toLowerCase().includes(q);
        return matchesName || matchesAdm || matchesGuardian || matchesPhone;
      }

      return true;
    });
  }, [students, search, selectedClassId, showInactive]);

  const stats = React.useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const inactive = total - active;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;
    return { total, active, inactive, activeRate };
  }, [students]);

  async function handleToggleActive(student: StudentItem) {
    if (!isAdmin) return;
    try {
      setIsTogglingId(student.id);
      const newActive = !student.active;
      const res = await toggleStudentActive(student.id, newActive);

      if (!res.ok) {
        toast.error(res.error || "Failed to update status");
        return;
      }

      // Optimistic update
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, active: newActive } : s))
      );

      toast.success(
        `Student ${student.fullName} ${newActive ? "reactivated" : "deactivated"}`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to change status");
    } finally {
      setIsTogglingId(null);
    }
  }

  function handleCreate() {
    setEditingStudent(null);
    setIsFormOpen(true);
  }

  function handleEdit(student: StudentItem) {
    setEditingStudent(student);
    setIsFormOpen(true);
  }

  function copyPhone(phone: string, id: string) {
    if (phone.includes("*")) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    toast.info(`Copied phone number ${phone}`);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Student Directory &amp; Roster
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Manage student admissions, primary guardian mobile numbers, and classroom assignments.
            </p>
          </div>
        </div>

        {isAdmin ? (
          <Button
            onClick={handleCreate}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 shadow-md shadow-blue-600/20 hover-lift shrink-0"
          >
            <UserPlus className="size-4" />
            <span>Add Student</span>
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Lock className="size-3.5 text-slate-400" />
            <span>Teacher View (Guardian phone masked)</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Enrolled */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs hover-lift transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Enrolled
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats.total}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Across {classes.length} classrooms</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs hover-lift transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Active Enrolled
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-200 mt-1">
                {stats.active}
              </h3>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-semibold mt-0.5">
                {stats.activeRate}% active rate
              </p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Inactive */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs hover-lift transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Inactive / Suspended
              </p>
              <h3 className="text-3xl font-extrabold text-slate-600 dark:text-slate-400 mt-1">
                {stats.inactive}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Excluded from roll-call</p>
            </div>
            <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Class Filter, Inactive Toggle */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by student name, admission number, guardian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl text-sm"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs"
            >
              <option value="ALL" className="dark:bg-slate-900">
                All Classrooms ({classes.length})
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Inactive Checkbox Toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Include Inactive Students</span>
          </label>
        </div>

        <p className="text-xs text-slate-500 self-end sm:self-auto font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length}</span> of {students.length} students
        </p>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900">
              <TableRow className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
                <TableHead className="w-32 py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Adm No</TableHead>
                <TableHead className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Student Profile</TableHead>
                <TableHead className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Classroom</TableHead>
                <TableHead className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Primary Guardian Contact</TableHead>
                <TableHead className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Enrollment Status</TableHead>
                {isAdmin && <TableHead className="text-right py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="h-40 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="size-9 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No students match current search or class filter</p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreate}
                          className="mt-1 rounded-xl text-xs font-semibold"
                        >
                          Register a new student
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const isToggling = isTogglingId === student.id;

                  return (
                    <TableRow
                      key={student.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        !student.active ? "opacity-60 bg-slate-50/40 dark:bg-slate-900/40" : ""
                      }`}
                    >
                      {/* Admission Number */}
                      <TableCell className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {student.admissionNo}
                        </span>
                      </TableCell>

                      {/* Student Full Name & Avatar */}
                      <TableCell className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-sm block">{student.fullName}</span>
                            <span className="block text-[11px] font-mono text-slate-400 font-normal">
                              ID: {student.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Class */}
                      <TableCell className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className="font-medium text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1"
                        >
                          <School className="size-3 text-slate-400" />
                          <span>{student.className}</span>
                        </Badge>
                      </TableCell>

                      {/* Primary Guardian & Phone */}
                      <TableCell className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-900 dark:text-slate-100 font-bold">
                            {student.guardianName}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <Smartphone className="size-3 text-slate-400" />
                            <span>{student.guardianPhone}</span>
                            {!isAdmin && (
                              <span className="text-[10px] text-slate-400 font-sans ml-1">
                                (masked)
                              </span>
                            )}
                            {isAdmin && !student.guardianPhone.includes("*") && (
                              <button
                                type="button"
                                onClick={() => copyPhone(student.guardianPhone, student.id)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-1 p-0.5"
                                title="Copy guardian phone"
                              >
                                {copiedPhoneId === student.id ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Active Status Badge */}
                      <TableCell className="py-3.5 px-4">
                        {student.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Roster
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="size-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </TableCell>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <TableCell className="text-right py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(student)}
                              className="size-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg cursor-pointer"
                              title="Edit Student Profile"
                            >
                              <Edit2 className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isToggling}
                              onClick={() => handleToggleActive(student)}
                              className={`size-8 p-0 rounded-lg cursor-pointer ${
                                student.active
                                  ? "text-slate-400 hover:text-amber-600 hover:bg-amber-500/10"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              }`}
                              title={student.active ? "Deactivate Student" : "Reactivate Student"}
                            >
                              {student.active ? (
                                <UserX className="size-3.5" />
                              ) : (
                                <UserCheck className="size-3.5" />
                              )}
                              <span className="sr-only">
                                {student.active ? "Deactivate" : "Reactivate"}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Slide-over Sheet for Create / Edit */}
      {isAdmin && (
        <StudentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          classes={classes}
          student={editingStudent}
          onSuccess={() => {
            // State revalidated via router.refresh()
          }}
        />
      )}
    </div>
  );
}
