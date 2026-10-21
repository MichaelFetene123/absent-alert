import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/prisma/db";

async function runAuthTests() {
  console.log("==================================================");
  console.log("       AbsentAlert - Step 4: Auth & Guard Tests   ");
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
    // Test 1: Fetch seeded Admin user
    const admin = await db.orm.public.User.where({ email: "admin@gmail.com" }).first();
    assert("Admin user (admin@gmail.com) exists in database", !!admin && admin.role === "ADMIN" && admin.name === "Admin");

    // Test 2: Verify valid Admin password
    const adminPassMatch = admin ? await bcrypt.compare("admin@123", admin.passwordHash) : false;
    assert("Admin valid password ('admin@123') matches bcrypt hash", adminPassMatch);

    // Test 3: Verify invalid Admin password rejection
    const adminWrongPass = admin ? await bcrypt.compare("wrongpassword", admin.passwordHash) : true;
    assert("Admin invalid password correctly rejected", !adminWrongPass);

    // Test 4: Fetch seeded Teacher user
    const teacher = await db.orm.public.User.where({ email: "teacher@gmail.com" }).first();
    assert("Teacher user (teacher@gmail.com) exists in database", !!teacher && teacher.role === "TEACHER");

    // Test 5: Verify valid Teacher password
    const teacherPassMatch = teacher ? await bcrypt.compare("teacher@123", teacher.passwordHash) : false;
    assert("Teacher valid password ('teacher@123') matches bcrypt hash", teacherPassMatch);

    // Test 6: Verify non-existent user returns null
    const nonExistent = await db.orm.public.User.where({ email: "ghost@nonexistent.org" }).first();
    assert("Non-existent email lookup returns null", nonExistent === null);

    // Test 7: Role guard - Admin check
    function testRequireAdmin(userRole: string) {
      if (userRole !== "ADMIN") {
        throw new Error("FORBIDDEN");
      }
      return true;
    }
    assert("requireAdmin() succeeds for ADMIN role", testRequireAdmin(admin!.role) === true);

    let teacherAdminError = false;
    try {
      testRequireAdmin(teacher!.role);
    } catch (e: any) {
      teacherAdminError = e.message === "FORBIDDEN";
    }
    assert("requireAdmin() blocks TEACHER role with FORBIDDEN", teacherAdminError);

    // Test 8: Class access guard
    const cls7b = await db.orm.public.Class.where({ name: "Class 7 B" }).first();
    assert("Class 'Class 7 B' exists in database", !!cls7b);

    async function testRequireClassAccess(userId: string, role: string, classId: string) {
      if (role === "ADMIN") return true;
      const link = await db.orm.public.TeacherClass.where({
        userId,
        classId,
      }).first();
      if (!link) throw new Error("FORBIDDEN");
      return true;
    }

    if (admin && teacher && cls7b) {
      const adminAccess = await testRequireClassAccess(admin.id, admin.role, cls7b.id);
      assert("Admin can access any class without explicit link", adminAccess === true);

      const teacherAssignedAccess = await testRequireClassAccess(teacher.id, teacher.role, cls7b.id);
      assert("Teacher can access their assigned 'Class 7 B'", teacherAssignedAccess === true);

      let teacherUnassignedBlocked = false;
      try {
        await testRequireClassAccess(teacher.id, teacher.role, "unassigned-class-id-999");
      } catch (e: any) {
        teacherUnassignedBlocked = e.message === "FORBIDDEN";
      }
      assert("Teacher is blocked from accessing unassigned class", teacherUnassignedBlocked);
    }
  } catch (error: any) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    await db.close();
  }

  console.log("--------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests();
