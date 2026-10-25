import { z } from "zod";
import { idSchema } from "./common";

/**
 * Basic Schema for class name validation.
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
 * Structured form schema for creating or updating a class with Grade & Section.
 */
export const classFormSchema = z.object({
  grade: z
    .string({ message: "Grade is required" })
    .trim()
    .min(1, "Grade is required")
    .max(30, "Grade must not exceed 30 characters"),
  section: z
    .string({ message: "Section is required" })
    .trim()
    .min(1, "Section is required")
    .max(15, "Section must not exceed 15 characters"),
  customName: z.string().trim().max(50).optional(),
  teacherIds: z.array(z.string()).optional(),
});

export type ClassFormInput = z.infer<typeof classFormSchema>;

/**
 * Schema for updating an existing class.
 */
export const updateClassSchema = z.object({
  id: idSchema,
  name: z
    .string({ message: "Class name is required" })
    .trim()
    .min(1, "Class name is required")
    .max(50, "Class name must not exceed 50 characters"),
  teacherIds: z.array(z.string()).optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;

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

/**
 * Helper to construct a canonical class name from Grade & Section.
 * Example: grade="7", section="B" -> "Grade 7 B"
 * Example: grade="KG 2", section="Blue" -> "KG 2 Blue"
 */
export function formatClassName(grade: string, section: string, customName?: string): string {
  if (customName && customName.trim().length > 0) {
    return customName.trim();
  }
  const cleanGrade = grade.trim();
  const cleanSection = section.trim().toUpperCase();

  const formattedGrade = /^\d+$/.test(cleanGrade)
    ? `Grade ${cleanGrade}`
    : cleanGrade.toLowerCase().startsWith("grade") || cleanGrade.toLowerCase().startsWith("class")
    ? cleanGrade
    : `Grade ${cleanGrade}`;

  return `${formattedGrade} ${cleanSection}`;
}

/**
 * Helper to extract Grade and Section from a class name string.
 * Example: "Grade 7 B" -> { grade: "Grade 7", section: "B" }
 * Example: "Class 7 B" -> { grade: "Grade 7", section: "B" }
 */
export function parseClassGradeSection(name: string): { grade: string; section: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 3) {
    // e.g. "Grade", "7", "B" or "Class", "7", "B"
    const section = parts[parts.length - 1]!;
    const grade = parts.slice(0, parts.length - 1).join(" ");
    return { grade, section };
  } else if (parts.length === 2) {
    // e.g. "7B" or "7 B"
    return { grade: parts[0]!, section: parts[1]! };
  }
  return { grade: name, section: "A" };
}
