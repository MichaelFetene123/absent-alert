"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import { sendSms } from "@/lib/sms/smshub";
import { revalidatePath } from "next/cache";

export type DispatchResult = {
  success: boolean;
  sentCount?: number;
  failedCount?: number;
  error?: string;
};

export async function dispatchPendingNotificationsAction(): Promise<DispatchResult> {
  try {
    await requireUser();

    // Fetch pending notifications
    const pending = await db.orm.public.Notification.where({
      status: "PENDING",
    }).all();

    let sentCount = 0;
    let failedCount = 0;

    for (const notif of pending) {
      // Mark as SENDING
      await db.orm.public.Notification.where({ id: notif.id }).update({
        status: "SENDING",
      });

      const res = await sendSms(notif.guardianPhone, notif.body);

      // Record attempt
      await db.orm.public.NotificationAttempt.create({
        notificationId: notif.id,
        success: res.accepted,
        httpStatus: res.httpStatus ?? null,
        rawResponse: res.raw as any,
        error: res.error ?? null,
      });

      if (res.accepted) {
        await db.orm.public.Notification.where({ id: notif.id }).update({
          status: "ACCEPTED",
          providerRef: res.providerRef ?? null,
        });
        sentCount++;
      } else {
        await db.orm.public.Notification.where({ id: notif.id }).update({
          status: "FAILED",
        });
        failedCount++;
      }
    }

    revalidatePath("/notifications");
    return { success: true, sentCount, failedCount };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to dispatch notifications" };
  }
}
