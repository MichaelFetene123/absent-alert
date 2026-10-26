/**
 * Consistent TanStack Query key factory across AbsentAlert domains.
 */
export const queryKeys = {
  classes: {
    all: ["classes"] as const,
    details: () => [...queryKeys.classes.all, "details"] as const,
    availableTeachers: () => [...queryKeys.classes.all, "available-teachers"] as const,
  },
  teachers: {
    all: ["teachers"] as const,
    details: () => [...queryKeys.teachers.all, "details"] as const,
    availableClasses: () => [...queryKeys.teachers.all, "available-classes"] as const,
  },
  students: {
    all: ["students"] as const,
    list: (params?: { classId?: string; search?: string; status?: string }) =>
      [...queryKeys.students.all, "list", params ?? {}] as const,
    classes: () => [...queryKeys.students.all, "classes"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    daily: (classId: string, date: string) =>
      [...queryKeys.attendance.all, "daily", classId, date] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: { status?: string; classId?: string; date?: string; page?: number; pageSize?: number }) =>
      [...queryKeys.notifications.all, "list", params ?? {}] as const,
  },
  policies: {
    all: ["policies"] as const,
    active: () => [...queryKeys.policies.all, "active"] as const,
    list: () => [...queryKeys.policies.all, "list"] as const,
  },
  profile: {
    all: ["profile"] as const,
    user: () => [...queryKeys.profile.all, "user"] as const,
  },
  smshub: {
    all: ["smshub"] as const,
    balance: () => [...queryKeys.smshub.all, "balance"] as const,
  },
} as const;
