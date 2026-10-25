"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  createTeacherSchema,
  updateTeacherSchema,
  assignTeacherClassesSchema,
} from "@/lib/validations/teacher";
import { idSchema } from "@/lib/validations/common";

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

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/**
 * Retrieves all registered teachers enriched with their assigned classes
 * and the count of attendance records they have marked.
 */
export async function listTeachersWithDetails(): Promise<TeacherItemWithDetails[]> {
  await requireUser();

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
      role: "TEACHER",
      assignedClasses: assigned,
      markedAttendanceCount: attendanceCountByTeacher.get(u.id) || 0,
    };
  });

  // Natural sort by teacher name
  result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}

/**
 * Lists all classes available for teacher assignment.
 */
export async function listAvailableClassesForTeachers(): Promise<
  Array<{ id: string; name: string }>
> {
  await requireUser();

  const classes = await db.orm.public.Class.all();
  return classes
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/**
 * Creates a new teacher account.
 * - Enforces requireAdmin()
 * - Validates name, email, password
 * - Hashes password with bcrypt
 * - Prevents duplicate email registration
 * - Associates any initial classes in TeacherClass
 */
export async function createTeacherAction(
  input: unknown
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  try {
    await requireAdmin();

    const parsed = createTeacherSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid teacher data",
      };
    }

    const { name, email, password, classIds = [] } = parsed.data;

    // Check duplicate email
    const existingUser = await db.orm.public.User.where({ email }).first();
    if (existingUser) {
      return {
        ok: false,
        error: `A user account with email "${email}" already exists.`,
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create teacher User record
    const createdTeacher = await db.orm.public.User.create({
      name,
      email,
      passwordHash,
      role: "TEACHER",
    });

    // Assign classes if provided
    if (classIds.length > 0) {
      for (const classId of classIds) {
        try {
          await db.orm.public.TeacherClass.create({
            userId: createdTeacher.id,
            classId,
          });
        } catch {
          // Skip if relation duplicate
        }
      }
    }

    revalidatePath("/teachers");
    revalidatePath("/classes");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return {
      ok: true,
      data: {
        id: createdTeacher.id,
        name: createdTeacher.name,
        email: createdTeacher.email,
      },
    };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to create teacher account" };
  }
}

/**
 * Updates an existing teacher's profile, credentials, and class assignments.
 * - Enforces requireAdmin()
 * - Optionally updates password if non-empty
 * - Synchronizes TeacherClass relationships
 */
export async function updateTeacherAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = updateTeacherSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid update payload",
      };
    }

    const { id, name, email, password, classIds } = parsed.data;

    // Verify teacher exists
    const existing = await db.orm.public.User.where({ id }).first();
    if (!existing || existing.role !== "TEACHER") {
      return { ok: false, error: "Teacher account not found" };
    }

    // Check duplicate email with another user
    const allUsers = await db.orm.public.User.all();
    const hasConflict = allUsers.some(
      (u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase()
    );

    if (hasConflict) {
      return {
        ok: false,
        error: `Another user account with email "${email}" already exists.`,
      };
    }

    // Prepare update payload
    const updates: Record<string, unknown> = {
      name,
      email,
    };

    if (password && password.trim().length >= 6) {
      updates.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    await db.orm.public.User.where({ id }).update(updates);

    // Sync class assignments if classIds array is specified
    if (classIds !== undefined) {
      const currentLinks = await db.orm.public.TeacherClass.where({ userId: id }).all();
      const currentClassIds = new Set(currentLinks.map((l) => l.classId));
      const targetClassIds = new Set(classIds);

      // Unassign classes no longer selected
      for (const link of currentLinks) {
        if (!targetClassIds.has(link.classId)) {
          await db.orm.public.TeacherClass.where({
            userId: id,
            classId: link.classId,
          }).delete();
        }
      }

      // Assign newly selected classes
      for (const classId of classIds) {
        if (!currentClassIds.has(classId)) {
          try {
            await db.orm.public.TeacherClass.create({
              userId: id,
              classId,
            });
          } catch {
            // Already linked
          }
        }
      }
    }

    revalidatePath("/teachers");
    revalidatePath("/classes");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to update teacher" };
  }
}

/**
 * Deletes a teacher account.
 * - Enforces requireAdmin()
 * - STRICT DEPENDENCY GUARD 1: Cannot delete if assigned to any classes (must unassign first)
 * - STRICT DEPENDENCY GUARD 2: Cannot delete if teacher has marked attendance records (audit integrity)
 */
export async function deleteTeacherAction(teacherId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = idSchema.parse(teacherId);

    const targetTeacher = await db.orm.public.User.where({ id }).first();
    if (!targetTeacher || targetTeacher.role !== "TEACHER") {
      return { ok: false, error: "Teacher account not found" };
    }

    // Dependency check 1: Active class assignments
    const teacherClasses = await db.orm.public.TeacherClass.where({ userId: id }).all();
    if (teacherClasses.length > 0) {
      return {
        ok: false,
        error: `Cannot delete "${targetTeacher.name}": Currently assigned to ${teacherClasses.length} class(es). Please unassign this teacher from all classes before deleting.`,
      };
    }

    // Dependency check 2: Linked attendance records marked by this teacher
    const markedRecords = await db.orm.public.AttendanceRecord.where({ markedById: id }).all();
    if (markedRecords.length > 0) {
      return {
        ok: false,
        error: `Cannot delete "${targetTeacher.name}": Has marked ${markedRecords.length} attendance record(s) in the system. To preserve historical attendance data and audit integrity, this teacher account cannot be deleted.`,
      };
    }

    // Safe to delete
    await db.orm.public.User.where({ id }).delete();

    revalidatePath("/teachers");
    revalidatePath("/classes");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to delete teacher" };
  }
}

/**
 * Direct action to synchronize class assignments for a teacher.
 */
export async function assignClassesToTeacherAction(
  teacherId: string,
  classIds: string[]
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = assignTeacherClassesSchema.safeParse({ teacherId, classIds });
    if (!parsed.success) {
      return { ok: false, error: "Invalid assignment data" };
    }

    const { teacherId: tId, classIds: targetIds } = parsed.data;

    const teacher = await db.orm.public.User.where({ id: tId }).first();
    if (!teacher || teacher.role !== "TEACHER") {
      return { ok: false, error: "Teacher not found" };
    }

    const currentLinks = await db.orm.public.TeacherClass.where({ userId: tId }).all();
    const currentClassIds = new Set(currentLinks.map((l) => l.classId));
    const targetClassIds = new Set(targetIds);

    // Delete removed
    for (const link of currentLinks) {
      if (!targetClassIds.has(link.classId)) {
        await db.orm.public.TeacherClass.where({
          userId: tId,
          classId: link.classId,
        }).delete();
      }
    }

    // Add new
    for (const classId of targetIds) {
      if (!currentClassIds.has(classId)) {
        try {
          await db.orm.public.TeacherClass.create({
            userId: tId,
            classId,
          });
        } catch {
          // Already linked
        }
      }
    }

    revalidatePath("/teachers");
    revalidatePath("/classes");
    revalidatePath("/attendance");
    revalidatePath("/attendance/overview");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to update class assignments" };
  }
}
