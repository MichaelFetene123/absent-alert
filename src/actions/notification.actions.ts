"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/components/cacheTag";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  dispatchNotifications,
  getNotificationHistory,
  sendOne,
  type NotificationDispatchResult,
  type NotificationHistoryResult,
} from "@/lib/services/notification.service";

const listNotificationsSchema = z.object({
  status: z.enum(["PENDING", "SENDING", "ACCEPTED", "DELIVERED", "FAILED"]).optional(),
  classId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListNotificationsInput = z.input<typeof listNotificationsSchema>;

/**
 * Lists enriched notifications matching filters.
 * - Authenticated users only
 * - Admins see all classes; teachers see only assigned classes
 * - Guardian phone masked for non-admins
 */
export async function listNotifications(
  input?: unknown
): Promise<NotificationHistoryResult> {
  const user = await requireUser();
  const parsed = listNotificationsSchema.parse(input || {});

  return getNotificationHistory({
    userId: user.id,
    role: user.role,
    status: parsed.status,
    classId: parsed.classId,
    search: parsed.search,
    page: parsed.page,
    pageSize: parsed.pageSize,
  });
}

/**
 * Retries a specific failed notification (Admin only).
 * - Enforces requireAdmin()
 * - Atomically transitions from FAILED -> SENDING -> ACCEPTED / FAILED
 * - Prevents double-send if already ACCEPTED or SENDING
 */
export async function retryNotification(notificationId: string): Promise<{
  ok: boolean;
  error?: string;
  providerRef?: string;
}> {
  await requireAdmin();
  const id = z.string().min(1, "Notification ID is required").parse(notificationId);

  const res = await sendOne(id);
  updateTag(CACHE_TAGS.NOTIFICATIONS);
  updateTag(CACHE_TAGS.NOTIFICATION(id));
  updateTag(CACHE_TAGS.DASHBOARD);

  return {
    ok: res.ok,
    error: res.error,
    providerRef: res.providerRef,
  };
}

// Alias for backwards-compatibility
export const retryNotificationAction = retryNotification;

/**
 * Batch retries all currently failed notifications (Admin only).
 */
export async function batchRetryFailedNotificationsAction(): Promise<{
  ok: boolean;
  total: number;
  sent: number;
  failed: number;
  error?: string;
}> {
  try {
    await requireAdmin();

    const failedNotifs = await db.orm.public.Notification.where({
      status: "FAILED",
    }).all();

    if (failedNotifs.length === 0) {
      return { ok: true, total: 0, sent: 0, failed: 0 };
    }

    const ids = failedNotifs.map((n) => n.id);
    const result: NotificationDispatchResult = await dispatchNotifications(ids);

    updateTag(CACHE_TAGS.NOTIFICATIONS);
    updateTag(CACHE_TAGS.DASHBOARD);

    return {
      ok: result.failed === 0,
      total: result.total,
      sent: result.sent,
      failed: result.failed,
    };
  } catch (err: any) {
    return {
      ok: false,
      total: 0,
      sent: 0,
      failed: 0,
      error: err.message || "Failed to batch retry notifications",
    };
  }
}

/**
 * Dispatches all pending notifications (Staff / User).
 */
export async function dispatchPendingNotificationsAction(): Promise<{
  success: boolean;
  sentCount?: number;
  failedCount?: number;
  total?: number;
  error?: string;
}> {
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

    updateTag(CACHE_TAGS.NOTIFICATIONS);
    updateTag(CACHE_TAGS.DASHBOARD);

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
