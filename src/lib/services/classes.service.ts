import "server-only";
import { cacheTag, CACHE_TAGS } from "@/components/cacheTag";
import { db } from "@/lib/db";
import { parseClassGradeSection } from "@/lib/validations/class";

export type ClassTeacherInfo = {
  id: string;
  name: string;
  email: string;
};

export type ClassItemWithDetails = {
  id: string;
  name: string;
  grade: string;
  section: string;
  activeStudentCount: number;
  totalStudentCount: number;
  teachers: ClassTeacherInfo[];
};

export async function fetchClassesWithDetails(): Promise<ClassItemWithDetails[]> {
  "use cache";
  cacheTag(CACHE_TAGS.CLASSES);

  const [allClasses, allStudents, allTeacherLinks, allUsers] = await Promise.all([
    db.orm.public.Class.all(),
    db.orm.public.Student.all(),
    db.orm.public.TeacherClass.all(),
    db.orm.public.User.all(),
  ]);

  // Index teachers by ID
  const teacherMap = new Map<string, (typeof allUsers)[0]>();
  for (const u of allUsers) {
    if (u.role === "TEACHER") {
      teacherMap.set(u.id, u);
    }
  }

  // Index teacher links by classId
  const teacherLinksByClass = new Map<string, Array<{ id: string; name: string; email: string }>>();
  for (const link of allTeacherLinks) {
    const teacher = teacherMap.get(link.userId);
    if (teacher) {
      const list = teacherLinksByClass.get(link.classId) || [];
      list.push({ id: teacher.id, name: teacher.name, email: teacher.email });
      teacherLinksByClass.set(link.classId, list);
    }
  }

  // Count active and total students by classId
  const activeStudentCounts = new Map<string, number>();
  const totalStudentCounts = new Map<string, number>();
  for (const s of allStudents) {
    totalStudentCounts.set(s.classId, (totalStudentCounts.get(s.classId) || 0) + 1);
    if (s.active) {
      activeStudentCounts.set(s.classId, (activeStudentCounts.get(s.classId) || 0) + 1);
    }
  }

  const result: ClassItemWithDetails[] = allClasses.map((cls) => {
    const parsed = parseClassGradeSection(cls.name);
    return {
      id: cls.id,
      name: cls.name,
      grade: parsed.grade,
      section: parsed.section,
      activeStudentCount: activeStudentCounts.get(cls.id) || 0,
      totalStudentCount: totalStudentCounts.get(cls.id) || 0,
      teachers: teacherLinksByClass.get(cls.id) || [],
    };
  });

  // Natural sort by name (e.g. Grade 7 A, Grade 7 B, Grade 8 A)
  result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return result;
}

export async function fetchAvailableTeachers(): Promise<
  Array<{ id: string; name: string; email: string }>
> {
  "use cache";
  cacheTag(CACHE_TAGS.TEACHERS);

  const teachers = await db.orm.public.User.where({ role: "TEACHER" }).all();
  return teachers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
  }));
}
