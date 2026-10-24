import "dotenv/config";
import * as TemporalPolyfill from "temporal-polyfill";
if (typeof globalThis !== "undefined" && !(globalThis as any).Temporal) {
  (globalThis as any).Temporal = TemporalPolyfill.Temporal;
}

import { db } from "../src/prisma/db";
import { saveAttendance } from "../src/lib/services/attendance.service";
import {
  queueAbsenceNotifications,
  dispatchNotifications,
  retryNotification,
} from "../src/lib/services/notification.service";

async function verifyScenarioCD() {
  console.log("=================================================================");
  console.log("   AbsentAlert: Testing Scenario C & D (Automated Verification)  ");
  console.log("=================================================================\n");

  const originalKey = process.env.SMSHUB_API_KEY;

  try {
    // 1. Fetch Class, Teacher, Student
    const testClass = await db.orm.public.Class.where({ name: "Class 7 B" }).first();
    const teacher = await db.orm.public.User.where({ email: "teacher@gmail.com" }).first();
    if (!testClass || !teacher) {
      throw new Error("Class or teacher not found");
    }

    // Create an isolated student for this test run
    const ts = Date.now().toString().slice(-4);
    const testStudent = await db.orm.public.Student.create({
      admissionNo: `ADM-SCENARIO-${ts}`,
      fullName: `Scenario Student ${ts}`,
      classId: testClass.id,
      active: true,
    });

    const testGuardian = await db.orm.public.Guardian.create({
      studentId: testStudent.id,
      name: `Guardian ${ts}`,
      phone: "+251911223344",
      isPrimary: true,
    });

    console.log(`[SETUP] Created test student: ${testStudent.fullName} (${testStudent.admissionNo})`);
    console.log(`[SETUP] Primary guardian phone: ${testGuardian.phone}\n`);

    const testDate = "2026-10-18";

    // =========================================================================
    // SCENARIO C: Failure Handling & Attendance Independence
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("SCENARIO C: Simulating Invalid API Key (SMS Failure)");
    console.log("-----------------------------------------------------------------");

    // Temporarily sabotage API key
    process.env.SMSHUB_API_KEY = "invalid_key_scenario_c_test_999";
    console.log(`[STEP 1] Tampered SMSHUB_API_KEY with invalid key: "${process.env.SMSHUB_API_KEY}"`);

    // Save attendance as ABSENT
    console.log(`[STEP 2] Saving attendance as ABSENT for date ${testDate}...`);
    const attResult = await saveAttendance({
      classId: testClass.id,
      date: testDate,
      markedById: teacher.id,
      entries: [{ studentId: testStudent.id, status: "ABSENT" }],
    });
    const attendanceRecord = attResult.records[0]!;
    console.log(`[STEP 2 RESULT] Attendance saved. Attendance ID: ${attendanceRecord.id}`);

    // Queue & Dispatch SMS with invalid key
    console.log(`[STEP 3] Queueing notification...`);
    const queuedIds = await queueAbsenceNotifications(
      [{ id: attendanceRecord.id, studentId: testStudent.id }],
      testDate
    );
    const notificationId = queuedIds[0]!;
    console.log(`[STEP 3 RESULT] Notification queued with ID: ${notificationId}`);

    console.log(`[STEP 4] Dispatching notification with invalid API key...`);
    const dispatchResult = await dispatchNotifications([notificationId]);
    console.log(`[STEP 4 RESULT] Dispatch result:`, dispatchResult);

    // Verify Notification row in DB
    const notifRow = await db.orm.public.Notification.where({ id: notificationId }).first();
    console.log(`\n[VERIFY SCENARIO C]`);
    console.log(`  - Notification Status in DB: "${notifRow?.status}" (Expected: "FAILED")`);

    // Verify NotificationAttempt in DB
    const attempts = await db.orm.public.NotificationAttempt.where({ notificationId }).all();
    console.log(`  - Total Attempt Rows Logged: ${attempts.length}`);
    if (attempts.length > 0) {
      console.log(`  - Attempt 1 Success: ${attempts[0]?.success}`);
      console.log(`  - Attempt 1 HTTP Status: ${attempts[0]?.httpStatus}`);
      console.log(`  - Attempt 1 Error: "${attempts[0]?.error}"`);
    }

    // Verify Attendance independence
    const plainDate = TemporalPolyfill.Temporal.PlainDate.from(testDate);
    const savedAttendance = await db.orm.public.AttendanceRecord.where({
      id: attendanceRecord.id,
      date: plainDate,
    }).first();
    console.log(`  - Attendance Record in DB: status="${savedAttendance?.status}" (Attendance remains safely preserved!)`);

    const scenarioCPassed =
      notifRow?.status === "FAILED" &&
      attempts.length >= 1 &&
      attempts[0]?.success === false &&
      savedAttendance?.status === "ABSENT";

    if (scenarioCPassed) {
      console.log("\n>>> SCENARIO C STATUS: PASSED! (Failure handled gracefully, attendance preserved)\n");
    } else {
      console.error("\n>>> SCENARIO C STATUS: FAILED!\n");
      process.exit(1);
    }

    // =========================================================================
    // SCENARIO D: Safe Retry of Failed Notifications
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log("SCENARIO D: Restoring Valid API Key & Retrying Failed Notification");
    console.log("-----------------------------------------------------------------");

    // Restore real API key
    process.env.SMSHUB_API_KEY = originalKey;
    console.log(`[STEP 1] Restored valid SMSHUB_API_KEY from environment`);

    // Retry the notification
    console.log(`[STEP 2] Retrying notification ID: ${notificationId}...`);
    const retryRes = await retryNotification(notificationId);
    console.log(`[STEP 2 RESULT] retryNotification result:`, retryRes);

    // Verify Notification row in DB after retry
    const retriedNotifRow = await db.orm.public.Notification.where({ id: notificationId }).first();
    console.log(`\n[VERIFY SCENARIO D]`);
    console.log(`  - Notification Status in DB after retry: "${retriedNotifRow?.status}" (Expected: "ACCEPTED")`);
    console.log(`  - Provider Ref in DB: "${retriedNotifRow?.providerRef}"`);

    // Verify all attempts in DB
    const allAttempts = await db.orm.public.NotificationAttempt.where({ notificationId }).all();
    console.log(`  - Total Attempt Rows Logged: ${allAttempts.length} (Expected >= 2)`);
    allAttempts.forEach((att, idx) => {
      console.log(`    Attempt ${idx + 1}: success=${att.success}, httpStatus=${att.httpStatus}, error=${att.error || "none"}`);
    });

    const scenarioDPassed =
      retriedNotifRow?.status === "ACCEPTED" &&
      !!retriedNotifRow?.providerRef &&
      allAttempts.length >= 2 &&
      allAttempts[allAttempts.length - 1]?.success === true;

    if (scenarioDPassed) {
      console.log("\n>>> SCENARIO D STATUS: PASSED! (Retry succeeded, providerRef stored, attempt history preserved)\n");
    } else {
      console.error("\n>>> SCENARIO D STATUS: FAILED!\n");
      process.exit(1);
    }

  } catch (error: any) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    process.env.SMSHUB_API_KEY = originalKey;
    await db.close();
  }
}

verifyScenarioCD();
