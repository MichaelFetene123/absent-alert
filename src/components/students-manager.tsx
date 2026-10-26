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
import { BulkImportModal } from "@/components/bulk-import-modal";
import { useStudentsQuery, useToggleStudentActiveMutation } from "@/hooks/use-students";
import { toast } from "sonner";
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
  FileSpreadsheet,
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
  const { data: students = initialStudents } = useStudentsQuery(
    { showInactive: true },
    initialStudents
  );
  const toggleActiveMutation = useToggleStudentActiveMutation();

  const [search, setSearch] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("ALL");
  const [showInactive, setShowInactive] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<StudentItem | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = React.useState<string | null>(null);

  const isTogglingId = toggleActiveMutation.isPending
    ? toggleActiveMutation.variables?.studentId
    : null;

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

  function handleToggleActive(student: StudentItem) {
    if (!isAdmin) return;
    const newActive = !student.active;
    toggleActiveMutation.mutate(
      { studentId: student.id, active: newActive },
      {
        onSuccess: (res) => {
          if (!res.ok) {
            toast.error(res.error || "Failed to update status");
            return;
          }
          toast.success(
            `Student ${student.fullName} ${newActive ? "reactivated" : "deactivated"}`
          );
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to change status");
        },
      }
    );
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-foreground" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Students
          </h1>
          {isAdmin ? (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1 py-0.5 px-2">
              <ShieldCheck className="size-3 text-muted-foreground" />
              <span>Admin</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1 py-0.5 px-2">
              <Lock className="size-3 text-muted-foreground" />
              <span>Teacher (Masked)</span>
            </Badge>
          )}
        </div>

        {isAdmin && (
          <Button
            onClick={handleCreate}
            size="sm"
            className="h-8 px-3 rounded-lg font-medium text-xs gap-1.5 shrink-0"
          >
            <UserPlus className="size-3.5" />
            <span>Add Student</span>
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Enrolled */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Enrolled
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.total}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across {classes.length} classrooms</p>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Enrolled
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.active}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.activeRate}% active rate
            </p>
          </CardContent>
        </Card>

        {/* Inactive */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inactive / Suspended
            </p>
            <h3 className="text-2xl font-bold text-muted-foreground mt-1">
              {stats.inactive}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Excluded from roll call</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Class Filter, Inactive Toggle */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by student, adm no, or guardian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 rounded-lg text-xs"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">
              All Classrooms ({classes.length})
            </option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Inactive Checkbox Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none px-2 py-1 rounded hover:bg-muted/50">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            <span>Include Inactive</span>
          </label>
        </div>

        <p className="text-xs text-muted-foreground self-end sm:self-auto font-medium">
          Showing <span className="font-bold text-foreground">{filteredStudents.length}</span> of {students.length}
        </p>
      </div>

      {/* Students Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border text-xs font-medium">
                <TableHead className="w-28 py-2.5 px-4 font-semibold text-foreground">Adm No</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Student Name</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Classroom</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Primary Guardian</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Status</TableHead>
                {isAdmin && <TableHead className="text-right py-2.5 px-4 font-semibold text-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Users className="size-6 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">No students match current search or class filter</p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreate}
                          className="mt-1 h-7 text-xs"
                        >
                          Register student
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
                      className={`hover:bg-muted/50 transition-colors ${
                        !student.active ? "opacity-60 bg-muted/20" : ""
                      }`}
                    >
                      {/* Admission Number */}
                      <TableCell className="py-2.5 px-4 font-mono text-xs text-muted-foreground">
                        {student.admissionNo}
                      </TableCell>

                      {/* Student Full Name */}
                      <TableCell className="py-2.5 px-4 font-medium text-foreground text-sm">
                        {student.fullName}
                      </TableCell>

                      {/* Class */}
                      <TableCell className="py-2.5 px-4">
                        <Badge
                          variant="secondary"
                          className="font-medium text-xs px-2 py-0.5"
                        >
                          {student.className}
                        </Badge>
                      </TableCell>

                      {/* Primary Guardian & Phone */}
                      <TableCell className="py-2.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-foreground font-medium">
                            {student.guardianName}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Smartphone className="size-3 text-muted-foreground" />
                            <span>{student.guardianPhone}</span>
                            {!isAdmin && (
                              <span className="text-[10px] text-muted-foreground font-sans">
                                (masked)
                              </span>
                            )}
                            {isAdmin && !student.guardianPhone.includes("*") && (
                              <button
                                type="button"
                                onClick={() => copyPhone(student.guardianPhone, student.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                title="Copy guardian phone"
                              >
                                {copiedPhoneId === student.id ? (
                                  <Check className="size-3 text-primary" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Active Status Badge */}
                      <TableCell className="py-2.5 px-4">
                        {student.active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                            <span className="size-1.5 rounded-full bg-primary" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span className="size-1.5 rounded-full bg-muted-foreground" />
                            Inactive
                          </span>
                        )}
                      </TableCell>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <TableCell className="text-right py-2.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(student)}
                              className="size-7 p-0 text-muted-foreground hover:text-foreground rounded"
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
                              className="size-7 p-0 rounded text-muted-foreground hover:text-foreground"
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

      {/* Centered Dialog for Create / Edit */}
      {isAdmin && (
        <>
          <StudentForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            classes={classes}
            student={editingStudent}
            onSuccess={() => {
              // State revalidated via router.refresh()
            }}
          />

          <BulkImportModal
            open={isBulkImportOpen}
            onOpenChange={setIsBulkImportOpen}
            classes={classes}
            onSuccess={() => {
              // State revalidated via router.refresh()
            }}
          />
        </>
      )}
    </div>
  );
}
