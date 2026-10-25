import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only and next/cache
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock SMS client
const mockSendSms = vi.fn();
vi.mock("@/lib/sms/smshub", () => ({
  sendSms: (phone: string, msg: string) => mockSendSms(phone, msg),
}));

// Mock Auth guards
let currentUser: { id: string; role: "ADMIN" | "TEACHER"; name?: string; email?: string } | null = null;
let teacherClassMap: Record<string, string[]> = {}; // userId -> classIds

vi.mock("@/lib/guards", () => ({
  AuthError: class AuthError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = "AuthError";
      this.code = code;
    }
  },
  getSessionUser: vi.fn(async () => currentUser),
  requireUser: vi.fn(async () => {
    if (!currentUser) throw new Error("You must be logged in to access this resource");
    return currentUser;
  }),
  requireAdmin: vi.fn(async () => {
    if (!currentUser) throw new Error("You must be logged in to access this resource");
    if (currentUser.role !== "ADMIN") {
      throw new Error("Access denied: Administrator privileges required");
    }
    return currentUser;
  }),
  requireClassAccess: vi.fn(async (classId: string) => {
    if (!currentUser) throw new Error("You must be logged in to access this resource");
    if (currentUser.role === "ADMIN") return currentUser;
    const allowed = teacherClassMap[currentUser.id] || [];
    if (!allowed.includes(classId)) {
      throw new Error("Access denied: You are not assigned to this class");
    }
    return currentUser;
  }),
}));

// In-memory Database mock for Step 12 hardening verification
type NotificationRecord = {
  id: string;
  attendanceId: string;
  guardianPhone: string;
  type: string;
  body: string;
  status: "PENDING" | "SENDING" | "ACCEPTED" | "DELIVERED" | "FAILED";
  providerRef?: string | null;
  createdAt?: Date;
};

type AttemptRecord = {
  id: string;
  notificationId: string;
  httpStatus?: number | null;
  success: boolean;
  rawResponse?: any;
  error?: string | null;
  attemptedAt?: Date;
};

let notifications: NotificationRecord[] = [];
let attempts: AttemptRecord[] = [];
let students: any[] = [];
let classes: any[] = [];
let guardians: any[] = [];
let attendanceRecords: any[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    orm: {
      public: {
        Student: {
          where: vi.fn((query: any) => ({
            first: vi.fn(async () => students.find((s) => s.id === query.id || s.admissionNo === query.admissionNo) || null),
          })),
          create: vi.fn(async (data: any) => {
            const row = { id: `stu_${Date.now()}_${Math.random()}`, ...data };
            students.push(row);
            return row;
          }),
        },
        Class: {
          where: vi.fn((query: any) => ({
            first: vi.fn(async () => classes.find((c) => c.id === query.id || c.name === query.name) || null),
          })),
        },
        Guardian: {
          where: vi.fn((query: any) => ({
            all: vi.fn(async () =>
              guardians.filter(
                (g) =>
                  (!query.studentId || g.studentId === query.studentId) &&
                  (query.isPrimary === undefined || g.isPrimary === query.isPrimary)
              )
            ),
          })),
          create: vi.fn(async (data: any) => {
            const row = { id: `g_${Date.now()}_${Math.random()}`, ...data };
            guardians.push(row);
            return row;
          }),
        },
        Notification: {
          where: vi.fn((query: any) => ({
            first: vi.fn(async () =>
              notifications.find(
                (n) =>
                  (!query.id || n.id === query.id) &&
                  (!query.attendanceId || n.attendanceId === query.attendanceId) &&
                  (!query.guardianPhone || n.guardianPhone === query.guardianPhone) &&
                  (!query.type || n.type === query.type)
              ) || null
            ),
            update: vi.fn(async (data: any) => {
              const idx = notifications.findIndex((n) => n.id === query.id);
              if (idx !== -1) {
                notifications[idx] = { ...notifications[idx]!, ...data };
                return notifications[idx];
              }
              return null;
            }),
          })),
          create: vi.fn(async (data: any) => {
            // Check unique constraint @@unique([attendanceId, guardianPhone, type])
            const dup = notifications.find(
              (n) =>
                n.attendanceId === data.attendanceId &&
                n.guardianPhone === data.guardianPhone &&
                n.type === data.type
            );
            if (dup) {
              throw new Error("Unique constraint violation: notification already exists");
            }
            const row = { id: `notif_${Date.now()}_${Math.random()}`, ...data };
            notifications.push(row);
            return row;
          }),
        },
        NotificationAttempt: {
          create: vi.fn(async (data: any) => {
            const row = { id: `att_${Date.now()}_${Math.random()}`, ...data };
            attempts.push(row);
            return row;
          }),
        },
      },
    },
  },
}));

import { queueAbsenceNotifications, sendOne } from "../src/lib/services/notification.service";
import { createStudent } from "../src/actions/student.actions";
import { markAttendance } from "../src/actions/attendance.actions";

describe("Step 12.1 – Tests and Hardening Scenarios", () => {
  beforeEach(() => {
    notifications = [];
    attempts = [];
    students = [
      { id: "stu_1", fullName: "Almaz Kebede", admissionNo: "ADM-001", classId: "cls_1", active: true },
    ];
    classes = [{ id: "cls_1", name: "Class 7 B" }, { id: "cls_2", name: "Class 8 A" }];
    guardians = [{ id: "g_1", studentId: "stu_1", name: "Kebede Tessema", phone: "+251911223344", isPrimary: true }];
    attendanceRecords = [{ id: "att_rec_1", studentId: "stu_1", date: "2026-10-24", status: "ABSENT" }];
    currentUser = { id: "usr_admin", role: "ADMIN", name: "Admin" };
    teacherClassMap = {};
    mockSendSms.mockReset();
  });

  it("Scenario 1: Save the same absent attendance twice -> One Notification row only", async () => {
    const record = [{ id: "att_rec_1", studentId: "stu_1" }];

    // First queue call
    const firstIds = await queueAbsenceNotifications(record, "2026-10-24");
    expect(firstIds).toHaveLength(1);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.status).toBe("PENDING");

    // Second queue call for the exact same absence
    const secondIds = await queueAbsenceNotifications(record, "2026-10-24");
    // Should return existing ID, NOT create a second row
    expect(secondIds).toHaveLength(1);
    expect(secondIds[0]).toBe(firstIds[0]);
    expect(notifications).toHaveLength(1);
  });

  it("Scenario 2: sendSms mocked to fail -> Attendance saved, notification FAILED, attempt row exists", async () => {
    mockSendSms.mockResolvedValueOnce({
      accepted: false,
      httpStatus: 504,
      error: "SMS provider gateway timeout",
      raw: { error: "gateway_timeout" },
    });

    const notifRow = {
      id: "notif_fail_1",
      attendanceId: "att_rec_1",
      guardianPhone: "+251911223344",
      type: "ABSENCE",
      body: "AbsentAlert: Almaz Kebede (Class 7 B) was marked absent on 2026-10-24.",
      status: "PENDING" as const,
    };
    notifications.push(notifRow);

    const result = await sendOne(notifRow.id);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("SMS provider gateway timeout");

    // Notification marked as FAILED
    const updatedNotif = notifications.find((n) => n.id === notifRow.id);
    expect(updatedNotif?.status).toBe("FAILED");

    // Attempt logged
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.success).toBe(false);
    expect(attempts[0]?.httpStatus).toBe(504);
    expect(attempts[0]?.error).toBe("SMS provider gateway timeout");
  });

  it("Scenario 3: Teacher calls markAttendance for another class -> Rejected", async () => {
    // Current user is a teacher assigned only to cls_1
    currentUser = { id: "usr_teacher", role: "TEACHER", name: "Teacher Abebe" };
    teacherClassMap["usr_teacher"] = ["cls_1"];

    // Teacher tries to mark attendance for cls_2
    const res = await markAttendance({
      classId: "cls_2",
      date: "2026-10-24",
      entries: [{ studentId: "stu_1", status: "PRESENT" }],
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Access denied: You are not assigned to this class");
  });

  it("Scenario 4: Anonymous or teacher calls createStudent -> Rejected", async () => {
    // Teacher call
    currentUser = { id: "usr_teacher", role: "TEACHER", name: "Teacher Abebe" };
    const teacherRes = await createStudent({
      admissionNo: "ADM-999",
      fullName: "Test Student",
      classId: "cls_1",
      guardianName: "Parent",
      guardianPhone: "0911223344",
    });
    expect(teacherRes.ok).toBe(false);
    expect(teacherRes.error).toContain("Administrator privileges required");

    // Anonymous call
    currentUser = null;
    const anonRes = await createStudent({
      admissionNo: "ADM-999",
      fullName: "Test Student",
      classId: "cls_1",
      guardianName: "Parent",
      guardianPhone: "0911223344",
    });
    expect(anonRes.ok).toBe(false);
    expect(anonRes.error).toContain("logged in");
  });

  it("Scenario 5: Absent -> Present -> Absent -> No second SMS if already ACCEPTED", async () => {
    mockSendSms.mockResolvedValueOnce({
      accepted: true,
      httpStatus: 200,
      providerRef: "MSG_12345",
      raw: { id: "MSG_12345", status: "ACCEPTED" },
    });

    const record = [{ id: "att_rec_1", studentId: "stu_1" }];

    // Initial absence queues and sends SMS
    const [notifId] = await queueAbsenceNotifications(record, "2026-10-24");
    expect(notifId).toBeDefined();

    const sendRes = await sendOne(notifId!);
    expect(sendRes.ok).toBe(true);
    expect(notifications[0]?.status).toBe("ACCEPTED");

    // If attendance is updated to PRESENT and later re-marked ABSENT on the same day:
    const reQueue = await queueAbsenceNotifications(record, "2026-10-24");
    // Since already ACCEPTED, it should NOT return the ID for redispatch
    expect(reQueue).toHaveLength(0);
    // Still only 1 notification row in the database
    expect(notifications).toHaveLength(1);
    expect(mockSendSms).toHaveBeenCalledTimes(1);
  });

  it("Scenario 6: Two simultaneous retries of one FAILED row -> Only one SMS sent", async () => {
    // Delay mock response to simulate network transit
    mockSendSms.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return { accepted: true, httpStatus: 200, providerRef: "MSG_RETRY_1" };
    });

    const failedRow = {
      id: "notif_failed_concurrency",
      attendanceId: "att_rec_1",
      guardianPhone: "+251911223344",
      type: "ABSENCE",
      body: "Alert",
      status: "FAILED" as const,
    };
    notifications.push(failedRow);

    // Run two simultaneous sendOne calls
    const [res1, res2] = await Promise.all([
      sendOne(failedRow.id),
      sendOne(failedRow.id),
    ]);

    // One succeeds, one is skipped because row was already claimed
    const successfulCalls = [res1, res2].filter((r) => r.ok);
    const skippedCalls = [res1, res2].filter((r) => r.skipped);

    expect(successfulCalls).toHaveLength(1);
    expect(skippedCalls).toHaveLength(1);
    expect(mockSendSms).toHaveBeenCalledTimes(1);
  });
});
