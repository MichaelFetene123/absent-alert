import "server-only";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms/smshub";

export type QueueNotificationInput = {
  attendanceId: string;
  guardianPhone: string;
  studentName: string;
  className: string;
  date: string;
};

/**
 * Notification service for dispatching SMS notifications to guardians.
 */
export async function queueAbsenceNotification(input: QueueNotificationInput) {
  const body = `AbsentAlert: ${input.studentName} was marked ABSENT from ${input.className} on ${input.date}. Please contact the school if you have questions.`;
  
  return db.orm.public.Notification.create({
    attendanceId: input.attendanceId,
    guardianPhone: input.guardianPhone,
    type: "ABSENCE",
    body,
    status: "PENDING",
  });
}
