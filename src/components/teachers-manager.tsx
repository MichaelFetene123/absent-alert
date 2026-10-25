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
  AlertCircle,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  createTeacherAction,
  updateTeacherAction,
  deleteTeacherAction,
  type TeacherItemWithDetails,
} from "@/actions/teacher.actions";

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
  const [teachers, setTeachers] = React.useState<TeacherItemWithDetails[]>(initialTeachers);

  // Sync state if server revalidates
  const [prevInitialTeachers, setPrevInitialTeachers] = React.useState(initialTeachers);
  if (initialTeachers !== prevInitialTeachers) {
    setPrevInitialTeachers(initialTeachers);
    setTeachers(initialTeachers);
  }

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
  const [isCreating, setIsCreating] = React.useState(false);

  // Edit Modal State
  const [editingTeacher, setEditingTeacher] = React.useState<TeacherItemWithDetails | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editPassword, setEditPassword] = React.useState("");
  const [editClassIds, setEditClassIds] = React.useState<string[]>([]);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Delete Modal State
  const [deletingTeacher, setDeletingTeacher] = React.useState<TeacherItemWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
      setIsCreating(true);
      const res = await createTeacherAction({
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
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsCreating(false);
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
      setIsUpdating(true);
      const res = await updateTeacherAction({
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
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsUpdating(false);
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
      setIsDeleting(true);
      const res = await deleteTeacherAction(deletingTeacher.id);

      if (!res.ok) {
        toast.error(res.error || "Failed to delete teacher");
        return;
      }

      toast.success(`Teacher "${deletingTeacher.name}" deleted successfully`);
      setDeletingTeacher(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-slate-700 dark:text-slate-300" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Teachers
          </h1>
          {isAdmin ? (
            <Badge variant="outline" className="text-xs font-medium text-slate-600 dark:text-slate-400 gap-1 py-0.5 px-2">
              <Shield className="size-3 text-slate-500" />
              <span>Admin</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-medium text-slate-600 dark:text-slate-400 gap-1 py-0.5 px-2">
              <GraduationCap className="size-3 text-slate-500" />
              <span>Faculty Directory</span>
            </Badge>
          )}
        </div>

        {isAdmin && (
          <Button
            id="add-teacher-btn"
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Teacher</span>
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Teachers */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Faculty Members</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalTeachers}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Registered accounts</p>
          </CardContent>
        </Card>

        {/* Class Assignments */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Class Assignments</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalClassAssignments}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all classrooms</p>
          </CardContent>
        </Card>

        {/* Assigned Teachers */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Instructors</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.assignedTeachers}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Covering rosters</p>
          </CardContent>
        </Card>

        {/* Unassigned */}
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unassigned</p>
            <h3
              className={`text-2xl font-bold mt-1 ${
                stats.unassignedTeachers > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {stats.unassignedTeachers}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.unassignedTeachers === 0 ? "All faculty assigned" : "Awaiting assignment"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Filters */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
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
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 outline-none"
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
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ASSIGNED">Has Classes</option>
            <option value="UNASSIGNED">No Classes</option>
          </select>
        </div>

        <p className="text-xs text-slate-500 self-end sm:self-auto font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredTeachers.length}</span> of {teachers.length}
        </p>
      </div>

      {/* Teachers Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <TableHead className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Instructor Name</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Email Address</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Assigned Classes</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Attendance Audit</TableHead>
                <TableHead className="py-2.5 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <GraduationCap className="size-6 text-slate-400" />
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-200">No teachers found</p>
                      <p className="text-xs text-slate-400">
                        {search || classFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Try clearing your search or filters."
                          : "Create your first teacher account to begin assigning classes."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Name */}
                    <TableCell className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{t.name}</span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-2.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3 text-slate-400 shrink-0" />
                        <span>{t.email}</span>
                      </div>
                    </TableCell>

                    {/* Assigned Classes */}
                    <TableCell className="py-2.5 px-4">
                      {t.assignedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {t.assignedClasses.map((cls) => (
                            <Link key={cls.id} href={`/attendance?classId=${cls.id}`}>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-colors">
                                <School className="size-3 text-slate-500" />
                                <span>{cls.name}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="size-3" />
                          <span>No classes</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Attendance Records Marked */}
                    <TableCell className="py-2.5 px-4">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
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
                              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
                              title={`View Roster for ${t.assignedClasses[0]!.name}`}
                            >
                              <CalendarCheck className="size-3.5 mr-1 text-emerald-600" />
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
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
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
                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
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
                <GraduationCap className="size-5 text-purple-600" />
                <span>Register Faculty Member</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create a teacher credentials login and assign initial classroom rosters.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTeacher} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                <Label htmlFor="create-teacher-email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                <Label htmlFor="create-teacher-password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assign Classroom Rosters ({createClassIds.length} selected)
                </Label>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                  {availableClasses.map((c) => {
                    const isChecked = createClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleClassSelection(c.id, createClassIds, setCreateClassIds)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
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
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
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
                <Edit2 className="size-5 text-purple-600" />
                <span>Edit Faculty: {editingTeacher.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update account details, reset password, or adjust class assignments.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateTeacher} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                <Label htmlFor="edit-teacher-email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                <Label htmlFor="edit-teacher-password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Change Password (leave empty to keep current)
                </Label>
                <Input
                  id="edit-teacher-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 rounded-xl font-mono text-sm"
                />
              </div>

              {/* Class Assignment Multi-select */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assigned Classes ({editClassIds.length} assigned)
                </Label>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                  {availableClasses.map((c) => {
                    const isChecked = editClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleClassSelection(c.id, editClassIds, setEditClassIds)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
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
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
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
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <AlertTriangle className="size-5" />
                </div>
                <DialogTitle className="text-lg font-bold">
                  Delete Faculty Account
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm pt-2 leading-relaxed">
                Are you certain you want to permanently delete teacher <strong>&quot;{deletingTeacher.name}&quot;</strong>?
              </DialogDescription>
            </DialogHeader>

            {deletingTeacher.assignedClasses.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                <strong>Deletion Blocked:</strong> Teacher is actively assigned to {deletingTeacher.assignedClasses.length} class(es). Unassign all classes first.
              </div>
            ) : deletingTeacher.markedAttendanceCount > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                <strong>Audit Lock:</strong> This teacher has {deletingTeacher.markedAttendanceCount} marked attendance records on file. Deleting is prevented to preserve historical school audit integrity.
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                This account has 0 class assignments and 0 historical attendance records, and can be removed safely.
              </p>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingTeacher(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  isDeleting ||
                  deletingTeacher.assignedClasses.length > 0 ||
                  deletingTeacher.markedAttendanceCount > 0
                }
                onClick={handleDeleteTeacher}
                className="rounded-xl text-xs font-semibold"
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
