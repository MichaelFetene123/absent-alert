"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import {
  dispatchNotifications,
  sendOne,
  type NotificationDispatchResult,
} from "@/lib/services/notification.service";
import { revalidatePath } from "next/cache";

export type DispatchActionResult = {
  success: boolean;
  sentCount?: number;
  failedCount?: number;
  total?: number;
  error?: string;
};

/**
 * Dispatches all pending notifications.
 */
export async function dispatchPendingNotificationsAction(): Promise<DispatchActionResult> {
  try {
    await requireUser();

    const pending = await db.orm.public.Notification.where({
      status: "PENDING",
    }).all();

    if (pending.length === 0) {
      return { success: true, sentCount: 0, failedCount: 0, total: 0 };
    }

    const ids = pending.map((n) => n.id);
    const result: NotificationDispatchResult = await dispatchNotifications(ids);

    revalidatePath("/notifications");
    revalidatePath("/dashboard");

    return {
      success: true,
      sentCount: result.sent,
      failedCount: result.failed,
      total: result.total,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to dispatch notifications",
    };
  }
}

/**
 * Retries sending a failed or pending notification.
 */
export async function retryNotificationAction(notificationId: string): Promise<{
  success: boolean;
  error?: string;
  providerRef?: string;
}> {
  try {
    await requireUser();

    const res = await sendOne(notificationId);
    revalidatePath("/notifications");
    revalidatePath("/dashboard");

    return {
      success: res.ok,
      error: res.error,
      providerRef: res.providerRef,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to retry notification",
    };
  }
}
