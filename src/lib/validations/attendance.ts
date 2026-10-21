import { z } from "zod";

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]);

export const attendanceItemSchema = z.object({
  studentId: z.string().min(1),
  status: attendanceStatusSchema,
});

export const markAttendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  records: z.array(attendanceItemSchema).min(1, "At least one student record is required"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
