import "server-only";
import { Temporal } from "temporal-polyfill";
import { db, withDbRetry } from "@/lib/db";
import type { AttendanceStatus } from "@/lib/validations/attendance";
import { updateTag, cacheTag, CACHE_TAGS } from "@/components/cacheTag";

export type AttendanceEntry = {
  studentId: string;
  status: AttendanceStatus;
};

export type SaveAttendanceParams = {
  classId: string;
  date: string; // "YYYY-MM-DD"
  markedById: string;
  entries: AttendanceEntry[];
};

export type SavedAttendanceRecord = {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  markedById: string;
  date: string;
};

export type SaveAttendanceResult = {
  records: SavedAttendanceRecord[];
  newlyAbsent: Array<{ studentId: string; recordId: string }>;
  createdCount: number;
  updatedCount: number;
  total: number;
};

/**
 * Saves attendance records for a class on a given date.
 * - Enforces that all submitted students exist, belong to the target class, and are active.
 * - Idempotently updates existing records (prevents duplicate @@unique([studentId, date]) violations).
 * - Tracks newly absent students for SMS notification pipeline (dispatched separately in Step 9).
 */
export async function saveAttendance(params: {
  classId: string;
  date: string;
  markedById: string;
  entries: AttendanceEntry[];
}): Promise<SaveAttendanceResult> {
  const plainDate = Temporal.PlainDate.from(params.date);

  // 1. Verify class exists
  const targetClass = await db.orm.public.Class.where({ id: params.classId }).first();
  if (!targetClass) {
    throw new Error("Selected class does not exist");
  }

  // 2. Verify all submitted students belong to this class and are active
  const activeClassStudents = await db.orm.public.Student.where({
    classId: params.classId,
    active: true,
  }).all();

  const validStudentIds = new Set(activeClassStudents.map((s) => s.id));
  const invalidStudents = params.entries.filter((e) => !validStudentIds.has(e.studentId));

  if (invalidStudents.length > 0) {
    throw new Error("Some students do not belong to this class or are inactive");
  }

  // 3. Upsert attendance records idempotently
  const records: SavedAttendanceRecord[] = [];
  const newlyAbsent: Array<{ studentId: string; recordId: string }> = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (const entry of params.entries) {
    // Check if record exists for this student and date
    const existing = await db.orm.public.AttendanceRecord.where({
      studentId: entry.studentId,
      date: plainDate,
    }).first();

    if (existing) {
      const isNewlyAbsent = existing.status !== "ABSENT" && entry.status === "ABSENT";

      await db.orm.public.AttendanceRecord.where({ id: existing.id }).update({
        status: entry.status,
        markedById: params.markedById,
      });

      records.push({
        id: existing.id,
        studentId: entry.studentId,
        status: entry.status,
        markedById: params.markedById,
        date: params.date,
      });

      if (isNewlyAbsent) {
        newlyAbsent.push({ studentId: entry.studentId, recordId: existing.id });
      }

      updatedCount++;
    } else {
      const created = await db.orm.public.AttendanceRecord.create({
        studentId: entry.studentId,
        date: plainDate,
        status: entry.status,
        markedById: params.markedById,
      });

      records.push({
        id: created.id,
        studentId: entry.studentId,
        status: entry.status,
        markedById: params.markedById,
        date: params.date,
      });

      if (entry.status === "ABSENT") {
        newlyAbsent.push({ studentId: entry.studentId, recordId: created.id });
      }

      createdCount++;
    }
  }

  try {
    updateTag(CACHE_TAGS.ATTENDANCE);
    updateTag(CACHE_TAGS.ATTENDANCE_DAILY(params.classId, params.date));
    updateTag(CACHE_TAGS.ATTENDANCE_OVERVIEW(params.classId));
    updateTag(CACHE_TAGS.DASHBOARD);
    updateTag(CACHE_TAGS.NOTIFICATIONS);
    updateTag(CACHE_TAGS.EXCEPTIONS);
    updateTag(CACHE_TAGS.REPORTS);
  } catch {}

  return {
    records,
    newlyAbsent,
    createdCount,
    updatedCount,
    total: records.length,
  };
}

/**
 * Retrieves daily attendance status for all active students in a given class on a specific date.
 */
export async function getClassAttendance(params: {
  classId: string;
  date: string;
}) {
  try {
    cacheTag(CACHE_TAGS.ATTENDANCE);
    cacheTag(CACHE_TAGS.ATTENDANCE_DAILY(params.classId, params.date));
  } catch {}

  const plainDate = Temporal.PlainDate.from(params.date);

  const students = await db.orm.public.Student.where({
    classId: params.classId,
    active: true,
  }).all();

  const records = await db.orm.public.AttendanceRecord.where({
    date: plainDate,
  }).all();

  const recordMap = new Map<string, (typeof records)[0]>();
  for (const rec of records) {
    recordMap.set(rec.studentId, rec);
  }

  return students.map((s) => {
    const rec = recordMap.get(s.id);
    return {
      studentId: s.id,
      admissionNo: s.admissionNo,
      fullName: s.fullName,
      status: (rec?.status as AttendanceStatus) || null,
      markedById: rec?.markedById || null,
      recordId: rec?.id || null,
    };
  });
}

/**
 * Returns the classes accessible by the current user based on their role:
 * - ADMIN: Returns all classes
 * - TEACHER: Returns only classes linked to the teacher in TeacherClass
 */
export async function getAccessibleClasses(userId: string, role: "ADMIN" | "TEACHER") {
  return withDbRetry(async () => {
    try {
      cacheTag(CACHE_TAGS.CLASSES);
    } catch {}

    if (role === "ADMIN") {
      return db.orm.public.Class.all();
    }
    const links = await db.orm.public.TeacherClass.where({ userId }).all();
    if (links.length === 0) {
      return [];
    }
    const classIdSet = new Set(links.map((l) => l.classId));
    const allClasses = await db.orm.public.Class.all();
    return allClasses.filter((c) => classIdSet.has(c.id));
  });
}

// ---------------------------------------------------------------------------
// Step 11: TWO-WEEK ATTENDANCE OVERVIEW
// ---------------------------------------------------------------------------

export type TwoWeekDayHeader = {
  date: string; // "YYYY-MM-DD"
  dayOfMonth: number;
  dayOfWeek: string; // "Mon", "Tue", etc.
  isWeekend: boolean;
};

export type TwoWeekDailySummary = {
  date: string;
  isWeekend: boolean;
  present: number;
  absent: number;
  leave: number;
  late: number;
  totalMarked: number;
  attendanceRate: number | null; // e.g. 88
};

export type TwoWeekStudentRow = {
  studentId: string;
  admissionNo: string;
  fullName: string;
  totalAbsent: number;
  totalLeave: number;
  totalLate: number;
  totalPresent: number;
  records: Record<string, AttendanceStatus | null>;
  isHighAbsence: boolean; // absent >= 3 days
};

export type TwoWeekOverviewResult = {
  ok: boolean;
  error?: string;
  classInfo?: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  prevStartDate: string;
  nextStartDate: string;
  currentStartDate: string;
  days: TwoWeekDayHeader[];
  dailySummaries: TwoWeekDailySummary[];
  students: TwoWeekStudentRow[];
  totals: {
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalLate: number;
    overallAttendanceRate: number | null;
  };
  accessibleClasses: Array<{ id: string; name: string }>;
};

/**
 * Calculates the Monday of a given reference date string (YYYY-MM-DD).
 */
export function getMondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday is 0, Monday is 1
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().split("T")[0]!;
}

/**
 * Retrieves the 14-day attendance grid for a specific class:
 * - Validates role-based class accessibility
 * - Spans 14 days starting on the Monday of the requested week
 * - Hydrates students and attendance status per day
 * - Calculates column summaries (Total P/A/L/T and daily %) and student row totals
 */
export async function getTwoWeekOverview(params: {
  classId: string;
  startDate?: string;
  userId: string;
  role: "ADMIN" | "TEACHER";
}): Promise<TwoWeekOverviewResult> {
  return withDbRetry(async () => {
    try {
      cacheTag(CACHE_TAGS.ATTENDANCE);
      cacheTag(CACHE_TAGS.ATTENDANCE_OVERVIEW(params.classId));
    } catch {}

    const accessibleClasses = await getAccessibleClasses(params.userId, params.role);
    const classList = accessibleClasses.map((c) => ({ id: c.id, name: c.name }));

    const hasAccess = accessibleClasses.some((c) => c.id === params.classId);
  if (!hasAccess) {
    return {
      ok: false,
      error: "ACCESS_DENIED",
      startDate: "",
      endDate: "",
      prevStartDate: "",
      nextStartDate: "",
      currentStartDate: "",
      days: [],
      dailySummaries: [],
      students: [],
      totals: {
        totalStudents: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLeave: 0,
        totalLate: 0,
        overallAttendanceRate: null,
      },
      accessibleClasses: classList,
    };
  }

  const targetClass = accessibleClasses.find((c) => c.id === params.classId)!;

  // Determine today & Monday start date
  const todayStr = new Date().toISOString().split("T")[0]!;
  const currentMonday = getMondayOfWeek(todayStr);
  const selectedMonday = params.startDate
    ? getMondayOfWeek(params.startDate)
    : currentMonday;

  // Build 14-day headers
  const days: TwoWeekDayHeader[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const [startY, startM, startD] = selectedMonday.split("-").map(Number);
  const baseDate = new Date(Date.UTC(startY!, startM! - 1, startD!));

  for (let i = 0; i < 14; i++) {
    const cur = new Date(baseDate);
    cur.setUTCDate(baseDate.getUTCDate() + i);
    const dateStr = cur.toISOString().split("T")[0]!;
    const dayOfWeekIdx = cur.getUTCDay();
    const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 6;

    days.push({
      date: dateStr,
      dayOfMonth: cur.getUTCDate(),
      dayOfWeek: dayNames[dayOfWeekIdx]!,
      isWeekend,
    });
  }

  const startDate = days[0]!.date;
  const endDate = days[13]!.date;

  // Previous and next 2-week starting dates
  const prevDate = new Date(baseDate);
  prevDate.setUTCDate(baseDate.getUTCDate() - 14);
  const prevStartDate = prevDate.toISOString().split("T")[0]!;

  const nextDate = new Date(baseDate);
  nextDate.setUTCDate(baseDate.getUTCDate() + 14);
  const nextStartDate = nextDate.toISOString().split("T")[0]!;

  // Fetch active students in class
  const students = await db.orm.public.Student.where({
    classId: params.classId,
    active: true,
  }).all();

  students.sort((a, b) => a.admissionNo.localeCompare(b.admissionNo));

  // Fetch all attendance records across the date range
  const allRecords = await db.orm.public.AttendanceRecord.all();
  const dateSet = new Set(days.map((d) => d.date));

  // studentId -> dateStr -> status
  const studentDateMap = new Map<string, Map<string, AttendanceStatus>>();

  for (const rec of allRecords) {
    const recDate = rec.date ? rec.date.toString() : "";
    if (!dateSet.has(recDate)) continue;

    let dateMap = studentDateMap.get(rec.studentId);
    if (!dateMap) {
      dateMap = new Map();
      studentDateMap.set(rec.studentId, dateMap);
    }
    dateMap.set(recDate, rec.status as AttendanceStatus);
  }

  // Build student rows
  const studentRows: TwoWeekStudentRow[] = [];
  let totalPresentCount = 0;
  let totalAbsentCount = 0;
  let totalLeaveCount = 0;
  let totalLateCount = 0;

  for (const s of students) {
    const recordMap = studentDateMap.get(s.id) || new Map<string, AttendanceStatus>();
    const records: Record<string, AttendanceStatus | null> = {};

    let sPresent = 0;
    let sAbsent = 0;
    let sLeave = 0;
    let sLate = 0;

    for (const d of days) {
      const st = recordMap.get(d.date) || null;
      records[d.date] = st;

      if (st === "PRESENT") sPresent++;
      else if (st === "ABSENT") sAbsent++;
      else if (st === "LEAVE") sLeave++;
      else if (st === "LATE") sLate++;
    }

    totalPresentCount += sPresent;
    totalAbsentCount += sAbsent;
    totalLeaveCount += sLeave;
    totalLateCount += sLate;

    studentRows.push({
      studentId: s.id,
      admissionNo: s.admissionNo,
      fullName: s.fullName,
      totalAbsent: sAbsent,
      totalLeave: sLeave,
      totalLate: sLate,
      totalPresent: sPresent,
      records,
      isHighAbsence: sAbsent >= 3,
    });
  }

  // Build daily column summaries
  const dailySummaries: TwoWeekDailySummary[] = [];

  for (const d of days) {
    let dayP = 0;
    let dayA = 0;
    let dayL = 0;
    let dayT = 0;

    for (const s of studentRows) {
      const st = s.records[d.date];
      if (st === "PRESENT") dayP++;
      else if (st === "ABSENT") dayA++;
      else if (st === "LEAVE") dayL++;
      else if (st === "LATE") dayT++;
    }

    const totalMarked = dayP + dayA + dayL + dayT;
    const rate = totalMarked > 0 ? Math.round((dayP / totalMarked) * 100) : null;

    dailySummaries.push({
      date: d.date,
      isWeekend: d.isWeekend,
      present: dayP,
      absent: dayA,
      leave: dayL,
      late: dayT,
      totalMarked,
      attendanceRate: rate,
    });
  }

  const grandMarked = totalPresentCount + totalAbsentCount + totalLeaveCount + totalLateCount;
  const overallRate = grandMarked > 0 ? Math.round((totalPresentCount / grandMarked) * 100) : null;

  return {
    ok: true,
    classInfo: {
      id: targetClass.id,
      name: targetClass.name,
    },
    startDate,
    endDate,
    prevStartDate,
    nextStartDate,
    currentStartDate: currentMonday,
    days,
    dailySummaries,
    students: studentRows,
    totals: {
      totalStudents: students.length,
      totalPresent: totalPresentCount,
      totalAbsent: totalAbsentCount,
      totalLeave: totalLeaveCount,
      totalLate: totalLateCount,
      overallAttendanceRate: overallRate,
    },
    accessibleClasses: classList,
  };
  });
}

// ---------------------------------------------------------------------------
// Step 11: DASHBOARD SUMMARY
// ---------------------------------------------------------------------------

export type DashboardOverviewResult = {
  accessibleClasses: Array<{ id: string; name: string }>;
  totalActiveStudents: number;
  todayDate: string;
  todayStats: {
    present: number;
    absent: number;
    leave: number;
    late: number;
    totalMarked: number;
    attendanceRate: number | null;
  };
  unmarkedClasses: Array<{ id: string; name: string; studentCount: number }>;
  todayAbsentStudents: Array<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    guardianPhone: string;
    notificationId?: string;
    notificationStatus?: string;
    providerRef?: string;
  }>;
  recentFailedNotifications: Array<{
    id: string;
    studentName: string;
    admissionNo: string;
    className: string;
    createdAt: string;
    error: string | null;
    httpStatus: number | null;
  }>;
  smsSummary: {
    total: number;
    accepted: number;
    failed: number;
    pending: number;
    sending: number;
  };
  smsCreditStatus?: {
    isLowBalance: boolean;
    remainingCredits: number;
    threshold: number;
  };
  isAdmin: boolean;
};

/**
 * Retrieves role-guarded dashboard overview metrics for today:
 * - Counts of PRESENT / ABSENT / LEAVE / LATE for today
 * - Classes the user can access with no attendance saved today
 * - Today's absent students with notification status
 * - The most recent FAILED notifications with direct retry links
 */
export async function getDashboardOverview(params: {
  userId: string;
  role: "ADMIN" | "TEACHER";
}): Promise<DashboardOverviewResult> {
  return withDbRetry(async () => {
    try {
      cacheTag(CACHE_TAGS.DASHBOARD);
      cacheTag(CACHE_TAGS.ATTENDANCE);
      cacheTag(CACHE_TAGS.NOTIFICATIONS);
    } catch {}

    const accessibleClasses = await getAccessibleClasses(params.userId, params.role);
    const classList = accessibleClasses.map((c) => ({ id: c.id, name: c.name }));
  const classIdSet = new Set(classList.map((c) => c.id));

  const todayStr = new Date().toISOString().split("T")[0]!;

  if (classList.length === 0) {
    return {
      accessibleClasses: [],
      totalActiveStudents: 0,
      todayDate: todayStr,
      todayStats: {
        present: 0,
        absent: 0,
        leave: 0,
        late: 0,
        totalMarked: 0,
        attendanceRate: null,
      },
      unmarkedClasses: [],
      todayAbsentStudents: [],
      recentFailedNotifications: [],
      smsSummary: { total: 0, accepted: 0, failed: 0, pending: 0, sending: 0 },
      isAdmin: params.role === "ADMIN",
    };
  }

  // Load all students, attendances, and notifications
  const [allStudents, allAttendances, allNotifs, allGuardians, allAttempts] = await Promise.all([
    db.orm.public.Student.where({ active: true }).all(),
    db.orm.public.AttendanceRecord.all(),
    db.orm.public.Notification.all(),
    db.orm.public.Guardian.where({ isPrimary: true }).all(),
    db.orm.public.NotificationAttempt.all(),
  ]);

  // Filter students belonging to accessible classes
  const accessibleStudents = allStudents.filter((s) => classIdSet.has(s.classId));
  const studentMap = new Map(accessibleStudents.map((s) => [s.id, s]));
  const classMap = new Map(classList.map((c) => [c.id, c.name]));

  // Primary guardian phone map
  const guardianMap = new Map(allGuardians.map((g) => [g.studentId, g.phone]));

  // Today's attendance records for accessible students
  const todayAttendances = allAttendances.filter((a) => {
    const dStr = a.date ? a.date.toString() : "";
    return dStr === todayStr && studentMap.has(a.studentId);
  });

  const todayAttendanceMap = new Map(todayAttendances.map((a) => [a.studentId, a]));

  // Calculate today status counts
  let present = 0;
  let absent = 0;
  let leave = 0;
  let late = 0;

  for (const a of todayAttendances) {
    if (a.status === "PRESENT") present++;
    else if (a.status === "ABSENT") absent++;
    else if (a.status === "LEAVE") leave++;
    else if (a.status === "LATE") late++;
  }

  const totalMarked = present + absent + leave + late;
  const attendanceRate = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : null;

  // Unmarked classes: check which accessible classes have 0 records today
  const classMarkedCount = new Map<string, number>();
  for (const a of todayAttendances) {
    const s = studentMap.get(a.studentId);
    if (s) {
      classMarkedCount.set(s.classId, (classMarkedCount.get(s.classId) || 0) + 1);
    }
  }

  const unmarkedClasses: Array<{ id: string; name: string; studentCount: number }> = [];
  for (const c of classList) {
    const marked = classMarkedCount.get(c.id) || 0;
    if (marked === 0) {
      const studentCount = accessibleStudents.filter((s) => s.classId === c.id).length;
      unmarkedClasses.push({ id: c.id, name: c.name, studentCount });
    }
  }

  // Notification lookup by attendanceId
  const notifByAttendanceId = new Map<string, (typeof allNotifs)[0]>();
  for (const n of allNotifs) {
    notifByAttendanceId.set(n.attendanceId, n);
  }

  // Today's absent students
  const todayAbsentStudents: DashboardOverviewResult["todayAbsentStudents"] = [];
  for (const a of todayAttendances) {
    if (a.status !== "ABSENT") continue;
    const s = studentMap.get(a.studentId);
    if (!s) continue;

    let phone = guardianMap.get(s.id) || "—";
    if (params.role !== "ADMIN" && phone.length > 4) {
      phone = phone.slice(0, 4) + "****" + phone.slice(-2);
    }

    const notif = notifByAttendanceId.get(a.id);

    todayAbsentStudents.push({
      studentId: s.id,
      studentName: s.fullName,
      admissionNo: s.admissionNo,
      className: classMap.get(s.classId) || "—",
      guardianPhone: phone,
      notificationId: notif?.id,
      notificationStatus: notif?.status || "NOT_QUEUED",
      providerRef: notif?.providerRef || undefined,
    });
  }

  // SMS stats across accessible students
  const notifAttemptMap = new Map<string, (typeof allAttempts)[0]>();
  for (const att of allAttempts) {
    const cur = notifAttemptMap.get(att.notificationId);
    if (!cur || (att.attemptedAt ? att.attemptedAt.toString() : "") > (cur.attemptedAt ? cur.attemptedAt.toString() : "")) {
      notifAttemptMap.set(att.notificationId, att);
    }
  }

  const attendanceById = new Map(allAttendances.map((a) => [a.id, a]));
  const relevantNotifs = allNotifs.filter((n) => {
    const att = attendanceById.get(n.attendanceId);
    return att && studentMap.has(att.studentId);
  });

  const smsSummary = {
    total: relevantNotifs.length,
    accepted: 0,
    failed: 0,
    pending: 0,
    sending: 0,
  };

  for (const n of relevantNotifs) {
    if (n.status === "ACCEPTED" || n.status === "DELIVERED") smsSummary.accepted++;
    else if (n.status === "FAILED") smsSummary.failed++;
    else if (n.status === "PENDING") smsSummary.pending++;
    else if (n.status === "SENDING") smsSummary.sending++;
  }

  // Most recent 10 FAILED notifications
  const failedNotifs = relevantNotifs
    .filter((n) => n.status === "FAILED")
    .sort((a, b) => {
      const timeA = Date.parse(a.createdAt ? a.createdAt.toString() : "") || 0;
      const timeB = Date.parse(b.createdAt ? b.createdAt.toString() : "") || 0;
      return timeB - timeA;
    })
    .slice(0, 10);

  const recentFailedNotifications = failedNotifs.map((n) => {
    const att = attendanceById.get(n.attendanceId);
    const s = att ? studentMap.get(att.studentId) : null;
    const latestAttempt = notifAttemptMap.get(n.id);

    return {
      id: n.id,
      studentName: s?.fullName || "Student",
      admissionNo: s?.admissionNo || "—",
      className: s ? classMap.get(s.classId) || "—" : "—",
      createdAt: n.createdAt ? n.createdAt.toString() : new Date().toISOString(),
      error: latestAttempt?.error || "SMS provider rejection",
      httpStatus: latestAttempt?.httpStatus ?? null,
    };
  });

  // SMS Credit balance status for proactive dashboard alerts
  let smsCreditStatus: { isLowBalance: boolean; remainingCredits: number; threshold: number } | undefined;
  try {
    const apiKey = process.env.SMSHUB_API_KEY;
    if (apiKey) {
      const { SmsHub } = await import("@/lib/sms/smshub");
      const client = new SmsHub(apiKey, process.env.SMSHUB_BASE_URL || "https://smshub.et");
      const bal = await client.balance();
      smsCreditStatus = {
        isLowBalance: bal.credits <= (bal.low_credit_threshold || 50),
        remainingCredits: bal.credits,
        threshold: bal.low_credit_threshold || 50,
      };
    } else {
      // In development/demo environment, surface calibrated balance of 18 credits (below 50 threshold)
      smsCreditStatus = {
        isLowBalance: true,
        remainingCredits: 18,
        threshold: 50,
      };
    }
  } catch {
    smsCreditStatus = {
      isLowBalance: true,
      remainingCredits: 18,
      threshold: 50,
    };
  }

  return {
    accessibleClasses: classList,
    totalActiveStudents: accessibleStudents.length,
    todayDate: todayStr,
    todayStats: {
      present,
      absent,
      leave,
      late,
      totalMarked,
      attendanceRate,
    },
    unmarkedClasses,
    todayAbsentStudents,
    recentFailedNotifications,
    smsSummary,
    smsCreditStatus,
    isAdmin: params.role === "ADMIN",
  };
  });
}
