import "server-only";
import { cacheTag, cacheLife, CACHE_TAGS, CACHE_PROFILES } from "@/components/cacheTag";
import { db } from "@/lib/db";

export type TeacherItemWithDetails = {
  id: string;
  name: string;
  email: string;
  role: "TEACHER";
  assignedClasses: Array<{
    id: string;
    name: string;
  }>;
  markedAttendanceCount: number;
};

export async function fetchTeachersWithDetails(): Promise<TeacherItemWithDetails[]> {
  "use cache";
  cacheLife(CACHE_PROFILES.STRUCTURE);
  cacheTag(CACHE_TAGS.TEACHERS, CACHE_TAGS.CLASSES);

  const [allUsers, allClasses, allTeacherClasses, allAttendance] = await Promise.all([
    db.orm.public.User.where({ role: "TEACHER" }).all(),
    db.orm.public.Class.all(),
    db.orm.public.TeacherClass.all(),
    db.orm.public.AttendanceRecord.all(),
  ]);

  // Map class by ID
  const classMap = new Map<string, (typeof allClasses)[0]>();
  for (const c of allClasses) {
    classMap.set(c.id, c);
  }

  // Group classes by teacher ID
  const classesByTeacher = new Map<string, Array<{ id: string; name: string }>>();
  for (const tc of allTeacherClasses) {
    const cls = classMap.get(tc.classId);
    if (cls) {
      const list = classesByTeacher.get(tc.userId) || [];
      list.push({ id: cls.id, name: cls.name });
      classesByTeacher.set(tc.userId, list);
    }
  }

  // Count attendance records marked by each teacher
  const attendanceCountByTeacher = new Map<string, number>();
  for (const a of allAttendance) {
    attendanceCountByTeacher.set(
      a.markedById,
      (attendanceCountByTeacher.get(a.markedById) || 0) + 1
    );
  }

  const result: TeacherItemWithDetails[] = allUsers.map((u) => {
    const assigned = classesByTeacher.get(u.id) || [];
    assigned.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: "TEACHER" as const,
      assignedClasses: assigned,
      markedAttendanceCount: attendanceCountByTeacher.get(u.id) || 0,
    };
  });

  // Natural sort by teacher name
  result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}

export async function fetchAvailableClassesForTeachers(): Promise<
  Array<{ id: string; name: string }>
> {
  "use cache";
  cacheLife(CACHE_PROFILES.STRUCTURE);
  cacheTag(CACHE_TAGS.CLASSES);

  const classes = await db.orm.public.Class.all();
  return classes
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
