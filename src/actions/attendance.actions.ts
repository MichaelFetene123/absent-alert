"use server";

import { db } from "@/lib/db";
import { requireClassAccess } from "@/lib/guards";
import { markAttendanceSchema, type MarkAttendanceInput } from "@/lib/validations/attendance";
import { revalidatePath } from "next/cache";

export type MarkAttendanceResult = {
  success: boolean;
  markedCount?: number;
  error?: string;
};

export async function markAttendanceAction(input: MarkAttendanceInput): Promise<MarkAttendanceResult> {
  try {
    const parsed = markAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid attendance data" };
    }

    const { classId, date, records } = parsed.data;
    const user = await requireClassAccess(classId);

    // Save attendance records
    let count = 0;
    for (const record of records) {
      const existing = await db.orm.public.AttendanceRecord.where({
        studentId: record.studentId,
        date,
      }).first();

      if (existing) {
        await db.orm.public.AttendanceRecord.where({ id: existing.id }).update({
          status: record.status,
          markedById: user.id,
        });
      } else {
        await db.orm.public.AttendanceRecord.create({
          studentId: record.studentId,
          date,
          status: record.status,
          markedById: user.id,
        });
      }
      count++;
    }

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return { success: true, markedCount: count };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark attendance" };
  }
}
