"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  School,
  Plus,
  Search,
  Filter,
  Users,
  GraduationCap,
  CalendarCheck,
  CalendarDays,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
  Sparkles,
  Shield,
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
import { formatClassName } from "@/lib/validations/class";
import type { ClassItemWithDetails } from "@/actions/class.actions";
import {
  useClassesDetailsQuery,
  useAvailableTeachersQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} from "@/hooks/use-classes";

interface ClassesManagerProps {
  initialClasses: ClassItemWithDetails[];
  availableTeachers: Array<{ id: string; name: string; email: string }>;
  isAdmin: boolean;
}

const COMMON_GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "KG 1",
  "KG 2",
  "Nursery",
];

export function ClassesManager({
  initialClasses,
  availableTeachers,
  isAdmin,
}: ClassesManagerProps) {
  const router = useRouter();

  // TanStack Query for classes and available teachers with initial data
  const { data: classes = initialClasses } = useClassesDetailsQuery(initialClasses);
  const { data: teachersList = availableTeachers } = useAvailableTeachersQuery(availableTeachers);

  // TanStack Mutations
  const createClassMutation = useCreateClassMutation();
  const updateClassMutation = useUpdateClassMutation();
  const deleteClassMutation = useDeleteClassMutation();

  // Filtering & Search
  const [search, setSearch] = React.useState("");
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL");
  const [teacherFilter, setTeacherFilter] = React.useState<string>("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createGrade, setCreateGrade] = React.useState("Grade 8");
  const [createSection, setCreateSection] = React.useState("A");
  const [createCustomName, setCreateCustomName] = React.useState("");
  const [createUseCustom, setCreateUseCustom] = React.useState(false);
  const [createTeacherIds, setCreateTeacherIds] = React.useState<string[]>([]);

  // Edit Modal State
  const [editingClass, setEditingClass] = React.useState<ClassItemWithDetails | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editTeacherIds, setEditTeacherIds] = React.useState<string[]>([]);

  // Delete Modal State
  const [deletingClass, setDeletingClass] = React.useState<ClassItemWithDetails | null>(null);

  const isCreating = createClassMutation.isPending;
  const isUpdating = updateClassMutation.isPending;
  const isDeleting = deleteClassMutation.isPending;

  // Unique grades for filter dropdown
  const uniqueGrades = React.useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => set.add(c.grade));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classes]);

  // Filtered classes
  const filteredClasses = React.useMemo(() => {
    return classes.filter((c) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesGrade = c.grade.toLowerCase().includes(q);
        const matchesSection = c.section.toLowerCase().includes(q);
        const matchesTeacher = c.teachers.some(
          (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesGrade && !matchesSection && !matchesTeacher) {
          return false;
        }
      }

      // Grade filter
      if (gradeFilter !== "ALL" && c.grade !== gradeFilter) {
        return false;
      }

      // Teacher assignment filter
      if (teacherFilter === "ASSIGNED" && c.teachers.length === 0) return false;
      if (teacherFilter === "UNASSIGNED" && c.teachers.length > 0) return false;

      return true;
    });
  }, [classes, search, gradeFilter, teacherFilter]);

  // Summary Metrics
  const stats = React.useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, c) => sum + c.totalStudentCount, 0);
    const activeStudents = classes.reduce((sum, c) => sum + c.activeStudentCount, 0);
    const uniqueTeachers = new Set<string>();
    let unassignedClasses = 0;

    classes.forEach((c) => {
      if (c.teachers.length === 0) unassignedClasses++;
      c.teachers.forEach((t) => uniqueTeachers.add(t.id));
    });

    return {
      totalClasses,
      totalStudents,
      activeStudents,
      assignedTeachersCount: uniqueTeachers.size,
      unassignedClasses,
    };
  }, [classes]);

  // Handlers
  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const res = await createClassMutation.mutateAsync({
        grade: createGrade,
        section: createSection,
        customName: createUseCustom ? createCustomName : undefined,
        teacherIds: createTeacherIds,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to create class");
        return;
      }

      toast.success(`Class "${res.data?.name}" created successfully`);
      setIsCreateOpen(false);
      setCreateGrade("Grade 8");
      setCreateSection("A");
      setCreateCustomName("");
      setCreateUseCustom(false);
      setCreateTeacherIds([]);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  }

  function openEditModal(c: ClassItemWithDetails) {
    setEditingClass(c);
    setEditName(c.name);
    setEditTeacherIds(c.teachers.map((t) => t.id));
  }

  async function handleUpdateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !editingClass) return;

    try {
      const res = await updateClassMutation.mutateAsync({
        id: editingClass.id,
        name: editName,
        teacherIds: editTeacherIds,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to update class");
        return;
      }

      toast.success("Class updated successfully");
      setEditingClass(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  }

  async function handleDeleteClass() {
    if (!isAdmin || !deletingClass) return;

    // Strict front-end guard: cannot delete if students are enrolled
    if (deletingClass.totalStudentCount > 0) {
      toast.error(
        `Cannot delete "${deletingClass.name}": It has ${deletingClass.totalStudentCount} enrolled student(s). Reassign or remove students first.`
      );
      return;
    }

    try {
      const res = await deleteClassMutation.mutateAsync(deletingClass.id);

      if (!res.ok) {
        toast.error(res.error || "Failed to delete class");
        return;
      }

      toast.error(`Class "${deletingClass.name}" deleted successfully`, {
        icon: <Trash2 className="size-4" />,
      });
      setDeletingClass(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  }

  function toggleTeacherSelection(teacherId: string, currentList: string[], setter: (v: string[]) => void) {
    if (currentList.includes(teacherId)) {
      setter(currentList.filter((id) => id !== teacherId));
    } else {
      setter([...currentList, teacherId]);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <School className="size-5 text-foreground" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Classes
          </h1>
          {isAdmin ? (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1 py-0.5 px-2">
              <Shield className="size-3 text-muted-foreground" />
              <span>Admin</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1 py-0.5 px-2">
              <GraduationCap className="size-3 text-muted-foreground" />
              <span>Teacher View</span>
            </Badge>
          )}
        </div>

        {isAdmin && (
          <Button
            id="add-class-btn"
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="h-8 px-3 rounded-lg font-medium text-xs gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Class</span>
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Classes */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Classes</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.totalClasses}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active rosters</p>
          </CardContent>
        </Card>

        {/* Total Enrolled */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.totalStudents}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.activeStudents} active enrolled
            </p>
          </CardContent>
        </Card>

        {/* Active Teachers */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faculty Assigned</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.assignedTeachersCount}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Assigned teachers</p>
          </CardContent>
        </Card>

        {/* Teacher Status */}
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Staffing Status</p>
            <h3
              className={`text-2xl font-bold mt-1 ${
                stats.unassignedClasses > 0
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {stats.unassignedClasses === 0 ? "100%" : `${stats.unassignedClasses} unassigned`}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.unassignedClasses === 0 ? "All covered" : "Need teacher"}
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
              id="class-search-input"
              placeholder="Search classes or teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 rounded-lg text-xs"
            />
          </div>

          {/* Grade Filter */}
          <select
            id="class-grade-filter"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">All Grades</option>
            {uniqueGrades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Teacher Filter */}
          <select
            id="class-teacher-filter"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">All Staffing</option>
            <option value="ASSIGNED">Assigned Faculty</option>
            <option value="UNASSIGNED">Unassigned Only</option>
          </select>
        </div>

        <p className="text-xs text-muted-foreground self-end sm:self-auto font-medium">
          Showing <span className="font-bold text-foreground">{filteredClasses.length}</span> of {classes.length}
        </p>
      </div>

      {/* Classes Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border text-xs font-medium">
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Class Name</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Grade &amp; Section</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Enrolled Students</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold text-foreground">Assigned Faculty</TableHead>
                <TableHead className="py-2.5 px-4 text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <School className="size-9 text-muted-foreground" />
                      <p className="font-semibold text-sm text-foreground">No classes match your search</p>
                      <p className="text-xs text-muted-foreground">
                        {search || gradeFilter !== "ALL" || teacherFilter !== "ALL"
                          ? "Try clearing your filters or search terms."
                          : "Create your first class to begin managing students and attendance."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-muted/50 transition-colors">
                    {/* Class Name */}
                    <TableCell className="py-2.5 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm">{cls.name}</span>
                      </div>
                    </TableCell>

                    {/* Grade & Section */}
                    <TableCell className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs font-medium">
                          {cls.grade}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 font-mono"
                        >
                          Sec {cls.section}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Enrolled Students */}
                    <TableCell className="py-2.5 px-4">
                      <Link
                        href={`/students?classId=${cls.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
                      >
                        <Users className="size-3 text-muted-foreground" />
                        <span>
                          {cls.totalStudentCount} {cls.totalStudentCount === 1 ? "student" : "students"}
                        </span>
                      </Link>
                    </TableCell>

                    {/* Assigned Teachers */}
                    <TableCell className="py-2.5 px-4">
                      {cls.teachers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cls.teachers.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border"
                            >
                              <GraduationCap className="size-3 text-muted-foreground" />
                              <span>{t.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-destructive bg-destructive/10 border border-destructive/20">
                          <AlertTriangle className="size-3" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Attendance Roster Link */}
                        <Link href={`/attendance?classId=${cls.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground font-medium"
                            title="Daily Attendance Roster"
                          >
                            <CalendarCheck className="size-3.5 mr-1 text-primary" />
                            <span>Roster</span>
                          </Button>
                        </Link>

                        {/* Two-Week Overview Link */}
                        <Link href={`/settings/overview?classId=${cls.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground font-medium"
                            title="Two-Week Attendance Overview"
                          >
                            <CalendarDays className="size-3.5 mr-1 text-primary" />
                            <span>14-Day</span>
                          </Button>
                        </Link>

                        {/* Admin Edit */}
                        {isAdmin && (
                          <Button
                            id={`edit-class-btn-${cls.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(cls)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded"
                            title="Edit Class & Teachers"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        )}

                        {/* Admin Delete */}
                        {isAdmin && (
                          <Button
                            id={`delete-class-btn-${cls.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingClass(cls)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                            title="Delete Class"
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

      {/* CREATE CLASS DIALOG */}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <School className="size-5 text-primary" />
                <span>Create New Class</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateClass} className="space-y-4 py-2">
              {!createUseCustom ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="create-grade" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Grade Level
                    </Label>
                    <select
                      id="create-grade"
                      value={createGrade}
                      onChange={(e) => setCreateGrade(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-sm font-semibold"
                      required
                    >
                      {COMMON_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-section" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Section
                    </Label>
                    <Input
                      id="create-section"
                      value={createSection}
                      onChange={(e) => setCreateSection(e.target.value.toUpperCase())}
                      placeholder="A, B, C..."
                      maxLength={10}
                      className="h-10 rounded-xl font-bold uppercase"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="create-custom-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Custom Class Name
                  </Label>
                  <Input
                    id="create-custom-name"
                    value={createCustomName}
                    onChange={(e) => setCreateCustomName(e.target.value)}
                    placeholder="e.g. Advanced Biology 101"
                    className="h-10 rounded-xl font-semibold"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="custom-toggle"
                  checked={createUseCustom}
                  onChange={(e) => setCreateUseCustom(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <label htmlFor="custom-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Use custom classroom name instead of Grade &amp; Section
                </label>
              </div>

              {/* Teacher Multi-Select */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assign Teachers ({createTeacherIds.length} selected)
                </Label>
                <div className="max-h-36 overflow-y-auto divide-y divide-border rounded-xl border border-border p-1 bg-card">
                  {teachersList.map((t) => {
                    const isChecked = createTeacherIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTeacherSelection(t.id, createTeacherIds, setCreateTeacherIds)}
                            className="rounded border-border accent-primary"
                          />
                          <span className="font-semibold text-foreground">{t.name}</span>
                        </div>
                        <span className="font-mono text-muted-foreground text-[11px]">{t.email}</span>
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
                  Create Classroom
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* EDIT CLASS DIALOG */}
      {editingClass && (
        <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Edit2 className="size-5 text-primary" />
                <span>Edit Class: {editingClass.name}</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateClass} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Class Name
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 rounded-xl font-semibold"
                  required
                />
              </div>

              {/* Teacher Assignment Multi-select */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Faculty ({editTeacherIds.length} assigned)
                </Label>
                <div className="max-h-40 overflow-y-auto divide-y divide-border rounded-xl border border-border p-1 bg-card">
                  {teachersList.map((t) => {
                    const isChecked = editTeacherIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTeacherSelection(t.id, editTeacherIds, setEditTeacherIds)}
                            className="rounded border-border accent-primary"
                          />
                          <span className="font-semibold text-foreground">{t.name}</span>
                        </div>
                        <span className="font-mono text-muted-foreground text-[11px]">{t.email}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingClass(null)}
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

      {/* DELETE CLASS CONFIRMATION DIALOG */}
      {deletingClass && (
        <Dialog open={!!deletingClass} onOpenChange={(open) => !open && setDeletingClass(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <span>Delete Class: {deletingClass.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {deletingClass.totalStudentCount > 0 ? (
                // DEPENDENCY BLOCKED STATE
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This class has{" "}
                    <strong className="text-foreground">{deletingClass.totalStudentCount} enrolled student(s)</strong> (
                    {deletingClass.activeStudentCount} active). Reassign or delete them in{" "}
                    <strong className="text-foreground">Student Management</strong> before deleting the class.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      id="close-delete-blocked-btn"
                      variant="outline"
                      onClick={() => setDeletingClass(null)}
                    >
                      Close
                    </Button>
                    <Link href={`/students?classId=${deletingClass.id}`}>
                      <Button
                        id="manage-students-link-btn"
                        className="gap-1.5"
                      >
                        <Users className="size-4" />
                        <span>Manage Enrolled Students</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                // SAFE TO DELETE STATE
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Permanently delete <strong className="text-foreground">{deletingClass.name}</strong>? This cannot be
                    undone.
                  </p>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      id="cancel-delete-btn"
                      variant="outline"
                      onClick={() => setDeletingClass(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      id="confirm-delete-btn"
                      variant="destructive"
                      onClick={handleDeleteClass}
                      disabled={isDeleting}
                      className="cursor-pointer"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-1.5" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Delete Class</span>
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
