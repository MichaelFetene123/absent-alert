"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  School,
  CalendarCheck,
  CalendarDays,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User,
  ExternalLink,
  Shield,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { TeacherItemWithDetails } from "@/actions/teacher.actions";
import {
  useTeachersDetailsQuery,
  useAvailableClassesQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} from "@/hooks/use-teachers";

interface TeachersManagerProps {
  initialTeachers: TeacherItemWithDetails[];
  availableClasses: Array<{ id: string; name: string }>;
  isAdmin: boolean;
}

export function TeachersManager({
  initialTeachers,
  availableClasses,
  isAdmin,
}: TeachersManagerProps) {
  const router = useRouter();

  // TanStack Query for teachers and classes
  const { data: teachers = initialTeachers } = useTeachersDetailsQuery(initialTeachers);
  const { data: classesList = availableClasses } = useAvailableClassesQuery(availableClasses);

  // TanStack Mutations
  const createTeacherMutation = useCreateTeacherMutation();
  const updateTeacherMutation = useUpdateTeacherMutation();
  const deleteTeacherMutation = useDeleteTeacherMutation();

  // Filtering & Search
  const [search, setSearch] = React.useState("");
  const [classFilter, setClassFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [createPassword, setCreatePassword] = React.useState("teacher@123");
  const [createClassIds, setCreateClassIds] = React.useState<string[]>([]);

  // Edit Modal State
  const [editingTeacher, setEditingTeacher] = React.useState<TeacherItemWithDetails | null>(null);
  const [editName, setEditName] = React.useState("");

  const [editEmail, setEditEmail] = React.useState("");
  const [editPassword, setEditPassword] = React.useState("");
  const [editClassIds, setEditClassIds] = React.useState<string[]>([]);

  // Delete Modal State
  const [deletingTeacher, setDeletingTeacher] = React.useState<TeacherItemWithDetails | null>(null);

  const isCreating = createTeacherMutation.isPending;
  const isUpdating = updateTeacherMutation.isPending;
  const isDeleting = deleteTeacherMutation.isPending;

  // Filtered teachers list
  const filteredTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesEmail = t.email.toLowerCase().includes(q);
        const matchesClass = t.assignedClasses.some((c) => c.name.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesClass) return false;
      }

      // Class filter
      if (classFilter !== "ALL") {
        if (classFilter === "UNASSIGNED" && t.assignedClasses.length > 0) return false;
        if (classFilter !== "UNASSIGNED" && !t.assignedClasses.some((c) => c.id === classFilter)) {
          return false;
        }
      }

      // Assignment status filter
      if (statusFilter === "ASSIGNED" && t.assignedClasses.length === 0) return false;
      if (statusFilter === "UNASSIGNED" && t.assignedClasses.length > 0) return false;

      return true;
    });
  }, [teachers, search, classFilter, statusFilter]);

  // Metric stats
  const stats = React.useMemo(() => {
    const totalTeachers = teachers.length;
    const assignedTeachers = teachers.filter((t) => t.assignedClasses.length > 0).length;
    const unassignedTeachers = totalTeachers - assignedTeachers;
    const totalClassAssignments = teachers.reduce((sum, t) => sum + t.assignedClasses.length, 0);

    return {
      totalTeachers,
      assignedTeachers,
      unassignedTeachers,
      totalClassAssignments,
    };
  }, [teachers]);

  // Handlers
  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const res = await createTeacherMutation.mutateAsync({
        name: createName,
        email: createEmail,
        password: createPassword,
        classIds: createClassIds,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to create teacher account");
        return;
      }

      toast.success(`Teacher "${createName}" registered successfully`);
      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("teacher@123");
      setCreateClassIds([]);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  }

  function openEditModal(t: TeacherItemWithDetails) {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditPassword("");
    setEditClassIds(t.assignedClasses.map((c) => c.id));
  }

  async function handleUpdateTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !editingTeacher) return;

    try {
      const res = await updateTeacherMutation.mutateAsync({
        id: editingTeacher.id,
        name: editName,
        email: editEmail,
        password: editPassword.trim() ? editPassword.trim() : undefined,
        classIds: editClassIds,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to update teacher");
        return;
      }

      toast.success("Teacher account updated successfully");
      setEditingTeacher(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  }

  async function handleDeleteTeacher() {
    if (!isAdmin || !deletingTeacher) return;

    // Strict front-end guard: classes assigned
    if (deletingTeacher.assignedClasses.length > 0) {
      toast.error(
        `Cannot delete "${deletingTeacher.name}": Assigned to ${deletingTeacher.assignedClasses.length} class(es). Unassign them first.`
      );
      return;
    }

    // Strict front-end guard: marked records
    if (deletingTeacher.markedAttendanceCount > 0) {
      toast.error(
        `Cannot delete "${deletingTeacher.name}": Has ${deletingTeacher.markedAttendanceCount} marked attendance record(s). Cannot delete historical audit record.`
      );
      return;
    }

    try {
      const res = await deleteTeacherMutation.mutateAsync(deletingTeacher.id);

      if (!res.ok) {
        toast.error(res.error || "Failed to delete teacher");
        return;
      }

      toast.success(`Teacher "${deletingTeacher.name}" deleted successfully`);
      setDeletingTeacher(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  }

  function toggleClassSelection(classId: string, currentList: string[], setter: (v: string[]) => void) {
    if (currentList.includes(classId)) {
      setter(currentList.filter((id) => id !== classId));
    } else {
      setter([...currentList, classId]);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-foreground" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Teachers
          </h1>
          {isAdmin ? (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1 py-0.5 px-2">
              <Shield className="size-3 text-muted-foreground" />
              <span>Admin</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1 py-0.5 px-2">
              <GraduationCap className="size-3 text-muted-foreground" />
              <span>Faculty Directory</span>
            </Badge>
          )}
        </div>

        {isAdmin && (
          <Button
            id="add-teacher-btn"
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="h-8 px-3 rounded-lg font-medium text-xs gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Teacher</span>
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Teachers */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faculty Members</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.totalTeachers}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Registered accounts</p>
          </CardContent>
        </Card>

        {/* Class Assignments */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Class Assignments</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.totalClassAssignments}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across all classrooms</p>
          </CardContent>
        </Card>

        {/* Assigned Teachers */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Instructors</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.assignedTeachers}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Covering rosters</p>
          </CardContent>
        </Card>

        {/* Unassigned */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unassigned</p>
            <h3
              className={`text-2xl font-bold mt-1 ${
                stats.unassignedTeachers > 0
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {stats.unassignedTeachers}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.unassignedTeachers === 0 ? "All faculty assigned" : "Awaiting assignment"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Filters */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              id="teacher-search-input"
              placeholder="Search faculty by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 rounded-lg text-xs"
            />
          </div>

          {/* Class Filter */}
          <select
            id="teacher-class-filter"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">All Classrooms</option>
            <option value="UNASSIGNED">Unassigned Only</option>
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="teacher-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ASSIGNED">Has Classes</option>
            <option value="UNASSIGNED">No Classes</option>
          </select>
        </div>

        <p className="text-xs text-muted-foreground self-end sm:self-auto font-medium">
          Showing <span className="font-bold text-foreground">{filteredTeachers.length}</span> of {teachers.length}
        </p>
      </div>

      {/* Teachers Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border text-xs font-medium">
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Instructor Name</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Email Address</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Assigned Classes</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Attendance Audit</TableHead>
                <TableHead className="py-2.5 px-4 text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <GraduationCap className="size-6 text-muted-foreground" />
                      <p className="font-medium text-sm text-foreground">No teachers found</p>
                      <p className="text-xs text-muted-foreground">
                        {search || classFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Try clearing your search or filters."
                          : "Create your first teacher account to begin assigning classes."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/50 transition-colors">
                    {/* Name */}
                    <TableCell className="py-2.5 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{t.name}</span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-2.5 px-4 text-muted-foreground font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3 text-muted-foreground shrink-0" />
                        <span>{t.email}</span>
                      </div>
                    </TableCell>

                    {/* Assigned Classes */}
                    <TableCell className="py-2.5 px-4">
                      {t.assignedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {t.assignedClasses.map((cls) => (
                            <Link key={cls.id} href={`/attendance?classId=${cls.id}`}>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border hover:border-foreground/40 transition-colors">
                                <School className="size-3 text-muted-foreground" />
                                <span>{cls.name}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-destructive bg-destructive/10 border border-destructive/20">
                          <AlertTriangle className="size-3" />
                          <span>No classes</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Attendance Records Marked */}
                    <TableCell className="py-2.5 px-4">
                      <span className="text-xs text-muted-foreground">
                        {t.markedAttendanceCount} session{t.markedAttendanceCount === 1 ? "" : "s"}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Direct Roster link if assigned */}
                        {t.assignedClasses.length > 0 && (
                          <Link href={`/attendance?classId=${t.assignedClasses[0]!.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground font-medium"
                              title={`View Roster for ${t.assignedClasses[0]!.name}`}
                            >
                              <CalendarCheck className="size-3.5 mr-1 text-primary" />
                              <span>Roster</span>
                            </Button>
                          </Link>
                        )}

                        {/* Admin Edit */}
                        {isAdmin && (
                          <Button
                            id={`edit-teacher-btn-${t.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(t)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded"
                            title="Edit Teacher & Classes"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        )}

                        {/* Admin Delete */}
                        {isAdmin && (
                          <Button
                            id={`delete-teacher-btn-${t.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTeacher(t)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded"
                            title="Delete Teacher Account"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CREATE TEACHER DIALOG */}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <GraduationCap className="size-5 text-primary" />
                <span>Register Faculty Member</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateTeacher} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="create-teacher-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Samuel Bekele"
                  className="h-10 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address (Login)
                </Label>
                <Input
                  id="create-teacher-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="teacher@school.edu.et"
                  className="h-10 rounded-xl font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Initial Password
                </Label>
                <Input
                  id="create-teacher-password"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="h-10 rounded-xl font-mono text-sm"
                  required
                />
              </div>

              {/* Class Assignment Multi-select */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assign Classroom Rosters ({createClassIds.length} selected)
                </Label>
                <div className="max-h-36 overflow-y-auto divide-y divide-border rounded-xl border border-border p-1 bg-card">
                  {classesList.map((c) => {
                    const isChecked = createClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleClassSelection(c.id, createClassIds, setCreateClassIds)}
                            className="rounded border-border accent-primary"
                          />
                          <span className="font-semibold text-foreground">{c.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl text-xs font-semibold"
                >
                  {isCreating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                  Register Teacher
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* EDIT TEACHER DIALOG */}
      {editingTeacher && (
        <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Edit2 className="size-5 text-primary" />
                <span>Edit Faculty: {editingTeacher.name}</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateTeacher} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="edit-teacher-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="edit-teacher-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-10 rounded-xl font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Change Password (leave empty to keep current)
                </Label>
                <Input
                  id="edit-teacher-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              {/* Class Assignment Multi-select */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Classes ({editClassIds.length} assigned)
                </Label>
                <div className="max-h-36 overflow-y-auto divide-y divide-border rounded-xl border border-border p-1 bg-card">
                  {classesList.map((c) => {
                    const isChecked = editClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleClassSelection(c.id, editClassIds, setEditClassIds)}
                            className="rounded border-border accent-primary"
                          />
                          <span className="font-semibold text-foreground">{c.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTeacher(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl text-xs font-semibold"
                >
                  {isUpdating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE TEACHER CONFIRMATION DIALOG */}
      {deletingTeacher && (
        <Dialog open={!!deletingTeacher} onOpenChange={(open) => !open && setDeletingTeacher(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <span>Delete Teacher: {deletingTeacher.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {deletingTeacher.assignedClasses.length > 0 ? (
                // DEPENDENCY BLOCKED 1: Active Class Assignments
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This teacher is assigned to{" "}
                    <strong className="text-foreground">{deletingTeacher.assignedClasses.length} classroom(s)</strong>:{" "}
                    {deletingTeacher.assignedClasses.map((c) => c.name).join(", ")}. Unassign them
                    from all classes before deleting the account.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      id="close-delete-teacher-blocked-btn"
                      variant="outline"
                      onClick={() => setDeletingTeacher(null)}
                    >
                      Close
                    </Button>
                    <Button
                      id="edit-to-unassign-btn"
                      onClick={() => {
                        const target = deletingTeacher;
                        setDeletingTeacher(null);
                        openEditModal(target);
                      }}
                      className="gap-1.5"
                    >
                      <Edit2 className="size-4" />
                      <span>Edit & Unassign Classes</span>
                    </Button>
                  </div>
                </div>
              ) : deletingTeacher.markedAttendanceCount > 0 ? (
                // DEPENDENCY BLOCKED 2: Marked Attendance Records (Audit Trail)
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This teacher has marked{" "}
                    <strong className="text-foreground">{deletingTeacher.markedAttendanceCount} attendance record(s)</strong>,
                    so the account cannot be deleted. Historical attendance is kept for audit.
                  </p>

                  <div className="flex justify-end pt-2">
                    <Button
                      id="close-audit-blocked-btn"
                      variant="outline"
                      onClick={() => setDeletingTeacher(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                // SAFE TO DELETE STATE
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Permanently delete teacher account{" "}
                    <strong className="text-foreground">{deletingTeacher.name}</strong> ({deletingTeacher.email})? This cannot
                    be undone.
                  </p>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      id="cancel-delete-teacher-btn"
                      variant="outline"
                      onClick={() => setDeletingTeacher(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      id="confirm-delete-teacher-btn"
                      variant="destructive"
                      onClick={handleDeleteTeacher}
                      disabled={isDeleting}
                      className="cursor-pointer"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-1.5" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Delete Teacher</span>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
