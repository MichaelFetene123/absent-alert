"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  classSchema,
  classFormSchema,
  updateClassSchema,
  formatClassName,
  parseClassGradeSection,
} from "@/lib/validations/class";
import { idSchema } from "@/lib/validations/common";

export type ClassItemWithDetails = {
  id: string;
  name: string;
  grade: string;
  section: string;
  activeStudentCount: number;
  totalStudentCount: number;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/**
 * Retrieves all classes enriched with active student count and assigned teachers.
 * Accessible to all authenticated staff members.
 */
export async function listClassesWithDetails(): Promise<ClassItemWithDetails[]> {
  await requireUser();

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

/**
 * Lists all registered teachers for class assignments.
 */
export async function listAvailableTeachers(): Promise<
  Array<{ id: string; name: string; email: string }>
> {
  await requireUser();

  const teachers = await db.orm.public.User.where({ role: "TEACHER" }).all();
  return teachers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
  }));
}

/**
 * Creates a new class with Grade and Section.
 * - Admin only
 * - Enforces unique class name
 * - Optionally assigns one or more teachers
 */
export async function createClassAction(input: unknown): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    await requireAdmin();

    // Support either structured { grade, section, customName, teacherIds } or { name, teacherIds }
    let finalName: string;
    let teacherIds: string[] = [];

    const structuredParse = classFormSchema.safeParse(input);
    if (structuredParse.success) {
      finalName = formatClassName(
        structuredParse.data.grade,
        structuredParse.data.section,
        structuredParse.data.customName
      );
      teacherIds = structuredParse.data.teacherIds || [];
    } else {
      const basicParse = classSchema.and(z.object({ teacherIds: z.array(z.string()).optional() })).safeParse(input);
      if (!basicParse.success) {
        return {
          ok: false,
          error: structuredParse.error.issues[0]?.message || basicParse.error.issues[0]?.message || "Invalid class data",
        };
      }
      finalName = basicParse.data.name.trim();
      teacherIds = basicParse.data.teacherIds || [];
    }

    // Check duplicate name
    const existingClasses = await db.orm.public.Class.all();
    const isDuplicate = existingClasses.some(
      (c) => c.name.toLowerCase().trim() === finalName.toLowerCase().trim()
    );

    if (isDuplicate) {
      return { ok: false, error: `A class with name "${finalName}" already exists.` };
    }

    // Create Class
    const createdClass = await db.orm.public.Class.create({
      name: finalName,
    });

    // Assign teachers if specified
    if (teacherIds.length > 0) {
      for (const teacherId of teacherIds) {
        try {
          await db.orm.public.TeacherClass.create({
            classId: createdClass.id,
            userId: teacherId,
          });
        } catch {
          // Skip if relation duplicate
        }
      }
    }

    revalidatePath("/classes");
    revalidatePath("/students");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: createdClass.id, name: createdClass.name } };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to create class" };
  }
}

/**
 * Updates an existing class name and syncs teacher assignments.
 * - Admin only
 */
export async function updateClassAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();

    // Parse input
    const parsed = updateClassSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Invalid update payload" };
    }

    const { id, name, teacherIds } = parsed.data;
    const finalName = name.trim();

    // Verify class exists
    const existing = await db.orm.public.Class.where({ id }).first();
    if (!existing) {
      return { ok: false, error: "Class not found" };
    }

    // Check duplicate name with another class
    const allClasses = await db.orm.public.Class.all();
    const hasConflict = allClasses.some(
      (c) => c.id !== id && c.name.toLowerCase().trim() === finalName.toLowerCase().trim()
    );

    if (hasConflict) {
      return { ok: false, error: `Another class with name "${finalName}" already exists.` };
    }

    // Update class name
    await db.orm.public.Class.where({ id }).update({
      name: finalName,
    });

    // Sync teacher assignments if provided
    if (teacherIds !== undefined) {
      const currentLinks = await db.orm.public.TeacherClass.where({ classId: id }).all();
      const currentTeacherIds = new Set(currentLinks.map((l) => l.userId));
      const targetTeacherIds = new Set(teacherIds);

      // Remove unselected teachers
      for (const link of currentLinks) {
        if (!targetTeacherIds.has(link.userId)) {
          await db.orm.public.TeacherClass.where({
            userId: link.userId,
            classId: id,
          }).delete();
        }
      }

      // Add newly selected teachers
      for (const teacherId of teacherIds) {
        if (!currentTeacherIds.has(teacherId)) {
          try {
            await db.orm.public.TeacherClass.create({
              userId: teacherId,
              classId: id,
            });
          } catch {
            // Already assigned
          }
        }
      }
    }

    revalidatePath("/classes");
    revalidatePath("/students");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to update class" };
  }
}

/**
 * Deletes a class.
 * - Admin only
 * - STRICT DEPENDENCY GUARD: Prevents deletion if any students are enrolled in this class.
 *   Enrolled students must be reassigned or deleted first.
 */
export async function deleteClassAction(classId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = idSchema.parse(classId);

    const targetClass = await db.orm.public.Class.where({ id }).first();
    if (!targetClass) {
      return { ok: false, error: "Class not found" };
    }

    // Dependency check: Count enrolled students
    const enrolledStudents = await db.orm.public.Student.where({ classId: id }).all();
    if (enrolledStudents.length > 0) {
      const activeCount = enrolledStudents.filter((s) => s.active).length;
      return {
        ok: false,
        error: `Cannot delete "${targetClass.name}": ${enrolledStudents.length} student(s) (${activeCount} active) are currently enrolled. Please reassign or delete these students in the Students directory before deleting this class.`,
      };
    }

    // Clean up teacher links for this class
    const teacherLinks = await db.orm.public.TeacherClass.where({ classId: id }).all();
    for (const link of teacherLinks) {
      await db.orm.public.TeacherClass.where({
        userId: link.userId,
        classId: id,
      }).delete();
    }

    // Delete the class
    await db.orm.public.Class.where({ id }).delete();

    revalidatePath("/classes");
    revalidatePath("/students");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to delete class" };
  }
}

/**
 * Assigns a teacher to a class.
 */
export async function assignTeacherToClassAction(
  classId: string,
  teacherId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    idSchema.parse(classId);
    idSchema.parse(teacherId);

    const [cls, teacher] = await Promise.all([
      db.orm.public.Class.where({ id: classId }).first(),
      db.orm.public.User.where({ id: teacherId }).first(),
    ]);

    if (!cls) return { ok: false, error: "Class not found" };
    if (!teacher || teacher.role !== "TEACHER") {
      return { ok: false, error: "Target user is not a teacher" };
    }

    const existing = await db.orm.public.TeacherClass.where({
      classId,
      userId: teacherId,
    }).first();

    if (!existing) {
      await db.orm.public.TeacherClass.create({
        classId,
        userId: teacherId,
      });
    }

    revalidatePath("/classes");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to assign teacher" };
  }
}

/**
 * Unassigns a teacher from a class.
 */
export async function unassignTeacherFromClassAction(
  classId: string,
  teacherId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    idSchema.parse(classId);
    idSchema.parse(teacherId);

    await db.orm.public.TeacherClass.where({
      classId,
      userId: teacherId,
    }).delete();

    revalidatePath("/classes");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to unassign teacher" };
  }
}
