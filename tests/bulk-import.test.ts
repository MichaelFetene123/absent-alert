import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

const mockRequireAdmin = vi.fn();
const mockRequireUser = vi.fn();

vi.mock("@/lib/guards", () => ({
  requireAdmin: () => mockRequireAdmin(),
  requireUser: () => mockRequireUser(),
}));

type ClassRecord = { id: string; name: string };
type StudentRecord = { id: string; admissionNo: string; fullName: string; classId: string; active: boolean };
type GuardianRecord = { id: string; studentId: string; name: string; phone: string; isPrimary: boolean };

let mockClasses: ClassRecord[] = [];
let mockStudents: StudentRecord[] = [];
let mockGuardians: GuardianRecord[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    orm: {
      public: {
        Class: {
          all: vi.fn(async () => [...mockClasses]),
          where: vi.fn((query: Partial<ClassRecord>) => ({
            first: vi.fn(async () => mockClasses.find((c) => !query.id || c.id === query.id) || null),
          })),
        },
        Student: {
          all: vi.fn(async () => [...mockStudents]),
          where: vi.fn((query: Partial<StudentRecord>) => ({
            first: vi.fn(async () =>
              mockStudents.find(
                (s) =>
                  (!query.id || s.id === query.id) &&
                  (!query.admissionNo || s.admissionNo === query.admissionNo)
              ) || null
            ),
          })),
          create: vi.fn(async (data: Omit<StudentRecord, "id">) => {
            const student = { id: `stu_${Date.now()}_${Math.random()}`, ...data };
            mockStudents.push(student);
            return student;
          }),
        },
        Guardian: {
          create: vi.fn(async (data: Omit<GuardianRecord, "id">) => {
            const guardian = { id: `grd_${Date.now()}_${Math.random()}`, ...data };
            mockGuardians.push(guardian);
            return guardian;
          }),
        },
      },
    },
  },
}));

import { bulkImportStudentsAction } from "../src/actions/student.actions";

describe("bulkImportStudentsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClasses = [
      { id: "class_1", name: "Grade 10A" },
      { id: "class_2", name: "Grade 10B" },
    ];
    mockStudents = [
      { id: "stu_existing", admissionNo: "ADM-001", fullName: "Existing Abebe", classId: "class_1", active: true },
    ];
    mockGuardians = [];
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
  });

  it("successfully imports valid students and normalizes Ethiopian phone numbers", async () => {
    const rows = [
      {
        admissionNo: "ADM-100",
        fullName: "Almaz Ayana",
        classNameOrId: "Grade 10A",
        guardianName: "Ayana Desta",
        guardianPhone: "0911223344",
      },
      {
        admissionNo: "ADM-101",
        fullName: "Kenenisa Bekele",
        classNameOrId: "Grade 10B",
        guardianName: "Bekele Benti",
        guardianPhone: "+251711223344",
      },
    ];

    const result = await bulkImportStudentsAction(rows);

    expect(result.ok).toBe(true);
    expect(result.data?.importedCount).toBe(2);
    expect(result.data?.skippedCount).toBe(0);
    expect(result.data?.errors).toHaveLength(0);

    // Verify created in DB
    expect(mockStudents.some((s) => s.admissionNo === "ADM-100")).toBe(true);
    expect(mockStudents.some((s) => s.admissionNo === "ADM-101")).toBe(true);
    // Verify phone normalization
    expect(mockGuardians.some((g) => g.phone === "+251911223344")).toBe(true);
    expect(mockGuardians.some((g) => g.phone === "+251711223344")).toBe(true);
  });

  it("flags duplicate admission numbers from database and within file", async () => {
    const rows = [
      {
        admissionNo: "ADM-001", // already in DB
        fullName: "Duplicate DB",
        classNameOrId: "Grade 10A",
        guardianName: "Parent 1",
        guardianPhone: "0911223344",
      },
      {
        admissionNo: "ADM-200",
        fullName: "Valid Row 1",
        classNameOrId: "Grade 10A",
        guardianName: "Parent 2",
        guardianPhone: "0911223345",
      },
      {
        admissionNo: "ADM-200", // duplicate in batch
        fullName: "Valid Row 2 Duplicate",
        classNameOrId: "Grade 10A",
        guardianName: "Parent 3",
        guardianPhone: "0911223346",
      },
    ];

    const result = await bulkImportStudentsAction(rows);

    expect(result.ok).toBe(true);
    expect(result.data?.importedCount).toBe(1);
    expect(result.data?.skippedCount).toBe(2);
    expect(result.data?.errors[0].admissionNo).toBe("ADM-001");
    expect(result.data?.errors[1].admissionNo).toBe("ADM-200");
  });

  it("flags invalid Ethiopian phone numbers without stopping valid rows", async () => {
    const rows = [
      {
        admissionNo: "ADM-300",
        fullName: "Valid Student",
        classNameOrId: "Grade 10A",
        guardianName: "Parent",
        guardianPhone: "0911223344",
      },
      {
        admissionNo: "ADM-301",
        fullName: "Invalid Phone Student",
        classNameOrId: "Grade 10A",
        guardianName: "Parent",
        guardianPhone: "12345", // invalid
      },
    ];

    const result = await bulkImportStudentsAction(rows);

    expect(result.ok).toBe(true);
    expect(result.data?.importedCount).toBe(1);
    expect(result.data?.skippedCount).toBe(1);
    expect(result.data?.errors[0].error).toContain("Invalid Ethiopian phone number");
  });

  it("flags non-existent classroom names", async () => {
    const rows = [
      {
        admissionNo: "ADM-400",
        fullName: "Student Unknown Class",
        classNameOrId: "Grade 12Z", // does not exist
        guardianName: "Parent",
        guardianPhone: "0911223344",
      },
    ];

    const result = await bulkImportStudentsAction(rows);

    expect(result.ok).toBe(true);
    expect(result.data?.importedCount).toBe(0);
    expect(result.data?.skippedCount).toBe(1);
    expect(result.data?.errors[0].error).toContain("Class 'Grade 12Z' not found");
  });
});
