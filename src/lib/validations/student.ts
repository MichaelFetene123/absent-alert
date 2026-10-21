import { z } from "zod";

export const studentSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  fullName: z.string().min(2, "Student full name is required"),
  classId: z.string().min(1, "Class is required"),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z
    .string()
    .min(9, "Phone number is too short")
    .regex(/^(\+251|0)[79]\d{8}$/, "Must be an Ethiopian phone number (e.g., 0911223344 or +251911223344)"),
});

export type StudentInput = z.infer<typeof studentSchema>;
