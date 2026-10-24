import { z } from "zod";
import { pastOrTodayDateSchema, dateSchema, idSchema } from "./common";

/**
 * Attendance status enum matching Prisma contract:
 * PRESENT, ABSENT, LEAVE, LATE
 */
export const attendanceStatusSchema = z.enum(
  ["PRESENT", "ABSENT", "LEAVE", "LATE"],
  { message: "Status must be PRESENT, ABSENT, LEAVE, or LATE" }
);

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

/**
 * Single student attendance entry.
 */
export const attendanceEntrySchema = z.object({
  studentId: idSchema,
  status: attendanceStatusSchema,
});

export const attendanceItemSchema = attendanceEntrySchema;
export type AttendanceEntryInput = z.infer<typeof attendanceEntrySchema>;
export type AttendanceItemInput = AttendanceEntryInput;

/**
 * Schema for submitting attendance for a class on a specific date.
 * Reusable in Server Actions and form submissions.
 * Accepts either `records` or `entries` for compatibility with both design patterns.
 */
export const markAttendanceSchema = z
  .object({
    classId: idSchema,
    date: pastOrTodayDateSchema,
    records: z.array(attendanceEntrySchema).optional(),
    entries: z.array(attendanceEntrySchema).optional(),
  })
  .refine(
    (data) => {
      const items = data.records || data.entries;
      return Array.isArray(items) && items.length > 0;
    },
    { message: "At least one student record is required", path: ["records"] }
  )
  .refine(
    (data) => {
      const items = data.records || data.entries || [];
      return items.length <= 200;
    },
    { message: "Cannot mark more than 200 students in a single batch", path: ["records"] }
  )
  .transform((data) => {
    const list = data.records || data.entries || [];
    return {
      classId: data.classId,
      date: data.date,
      records: list,
      entries: list,
    };
  });

export type MarkAttendanceInput = z.input<typeof markAttendanceSchema>;
export type MarkAttendanceOutput = z.output<typeof markAttendanceSchema>;

/**
 * Schema for querying daily class attendance.
 */
export const attendanceQuerySchema = z.object({
  classId: idSchema,
  date: dateSchema,
});

export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
