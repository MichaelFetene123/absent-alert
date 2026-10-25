import { z } from "zod";
import { idSchema } from "./common";

/**
 * Schema for creating a new teacher account.
 */
export const createTeacherSchema = z.object({
  name: z
    .string({ message: "Teacher name is required" })
    .trim()
    .min(2, "Teacher name must be at least 2 characters")
    .max(50, "Teacher name must not exceed 50 characters"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .email("A valid email address is required")
    .max(100, "Email must not exceed 100 characters"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
  classIds: z.array(z.string()).optional().default([]),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

/**
 * Schema for updating an existing teacher account.
 * Password is optional — if provided (min 6), updates the hash; if empty/omitted, keeps existing.
 */
export const updateTeacherSchema = z.object({
  id: idSchema,
  name: z
    .string({ message: "Teacher name is required" })
    .trim()
    .min(2, "Teacher name must be at least 2 characters")
    .max(50, "Teacher name must not exceed 50 characters"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .email("A valid email address is required")
    .max(100, "Email must not exceed 100 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  classIds: z.array(z.string()).optional(),
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

/**
 * Schema for managing class assignments for a teacher.
 */
export const assignTeacherClassesSchema = z.object({
  teacherId: idSchema,
  classIds: z.array(z.string()),
});

export type AssignTeacherClassesInput = z.infer<typeof assignTeacherClassesSchema>;
