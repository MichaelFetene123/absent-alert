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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  React.useEffect(() => {
    setTeachers(initialTeachers);
  }, [initialTeachers]);

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
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Teachers</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.totalTeachers}
              </h3>
            </div>
            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Class Assignments</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.totalClassAssignments}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                across all classes
              </p>
            </div>
            <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <School className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Teachers</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.assignedTeachers}
              </h3>
              <p className="text-[11px] text-slate-500">Active class instructors</p>
            </div>
            <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Unassigned</p>
              <h3
                className={`text-2xl font-bold mt-0.5 ${
                  stats.unassignedTeachers > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {stats.unassignedTeachers}
              </h3>
              <p className="text-[11px] text-slate-500">
                {stats.unassignedTeachers === 0 ? "All teachers assigned" : "Awaiting class assignment"}
              </p>
            </div>
            <div
              className={`size-10 rounded-lg flex items-center justify-center ${
                stats.unassignedTeachers > 0
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {stats.unassignedTeachers > 0 ? (
                <AlertTriangle className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Filters, Add Teacher Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="teacher-search-input"
              placeholder="Search teachers by name, email, or class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
          </div>

          {/* Class Filter */}
          <select
            id="teacher-class-filter"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Classes</option>
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
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Status</option>
            <option value="ASSIGNED">Has Classes</option>
            <option value="UNASSIGNED">No Classes</option>
          </select>
        </div>

        {isAdmin && (
          <Button
            id="add-teacher-btn"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Add Teacher</span>
          </Button>
        )}
      </div>

      {/* Teachers Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Teacher Profile</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Email Address</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Assigned Classes</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Attendance Marked</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <GraduationCap className="size-8 text-slate-400" />
                      <p className="font-medium text-sm">No teachers found</p>
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
                  <TableRow key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    {/* Name & Avatar */}
                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{t.name}</span>
                          <span className="block text-[11px] font-mono text-slate-400 font-normal">
                            ID: {t.id.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-slate-400 shrink-0" />
                        <span>{t.email}</span>
                      </div>
                    </TableCell>

                    {/* Assigned Classes */}
                    <TableCell>
                      {t.assignedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {t.assignedClasses.map((cls) => (
                            <Link key={cls.id} href={`/attendance?classId=${cls.id}`}>
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[11px] gap-1 hover:bg-blue-100 cursor-pointer transition-colors"
                              >
                                <School className="size-3 text-blue-600" />
                                <span>{cls.name}</span>
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[11px] gap-1"
                        >
                          <AlertTriangle className="size-3" />
                          <span>No classes assigned</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Attendance Records Marked */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.markedAttendanceCount > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 text-xs"
                        }
                      >
                        <CalendarCheck className="size-3 mr-1" />
                        <span>{t.markedAttendanceCount} records marked</span>
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* If teacher has classes, provide direct Roster link */}
                        {t.assignedClasses.length > 0 && (
                          <Link href={`/attendance?classId=${t.assignedClasses[0]!.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                              title={`View Roster for ${t.assignedClasses[0]!.name}`}
                            >
                              <CalendarCheck className="size-3.5 mr-1" />
                              <span className="hidden sm:inline">Roster</span>
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
                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
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
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 cursor-pointer"
                            title="Delete Teacher"
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
      </Card>

      {/* CREATE TEACHER DIALOG */}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-blue-600" />
                <span>Add New Teacher</span>
              </DialogTitle>
              <DialogDescription>
                Create a login account for school faculty and assign classrooms.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTeacher} className="space-y-4 py-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="create-teacher-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Teacher Abebe"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="create-teacher-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="e.g. teacher.abebe@school.et"
                  required
                />
              </div>

              {/* Initial Password */}
              <div className="space-y-1.5">
                <Label htmlFor="create-teacher-password" className="text-xs font-semibold">
                  Temporary Password
                </Label>
                <Input
                  id="create-teacher-password"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              {/* Assigned Classes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Assign Classrooms</span>
                  <span className="text-slate-400 font-normal">
                    {createClassIds.length} selected
                  </span>
                </Label>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {availableClasses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-1">No classes created in system.</p>
                  ) : (
                    availableClasses.map((cls) => {
                      const isChecked = createClassIds.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            id={`create-class-check-${cls.id}`}
                            checked={isChecked}
                            onChange={() =>
                              toggleClassSelection(cls.id, createClassIds, setCreateClassIds)
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 size-3.5"
                          />
                          <span className="font-medium text-slate-900 dark:text-white">{cls.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  id="cancel-create-teacher-btn"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  id="submit-create-teacher-btn"
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* EDIT TEACHER DIALOG */}
      {editingTeacher && (
        <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="size-5 text-blue-600" />
                <span>Edit Teacher: {editingTeacher.name}</span>
              </DialogTitle>
              <DialogDescription>
                Update faculty details, reset credentials, or manage classroom assignments.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateTeacher} className="space-y-4 py-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="edit-teacher-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Teacher Abebe"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="edit-teacher-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. teacher.abebe@school.et"
                  required
                />
              </div>

              {/* Reset Password (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-teacher-password" className="text-xs font-semibold">
                  New Password (Optional)
                </Label>
                <Input
                  id="edit-teacher-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave empty to keep existing password"
                />
                <p className="text-[11px] text-slate-400">
                  Only fill this out if you wish to reset the teacher&apos;s password.
                </p>
              </div>

              {/* Assigned Classes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Assigned Classrooms</span>
                  <span className="text-slate-400 font-normal">
                    {editClassIds.length} assigned
                  </span>
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {availableClasses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-1">No classes created in system.</p>
                  ) : (
                    availableClasses.map((cls) => {
                      const isChecked = editClassIds.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            id={`edit-class-check-${cls.id}`}
                            checked={isChecked}
                            onChange={() =>
                              toggleClassSelection(cls.id, editClassIds, setEditClassIds)
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 size-3.5"
                          />
                          <span className="font-medium text-slate-900 dark:text-white">{cls.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  id="cancel-edit-teacher-btn"
                  variant="outline"
                  onClick={() => setEditingTeacher(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  id="submit-edit-teacher-btn"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION DIALOG WITH REFERENTIAL INTEGRITY GUARD */}
      {deletingTeacher && (
        <Dialog open={!!deletingTeacher} onOpenChange={(open) => !open && setDeletingTeacher(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="size-5" />
                <span>Delete Teacher: {deletingTeacher.name}</span>
              </DialogTitle>
              <DialogDescription>
                Review referential integrity requirements before deleting this faculty account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {deletingTeacher.assignedClasses.length > 0 ? (
                // DEPENDENCY BLOCKED 1: Active Class Assignments
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <AlertCircle className="size-4 text-red-600 shrink-0" />
                      <span>Active Class Assignments Prevent Deletion</span>
                    </div>
                    <p>
                      This teacher is currently assigned to{" "}
                      <strong>{deletingTeacher.assignedClasses.length} classroom(s)</strong>:{" "}
                      {deletingTeacher.assignedClasses.map((c) => c.name).join(", ")}.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      To preserve teaching assignments and prevent unmanaged classrooms, you must
                      unassign this teacher from all classes before deleting their account.
                    </p>
                  </div>

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
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    >
                      <Edit2 className="size-4" />
                      <span>Edit & Unassign Classes</span>
                    </Button>
                  </div>
                </div>
              ) : deletingTeacher.markedAttendanceCount > 0 ? (
                // DEPENDENCY BLOCKED 2: Marked Attendance Records (Audit Trail)
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <AlertCircle className="size-4 text-red-600 shrink-0" />
                      <span>Historical Attendance Records Prevent Deletion</span>
                    </div>
                    <p>
                      This teacher account has marked{" "}
                      <strong>{deletingTeacher.markedAttendanceCount} attendance record(s)</strong> in
                      the system.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      To maintain academic audit records, government attendance compliance, and
                      database referential integrity, accounts with recorded historical attendance
                      cannot be deleted.
                    </p>
                  </div>

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
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Are you sure you want to permanently delete teacher account{" "}
                    <strong>{deletingTeacher.name}</strong> ({deletingTeacher.email})?
                  </p>
                  <p className="text-xs text-slate-500">
                    This teacher has 0 assigned classrooms and 0 marked attendance records. This
                    action cannot be undone.
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
