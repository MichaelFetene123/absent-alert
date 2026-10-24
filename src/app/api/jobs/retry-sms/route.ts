import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchNotifications } from "@/lib/services/notification.service";

/**
 * Step 10.3 - Automated SMS Retry Job
 * 
 * Periodically called via cron (e.g., every 15 minutes).
 * Picks FAILED notifications with fewer than 3 attempts and dispatches them.
 * 
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  return handleRetryJob(req);
}

export async function POST(req: NextRequest) {
  return handleRetryJob(req);
}

async function handleRetryJob(req: NextRequest) {
  // Enforce CRON_SECRET if configured in environment
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-cron-secret");
    const bearer = authHeader?.replace(/^Bearer\s+/i, "");

    if (bearer !== expectedSecret && customHeader !== expectedSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Invalid cron secret" },
        { status: 401 }
      );
    }
  }

  try {
    // 1. Fetch all FAILED notifications
    const failedNotifs = await db.orm.public.Notification.where({
      status: "FAILED",
    }).all();

    if (failedNotifs.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No failed notifications found",
        retried: 0,
      });
    }

    // 2. Filter for notifications with fewer than 3 attempts
    const allAttempts = await db.orm.public.NotificationAttempt.all();
    const attemptCountMap = new Map<string, number>();
    for (const att of allAttempts) {
      attemptCountMap.set(att.notificationId, (attemptCountMap.get(att.notificationId) || 0) + 1);
    }

    const eligibleIds = failedNotifs
      .filter((n) => (attemptCountMap.get(n.id) || 0) < 3)
      .map((n) => n.id);

    if (eligibleIds.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No eligible failed notifications with < 3 attempts",
        failedTotal: failedNotifs.length,
        retried: 0,
      });
    }

    // 3. Dispatch eligible failed notifications (sendOne atomically claims FAILED rows)
    const result = await dispatchNotifications(eligibleIds);

    return NextResponse.json({
      ok: true,
      failedTotal: failedNotifs.length,
      eligibleTotal: eligibleIds.length,
      retried: result.total,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to process retry job" },
      { status: 500 }
    );
  }
}
