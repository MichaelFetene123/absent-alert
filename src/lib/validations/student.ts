import { z } from "zod";
import { phoneSchema, idSchema } from "./common";

/**
 * Schema for creating a new student with their primary guardian.
 */
export const studentSchema = z.object({
  admissionNo: z
    .string({ message: "Admission number is required" })
    .trim()
    .min(1, "Admission number is required")
    .max(30, "Admission number must not exceed 30 characters"),
  fullName: z
    .string({ message: "Student full name is required" })
    .trim()
    .min(2, "Student full name must be at least 2 characters")
    .max(100, "Student full name must not exceed 100 characters"),
  classId: idSchema,
  guardianName: z
    .string({ message: "Guardian name is required" })
    .trim()
    .min(2, "Guardian name must be at least 2 characters")
    .max(100, "Guardian name must not exceed 100 characters"),
  guardianPhone: phoneSchema,
  active: z.boolean().optional().default(true),
});

export type StudentInput = z.input<typeof studentSchema>;
export type StudentOutput = z.output<typeof studentSchema>;

/**
 * Schema for updating an existing student.
 */
export const updateStudentSchema = z.object({
  id: idSchema,
  admissionNo: z
    .string()
    .trim()
    .min(1, "Admission number cannot be empty")
    .max(30, "Admission number must not exceed 30 characters")
    .optional(),
  fullName: z
    .string()
    .trim()
    .min(2, "Student full name must be at least 2 characters")
    .max(100, "Student full name must not exceed 100 characters")
    .optional(),
  classId: idSchema.optional(),
  active: z.boolean().optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

/**
 * Schema for filtering/listing students.
 */
export const studentFilterSchema = z.object({
  classId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  active: z.boolean().optional(),
});

export type StudentFilterInput = z.infer<typeof studentFilterSchema>;
