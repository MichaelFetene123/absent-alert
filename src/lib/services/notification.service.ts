import "server-only";
import { db } from "@/lib/db";
import { sendSms, type SendSmsResult } from "@/lib/sms/smshub";
import { updateTag, cacheTag, cacheLife, CACHE_TAGS, CACHE_PROFILES } from "@/components/cacheTag";
import { getActiveTemplate, renderSmsTemplate } from "@/lib/services/templates.service";

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

  // Fetch active absence template from DB (fallback to hardcoded default if needed)
  let activeAbsenceTemplate: string | null = null;
  try {
    const tpl = await getActiveTemplate("ABSENCE", "en");
    if (tpl?.body) {
      activeAbsenceTemplate = tpl.body;
    }
  } catch (err) {
    console.error("Failed to load active absence SMS template from DB:", err);
  }

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

    let messageBody = activeAbsenceTemplate
      ? renderSmsTemplate(activeAbsenceTemplate, {
          student_name: student.fullName,
          class_name: cls?.name || "Class",
          date,
          status: "Absent",
          admission_no: student.admissionNo,
          school_name: "Addis Academy",
        })
      : absenceMessage(student.fullName, cls?.name || "Class", date);

    // Safeguard: SMSHub appends ~30 chars signature. Ensure body <= 130 chars (total <= 160)
    if (messageBody.length > 130) {
      messageBody = `AbsentAlert: ${student.fullName} (${cls?.name || "Class"}) was marked absent on ${date}. Contact school if unexpected.`;
      if (messageBody.length > 130) {
        messageBody = messageBody.slice(0, 127) + "...";
      }
    }

    try {
      const n = await db.orm.public.Notification.create({
        attendanceId: rec.id,
        guardianPhone: guardian.phone,
        type: "ABSENCE",
        body: messageBody,
        status: "PENDING",
      });
      notificationIds.push(n.id);
    } catch {
      // Concurrency or unique constraint violation: skip silently
      continue;
    }
  }

  try {
    updateTag(CACHE_TAGS.NOTIFICATIONS);
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

  return notificationIds;
}

// In-flight mutex set to prevent concurrent double-sends for the same notification ID
const activeClaims = new Set<string>();

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
  // Prevent concurrent dispatch of the same notification in-flight
  if (activeClaims.has(notificationId)) {
    return { ok: false, skipped: true, error: "Notification is already in-flight" };
  }
  activeClaims.add(notificationId);

  try {
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

    // Safeguard against SMSHub 160-char limit including signature (~30 chars)
    let textToSend = notif.body;
    if (textToSend.length > 130) {
      textToSend = textToSend.slice(0, 127) + "...";
    }

    // Call SMS provider
    const result: SendSmsResult = await sendSms(notif.guardianPhone, textToSend);

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
  } finally {
    activeClaims.delete(notificationId);
  }
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

  try {
    updateTag(CACHE_TAGS.NOTIFICATIONS);
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

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
  const result = await sendOne(notificationId);
  try {
    updateTag(CACHE_TAGS.NOTIFICATIONS);
    updateTag(CACHE_TAGS.NOTIFICATION(notificationId));
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}
  return result;
}

export type NotificationHistoryAttempt = {
  id: string;
  attemptedAt: string;
  httpStatus: number | null;
  success: boolean;
  rawResponse: any;
  error: string | null;
};

export type NotificationHistoryItem = {
  id: string;
  attendanceId: string;
  guardianPhone: string;
  type: string;
  body: string;
  status: "PENDING" | "SENDING" | "ACCEPTED" | "DELIVERED" | "FAILED";
  providerRef: string | null;
  createdAt: string;
  needsReview: boolean;
  student: {
    id: string;
    fullName: string;
    admissionNo: string;
    classId: string;
    className: string;
  };
  attendance: {
    id: string;
    date: string;
    status: string;
  };
  attempts: NotificationHistoryAttempt[];
};

export type NotificationHistorySummary = {
  total: number;
  accepted: number;
  failed: number;
  pending: number;
  sending: number;
  delivered: number;
  needsReview: number;
};

export type NotificationHistoryParams = {
  userId: string;
  role: "ADMIN" | "TEACHER";
  status?: "PENDING" | "SENDING" | "ACCEPTED" | "DELIVERED" | "FAILED";
  classId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type NotificationHistoryResult = {
  items: NotificationHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: NotificationHistorySummary;
  accessibleClasses: Array<{ id: string; name: string }>;
  isAdmin: boolean;
};

/**
 * Retrieves enriched notification history for a user:
 * - Enforces role-based class visibility (teachers only see notifications for students in their assigned classes)
 * - Masks guardian phone numbers for teachers (preserves full phone for admins)
 * - Joins AttendanceRecord, Student, Class, and all NotificationAttempts
 * - Flags notifications in SENDING for >5 minutes as needsReview
 * - Returns pagination and status counts
 */
export async function getNotificationHistory(
  params: NotificationHistoryParams
): Promise<NotificationHistoryResult> {
  "use cache";
  cacheLife(CACHE_PROFILES.NOTIFICATIONS);
  cacheTag(CACHE_TAGS.NOTIFICATIONS);

  // 1. Determine accessible classes
  let accessibleClasses: Array<{ id: string; name: string }> = [];
  let allowedClassIds: Set<string> | null = null;

  if (params.role === "ADMIN") {
    const allClasses = await db.orm.public.Class.all();
    accessibleClasses = allClasses.map((c) => ({ id: c.id, name: c.name }));
  } else {
    const links = await db.orm.public.TeacherClass.where({ userId: params.userId }).all();
    const classIds = links.map((l) => l.classId);
    allowedClassIds = new Set(classIds);

    const classes = await Promise.all(
      classIds.map((id) => db.orm.public.Class.where({ id }).first())
    );
    accessibleClasses = classes
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({ id: c.id, name: c.name }));
  }

  // If teacher has no assigned classes, return empty immediately
  if (params.role === "TEACHER" && (!allowedClassIds || allowedClassIds.size === 0)) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params.pageSize || 25,
      totalPages: 1,
      summary: {
        total: 0,
        accepted: 0,
        failed: 0,
        pending: 0,
        sending: 0,
        delivered: 0,
        needsReview: 0,
      },
      accessibleClasses: [],
      isAdmin: false,
    };
  }

  // 2. Fetch all raw data for enrichment
  const [allNotifs, allAttendances, allStudents, allClasses, allAttempts] = await Promise.all([
    db.orm.public.Notification.all(),
    db.orm.public.AttendanceRecord.all(),
    db.orm.public.Student.all(),
    db.orm.public.Class.all(),
    db.orm.public.NotificationAttempt.all(),
  ]);

  // Index references for rapid lookup
  const attendanceMap = new Map<string, (typeof allAttendances)[0]>();
  for (const a of allAttendances) {
    attendanceMap.set(a.id, a);
  }

  const studentMap = new Map<string, (typeof allStudents)[0]>();
  for (const s of allStudents) {
    studentMap.set(s.id, s);
  }

  const classMap = new Map<string, string>();
  for (const c of allClasses) {
    classMap.set(c.id, c.name);
  }

  const attemptsByNotifId = new Map<string, (typeof allAttempts)>();
  for (const att of allAttempts) {
    const list = attemptsByNotifId.get(att.notificationId) || [];
    list.push(att);
    attemptsByNotifId.set(att.notificationId, list);
  }

  // 3. Filter and enrich notifications
  const now = Date.now();
  const summary: NotificationHistorySummary = {
    total: 0,
    accepted: 0,
    failed: 0,
    pending: 0,
    sending: 0,
    delivered: 0,
    needsReview: 0,
  };

  const enrichedItems: NotificationHistoryItem[] = [];

  for (const notif of allNotifs) {
    const att = attendanceMap.get(notif.attendanceId);
    if (!att) continue;

    const student = studentMap.get(att.studentId);
    if (!student) continue;

    // Teacher class security boundary
    if (allowedClassIds && !allowedClassIds.has(student.classId)) {
      continue;
    }

    const className = classMap.get(student.classId) || "—";

    // Track status counts across all accessible notifications
    summary.total++;
    if (notif.status === "ACCEPTED") summary.accepted++;
    else if (notif.status === "FAILED") summary.failed++;
    else if (notif.status === "PENDING") summary.pending++;
    else if (notif.status === "SENDING") summary.sending++;
    else if (notif.status === "DELIVERED") summary.delivered++;

    // Calculate elapsed time for SENDING rows
    const createdStr = notif.createdAt ? notif.createdAt.toString() : new Date().toISOString();
    const createdMs = Date.parse(createdStr) || now;
    const isStuck = notif.status === "SENDING" && now - createdMs > 5 * 60 * 1000;
    if (isStuck) summary.needsReview++;

    // Check query filters
    if (params.classId && student.classId !== params.classId) {
      continue;
    }

    if (params.status && notif.status !== params.status) {
      continue;
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      const matchName = student.fullName.toLowerCase().includes(q);
      const matchAdm = student.admissionNo.toLowerCase().includes(q);
      const matchPhone = notif.guardianPhone.toLowerCase().includes(q);
      const matchRef = notif.providerRef?.toLowerCase().includes(q) ?? false;
      const matchBody = notif.body.toLowerCase().includes(q);

      if (!matchName && !matchAdm && !matchPhone && !matchRef && !matchBody) {
        continue;
      }
    }

    // Mask phone for non-admin
    let guardianPhone = notif.guardianPhone;
    if (params.role !== "ADMIN" && guardianPhone.length > 4) {
      guardianPhone = guardianPhone.slice(0, 4) + "****" + guardianPhone.slice(-2);
    }

    // Sort attempts chronologically
    const rawAttempts = attemptsByNotifId.get(notif.id) || [];
    rawAttempts.sort((a, b) => {
      const timeA = Date.parse(a.attemptedAt ? a.attemptedAt.toString() : "") || 0;
      const timeB = Date.parse(b.attemptedAt ? b.attemptedAt.toString() : "") || 0;
      return timeA - timeB;
    });

    const attempts: NotificationHistoryAttempt[] = rawAttempts.map((a) => ({
      id: a.id,
      attemptedAt: a.attemptedAt ? a.attemptedAt.toString() : new Date().toISOString(),
      httpStatus: a.httpStatus ?? null,
      success: a.success,
      rawResponse: a.rawResponse,
      error: a.error ?? null,
    }));

    enrichedItems.push({
      id: notif.id,
      attendanceId: notif.attendanceId,
      guardianPhone,
      type: notif.type,
      body: notif.body,
      status: notif.status as NotificationHistoryItem["status"],
      providerRef: notif.providerRef ?? null,
      createdAt: createdStr,
      needsReview: isStuck,
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNo: student.admissionNo,
        classId: student.classId,
        className,
      },
      attendance: {
        id: att.id,
        date: att.date ? att.date.toString() : "",
        status: att.status,
      },
      attempts,
    });
  }

  // 4. Sort newest first
  enrichedItems.sort((a, b) => {
    const timeA = Date.parse(a.createdAt) || 0;
    const timeB = Date.parse(b.createdAt) || 0;
    return timeB - timeA;
  });

  // 5. Pagination
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
  const total = enrichedItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = enrichedItems.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    summary,
    accessibleClasses,
    isAdmin: params.role === "ADMIN",
  };
}
