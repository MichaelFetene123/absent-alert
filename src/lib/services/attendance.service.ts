import "server-only";
import { db } from "@/lib/db";

export type MarkStudentAttendanceInput = {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "LATE";
};

/**
 * Attendance service for recording daily student attendance.
 */
export async function getAttendanceByDate(classId: string, date: string) {
  // Query attendance records for the class and date
  return db.orm.public.AttendanceRecord.where({
    date,
  }).all();
}
