import "dotenv/config";
import * as TemporalPolyfill from "temporal-polyfill";
if (typeof globalThis !== "undefined" && !(globalThis as any).Temporal) {
  (globalThis as any).Temporal = TemporalPolyfill.Temporal;
}

import { db } from "../src/prisma/db";
import {
  absenceMessage,
  queueAbsenceNotifications,
  sendOne,
  dispatchNotifications,
  retryNotification,
} from "../src/lib/services/notification.service";
import { saveAttendance } from "../src/lib/services/attendance.service";

async function runNotificationTests() {
  console.log("==================================================");
  console.log("       AbsentAlert - Step 9: Notification Tests   ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Message Builder Test
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Absence Message Builder ---");
    const msg = absenceMessage("Almaz Kebede", "Class 7 B", "2026-10-24");
    assert("Message contains student name", msg.includes("Almaz Kebede"));
    assert("Message contains class name", msg.includes("Class 7 B"));
    assert("Message contains date", msg.includes("2026-10-24"));
    assert("Message starts with AbsentAlert brand", msg.startsWith("AbsentAlert:"));

    // -------------------------------------------------------------------------
    // 2. Setup Test Data (Class, Teacher, Isolated Test Students)
    // -------------------------------------------------------------------------
    const testClass = await db.orm.public.Class.where({ name: "Class 7 B" }).first();
    const teacher = await db.orm.public.User.where({ email: "teacher@gmail.com" }).first();
    assert("Test class and teacher exist", !!testClass && !!teacher);

    const ts = Date.now().toString().slice(-5);
    const testStudentA = await db.orm.public.Student.create({
      admissionNo: `TEST-SMS-A-${ts}`,
      fullName: `Test Student A ${ts}`,
      classId: testClass!.id,
      active: true,
    });
    const testGuardianA = await db.orm.public.Guardian.create({
      studentId: testStudentA.id,
      name: "Guardian A",
      phone: "+251911223344",
      isPrimary: true,
    });

    const testStudentB = await db.orm.public.Student.create({
      admissionNo: `TEST-SMS-B-${ts}`,
      fullName: `Test Student B ${ts}`,
      classId: testClass!.id,
      active: true,
    });
    const testGuardianB = await db.orm.public.Guardian.create({
      studentId: testStudentB.id,
      name: "Guardian B",
      phone: "+251922334455",
      isPrimary: true,
    });

    assert("Created isolated test students and primary guardians", !!testStudentA && !!testStudentB);

    // -------------------------------------------------------------------------
    // 3. Queue Notifications (Idempotent Creation)
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Idempotent Notification Queueing ---");

    const testDate = "2026-10-20";
    // First, save an ABSENT attendance record for test student A
    const attResult = await saveAttendance({
      classId: testClass!.id,
      date: testDate,
      markedById: teacher!.id,
      entries: [{ studentId: testStudentA.id, status: "ABSENT" }],
    });
    assert("Attendance saved with ABSENT status", attResult.total === 1);
    const attendanceRecordA = attResult.records[0]!;

    // Queue notification
    const queuedIds = await queueAbsenceNotifications(
      [{ id: attendanceRecordA.id, studentId: testStudentA.id }],
      testDate
    );
    assert("queueAbsenceNotifications returns a notification ID", queuedIds.length === 1);
    const notifIdA = queuedIds[0]!;

    // Verify row in database
    const notifRowA = await db.orm.public.Notification.where({ id: notifIdA }).first();
    assert("Notification row exists in DB with status PENDING", !!notifRowA && notifRowA.status === "PENDING");
    assert("Notification has correct guardian phone", notifRowA?.guardianPhone === testGuardianA.phone);
    assert("Notification has correct attendanceId", notifRowA?.attendanceId === attendanceRecordA.id);

    // Duplicate queue test: calling queue again for same record MUST NOT duplicate
    await queueAbsenceNotifications(
      [{ id: attendanceRecordA.id, studentId: testStudentA.id }],
      testDate
    );
    const allNotifsForRecord = await db.orm.public.Notification.where({
      attendanceId: attendanceRecordA.id,
      guardianPhone: testGuardianA.phone,
      type: "ABSENCE",
    }).all();
    assert("Duplicate queueing prevented by unique constraint (exactly 1 row exists)", allNotifsForRecord.length === 1);

    // -------------------------------------------------------------------------
    // 4. Send & Attempt Logging
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Send Dispatch & Attempt Logging ---");

    const sendResult = await sendOne(notifIdA);
    const afterSendNotifA = await db.orm.public.Notification.where({ id: notifIdA }).first();
    assert("Notification status updated from PENDING (now ACCEPTED or FAILED)", afterSendNotifA?.status === "ACCEPTED" || afterSendNotifA?.status === "FAILED");

    // Check attempts row
    const attempts = await db.orm.public.NotificationAttempt.where({
      notificationId: notifIdA,
    }).all();
    assert("NotificationAttempt record created in DB", attempts.length >= 1);
    const lastAttempt = attempts[attempts.length - 1]!;
    assert("Attempt records success boolean and timestamp", typeof lastAttempt.success === "boolean" && !!lastAttempt.attemptedAt);

    // If ACCEPTED, trying to send again should be skipped to prevent double-charging
    if (afterSendNotifA?.status === "ACCEPTED") {
      const skipRes = await sendOne(notifIdA);
      assert("ACCEPTED notification is skipped on re-send attempt (prevents duplicate SMS)", skipRes.skipped === true);
    }

    // -------------------------------------------------------------------------
    // 5. Deliberate Failure Simulation (Invalid API key behavior)
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Deliberate API Failure Handling ---");

    // Save attendance for student B
    const attResultB = await saveAttendance({
      classId: testClass!.id,
      date: testDate,
      markedById: teacher!.id,
      entries: [{ studentId: testStudentB.id, status: "ABSENT" }],
    });
    const attendanceRecordB = attResultB.records[0]!;

    const queuedIdsB = await queueAbsenceNotifications(
      [{ id: attendanceRecordB.id, studentId: testStudentB.id }],
      testDate
    );
    const notifIdB = queuedIdsB[0]!;

    // Temporarily tamper with API key to simulate failure
    const originalKey = process.env.SMSHUB_API_KEY;
    try {
      process.env.SMSHUB_API_KEY = "invalid_tampered_key_test_123";

      const failSendResult = await sendOne(notifIdB);
      assert("sendOne reports failure when API key is invalid", !failSendResult.ok);

      const failedNotif = await db.orm.public.Notification.where({ id: notifIdB }).first();
      assert("Notification marked as FAILED in database", failedNotif?.status === "FAILED");

      const failAttempts = await db.orm.public.NotificationAttempt.where({
        notificationId: notifIdB,
      }).all();
      assert("Attempt row recorded with success: false and error message", failAttempts.some((a) => a.success === false && !!a.error));

      // Attendance record must STILL be preserved despite SMS failure!
      const plainDate = TemporalPolyfill.Temporal.PlainDate.from(testDate);
      const studentBAttendance = await db.orm.public.AttendanceRecord.where({
        id: attendanceRecordB.id,
        date: plainDate,
      }).first();
      assert("Attendance record B remains preserved in DB despite SMS failure", !!studentBAttendance && studentBAttendance.status === "ABSENT");

      // Test Retry on FAILED notification
      process.env.SMSHUB_API_KEY = originalKey; // Restore key
      const retryResult = await retryNotification(notifIdB);
      assert("retryNotification executed for FAILED notification", typeof retryResult.ok === "boolean");

      const attemptsAfterRetry = await db.orm.public.NotificationAttempt.where({
        notificationId: notifIdB,
      }).all();
      assert("New attempt logged after retry (attempt count >= 2)", attemptsAfterRetry.length >= 2);
    } finally {
      process.env.SMSHUB_API_KEY = originalKey;
    }

  } catch (error: any) {
    console.error("Test execution failed:", error);
    failed++;
  } finally {
    await db.close();
  }

  console.log("\n==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runNotificationTests();
