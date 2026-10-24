import "server-only";
import { Temporal } from "temporal-polyfill";
import { db } from "@/lib/db";
import type { AttendanceStatus } from "@/lib/validations/attendance";

export type AttendanceEntry = {
  studentId: string;
  status: AttendanceStatus;
};

export type SaveAttendanceParams = {
  classId: string;
  date: string; // "YYYY-MM-DD"
  markedById: string;
  entries: AttendanceEntry[];
};

export type SavedAttendanceRecord = {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  markedById: string;
  date: string;
};

export type SaveAttendanceResult = {
  records: SavedAttendanceRecord[];
  newlyAbsent: Array<{ studentId: string; recordId: string }>;
  createdCount: number;
  updatedCount: number;
  total: number;
};

/**
 * Saves attendance records for a class on a given date.
 * - Enforces that all submitted students exist, belong to the target class, and are active.
 * - Idempotently updates existing records (prevents duplicate @@unique([studentId, date]) violations).
 * - Tracks newly absent students for SMS notification pipeline (dispatched separately in Step 9).
 */
export async function saveAttendance(params: {
  classId: string;
  date: string;
  markedById: string;
  entries: AttendanceEntry[];
}): Promise<SaveAttendanceResult> {
  const plainDate = Temporal.PlainDate.from(params.date);

  // 1. Verify class exists
  const targetClass = await db.orm.public.Class.where({ id: params.classId }).first();
  if (!targetClass) {
    throw new Error("Selected class does not exist");
  }

  // 2. Verify all submitted students belong to this class and are active
  const activeClassStudents = await db.orm.public.Student.where({
    classId: params.classId,
    active: true,
  }).all();

  const validStudentIds = new Set(activeClassStudents.map((s) => s.id));
  const invalidStudents = params.entries.filter((e) => !validStudentIds.has(e.studentId));

  if (invalidStudents.length > 0) {
    throw new Error("Some students do not belong to this class or are inactive");
  }

  // 3. Upsert attendance records idempotently
  const records: SavedAttendanceRecord[] = [];
  const newlyAbsent: Array<{ studentId: string; recordId: string }> = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (const entry of params.entries) {
    // Check if record exists for this student and date
    const existing = await db.orm.public.AttendanceRecord.where({
      studentId: entry.studentId,
      date: plainDate,
    }).first();

    if (existing) {
      const isNewlyAbsent = existing.status !== "ABSENT" && entry.status === "ABSENT";

      await db.orm.public.AttendanceRecord.where({ id: existing.id }).update({
        status: entry.status,
        markedById: params.markedById,
      });

      records.push({
        id: existing.id,
        studentId: entry.studentId,
        status: entry.status,
        markedById: params.markedById,
        date: params.date,
      });

      if (isNewlyAbsent) {
        newlyAbsent.push({ studentId: entry.studentId, recordId: existing.id });
      }

      updatedCount++;
    } else {
      const created = await db.orm.public.AttendanceRecord.create({
        studentId: entry.studentId,
        date: plainDate,
        status: entry.status,
        markedById: params.markedById,
      });

      records.push({
        id: created.id,
        studentId: entry.studentId,
        status: entry.status,
        markedById: params.markedById,
        date: params.date,
      });

      if (entry.status === "ABSENT") {
        newlyAbsent.push({ studentId: entry.studentId, recordId: created.id });
      }

      createdCount++;
    }
  }

  return {
    records,
    newlyAbsent,
    createdCount,
    updatedCount,
    total: records.length,
  };
}

/**
 * Retrieves daily attendance status for all active students in a given class on a specific date.
 */
export async function getClassAttendance(params: {
  classId: string;
  date: string;
}) {
  const plainDate = Temporal.PlainDate.from(params.date);

  const students = await db.orm.public.Student.where({
    classId: params.classId,
    active: true,
  }).all();

  const records = await db.orm.public.AttendanceRecord.where({
    date: plainDate,
  }).all();

  const recordMap = new Map<string, (typeof records)[0]>();
  for (const rec of records) {
    recordMap.set(rec.studentId, rec);
  }

  return students.map((s) => {
    const rec = recordMap.get(s.id);
    return {
      studentId: s.id,
      admissionNo: s.admissionNo,
      fullName: s.fullName,
      status: (rec?.status as AttendanceStatus) || null,
      markedById: rec?.markedById || null,
      recordId: rec?.id || null,
    };
  });
}
