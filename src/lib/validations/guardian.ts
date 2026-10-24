import { z } from "zod";
import { phoneSchema, idSchema } from "./common";

/**
 * Schema for adding a guardian to a student.
 */
export const guardianSchema = z.object({
  studentId: idSchema,
  name: z
    .string({ message: "Guardian name is required" })
    .trim()
    .min(2, "Guardian name must be at least 2 characters")
    .max(100, "Guardian name must not exceed 100 characters"),
  phone: phoneSchema,
  isPrimary: z.boolean().optional().default(true),
});

export type GuardianInput = z.input<typeof guardianSchema>;
export type GuardianOutput = z.output<typeof guardianSchema>;

/**
 * Schema for updating an existing guardian.
 */
export const updateGuardianSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .trim()
    .min(2, "Guardian name must be at least 2 characters")
    .max(100, "Guardian name must not exceed 100 characters")
    .optional(),
  phone: phoneSchema.optional(),
  isPrimary: z.boolean().optional(),
});

export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
