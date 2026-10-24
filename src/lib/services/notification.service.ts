import "server-only";
import { db } from "@/lib/db";
import { sendSms, type SendSmsResult } from "@/lib/sms/smshub";

export type QueueNotificationInput = {
  attendanceId: string;
  guardianPhone: string;
  studentName: string;
  className: string;
  date: string;
};

export type NotificationDispatchResult = {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
};

/**
 * Standard message template for absence alerts.
 */
export function absenceMessage(studentName: string, className: string, date: string): string {
  return `AbsentAlert: ${studentName} (${className}) was marked absent on ${date}. Please contact the school if this is unexpected.`;
}

/**
 * Idempotently queues absence notifications for a set of absent attendance records.
 * - Loads the student's primary guardian and class name.
 * - Enforces the unique constraint @@unique([attendanceId, guardianPhone, type]) to prevent duplicates.
 * - Returns the list of notification IDs ready for dispatch.
 */
export async function queueAbsenceNotifications(
  absentRecords: Array<{ id: string; studentId: string }>,
  date: string
): Promise<string[]> {
  const notificationIds: string[] = [];

  for (const rec of absentRecords) {
    const student = await db.orm.public.Student.where({ id: rec.studentId }).first();
    if (!student) continue;

    const [cls, guardians] = await Promise.all([
      db.orm.public.Class.where({ id: student.classId }).first(),
      db.orm.public.Guardian.where({ studentId: student.id, isPrimary: true }).all(),
    ]);

    const guardian = guardians[0];
    if (!guardian || !guardian.phone) continue;

    // Check if notification already exists for this attendance record and guardian phone
    const existing = await db.orm.public.Notification.where({
      attendanceId: rec.id,
      guardianPhone: guardian.phone,
      type: "ABSENCE",
    }).first();

    if (existing) {
      // If already accepted or delivered, do not re-queue
      if (existing.status === "ACCEPTED" || existing.status === "DELIVERED") {
        continue;
      }
      // If failed or pending, include its ID for dispatch/retry
      notificationIds.push(existing.id);
      continue;
    }

    try {
      const n = await db.orm.public.Notification.create({
        attendanceId: rec.id,
        guardianPhone: guardian.phone,
        type: "ABSENCE",
        body: absenceMessage(student.fullName, cls?.name || "Class", date),
        status: "PENDING",
      });
      notificationIds.push(n.id);
    } catch {
      // Concurrency or unique constraint violation: skip silently
      continue;
    }
  }

  return notificationIds;
}

/**
 * Claims and dispatches a single notification.
 * - Claims the row by transitioning status: PENDING / FAILED -> SENDING.
 * - Calls SMSHub API to transmit SMS.
 * - Records an immutable NotificationAttempt row with rawResponse, httpStatus, error.
 * - Updates Notification status to ACCEPTED or FAILED. Never sets DELIVERED at send time.
 */
export async function sendOne(notificationId: string): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
  providerRef?: string;
}> {
  // Claim check: only PENDING or FAILED notifications can be dispatched
  const notif = await db.orm.public.Notification.where({ id: notificationId }).first();
  if (!notif) {
    return { ok: false, skipped: true, error: "Notification not found" };
  }

  if (notif.status !== "PENDING" && notif.status !== "FAILED") {
    return { ok: false, skipped: true, error: `Notification is already ${notif.status}` };
  }

  // Atomically claim
  await db.orm.public.Notification.where({ id: notificationId }).update({
    status: "SENDING",
  });

  // Call SMS provider
  const result: SendSmsResult = await sendSms(notif.guardianPhone, notif.body);

  // Record attempt
  await db.orm.public.NotificationAttempt.create({
    notificationId,
    httpStatus: result.httpStatus ?? null,
    success: result.accepted,
    rawResponse: result.raw as any,
    error: result.error ?? null,
  });

  // Update notification record
  const updates: Record<string, unknown> = {
    status: result.accepted ? "ACCEPTED" : "FAILED",
  };
  if (result.providerRef) {
    updates.providerRef = result.providerRef;
  }

  await db.orm.public.Notification.where({ id: notificationId }).update(updates);

  return {
    ok: result.accepted,
    error: result.error,
    providerRef: result.providerRef,
  };
}

/**
 * Dispatches an array of notification IDs sequentially.
 * Returns counts of sent, failed, and skipped.
 */
export async function dispatchNotifications(ids: string[]): Promise<NotificationDispatchResult> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const id of ids) {
    const res = await sendOne(id);
    if (res.ok) {
      sent++;
    } else if (res.skipped) {
      skipped++;
    } else {
      failed++;
    }
  }

  return {
    total: ids.length,
    sent,
    failed,
    skipped,
  };
}

/**
 * Retries a specific notification.
 */
export async function retryNotification(notificationId: string) {
  return sendOne(notificationId);
}
