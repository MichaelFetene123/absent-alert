import {
  normalizePhone,
  phoneSchema,
  dateSchema,
  pastOrTodayDateSchema,
  studentSchema,
  updateStudentSchema,
  guardianSchema,
  classSchema,
  assignTeacherSchema,
  attendanceStatusSchema,
  attendanceEntrySchema,
  markAttendanceSchema,
  notificationStatusSchema,
  queueNotificationSchema,
  dispatchNotificationSchema,
  loginSchema,
} from "../src/lib/validations";

async function runValidationTests() {
  console.log("==================================================");
  console.log("     AbsentAlert - Step 5: Validation Tests       ");
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

  // --- 1. Phone Normalization Tests ---
  console.log("\n--- Testing Phone Normalization & Schema ---");
  const validPhoneInputs = [
    { input: "0911223344", expected: "+251911223344" },
    { input: "+251911223344", expected: "+251911223344" },
    { input: "251911223344", expected: "+251911223344" },
    { input: "0711223344", expected: "+251711223344" },
    { input: "+251711223344", expected: "+251711223344" },
    { input: "09 11 22 33 44", expected: "+251911223344" },
    { input: "(+251) 911-223344", expected: "+251911223344" },
  ];

  for (const tc of validPhoneInputs) {
    try {
      const normalized = normalizePhone(tc.input);
      assert(`normalizePhone("${tc.input}") returns ${tc.expected}`, normalized === tc.expected);
      const parsed = phoneSchema.parse(tc.input);
      assert(`phoneSchema.parse("${tc.input}") parses to ${tc.expected}`, parsed === tc.expected);
    } catch (e: any) {
      assert(`normalizePhone("${tc.input}") failed`, false, e.message);
    }
  }

  const invalidPhones = ["12345", "0811223344", "abcdefghij", "+14155552671", "", "   "];
  for (const inv of invalidPhones) {
    let threw = false;
    try {
      phoneSchema.parse(inv);
    } catch {
      threw = true;
    }
    assert(`phoneSchema correctly rejects invalid phone "${inv}"`, threw);
  }

  // --- 2. Date Schema Tests ---
  console.log("\n--- Testing Date Schemas ---");
  const validDates = ["2026-10-21", "2026-01-01", "2024-02-29"]; // 2024 is leap year
  for (const d of validDates) {
    assert(`dateSchema accepts valid date "${d}"`, dateSchema.safeParse(d).success);
  }

  const invalidDates = ["2026-02-31", "2026/10/21", "not-a-date", "2026-13-01", "2026-00-10"];
  for (const inv of invalidDates) {
    assert(`dateSchema rejects invalid date "${inv}"`, !dateSchema.safeParse(inv).success);
  }

  // Future date check
  const futureDate = "2099-01-01";
  assert(`pastOrTodayDateSchema rejects future date "${futureDate}"`, !pastOrTodayDateSchema.safeParse(futureDate).success);
  assert("pastOrTodayDateSchema accepts today/past date '2025-01-01'", pastOrTodayDateSchema.safeParse("2025-01-01").success);

  // --- 3. Student Schema Tests ---
  console.log("\n--- Testing Student Schema ---");
  const validStudent = {
    admissionNo: "ADM-101",
    fullName: "Abebe Bikila",
    classId: "cls-uuid-1",
    guardianName: "Bikila Demissie",
    guardianPhone: "0911223344",
  };
  const studentParse = studentSchema.safeParse(validStudent);
  assert("studentSchema accepts valid student data", studentParse.success);
  if (studentParse.success) {
    assert("studentSchema normalizes guardianPhone to E.164", studentParse.data.guardianPhone === "+251911223344");
    assert("studentSchema defaults active to true", studentParse.data.active === true);
  }

  const invalidStudents = [
    { ...validStudent, admissionNo: "" }, // missing admission
    { ...validStudent, fullName: "A" }, // too short full name
    { ...validStudent, guardianPhone: "0812345678" }, // invalid phone
    { ...validStudent, classId: "" }, // missing class
  ];
  for (let i = 0; i < invalidStudents.length; i++) {
    assert(`studentSchema rejects invalid student case #${i + 1}`, !studentSchema.safeParse(invalidStudents[i]).success);
  }

  // --- 4. Guardian Schema Tests ---
  console.log("\n--- Testing Guardian Schema ---");
  const validGuardian = {
    studentId: "stu-123",
    name: "Almaz Ayana",
    phone: "0922334455",
    isPrimary: true,
  };
  const guardianParse = guardianSchema.safeParse(validGuardian);
  assert("guardianSchema accepts valid guardian", guardianParse.success);
  if (guardianParse.success) {
    assert("guardianSchema normalizes phone", guardianParse.data.phone === "+251922334455");
  }

  assert("guardianSchema rejects missing studentId", !guardianSchema.safeParse({ ...validGuardian, studentId: "" }).success);
  assert("guardianSchema rejects short name", !guardianSchema.safeParse({ ...validGuardian, name: "A" }).success);

  // --- 5. Class Schema Tests ---
  console.log("\n--- Testing Class Schema ---");
  assert("classSchema accepts valid class 'Class 7 B'", classSchema.safeParse({ name: "Class 7 B" }).success);
  assert("classSchema rejects empty class name", !classSchema.safeParse({ name: "  " }).success);

  assert("assignTeacherSchema accepts valid link", assignTeacherSchema.safeParse({ userId: "u-1", classId: "c-1" }).success);
  assert("assignTeacherSchema rejects missing userId", !assignTeacherSchema.safeParse({ userId: "", classId: "c-1" }).success);

  // --- 6. Attendance Schema Tests ---
  console.log("\n--- Testing Attendance Schema ---");
  const validAttendanceStatuses = ["PRESENT", "ABSENT", "LEAVE", "LATE"];
  for (const st of validAttendanceStatuses) {
    assert(`attendanceStatusSchema accepts "${st}"`, attendanceStatusSchema.safeParse(st).success);
  }
  assert("attendanceStatusSchema rejects 'UNKNOWN'", !attendanceStatusSchema.safeParse("UNKNOWN").success);

  const validMarkAttendance = {
    classId: "cls-7b",
    date: "2025-10-20",
    records: [
      { studentId: "s-1", status: "PRESENT" as const },
      { studentId: "s-2", status: "ABSENT" as const },
    ],
  };
  const attendanceParse = markAttendanceSchema.safeParse(validMarkAttendance);
  assert("markAttendanceSchema accepts valid payload with records", attendanceParse.success);

  // Also test with `entries` key
  const validWithEntries = {
    classId: "cls-7b",
    date: "2025-10-20",
    entries: [{ studentId: "s-1", status: "PRESENT" as const }],
  };
  const entriesParse = markAttendanceSchema.safeParse(validWithEntries);
  assert("markAttendanceSchema accepts payload using 'entries' key", entriesParse.success);

  assert("markAttendanceSchema rejects empty records/entries list", !markAttendanceSchema.safeParse({
    classId: "cls-7b",
    date: "2025-10-20",
    records: [],
  }).success);

  assert("markAttendanceSchema rejects future date", !markAttendanceSchema.safeParse({
    classId: "cls-7b",
    date: "2099-12-31",
    records: [{ studentId: "s-1", status: "PRESENT" as const }],
  }).success);

  // --- 7. Notification Schema Tests ---
  console.log("\n--- Testing Notification Schema ---");
  const validStatuses = ["PENDING", "SENDING", "ACCEPTED", "DELIVERED", "FAILED"];
  for (const st of validStatuses) {
    assert(`notificationStatusSchema accepts "${st}"`, notificationStatusSchema.safeParse(st).success);
  }
  assert("notificationStatusSchema rejects 'QUEUED'", !notificationStatusSchema.safeParse("QUEUED").success);

  const validQueueNotif = {
    attendanceId: "att-123",
    guardianPhone: "0911223344",
    studentName: "Dawit Haile",
    className: "Class 7 B",
    date: "2025-10-20",
  };
  const queueParse = queueNotificationSchema.safeParse(validQueueNotif);
  assert("queueNotificationSchema accepts valid input", queueParse.success);
  if (queueParse.success) {
    assert("queueNotificationSchema normalizes guardianPhone", queueParse.data.guardianPhone === "+251911223344");
    assert("queueNotificationSchema defaults type to ABSENCE", queueParse.data.type === "ABSENCE");
  }

  // --- 8. Auth Schema Tests ---
  console.log("\n--- Testing Auth Schema ---");
  assert("loginSchema accepts valid email and password", loginSchema.safeParse({ email: "admin@gmail.com", password: "password123" }).success);
  assert("loginSchema rejects invalid email", !loginSchema.safeParse({ email: "not-an-email", password: "password123" }).success);
  assert("loginSchema rejects short password (<6 chars)", !loginSchema.safeParse({ email: "admin@gmail.com", password: "123" }).success);

  console.log("\n==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runValidationTests();
