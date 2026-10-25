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
  AlertCircle,
  Loader2,
  X,
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
import { formatClassName } from "@/lib/validations/class";
import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
  type ClassItemWithDetails,
} from "@/actions/class.actions";

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
  const [classes, setClasses] = React.useState<ClassItemWithDetails[]>(initialClasses);

  // Sync state if revalidated from server
  React.useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);

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
  const [isCreating, setIsCreating] = React.useState(false);

  // Edit Modal State
  const [editingClass, setEditingClass] = React.useState<ClassItemWithDetails | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editTeacherIds, setEditTeacherIds] = React.useState<string[]>([]);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Delete Modal State
  const [deletingClass, setDeletingClass] = React.useState<ClassItemWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  // Computed preview name for create form
  const previewCreateName = React.useMemo(() => {
    if (createUseCustom && createCustomName.trim()) {
      return createCustomName.trim();
    }
    return formatClassName(createGrade, createSection);
  }, [createGrade, createSection, createUseCustom, createCustomName]);

  // Handlers
  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setIsCreating(true);
      const res = await createClassAction({
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
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsCreating(false);
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
      setIsUpdating(true);
      const res = await updateClassAction({
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
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsUpdating(false);
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
      setIsDeleting(true);
      const res = await deleteClassAction(deletingClass.id);

      if (!res.ok) {
        toast.error(res.error || "Failed to delete class");
        return;
      }

      toast.success(`Class "${deletingClass.name}" deleted successfully`);
      setDeletingClass(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Classes</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.totalClasses}
              </h3>
            </div>
            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <School className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.totalStudents}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {stats.activeStudents} active
              </p>
            </div>
            <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Teachers</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.assignedTeachersCount}
              </h3>
              <p className="text-[11px] text-slate-500">Assigned across classes</p>
            </div>
            <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Teacher Status</p>
              <h3
                className={`text-2xl font-bold mt-0.5 ${
                  stats.unassignedClasses > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {stats.unassignedClasses === 0 ? "100%" : `${stats.unassignedClasses} unassigned`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {stats.unassignedClasses === 0 ? "All classes assigned" : "Require teacher assignment"}
              </p>
            </div>
            <div
              className={`size-10 rounded-lg flex items-center justify-center ${
                stats.unassignedClasses > 0
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {stats.unassignedClasses > 0 ? (
                <AlertTriangle className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Filters, Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="class-search-input"
              placeholder="Search classes, grades, sections, or teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
          </div>

          {/* Grade Filter */}
          <select
            id="class-grade-filter"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
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
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Assignments</option>
            <option value="ASSIGNED">Has Teacher</option>
            <option value="UNASSIGNED">No Teacher</option>
          </select>
        </div>

        {isAdmin && (
          <Button
            id="add-class-btn"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Add Class</span>
          </Button>
        )}
      </div>

      {/* Classes Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Class Name</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Grade & Section</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Enrolled Students</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Assigned Teachers</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <School className="size-8 text-slate-400" />
                      <p className="font-medium text-sm">No classes found</p>
                      <p className="text-xs text-slate-400">
                        {search || gradeFilter !== "ALL" || teacherFilter !== "ALL"
                          ? "Try clearing your filters or search terms."
                          : "Create your first class to begin managing students and attendance."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    {/* Class Name */}
                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <School className="size-4" />
                        </div>
                        <div>
                          <span>{cls.name}</span>
                          <span className="block text-[11px] font-mono text-slate-400 font-normal">
                            ID: {cls.id.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Grade & Section */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs font-medium">
                          {cls.grade}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs px-2"
                        >
                          Sec {cls.section}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Enrolled Students */}
                    <TableCell>
                      <Link
                        href={`/students?classId=${cls.id}`}
                        className="inline-flex items-center gap-1.5 hover:underline group"
                      >
                        <Badge
                          variant="outline"
                          className={
                            cls.totalStudentCount > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200"
                          }
                        >
                          <Users className="size-3 mr-1" />
                          <span>
                            {cls.totalStudentCount} {cls.totalStudentCount === 1 ? "student" : "students"}
                          </span>
                          {cls.totalStudentCount > 0 && cls.activeStudentCount !== cls.totalStudentCount && (
                            <span className="text-[10px] ml-1 opacity-80">
                              ({cls.activeStudentCount} active)
                            </span>
                          )}
                        </Badge>
                        <ExternalLink className="size-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </TableCell>

                    {/* Assigned Teachers */}
                    <TableCell>
                      {cls.teachers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cls.teachers.map((t) => (
                            <Badge
                              key={t.id}
                              variant="secondary"
                              className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[11px] gap-1 py-0.5"
                            >
                              <GraduationCap className="size-3 text-purple-600" />
                              <span>{t.name}</span>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[11px] gap-1"
                        >
                          <AlertTriangle className="size-3" />
                          <span>No teacher assigned</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Attendance Roster Link */}
                        <Link href={`/attendance?classId=${cls.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                            title="Daily Attendance Roster"
                          >
                            <CalendarCheck className="size-3.5 mr-1" />
                            <span className="hidden sm:inline">Roster</span>
                          </Button>
                        </Link>

                        {/* Two-Week Overview Link */}
                        <Link href={`/attendance/overview?classId=${cls.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                            title="Two-Week Attendance Overview"
                          >
                            <CalendarDays className="size-3.5 mr-1" />
                            <span className="hidden sm:inline">Trend</span>
                          </Button>
                        </Link>

                        {/* Admin Edit */}
                        {isAdmin && (
                          <Button
                            id={`edit-class-btn-${cls.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(cls)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
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
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 cursor-pointer"
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
      </Card>

      {/* CREATE CLASS DIALOG */}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="size-5 text-blue-600" />
              <span>Create New Class</span>
            </DialogTitle>
            <DialogDescription>
              Specify the grade level, section identifier, and assign designated teachers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-4 py-2">
            {!createUseCustom ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Grade */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-grade" className="text-xs font-semibold">
                    Grade Level
                  </Label>
                  <select
                    id="create-grade"
                    value={createGrade}
                    onChange={(e) => setCreateGrade(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
                    required
                  >
                    {COMMON_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-section" className="text-xs font-semibold">
                    Section
                  </Label>
                  <Input
                    id="create-section"
                    value={createSection}
                    onChange={(e) => setCreateSection(e.target.value.toUpperCase())}
                    placeholder="e.g. A, B, C"
                    maxLength={15}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="create-custom-name" className="text-xs font-semibold">
                  Custom Class Name
                </Label>
                <Input
                  id="create-custom-name"
                  value={createCustomName}
                  onChange={(e) => setCreateCustomName(e.target.value)}
                  placeholder="e.g. Kindergarten Morning Blue"
                  required
                />
              </div>
            )}

            {/* Custom Name Toggle */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Preview: <strong className="text-slate-900 dark:text-white font-mono">{previewCreateName}</strong></span>
              <button
                type="button"
                id="toggle-custom-name-btn"
                onClick={() => setCreateUseCustom(!createUseCustom)}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {createUseCustom ? "Use Grade/Section builder" : "Custom Name override"}
              </button>
            </div>

            {/* Teacher Assignment */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Assign Teachers (Optional)</span>
                <span className="text-slate-400 font-normal">
                  {createTeacherIds.length} selected
                </span>
              </Label>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                {availableTeachers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-1">No teachers registered in system.</p>
                ) : (
                  availableTeachers.map((t) => {
                    const isChecked = createTeacherIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                      >
                        <input
                          type="checkbox"
                          id={`teacher-check-${t.id}`}
                          checked={isChecked}
                          onChange={() =>
                            toggleTeacherSelection(t.id, createTeacherIds, setCreateTeacherIds)
                          }
                          className="rounded text-blue-600 focus:ring-blue-500 size-3.5"
                        />
                        <div className="flex-1 truncate">
                          <span className="font-medium text-slate-900 dark:text-white">{t.name}</span>
                          <span className="text-slate-400 ml-1.5">({t.email})</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                id="cancel-create-btn"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                id="submit-create-btn"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Class</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}

      {/* EDIT CLASS DIALOG */}
      {editingClass && (
        <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="size-5 text-blue-600" />
                <span>Edit Class: {editingClass.name}</span>
              </DialogTitle>
              <DialogDescription>
                Update the official class name or sync teacher assignments.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateClass} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  Class Name
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Grade 7 B"
                  required
                />
              </div>

              {/* Teacher Assignment */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Assigned Teachers</span>
                  <span className="text-slate-400 font-normal">
                    {editTeacherIds.length} assigned
                  </span>
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {availableTeachers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-1">No teachers registered in system.</p>
                  ) : (
                    availableTeachers.map((t) => {
                      const isChecked = editTeacherIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              toggleTeacherSelection(t.id, editTeacherIds, setEditTeacherIds)
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 size-3.5"
                          />
                          <div className="flex-1 truncate">
                            <span className="font-medium text-slate-900 dark:text-white">{t.name}</span>
                            <span className="text-slate-400 ml-1.5">({t.email})</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  id="cancel-edit-btn"
                  variant="outline"
                  onClick={() => setEditingClass(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  id="submit-edit-btn"
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

      {/* DELETE CONFIRMATION DIALOG WITH DEPENDENCY GUARD */}
      {deletingClass && (
        <Dialog open={!!deletingClass} onOpenChange={(open) => !open && setDeletingClass(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="size-5" />
                <span>Delete Class: {deletingClass.name}</span>
              </DialogTitle>
              <DialogDescription>
                Review database dependency requirements before proceeding.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {deletingClass.totalStudentCount > 0 ? (
                // DEPENDENCY BLOCKED STATE
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <AlertCircle className="size-4 text-red-600 shrink-0" />
                      <span>Class Cannot Be Deleted</span>
                    </div>
                    <p>
                      This class currently has{" "}
                      <strong>{deletingClass.totalStudentCount} enrolled student(s)</strong> (
                      {deletingClass.activeStudentCount} active).
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      To preserve student records and attendance integrity, you must reassign or
                      delete these students in the <strong>Student Management</strong> directory
                      first.
                    </p>
                  </div>

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
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      >
                        <Users className="size-4" />
                        <span>Manage Enrolled Students</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                // SAFE TO DELETE STATE
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Are you sure you want to permanently delete <strong>{deletingClass.name}</strong>?
                  </p>
                  <p className="text-xs text-slate-500">
                    This class has 0 enrolled students. Any assigned teacher links will be
                    automatically unlinked. This action cannot be undone.
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
