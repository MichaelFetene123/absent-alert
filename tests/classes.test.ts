import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only and next/cache for Vitest test environment
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

import {
  formatClassName,
  parseClassGradeSection,
  classFormSchema,
  updateClassSchema,
  classSchema,
} from "../src/lib/validations/class";

// Mock guards and db
const mockRequireAdmin = vi.fn();
const mockRequireUser = vi.fn();

vi.mock("@/lib/guards", () => ({
  requireAdmin: () => mockRequireAdmin(),
  requireUser: () => mockRequireUser(),
}));

// In-memory mock DB tables
type ClassRecord = { id: string; name: string };
type StudentRecord = { id: string; name: string; classId: string; active: boolean };
type TeacherClassRecord = { userId: string; classId: string };
type UserRecord = { id: string; name: string; email: string; role: "ADMIN" | "TEACHER" };

let mockClasses: ClassRecord[] = [];
let mockStudents: StudentRecord[] = [];
let mockTeacherClasses: TeacherClassRecord[] = [];
let mockUsers: UserRecord[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    orm: {
      public: {
        Class: {
          all: vi.fn(async () => [...mockClasses]),
          where: vi.fn((query: Partial<ClassRecord>) => ({
            first: vi.fn(async () => mockClasses.find((c) => !query.id || c.id === query.id) || null),
            update: vi.fn(async (data: Partial<ClassRecord>) => {
              const idx = mockClasses.findIndex((c) => c.id === query.id);
              if (idx !== -1) mockClasses[idx] = { ...mockClasses[idx]!, ...data };
            }),
            delete: vi.fn(async () => {
              mockClasses = mockClasses.filter((c) => c.id !== query.id);
            }),
          })),
          create: vi.fn(async (data: { name: string }) => {
            const newClass = { id: `cls_${Date.now()}_${Math.random()}`, name: data.name };
            mockClasses.push(newClass);
            return newClass;
          }),
        },
        Student: {
          all: vi.fn(async () => [...mockStudents]),
          where: vi.fn((query: Partial<StudentRecord>) => ({
            all: vi.fn(async () =>
              mockStudents.filter(
                (s) =>
                  (query.classId === undefined || s.classId === query.classId) &&
                  (query.active === undefined || s.active === query.active)
              )
            ),
          })),
        },
        TeacherClass: {
          all: vi.fn(async () => [...mockTeacherClasses]),
          where: vi.fn((query: Partial<TeacherClassRecord>) => ({
            all: vi.fn(async () =>
              mockTeacherClasses.filter(
                (t) =>
                  (query.classId === undefined || t.classId === query.classId) &&
                  (query.userId === undefined || t.userId === query.userId)
              )
            ),
            first: vi.fn(async () =>
              mockTeacherClasses.find(
                (t) =>
                  (query.classId === undefined || t.classId === query.classId) &&
                  (query.userId === undefined || t.userId === query.userId)
              ) || null
            ),
            delete: vi.fn(async () => {
              mockTeacherClasses = mockTeacherClasses.filter(
                (t) =>
                  (query.classId !== undefined && t.classId !== query.classId) ||
                  (query.userId !== undefined && t.userId !== query.userId)
              );
            }),
          })),
          create: vi.fn(async (data: TeacherClassRecord) => {
            mockTeacherClasses.push(data);
            return data;
          }),
        },
        User: {
          all: vi.fn(async () => [...mockUsers]),
          where: vi.fn((query: Partial<UserRecord>) => ({
            all: vi.fn(async () =>
              mockUsers.filter((u) => query.role === undefined || u.role === query.role)
            ),
            first: vi.fn(async () =>
              mockUsers.find(
                (u) =>
                  (!query.id || u.id === query.id) &&
                  (query.role === undefined || u.role === query.role)
              ) || null
            ),
          })),
        },
      },
    },
  },
}));

import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
  listClassesWithDetails,
} from "../src/actions/class.actions";

describe("Class Validation & Formatting", () => {
  it("formatClassName builds clean canonical names", () => {
    // Numeric grade
    expect(formatClassName("7", "b")).toBe("Grade 7 B");
    expect(formatClassName("8", "A")).toBe("Grade 8 A");
    // With Grade prefix
    expect(formatClassName("Grade 7", "b")).toBe("Grade 7 B");
    // With Class prefix
    expect(formatClassName("Class 10", "c")).toBe("Class 10 C");
    // Kindergarten or custom grade
    expect(formatClassName("KG 2", "Blue")).toBe("Grade KG 2 BLUE");
    // Custom name override
    expect(formatClassName("7", "B", "Accelerated Math 7")).toBe("Accelerated Math 7");
  });

  it("parseClassGradeSection extracts grade and section", () => {
    expect(parseClassGradeSection("Grade 7 B")).toEqual({
      grade: "Grade 7",
      section: "B",
    });
    expect(parseClassGradeSection("Class 7 B")).toEqual({
      grade: "Class 7",
      section: "B",
    });
    expect(parseClassGradeSection("8 A")).toEqual({
      grade: "8",
      section: "A",
    });
  });

  it("classFormSchema validates grade and section limits", () => {
    const valid = classFormSchema.safeParse({
      grade: "Grade 8",
      section: "A",
      teacherIds: ["usr_1"],
    });
    expect(valid.success).toBe(true);

    const emptyGrade = classFormSchema.safeParse({
      grade: "",
      section: "A",
    });
    expect(emptyGrade.success).toBe(false);

    const emptySection = classFormSchema.safeParse({
      grade: "Grade 8",
      section: "",
    });
    expect(emptySection.success).toBe(false);
  });

  it("updateClassSchema requires id and valid name", () => {
    expect(
      updateClassSchema.safeParse({
        id: "cuid1234567890123456789012",
        name: "Grade 8 B",
      }).success
    ).toBe(true);

    expect(
      updateClassSchema.safeParse({
        id: "cuid1234567890123456789012",
        name: "",
      }).success
    ).toBe(false);
  });
});

describe("Class Management Actions & Dependency Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    mockRequireUser.mockResolvedValue({ id: "admin_1", role: "ADMIN" });

    // Seed mock database
    mockClasses = [
      { id: "cls_7b", name: "Class 7 B" },
      { id: "cls_empty", name: "Grade 9 C" },
    ];
    mockStudents = [
      { id: "std_1", name: "Abebe Bikila", classId: "cls_7b", active: true },
      { id: "std_2", name: "Almaz Ayana", classId: "cls_7b", active: false },
    ];
    mockTeacherClasses = [{ userId: "tch_1", classId: "cls_7b" }];
    mockUsers = [
      { id: "tch_1", name: "Alemayehu Teacher", email: "teacher@school.et", role: "TEACHER" },
    ];
  });

  it("listClassesWithDetails accurately calculates student counts and teachers", async () => {
    const list = await listClassesWithDetails();
    expect(list).toHaveLength(2);

    const class7B = list.find((c) => c.id === "cls_7b")!;
    expect(class7B.totalStudentCount).toBe(2);
    expect(class7B.activeStudentCount).toBe(1);
    expect(class7B.teachers).toHaveLength(1);
    expect(class7B.teachers[0]!.name).toBe("Alemayehu Teacher");

    const classEmpty = list.find((c) => c.id === "cls_empty")!;
    expect(classEmpty.totalStudentCount).toBe(0);
    expect(classEmpty.activeStudentCount).toBe(0);
    expect(classEmpty.teachers).toHaveLength(0);
  });

  it("createClassAction creates a new class and prevents duplicate names", async () => {
    // 1. Success creation
    const res = await createClassAction({
      grade: "Grade 8",
      section: "A",
      teacherIds: ["tch_1"],
    });
    expect(res.ok).toBe(true);
    expect(res.data?.name).toBe("Grade 8 A");
    expect(mockClasses.some((c) => c.name === "Grade 8 A")).toBe(true);

    // 2. Duplicate rejection
    const dupRes = await createClassAction({
      grade: "Grade 8",
      section: "A",
    });
    expect(dupRes.ok).toBe(false);
    expect(dupRes.error).toContain("already exists");
  });

  it("STRICT DEPENDENCY GUARD: Prevents deleting class with enrolled students", async () => {
    // Attempt to delete class "cls_7b" which has 2 enrolled students
    const deleteRes = await deleteClassAction("cls_7b");

    expect(deleteRes.ok).toBe(false);
    expect(deleteRes.error).toContain("Cannot delete");
    expect(deleteRes.error).toContain("2 student(s)");
    expect(deleteRes.error).toContain("enrolled");

    // Verify class was NOT deleted from the database
    expect(mockClasses.some((c) => c.id === "cls_7b")).toBe(true);
  });

  it("Deletes a class successfully when it has 0 enrolled students", async () => {
    // Attempt to delete empty class "cls_empty"
    const deleteRes = await deleteClassAction("cls_empty");

    expect(deleteRes.ok).toBe(true);
    // Verify class was removed from the database
    expect(mockClasses.some((c) => c.id === "cls_empty")).toBe(false);
  });

  it("updateClassAction modifies class name and rejects duplicate names", async () => {
    // Update name of cls_empty
    const updateRes = await updateClassAction({
      id: "cls_empty",
      name: "Grade 9 C - Advanced",
    });
    expect(updateRes.ok).toBe(true);
    expect(mockClasses.find((c) => c.id === "cls_empty")?.name).toBe("Grade 9 C - Advanced");

    // Conflict with another class
    const conflictRes = await updateClassAction({
      id: "cls_empty",
      name: "Class 7 B", // already exists
    });
    expect(conflictRes.ok).toBe(false);
    expect(conflictRes.error).toContain("already exists");
  });

  it("enforces requireAdmin for create and delete actions", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("Unauthorized: Admin role required"));
    const res = await createClassAction({ grade: "Grade 10", section: "B" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Unauthorized");

    mockRequireAdmin.mockRejectedValueOnce(new Error("Unauthorized: Admin role required"));
    const delRes = await deleteClassAction("cls_empty");
    expect(delRes.ok).toBe(false);
    expect(delRes.error).toContain("Unauthorized");
  });
});
