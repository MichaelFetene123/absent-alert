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

  // Sync state if props change from server revalidation
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

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
        return matchesName || matchesAdm || matchesGuardian;
      }

      return true;
    });
  }, [students, search, selectedClassId, showInactive]);

  const stats = React.useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const inactive = total - active;
    return { total, active, inactive };
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

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Enrolled
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.total}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Active Students
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {stats.active}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Inactive / Deactivated
              </p>
              <h3 className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.inactive}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Class Filter, Inactive Toggle, Add Student Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, adm no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-9 px-2.5 text-sm rounded-lg border border-input bg-transparent text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors dark:bg-input/30"
            >
              <option value="ALL" className="dark:bg-slate-900">
                All Classes ({classes.length})
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Inactive Checkbox Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show Inactive</span>
          </label>
        </div>

        {/* Add Student Button (Admin only) */}
        {isAdmin ? (
          <Button
            onClick={handleCreate}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
          >
            <UserPlus className="size-4" />
            <span>Add Student</span>
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <Lock className="size-3.5 text-slate-400" />
            <span>Teacher View (Read-Only)</span>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 dark:bg-slate-800/50 hover:bg-slate-50/75 dark:hover:bg-slate-800/50">
              <TableHead className="w-28 font-semibold">Adm No</TableHead>
              <TableHead className="font-semibold">Student Name</TableHead>
              <TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Primary Guardian</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              {isAdmin && <TableHead className="text-right font-semibold">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="h-32 text-center text-slate-500 dark:text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="size-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No students match your criteria</p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreate}
                        className="mt-1"
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
                    className={!student.active ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/50" : ""}
                  >
                    {/* Admission Number */}
                    <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-800">
                        {student.admissionNo}
                      </Badge>
                    </TableCell>

                    {/* Student Full Name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {student.fullName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <School className="size-3.5 text-slate-400" />
                        <span>{student.className}</span>
                      </div>
                    </TableCell>

                    {/* Primary Guardian & Masked/Unmasked Phone */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                          {student.guardianName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                          <Phone className="size-3 text-slate-400" />
                          <span>{student.guardianPhone}</span>
                          {!isAdmin && (
                            <span className="text-[10px] text-slate-400 font-sans ml-1">
                              (masked)
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Active Status Badge */}
                    <TableCell>
                      {student.active ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 text-[11px] gap-1 px-2"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] gap-1 px-2"
                        >
                          <span className="size-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(student)}
                            className="size-8 p-0 text-slate-600 hover:text-blue-600"
                            title="Edit Student"
                          >
                            <Edit2 className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isToggling}
                            onClick={() => handleToggleActive(student)}
                            className={`size-8 p-0 ${
                              student.active
                                ? "text-slate-400 hover:text-amber-600"
                                : "text-emerald-600 hover:text-emerald-700"
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
