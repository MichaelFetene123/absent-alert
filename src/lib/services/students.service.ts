import "server-only";
import { cacheTag, cacheLife, CACHE_TAGS, CACHE_PROFILES } from "@/components/cacheTag";
import { db } from "@/lib/db";

export type EnrichedStudent = {
  id: string;
  admissionNo: string;
  fullName: string;
  classId: string;
  className: string;
  active: boolean;
  guardianName: string;
  guardianPhone: string;
};

export async function fetchStudentsData(params?: {
  classId?: string;
  search?: string;
  showInactive?: boolean;
  isTeacherRole?: boolean;
}): Promise<EnrichedStudent[]> {
  "use cache";
  cacheLife(CACHE_PROFILES.DIRECTORY);
  if (params?.classId) {
    cacheTag(CACHE_TAGS.STUDENTS, CACHE_TAGS.STUDENTS_BY_CLASS(params.classId));
  } else {
    cacheTag(CACHE_TAGS.STUDENTS);
  }

  // Build filter
  const filter: Record<string, unknown> = {};
  if (params?.classId) filter.classId = params.classId;
  if (!params?.showInactive) filter.active = true;

  let students = await db.orm.public.Student.where(filter).all();

  // Search by name or admission number
  if (params?.search) {
    const q = params.search.toLowerCase();
    students = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q)
    );
  }

  // Fetch class names and guardians for each student
  const enriched = await Promise.all(
    students.map(async (s) => {
      const cls = await db.orm.public.Class.where({ id: s.classId }).first();
      const guardians = await db.orm.public.Guardian.where({
        studentId: s.id,
        isPrimary: true,
      }).all();
      const guardian = guardians[0];

      // Mask phone for teacher users
      let guardianPhone = guardian?.phone || "";
      if (params?.isTeacherRole && guardianPhone.length > 4) {
        guardianPhone =
          guardianPhone.slice(0, 4) + "****" + guardianPhone.slice(-2);
      }

      return {
        id: s.id,
        admissionNo: s.admissionNo,
        fullName: s.fullName,
        classId: s.classId,
        className: cls?.name || "—",
        active: s.active,
        guardianName: guardian?.name || "—",
        guardianPhone,
      };
    })
  );

  return enriched;
}

export async function fetchClassesListData() {
  "use cache";
  cacheLife(CACHE_PROFILES.STRUCTURE);
  cacheTag(CACHE_TAGS.CLASSES);
  return db.orm.public.Class.all();
}
