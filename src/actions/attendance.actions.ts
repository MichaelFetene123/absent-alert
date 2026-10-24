"use server";

import { requireClassAccess } from "@/lib/guards";
import {
  markAttendanceSchema,
  attendanceQuerySchema,
  type MarkAttendanceInput,
  type AttendanceQueryInput,
} from "@/lib/validations/attendance";
import { saveAttendance, getClassAttendance } from "@/lib/services/attendance.service";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  success?: boolean;
  data?: T;
  error?: string;
};

/**
 * Marks attendance for a class on a specified date.
 * - Validates input with markAttendanceSchema (PRESENT, ABSENT, LEAVE, LATE).
 * - Enforces class authorization: Admins have universal access; Teachers must be assigned to the class.
 * - Idempotently handles existing records to prevent duplicate @@unique([studentId, date]) errors.
 * - Saves attendance independently of SMS delivery (Step 7 requirement: no SMS sent here).
 */
export async function markAttendance(input: unknown): Promise<ActionResult<{
  saved: number;
  created: number;
  updated: number;
  newlyAbsentCount: number;
}>> {
  try {
    // 1. Zod validation
    const parsed = markAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid attendance data",
      };
    }

    const { classId, date, entries } = parsed.data;

    // 2. Authorization check (Admin or assigned Teacher)
    const user = await requireClassAccess(classId);

    // 3. Prevent marking attendance for future dates
    const todayStr = new Date().toISOString().split("T")[0];
    if (date > todayStr) {
      return {
        ok: false,
        success: false,
        error: "Cannot mark attendance for future dates",
      };
    }

    // 4. Save attendance via dedicated attendance service
    const result = await saveAttendance({
      classId,
      date,
      markedById: user.id,
      entries,
    });

    revalidatePath("/attendance");
    revalidatePath("/dashboard");

    return {
      ok: true,
      success: true,
      data: {
        saved: result.total,
        created: result.createdCount,
        updated: result.updatedCount,
        newlyAbsentCount: result.newlyAbsent.length,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      success: false,
      error: error.message || "Failed to mark attendance",
    };
  }
}

// Alias for backwards-compatibility
export const markAttendanceAction = markAttendance;

/**
 * Retrieves daily attendance status for a class on a given date.
 * Enforces class authorization (Admin or assigned Teacher).
 */
export async function getDailyAttendance(input: unknown): Promise<ActionResult> {
  try {
    const parsed = attendanceQuerySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid query parameters",
      };
    }

    const { classId, date } = parsed.data;
    await requireClassAccess(classId);

    const records = await getClassAttendance({ classId, date });
    return {
      ok: true,
      success: true,
      data: records,
    };
  } catch (error: any) {
    return {
      ok: false,
      success: false,
      error: error.message || "Failed to fetch attendance records",
    };
  }
}
