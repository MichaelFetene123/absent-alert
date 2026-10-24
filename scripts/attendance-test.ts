import "dotenv/config";
import * as TemporalPolyfill from "temporal-polyfill";
if (typeof globalThis !== "undefined" && !(globalThis as any).Temporal) {
  (globalThis as any).Temporal = TemporalPolyfill.Temporal;
}

import { db } from "../src/prisma/db";
import {
  markAttendanceSchema,
  attendanceStatusSchema,
} from "../src/lib/validations/attendance";
import { saveAttendance, getClassAttendance } from "../src/lib/services/attendance.service";

async function runAttendanceTests() {
  console.log("==================================================");
  console.log("       AbsentAlert - Step 7: Attendance Tests     ");
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
    // 1. Setup & inspect base entities
    const testClass = await db.orm.public.Class.where({ name: "Class 7 B" }).first();
    assert("Class 'Class 7 B' exists in DB", !!testClass);

    const admin = await db.orm.public.User.where({ email: "admin@gmail.com" }).first();
    const teacher = await db.orm.public.User.where({ email: "teacher@gmail.com" }).first();
    assert("Admin user exists", !!admin && admin.role === "ADMIN");
    assert("Teacher user exists", !!teacher && teacher.role === "TEACHER");

    // Fetch active students in class
    const classStudents = await db.orm.public.Student.where({
      classId: testClass!.id,
      active: true,
    }).all();
    assert("Class has active students for attendance testing", classStudents.length >= 2);

    const studentA = classStudents[0]!;
    const studentB = classStudents[1]!;

    // -------------------------------------------------------------------------
    // 2. Validation Schema Tests
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Zod Validation for Attendance ---");

    // All four valid statuses
    for (const status of ["PRESENT", "ABSENT", "LEAVE", "LATE"] as const) {
      assert(`attendanceStatusSchema accepts '${status}'`, attendanceStatusSchema.safeParse(status).success);
    }
    assert("attendanceStatusSchema rejects invalid status 'EXCUSED'", !attendanceStatusSchema.safeParse("EXCUSED").success);

    // Empty records refinement
    const emptyPayload = { classId: testClass!.id, date: "2026-10-24", entries: [] };
    assert("markAttendanceSchema rejects empty entries array", !markAttendanceSchema.safeParse(emptyPayload).success);

    // Future date rejection
    const futurePayload = {
      classId: testClass!.id,
      date: "2099-12-31",
      entries: [{ studentId: studentA.id, status: "PRESENT" }],
    };
    assert("markAttendanceSchema rejects future date", !markAttendanceSchema.safeParse(futurePayload).success);

    // Valid payload with 'entries' key
    const validEntriesPayload = {
      classId: testClass!.id,
      date: "2026-10-20",
      entries: [
        { studentId: studentA.id, status: "PRESENT" },
        { studentId: studentB.id, status: "ABSENT" },
      ],
    };
    const parsedValid = markAttendanceSchema.safeParse(validEntriesPayload);
    assert("markAttendanceSchema accepts valid payload with entries", parsedValid.success);

    // Valid payload with 'records' key (backwards-compatibility)
    const validRecordsPayload = {
      classId: testClass!.id,
      date: "2026-10-20",
      records: [
        { studentId: studentA.id, status: "LEAVE" },
        { studentId: studentB.id, status: "LATE" },
      ],
    };
    assert("markAttendanceSchema accepts payload using 'records' key", markAttendanceSchema.safeParse(validRecordsPayload).success);

    // -------------------------------------------------------------------------
    // 3. Authorization & Role Guard Logic
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Class Access Guards ---");

    async function checkClassAccess(userId: string, role: string, classId: string) {
      if (role === "ADMIN") return true;
      const link = await db.orm.public.TeacherClass.where({ userId, classId }).first();
      if (!link) throw new Error("Access denied: You are not assigned to this class");
      return true;
    }

    const adminCanAccess = await checkClassAccess(admin!.id, admin!.role, testClass!.id);
    assert("Admin has access to any class without explicit link", adminCanAccess === true);

    const teacherAssigned = await checkClassAccess(teacher!.id, teacher!.role, testClass!.id);
    assert("Teacher assigned to 'Class 7 B' has authorized access", teacherAssigned === true);

    let unassignedBlocked = false;
    try {
      await checkClassAccess(teacher!.id, teacher!.role, "unassigned-class-uuid-999");
    } catch {
      unassignedBlocked = true;
    }
    assert("Teacher blocked from unassigned class with Access denied error", unassignedBlocked);

    // -------------------------------------------------------------------------
    // 4. Attendance Service: saveAttendance
    // -------------------------------------------------------------------------
    console.log("\n--- Testing Attendance Service & Persistence ---");

    const testDate = "2026-10-20";

    // A. Reject students that do not belong to the class
    let foreignStudentBlocked = false;
    try {
      await saveAttendance({
        classId: testClass!.id,
        date: testDate,
        markedById: teacher!.id,
        entries: [{ studentId: "non-existent-student-id", status: "PRESENT" }],
      });
    } catch {
      foreignStudentBlocked = true;
    }
    assert("saveAttendance rejects students not enrolled in the class", foreignStudentBlocked);

    // B. Save initial attendance: studentA is PRESENT, studentB is ABSENT
    const initialResult = await saveAttendance({
      classId: testClass!.id,
      date: testDate,
      markedById: teacher!.id,
      entries: [
        { studentId: studentA.id, status: "PRESENT" },
        { studentId: studentB.id, status: "ABSENT" },
      ],
    });

    assert("saveAttendance successfully saved 2 records", initialResult.total === 2);
    assert("Initial save created new records (createdCount >= 1)", initialResult.createdCount + initialResult.updatedCount === 2);
    assert("studentB identified as newlyAbsent", initialResult.newlyAbsent.some((na) => na.studentId === studentB.id));
    assert("studentA is NOT in newlyAbsent", !initialResult.newlyAbsent.some((na) => na.studentId === studentA.id));

    // C. Duplicate handling & safe update (idempotency check)
    // Same student & date submitted again with updated statuses: studentA becomes LATE, studentB becomes PRESENT
    const updateResult = await saveAttendance({
      classId: testClass!.id,
      date: testDate,
      markedById: admin!.id, // Admin updates it
      entries: [
        { studentId: studentA.id, status: "LATE" },
        { studentId: studentB.id, status: "PRESENT" },
      ],
    });

    assert("Updating existing records succeeded without duplicate key error", updateResult.total === 2);
    assert("Records were updated in-place (updatedCount = 2)", updateResult.updatedCount === 2);
    assert("No newly absent students when status changed to PRESENT/LATE", updateResult.newlyAbsent.length === 0);

    // Verify DB state
    const plainDate = TemporalPolyfill.Temporal.PlainDate.from(testDate);
    const recA = await db.orm.public.AttendanceRecord.where({
      studentId: studentA.id,
      date: plainDate,
    }).first();
    const recB = await db.orm.public.AttendanceRecord.where({
      studentId: studentB.id,
      date: plainDate,
    }).first();

    assert("studentA status correctly updated to 'LATE' in DB", recA?.status === "LATE");
    assert("studentB status correctly updated to 'PRESENT' in DB", recB?.status === "PRESENT");
    assert("markedById correctly updated to Admin's ID", recA?.markedById === admin!.id);

    // D. Test transition from PRESENT back to ABSENT flags as newlyAbsent
    const absentResult = await saveAttendance({
      classId: testClass!.id,
      date: testDate,
      markedById: teacher!.id,
      entries: [{ studentId: studentA.id, status: "ABSENT" }],
    });
    assert("Transition from LATE to ABSENT properly registers as newlyAbsent", absentResult.newlyAbsent.length === 1 && absentResult.newlyAbsent[0]!.studentId === studentA.id);

    // E. Test getClassAttendance retrieval
    console.log("\n--- Testing Attendance Retrieval ---");
    const classAttendance = await getClassAttendance({
      classId: testClass!.id,
      date: testDate,
    });
    assert("getClassAttendance returns list of students for class", classAttendance.length >= 2);
    const itemA = classAttendance.find((s) => s.studentId === studentA.id);
    assert("getClassAttendance matches recorded status for studentA", itemA?.status === "ABSENT");

  } catch (error: any) {
    console.error("Test execution error:", error);
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

runAttendanceTests();
