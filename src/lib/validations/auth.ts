import { z } from "zod";

/**
 * User role enum matching Prisma contract:
 * ADMIN, TEACHER
 */
export const roleSchema = z.enum(["ADMIN", "TEACHER"], {
  message: "Role must be ADMIN or TEACHER",
});

export type Role = z.infer<typeof roleSchema>;

/**
 * Schema for login authentication.
 */
export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Enter a valid email address"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for creating a staff user (Admin / Teacher).
 */
export const createUserSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Enter a valid email address"),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  role: roleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
