import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  phoneSchema,
  dateSchema,
  pastOrTodayDateSchema,
  studentSchema,
  guardianSchema,
  classSchema,
  assignTeacherSchema,
  attendanceStatusSchema,
  markAttendanceSchema,
  notificationStatusSchema,
  queueNotificationSchema,
  loginSchema,
} from "../src/lib/validations";

describe("Phone Validation & Normalization", () => {
  it("normalizes various Ethiopian formats to E.164 (+251...)", () => {
    expect(normalizePhone("0911223344")).toBe("+251911223344");
    expect(normalizePhone("+251911223344")).toBe("+251911223344");
    expect(normalizePhone("251911223344")).toBe("+251911223344");
    expect(normalizePhone("0711223344")).toBe("+251711223344");
    expect(normalizePhone("+251711223344")).toBe("+251711223344");
    expect(normalizePhone("09 11 22 33 44")).toBe("+251911223344");
  });

  it("phoneSchema parses and normalizes phone number", () => {
    expect(phoneSchema.parse("0911223344")).toBe("+251911223344");
  });

  it("rejects non-Ethiopian and invalid formats", () => {
    expect(() => normalizePhone("12345")).toThrow();
    expect(() => normalizePhone("0811223344")).toThrow();
    expect(() => normalizePhone("+14155552671")).toThrow();
    expect(() => phoneSchema.parse("invalid")).toThrow();
  });
});

describe("Date Validation", () => {
  it("accepts valid calendar dates", () => {
    expect(dateSchema.safeParse("2026-10-21").success).toBe(true);
    expect(dateSchema.safeParse("2024-02-29").success).toBe(true); // leap year
  });

  it("rejects invalid calendar dates and bad formatting", () => {
    expect(dateSchema.safeParse("2026-02-31").success).toBe(false);
    expect(dateSchema.safeParse("2026/10/21").success).toBe(false);
    expect(dateSchema.safeParse("not-a-date").success).toBe(false);
  });

  it("pastOrTodayDateSchema rejects future dates", () => {
    expect(pastOrTodayDateSchema.safeParse("2099-01-01").success).toBe(false);
    expect(pastOrTodayDateSchema.safeParse("2025-01-01").success).toBe(true);
  });
});

describe("Student & Guardian Schemas", () => {
  it("validates student payload and normalizes guardian phone", () => {
    const res = studentSchema.safeParse({
      admissionNo: "ADM-001",
      fullName: "Almaz Kebede",
      classId: "cls-1",
      guardianName: "Kebede Tessema",
      guardianPhone: "0911223344",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.guardianPhone).toBe("+251911223344");
      expect(res.data.active).toBe(true);
    }
  });

  it("rejects incomplete student data", () => {
    const res = studentSchema.safeParse({
      admissionNo: "",
      fullName: "A",
      classId: "",
      guardianName: "",
      guardianPhone: "0812345678",
    });
    expect(res.success).toBe(false);
  });

  it("validates guardian data", () => {
    const res = guardianSchema.safeParse({
      studentId: "stu-1",
      name: "Kebede Tessema",
      phone: "0911223344",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.phone).toBe("+251911223344");
      expect(res.data.isPrimary).toBe(true);
    }
  });
});

describe("Class Schema", () => {
  it("validates class name and teacher assignments", () => {
    expect(classSchema.safeParse({ name: "Class 7 B" }).success).toBe(true);
    expect(classSchema.safeParse({ name: "" }).success).toBe(false);
    expect(assignTeacherSchema.safeParse({ userId: "u1", classId: "c1" }).success).toBe(true);
    expect(assignTeacherSchema.safeParse({ userId: "", classId: "c1" }).success).toBe(false);
  });
});

describe("Attendance Schema", () => {
  it("validates statuses and batch records", () => {
    expect(attendanceStatusSchema.safeParse("PRESENT").success).toBe(true);
    expect(attendanceStatusSchema.safeParse("ABSENT").success).toBe(true);
    expect(attendanceStatusSchema.safeParse("LEAVE").success).toBe(true);
    expect(attendanceStatusSchema.safeParse("LATE").success).toBe(true);
    expect(attendanceStatusSchema.safeParse("OTHER").success).toBe(false);

    const markRes = markAttendanceSchema.safeParse({
      classId: "c1",
      date: "2025-10-20",
      records: [{ studentId: "s1", status: "PRESENT" }],
    });
    expect(markRes.success).toBe(true);
  });

  it("rejects empty records and future date", () => {
    expect(
      markAttendanceSchema.safeParse({
        classId: "c1",
        date: "2025-10-20",
        records: [],
      }).success
    ).toBe(false);

    expect(
      markAttendanceSchema.safeParse({
        classId: "c1",
        date: "2099-01-01",
        records: [{ studentId: "s1", status: "PRESENT" }],
      }).success
    ).toBe(false);
  });
});

describe("Notification & Auth Schemas", () => {
  it("validates notification queue payload", () => {
    const res = queueNotificationSchema.safeParse({
      attendanceId: "att-1",
      guardianPhone: "0911223344",
      studentName: "Almaz Kebede",
      className: "Class 7 B",
      date: "2025-10-20",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.guardianPhone).toBe("+251911223344");
      expect(res.data.type).toBe("ABSENCE");
    }
    expect(notificationStatusSchema.safeParse("PENDING").success).toBe(true);
    expect(notificationStatusSchema.safeParse("INVALID").success).toBe(false);
  });

  it("validates login credentials", () => {
    expect(loginSchema.safeParse({ email: "admin@gmail.com", password: "password123" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "invalid", password: "123" }).success).toBe(false);
  });
});
