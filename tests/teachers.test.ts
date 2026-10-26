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
  createTeacherSchema,
  updateTeacherSchema,
  assignTeacherClassesSchema,
} from "../src/lib/validations/teacher";

// Mock guards and db
const mockRequireAdmin = vi.fn();
const mockRequireUser = vi.fn();

vi.mock("@/lib/guards", () => ({
  requireAdmin: () => mockRequireAdmin(),
  requireUser: () => mockRequireUser(),
}));

// In-memory mock DB records
type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "TEACHER";
};
type ClassRecord = { id: string; name: string };
type TeacherClassRecord = { userId: string; classId: string };
type AttendanceRecord = { id: string; studentId: string; date: string; status: string; markedById: string };

let mockUsers: UserRecord[] = [];
let mockClasses: ClassRecord[] = [];
let mockTeacherClasses: TeacherClassRecord[] = [];
let mockAttendance: AttendanceRecord[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    orm: {
      public: {
        User: {
          all: vi.fn(async () => [...mockUsers]),
          where: vi.fn((query: Partial<UserRecord>) => ({
            all: vi.fn(async () =>
              mockUsers.filter(
                (u) =>
                  (!query.id || u.id === query.id) &&
                  (!query.email || u.email.toLowerCase() === query.email.toLowerCase()) &&
                  (!query.role || u.role === query.role)
              )
            ),
            first: vi.fn(async () =>
              mockUsers.find(
                (u) =>
                  (!query.id || u.id === query.id) &&
                  (!query.email || u.email.toLowerCase() === query.email.toLowerCase()) &&
                  (!query.role || u.role === query.role)
              ) || null
            ),
            update: vi.fn(async (data: Partial<UserRecord>) => {
              const idx = mockUsers.findIndex((u) => u.id === query.id);
              if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx]!, ...data };
            }),
            delete: vi.fn(async () => {
              mockUsers = mockUsers.filter((u) => u.id !== query.id);
            }),
          })),
          create: vi.fn(async (data: Omit<UserRecord, "id">) => {
            const newUser: UserRecord = {
              id: `usr_${Date.now()}_${Math.random()}`,
              ...data,
            };
            mockUsers.push(newUser);
            return newUser;
          }),
        },
        Class: {
          all: vi.fn(async () => [...mockClasses]),
          where: vi.fn((query: Partial<ClassRecord>) => ({
            all: vi.fn(async () =>
              mockClasses.filter((c) => !query.id || c.id === query.id)
            ),
            first: vi.fn(async () =>
              mockClasses.find((c) => !query.id || c.id === query.id) || null
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
        AttendanceRecord: {
          all: vi.fn(async () => [...mockAttendance]),
          where: vi.fn((query: Partial<AttendanceRecord>) => ({
            all: vi.fn(async () =>
              mockAttendance.filter(
                (a) => query.markedById === undefined || a.markedById === query.markedById
              )
            ),
          })),
        },
      },
    },
  },
}));

import {
  createTeacherAction,
  updateTeacherAction,
  deleteTeacherAction,
  listTeachersWithDetails,
  assignClassesToTeacherAction,
} from "../src/actions/teacher.actions";

describe("Teacher Validation Schemas", () => {
  it("createTeacherSchema validates required fields, email format, and password length", () => {
    // Valid
    const valid = createTeacherSchema.safeParse({
      name: "Teacher Almaz",
      email: "almaz@school.et",
      password: "securepassword123",
      classIds: ["cls_1"],
    });
    expect(valid.success).toBe(true);

    // Invalid email
    const badEmail = createTeacherSchema.safeParse({
      name: "Teacher Almaz",
      email: "not-an-email",
      password: "securepassword123",
    });
    expect(badEmail.success).toBe(false);

    // Short password (<6 chars)
    const shortPassword = createTeacherSchema.safeParse({
      name: "Teacher Almaz",
      email: "almaz@school.et",
      password: "123",
    });
    expect(shortPassword.success).toBe(false);

    // Short name (<2 chars)
    const shortName = createTeacherSchema.safeParse({
      name: "A",
      email: "almaz@school.et",
      password: "securepassword123",
    });
    expect(shortName.success).toBe(false);
  });

  it("updateTeacherSchema permits empty password to keep existing credentials", () => {
    const validNoPassword = updateTeacherSchema.safeParse({
      id: "cuid1234567890123456789012",
      name: "Teacher Almaz Updated",
      email: "almaz.updated@school.et",
      password: "",
    });
    expect(validNoPassword.success).toBe(true);

    const validNewPassword = updateTeacherSchema.safeParse({
      id: "cuid1234567890123456789012",
      name: "Teacher Almaz Updated",
      email: "almaz.updated@school.et",
      password: "brandnewpassword",
    });
    expect(validNewPassword.success).toBe(true);
  });
});

describe("Teacher Management Server Actions & Referential Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    mockRequireUser.mockResolvedValue({ id: "admin_1", role: "ADMIN" });

    // Seed mock data
    mockUsers = [
      {
        id: "tch_assigned",
        name: "Teacher Assigned",
        email: "assigned@school.et",
        passwordHash: "$2a$10$xyz",
        role: "TEACHER",
      },
      {
        id: "tch_marked",
        name: "Teacher With Attendance",
        email: "marked@school.et",
        passwordHash: "$2a$10$xyz",
        role: "TEACHER",
      },
      {
        id: "tch_free",
        name: "Teacher Free",
        email: "free@school.et",
        passwordHash: "$2a$10$xyz",
        role: "TEACHER",
      },
    ];

    mockClasses = [
      { id: "cls_7b", name: "Class 7 B" },
      { id: "cls_8a", name: "Grade 8 A" },
    ];

    mockTeacherClasses = [
      { userId: "tch_assigned", classId: "cls_7b" },
      { userId: "tch_assigned", classId: "cls_8a" },
    ];

    mockAttendance = [
      {
        id: "att_1",
        studentId: "std_1",
        date: "2026-10-24",
        status: "PRESENT",
        markedById: "tch_marked",
      },
    ];
  });

  it("listTeachersWithDetails accurately computes class assignments and marked records", async () => {
    const list = await listTeachersWithDetails();
    expect(list).toHaveLength(3);

    const assigned = list.find((t) => t.id === "tch_assigned")!;
    expect(assigned.assignedClasses).toHaveLength(2);
    expect(assigned.assignedClasses.map((c) => c.name)).toEqual(["Class 7 B", "Grade 8 A"]);
    expect(assigned.markedAttendanceCount).toBe(0);

    const marked = list.find((t) => t.id === "tch_marked")!;
    expect(marked.assignedClasses).toHaveLength(0);
    expect(marked.markedAttendanceCount).toBe(1);

    const free = list.find((t) => t.id === "tch_free")!;
    expect(free.assignedClasses).toHaveLength(0);
    expect(free.markedAttendanceCount).toBe(0);
  });

  it("createTeacherAction creates a teacher account, hashes password, and prevents duplicate email", async () => {
    // 1. Success create
    const res = await createTeacherAction({
      name: "New Teacher",
      email: "new.teacher@school.et",
      password: "password123",
      classIds: ["cls_7b"],
    });
    expect(res.ok).toBe(true);
    expect(res.data?.email).toBe("new.teacher@school.et");

    const created = mockUsers.find((u) => u.email === "new.teacher@school.et");
    expect(created).toBeDefined();
    expect(created?.role).toBe("TEACHER");
    expect(created?.passwordHash).not.toBe("password123"); // hashed

    // Class relation created
    expect(
      mockTeacherClasses.some((tc) => tc.userId === created?.id && tc.classId === "cls_7b")
    ).toBe(true);

    // 2. Duplicate email rejection
    const dupRes = await createTeacherAction({
      name: "Duplicate Teacher",
      email: "new.teacher@school.et",
      password: "password123",
    });
    expect(dupRes.ok).toBe(false);
    expect(dupRes.error).toContain("already exists");
  });

  it("STRICT DEPENDENCY GUARD 1: Prevents deleting teacher with active class assignments", async () => {
    const deleteRes = await deleteTeacherAction("tch_assigned");

    expect(deleteRes.ok).toBe(false);
    expect(deleteRes.error).toContain("Cannot delete");
    expect(deleteRes.error).toContain("assigned to 2 class(es)");

    // Verify teacher still exists
    expect(mockUsers.some((u) => u.id === "tch_assigned")).toBe(true);
  });

  it("STRICT DEPENDENCY GUARD 2: Prevents deleting teacher who has marked attendance records", async () => {
    const deleteRes = await deleteTeacherAction("tch_marked");

    expect(deleteRes.ok).toBe(false);
    expect(deleteRes.error).toContain("Cannot delete");
    expect(deleteRes.error).toContain("marked 1 attendance record(s)");
    expect(deleteRes.error).toContain("audit integrity");

    // Verify teacher still exists
    expect(mockUsers.some((u) => u.id === "tch_marked")).toBe(true);
  });

  it("Deletes a teacher cleanly when 0 classes and 0 attendance records are linked", async () => {
    const deleteRes = await deleteTeacherAction("tch_free");

    expect(deleteRes.ok).toBe(true);
    // Verify teacher was removed
    expect(mockUsers.some((u) => u.id === "tch_free")).toBe(false);
  });

  it("updateTeacherAction updates fields and synchronizes class assignments", async () => {
    const updateRes = await updateTeacherAction({
      id: "tch_free",
      name: "Teacher Free Updated",
      email: "free.updated@school.et",
      classIds: ["cls_7b"],
    });

    expect(updateRes.ok).toBe(true);

    const updated = mockUsers.find((u) => u.id === "tch_free");
    expect(updated?.name).toBe("Teacher Free Updated");
    expect(updated?.email).toBe("free.updated@school.et");

    // Verify new class assignment
    expect(
      mockTeacherClasses.some((tc) => tc.userId === "tch_free" && tc.classId === "cls_7b")
    ).toBe(true);
  });

  it("assignClassesToTeacherAction updates class links directly", async () => {
    const assignRes = await assignClassesToTeacherAction("tch_free", ["cls_8a"]);
    expect(assignRes.ok).toBe(true);

    const links = mockTeacherClasses.filter((tc) => tc.userId === "tch_free");
    expect(links).toHaveLength(1);
    expect(links[0]?.classId).toBe("cls_8a");
  });

  it("enforces requireAdmin for mutations", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("Unauthorized: Admin role required"));
    const createRes = await createTeacherAction({
      name: "Test",
      email: "test@school.et",
      password: "password123",
    });
    expect(createRes.ok).toBe(false);
    expect(createRes.error).toContain("Unauthorized");

    mockRequireAdmin.mockRejectedValueOnce(new Error("Unauthorized: Admin role required"));
    const deleteRes = await deleteTeacherAction("tch_free");
    expect(deleteRes.ok).toBe(false);
    expect(deleteRes.error).toContain("Unauthorized");
  });
});
