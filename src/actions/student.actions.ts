"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  studentSchema,
  updateStudentSchema,
  type StudentInput,
  type UpdateStudentInput,
} from "@/lib/validations/student";
import { updateTag, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/components/cacheTag";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
export async function createStudent(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = studentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const { admissionNo, fullName, classId, guardianName, guardianPhone } = parsed.data;

    // Check class exists
    const cls = await db.orm.public.Class.where({ id: classId }).first();
    if (!cls) {
      return { ok: false, error: "Selected class does not exist" };
    }

    // Duplicate admission number guard
    const existing = await db.orm.public.Student.where({ admissionNo }).first();
    if (existing) {
      return { ok: false, error: "A student with this admission number already exists" };
    }

    const student = await db.orm.public.Student.create({
      admissionNo,
      fullName,
      classId,
      active: true,
    });

    await db.orm.public.Guardian.create({
      studentId: student.id,
      name: guardianName,
      phone: guardianPhone,
      isPrimary: true,
    });

    try {
      updateTag(CACHE_TAGS.STUDENTS);
      updateTag(CACHE_TAGS.STUDENTS_BY_CLASS(classId));
      updateTag(CACHE_TAGS.CLASSES);
      updateTag(CACHE_TAGS.ATTENDANCE);
      updateTag(CACHE_TAGS.DASHBOARD);
      updateTag(CACHE_TAGS.GUARDIANS);
    } catch {}
    return { ok: true, data: { id: student.id, admissionNo, fullName } };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to create student" };
  }
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------
export async function updateStudent(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = updateStudentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const { id, admissionNo, fullName, classId, active, guardianName, guardianPhone } = parsed.data;

    // Verify student exists
    const student = await db.orm.public.Student.where({ id }).first();
    if (!student) {
      return { ok: false, error: "Student not found" };
    }

    // Duplicate admission number check (only if admissionNo changed)
    if (admissionNo && admissionNo !== student.admissionNo) {
      const dup = await db.orm.public.Student.where({ admissionNo }).first();
      if (dup) {
        return { ok: false, error: "A student with this admission number already exists" };
      }
    }

    // Check class exists if classId changed
    if (classId && classId !== student.classId) {
      const cls = await db.orm.public.Class.where({ id: classId }).first();
      if (!cls) {
        return { ok: false, error: "Selected class does not exist" };
      }
    }

    // Build update object, only changed fields
    const updates: Record<string, unknown> = {};
    if (admissionNo !== undefined) updates.admissionNo = admissionNo;
    if (fullName !== undefined) updates.fullName = fullName;
    if (classId !== undefined) updates.classId = classId;
    if (active !== undefined) updates.active = active;

    if (Object.keys(updates).length > 0) {
      await db.orm.public.Student.where({ id }).update(updates);
    }

    // Update or create primary guardian if guardian fields provided
    if (guardianName !== undefined || guardianPhone !== undefined) {
      const guardians = await db.orm.public.Guardian.where({ studentId: id, isPrimary: true }).all();
      const primary = guardians[0];
      if (primary) {
        const guardianUpdates: Record<string, unknown> = {};
        if (guardianName !== undefined) guardianUpdates.name = guardianName;
        if (guardianPhone !== undefined) guardianUpdates.phone = guardianPhone;
        await db.orm.public.Guardian.where({ id: primary.id }).update(guardianUpdates);
      } else if (guardianName && guardianPhone) {
        await db.orm.public.Guardian.create({
          studentId: id,
          name: guardianName,
          phone: guardianPhone,
          isPrimary: true,
        });
      }
    }

    try {
      updateTag(CACHE_TAGS.STUDENTS);
      updateTag(CACHE_TAGS.STUDENT(id));
      if (classId) updateTag(CACHE_TAGS.STUDENTS_BY_CLASS(classId));
      updateTag(CACHE_TAGS.CLASSES);
      updateTag(CACHE_TAGS.ATTENDANCE);
      updateTag(CACHE_TAGS.DASHBOARD);
      updateTag(CACHE_TAGS.GUARDIANS);
    } catch {}
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to update student" };
  }
}

// ---------------------------------------------------------------------------
// UPDATE GUARDIAN
// ---------------------------------------------------------------------------
export async function updateGuardian(input: {
  studentId: string;
  guardianName: string;
  guardianPhone: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const { studentId, guardianName, guardianPhone } = input;
    if (!studentId || !guardianName || !guardianPhone) {
      return { ok: false, error: "Missing required guardian fields" };
    }

    const student = await db.orm.public.Student.where({ id: studentId }).first();
    if (!student) {
      return { ok: false, error: "Student not found" };
    }

    // Find primary guardian
    const guardians = await db.orm.public.Guardian.where({ studentId, isPrimary: true }).all();
    const guardian = guardians[0];

    if (guardian) {
      await db.orm.public.Guardian.where({ id: guardian.id }).update({
        name: guardianName,
        phone: guardianPhone,
      });
    } else {
      await db.orm.public.Guardian.create({
        studentId,
        name: guardianName,
        phone: guardianPhone,
        isPrimary: true,
      });
    }

    try {
      updateTag(CACHE_TAGS.STUDENTS);
      updateTag(CACHE_TAGS.STUDENT(studentId));
      updateTag(CACHE_TAGS.GUARDIANS);
    } catch {}
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to update guardian" };
  }
}

// ---------------------------------------------------------------------------
// DEACTIVATE / REACTIVATE / DELETE (soft-delete to keep history intact)
// ---------------------------------------------------------------------------
export async function toggleStudentActive(
  studentId: string,
  active: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const student = await db.orm.public.Student.where({ id: studentId }).first();
    if (!student) {
      return { ok: false, error: "Student not found" };
    }

    await db.orm.public.Student.where({ id: studentId }).update({ active });
    try {
      updateTag(CACHE_TAGS.STUDENTS);
      updateTag(CACHE_TAGS.STUDENT(studentId));
      updateTag(CACHE_TAGS.CLASSES);
      updateTag(CACHE_TAGS.ATTENDANCE);
      updateTag(CACHE_TAGS.DASHBOARD);
      updateTag(CACHE_TAGS.GUARDIANS);
    } catch {}
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to update student status" };
  }
}

export async function deactivateStudent(studentId: string): Promise<ActionResult> {
  return toggleStudentActive(studentId, false);
}

export async function deleteStudent(studentId: string): Promise<ActionResult> {
  // Soft-delete to preserve attendance and notification history
  return toggleStudentActive(studentId, false);
}

// ---------------------------------------------------------------------------
// LIST (available to all authenticated users, but guardian phones masked for teachers)
// ---------------------------------------------------------------------------
export async function listStudents(params?: {
  classId?: string;
  search?: string;
  showInactive?: boolean;
}) {
  const user = await requireUser();
  try {
    if (params?.classId) {
      cacheTag(CACHE_TAGS.STUDENTS, CACHE_TAGS.STUDENTS_BY_CLASS(params.classId));
    } else {
      cacheTag(CACHE_TAGS.STUDENTS);
    }
  } catch {}

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

      // Mask phone for non-admin users
      let guardianPhone = guardian?.phone || "";
      if (user.role !== "ADMIN" && guardianPhone.length > 4) {
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

// ---------------------------------------------------------------------------
// LIST CLASSES (for dropdowns)
// ---------------------------------------------------------------------------
export async function listClasses() {
  await requireUser();
  try {
    cacheTag(CACHE_TAGS.CLASSES);
  } catch {}
  return db.orm.public.Class.all();
}
