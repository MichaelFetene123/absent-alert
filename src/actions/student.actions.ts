"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  studentSchema,
  updateStudentSchema,
  type StudentInput,
  type UpdateStudentInput,
} from "@/lib/validations/student";
import { updateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/components/cacheTag";
import {
  fetchStudentsData,
  fetchClassesListData,
} from "@/lib/services/students.service";

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
// BULK IMPORT
// ---------------------------------------------------------------------------
export type BulkImportRowInput = {
  admissionNo: string;
  fullName: string;
  classNameOrId: string;
  guardianName: string;
  guardianPhone: string;
};

export type BulkImportResult = {
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; admissionNo: string; error: string }>;
};

export async function bulkImportStudentsAction(
  rows: BulkImportRowInput[]
): Promise<ActionResult<BulkImportResult>> {
  try {
    await requireAdmin();

    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, error: "No student records provided for import" };
    }

    if (rows.length > 500) {
      return { ok: false, error: "Cannot import more than 500 students in a single batch" };
    }

    // Preload all classes for matching
    const allClasses = await db.orm.public.Class.all();
    const classMap = new Map<string, string>();
    for (const c of allClasses) {
      classMap.set(c.id.toLowerCase(), c.id);
      classMap.set(c.name.toLowerCase().trim(), c.id);
    }

    // Preload existing admission numbers
    const existingStudents = await db.orm.public.Student.all();
    const existingAdmissionNos = new Set(
      existingStudents.map((s) => s.admissionNo.toLowerCase().trim())
    );

    const batchAdmissionNos = new Set<string>();
    const errors: Array<{ row: number; admissionNo: string; error: string }> = [];
    const validRowsToCreate: Array<{
      admissionNo: string;
      fullName: string;
      classId: string;
      guardianName: string;
      guardianPhone: string;
    }> = [];

    // Import normalizePhone dynamically or from validations
    const { normalizePhone } = await import("@/lib/validations/common");

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;
      const adm = (r.admissionNo || "").trim();
      const name = (r.fullName || "").trim();
      const clsKey = (r.classNameOrId || "").toLowerCase().trim();
      const gName = (r.guardianName || "").trim();
      const gPhone = (r.guardianPhone || "").trim();

      if (!adm) {
        errors.push({ row: rowNum, admissionNo: adm, error: "Missing admission number" });
        continue;
      }

      if (adm.length > 30) {
        errors.push({ row: rowNum, admissionNo: adm, error: "Admission number exceeds 30 characters" });
        continue;
      }

      const lowerAdm = adm.toLowerCase();
      if (existingAdmissionNos.has(lowerAdm)) {
        errors.push({ row: rowNum, admissionNo: adm, error: `Student with admission #${adm} already exists in database` });
        continue;
      }

      if (batchAdmissionNos.has(lowerAdm)) {
        errors.push({ row: rowNum, admissionNo: adm, error: `Duplicate admission #${adm} within this import file` });
        continue;
      }

      if (!name || name.length < 2) {
        errors.push({ row: rowNum, admissionNo: adm, error: "Student name must be at least 2 characters" });
        continue;
      }

      const matchedClassId = classMap.get(clsKey);
      if (!matchedClassId) {
        errors.push({
          row: rowNum,
          admissionNo: adm,
          error: `Class '${r.classNameOrId}' not found. Available: ${allClasses.map((c) => c.name).join(", ")}`,
        });
        continue;
      }

      if (!gName || gName.length < 2) {
        errors.push({ row: rowNum, admissionNo: adm, error: "Guardian name must be at least 2 characters" });
        continue;
      }

      let normalizedPhone: string;
      try {
        normalizedPhone = normalizePhone(gPhone);
      } catch (err: any) {
        errors.push({
          row: rowNum,
          admissionNo: adm,
          error: err.message || `Invalid Ethiopian phone number: '${gPhone}'`,
        });
        continue;
      }

      batchAdmissionNos.add(lowerAdm);
      validRowsToCreate.push({
        admissionNo: adm,
        fullName: name,
        classId: matchedClassId,
        guardianName: gName,
        guardianPhone: normalizedPhone,
      });
    }

    // Persist all valid rows
    let importedCount = 0;
    for (const valid of validRowsToCreate) {
      const student = await db.orm.public.Student.create({
        admissionNo: valid.admissionNo,
        fullName: valid.fullName,
        classId: valid.classId,
        active: true,
      });

      await db.orm.public.Guardian.create({
        studentId: student.id,
        name: valid.guardianName,
        phone: valid.guardianPhone,
        isPrimary: true,
      });

      importedCount++;
    }

    revalidatePath("/students");
    return {
      ok: true,
      data: {
        importedCount,
        skippedCount: errors.length,
        errors,
      },
    };
  } catch (error: any) {
    return { ok: false, error: error.message || "Failed to bulk import students" };
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
  return fetchStudentsData({
    ...params,
    isTeacherRole: user.role === "TEACHER",
  });
}

// ---------------------------------------------------------------------------
// LIST CLASSES (for dropdowns)
// ---------------------------------------------------------------------------
export async function listClasses() {
  await requireUser();
  return fetchClassesListData();
}
