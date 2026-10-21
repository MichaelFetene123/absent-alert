"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createStudentAction(input: StudentInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = studentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const { admissionNo, fullName, classId, guardianName, guardianPhone } = parsed.data;

    const existing = await db.orm.public.Student.where({ admissionNo }).first();
    if (existing) {
      return { success: false, error: "A student with this admission number already exists" };
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

    revalidatePath("/students");
    return { success: true, data: student };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create student" };
  }
}
