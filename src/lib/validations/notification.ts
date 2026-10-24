import { z } from "zod";
import { phoneSchema, dateSchema, idSchema } from "./common";

/**
 * Notification status enum matching Prisma contract:
 * PENDING, SENDING, ACCEPTED, DELIVERED, FAILED
 */
export const notificationStatusSchema = z.enum(
  ["PENDING", "SENDING", "ACCEPTED", "DELIVERED", "FAILED"],
  { message: "Status must be PENDING, SENDING, ACCEPTED, DELIVERED, or FAILED" }
);

export type NotificationStatus = z.infer<typeof notificationStatusSchema>;

/**
 * Notification type schema (defaults to ABSENCE).
 */
export const notificationTypeSchema = z.string().trim().min(1).default("ABSENCE");

/**
 * Schema for queueing an absence notification for a student.
 */
export const queueNotificationSchema = z.object({
  attendanceId: idSchema,
  guardianPhone: phoneSchema,
  studentName: z
    .string({ message: "Student name is required" })
    .trim()
    .min(1, "Student name is required"),
  className: z
    .string({ message: "Class name is required" })
    .trim()
    .min(1, "Class name is required"),
  date: dateSchema,
  type: notificationTypeSchema.optional().default("ABSENCE"),
});

export type QueueNotificationInput = z.input<typeof queueNotificationSchema>;
export type QueueNotificationOutput = z.output<typeof queueNotificationSchema>;

/**
 * Schema for triggering notification dispatch batches.
 */
export const dispatchNotificationSchema = z.object({
  date: dateSchema.optional(),
  classId: z.string().trim().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
});

export type DispatchNotificationInput = z.infer<typeof dispatchNotificationSchema>;

/**
 * Schema for retrying a failed notification.
 */
export const retryNotificationSchema = z.object({
  notificationId: idSchema,
});

export type RetryNotificationInput = z.infer<typeof retryNotificationSchema>;

/**
 * Schema for querying and filtering notifications.
 */
export const notificationQuerySchema = z.object({
  status: notificationStatusSchema.optional(),
  date: dateSchema.optional(),
  classId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;

