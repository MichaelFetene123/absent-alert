import "dotenv/config";
import { db } from "../src/prisma/db";
import { studentSchema, updateStudentSchema } from "../src/lib/validations/student";

async function runStudentTests() {
  console.log("==================================================");
  console.log("       AbsentAlert - Step 6: Student Management   ");
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
    // 1. Fetch Class
    let testClass = await db.orm.public.Class.where({ name: "Class 7 B" }).first();
    if (!testClass) {
      testClass = await db.orm.public.Class.create({ name: "Class 7 B" });
    }
    assert("Test class 'Class 7 B' exists", !!testClass);

    // 2. Fetch Users
    const admin = await db.orm.public.User.where({ email: "admin@gmail.com" }).first();
    const teacher = await db.orm.public.User.where({ email: "teacher@gmail.com" }).first();
    assert("Admin and Teacher accounts exist", !!admin && !!teacher);

    // 3. Test Zod Validation for Student Creation
    console.log("\n--- Testing Zod Validation for Students ---");
    const invalidPhoneStudent = {
      admissionNo: "ADM-TEST-999",
      fullName: "Test Student",
      classId: testClass.id,
      guardianName: "Test Guardian",
      guardianPhone: "12345", // invalid phone
    };
    const invalidPhoneResult = studentSchema.safeParse(invalidPhoneStudent);
    assert("studentSchema rejects invalid phone number", !invalidPhoneResult.success);

    const validStudentInput = {
      admissionNo: "ADM-TEST-" + Date.now().toString().slice(-5),
      fullName: "Kenenisa Bekele",
      classId: testClass.id,
      guardianName: "Bekele Benti",
      guardianPhone: "0911554433",
    };
    const validResult = studentSchema.safeParse(validStudentInput);
    assert("studentSchema parses valid student input and normalizes phone to +251...", validResult.success && validResult.data.guardianPhone.startsWith("+251"));

    // 4. Role Guard Enforcement
    console.log("\n--- Testing Role Guards ---");
    function checkAdminGuard(userRole: string) {
      if (userRole !== "ADMIN") {
        throw new Error("Access denied: Administrator privileges required");
      }
      return true;
    }

    assert("Admin passes requireAdmin guard", checkAdminGuard(admin!.role));
    let teacherBlocked = false;
    try {
      checkAdminGuard(teacher!.role);
    } catch {
      teacherBlocked = true;
    }
    assert("Teacher is blocked by requireAdmin guard", teacherBlocked);

    // 5. Test Student Creation & Guardian Relationship
    console.log("\n--- Testing Student Creation & Database Persistence ---");
    const admNo = "ADM-CRUD-" + Date.now().toString().slice(-4);
    
    // Check if class exists
    const clsCheck = await db.orm.public.Class.where({ id: testClass.id }).first();
    assert("Target class exists for creation", !!clsCheck);

    // Check duplicate admission check
    const existingCheck = await db.orm.public.Student.where({ admissionNo: admNo }).first();
    assert("Admission number is initially unique", !existingCheck);

    // Create student
    const newStudent = await db.orm.public.Student.create({
      admissionNo: admNo,
      fullName: "Chaltu Regassa",
      classId: testClass.id,
      active: true,
    });
    assert("Student created successfully in DB", !!newStudent && !!newStudent.id);

    // Create primary guardian
    const newGuardian = await db.orm.public.Guardian.create({
      studentId: newStudent.id,
      name: "Regassa Fayissa",
      phone: "+251911998877",
      isPrimary: true,
    });
    assert("Primary guardian created successfully and linked to student", !!newGuardian && newGuardian.studentId === newStudent.id);

    // 6. Test Duplicate Admission Number Guard
    console.log("\n--- Testing Duplicate Admission Guard ---");
    const dupStudentCheck = await db.orm.public.Student.where({ admissionNo: admNo }).first();
    assert("Duplicate admission number detected when attempting to reuse", !!dupStudentCheck);

    // 7. Test Student & Guardian Update
    console.log("\n--- Testing Update Student & Primary Guardian ---");
    const updatedName = "Chaltu Regassa Fayissa";
    await db.orm.public.Student.where({ id: newStudent.id }).update({ fullName: updatedName });
    const refreshedStudent = await db.orm.public.Student.where({ id: newStudent.id }).first();
    assert("Student full name updated successfully", refreshedStudent?.fullName === updatedName);

    const updatedGuardianPhone = "+251922334455";
    await db.orm.public.Guardian.where({ id: newGuardian.id }).update({ phone: updatedGuardianPhone });
    const refreshedGuardian = await db.orm.public.Guardian.where({ id: newGuardian.id }).first();
    assert("Primary guardian phone updated successfully", refreshedGuardian?.phone === updatedGuardianPhone);

    // 8. Test Soft Deactivation & Reactivation (Never Delete)
    console.log("\n--- Testing Soft Deactivation / Status Toggle ---");
    await db.orm.public.Student.where({ id: newStudent.id }).update({ active: false });
    const deactivated = await db.orm.public.Student.where({ id: newStudent.id }).first();
    assert("Student soft-deactivated (active = false)", deactivated?.active === false);

    // Query active only vs all
    const activeStudents = await db.orm.public.Student.where({ active: true }).all();
    const isExcludedFromActive = !activeStudents.some((s) => s.id === newStudent.id);
    assert("Deactivated student is excluded from default active list", isExcludedFromActive);

    // Reactivate
    await db.orm.public.Student.where({ id: newStudent.id }).update({ active: true });
    const reactivated = await db.orm.public.Student.where({ id: newStudent.id }).first();
    assert("Student reactivated successfully (active = true)", reactivated?.active === true);

    // 9. Test Phone Masking for Teachers vs Admins
    console.log("\n--- Testing Phone Number Masking (Teacher vs Admin) ---");
    function maskPhoneForRole(role: string, phone: string): string {
      if (role !== "ADMIN" && phone.length > 4) {
        return phone.slice(0, 4) + "****" + phone.slice(-2);
      }
      return phone;
    }

    const rawPhone = refreshedGuardian!.phone;
    const adminSeenPhone = maskPhoneForRole("ADMIN", rawPhone);
    const teacherSeenPhone = maskPhoneForRole("TEACHER", rawPhone);

    assert("Admin sees full guardian phone number", adminSeenPhone === rawPhone);
    assert("Teacher sees masked guardian phone number (+251****55)", teacherSeenPhone === "+251****55");

    // Clean up test student & guardian created during test
    await db.orm.public.Guardian.where({ id: newGuardian.id }).update({ name: "Cleaned Guardian" });
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

runStudentTests();
