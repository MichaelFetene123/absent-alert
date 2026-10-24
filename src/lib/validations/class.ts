import { z } from "zod";
import { idSchema } from "./common";

/**
 * Schema for creating a new class (e.g. "Class 7 B").
 */
export const classSchema = z.object({
  name: z
    .string({ message: "Class name is required" })
    .trim()
    .min(1, "Class name is required")
    .max(50, "Class name must not exceed 50 characters"),
});

export const createClassSchema = classSchema;
export type ClassInput = z.infer<typeof classSchema>;
export type CreateClassInput = ClassInput;

/**
 * Schema for assigning or unassigning a teacher to/from a class.
 */
export const assignTeacherSchema = z.object({
  userId: idSchema,
  classId: idSchema,
});

export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;

/**
 * Schema for managing teacher-class associations with explicit actions.
 */
export const classTeacherActionSchema = z.object({
  userId: idSchema,
  classId: idSchema,
  action: z.enum(["ASSIGN", "UNASSIGN"]),
});

export type ClassTeacherActionInput = z.infer<typeof classTeacherActionSchema>;
