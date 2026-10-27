import { updateTag, cacheTag, cacheLife } from "next/cache";

// Augment Next.js CacheLifeProfiles interface to register our domain-specific cache profiles
declare module "next/cache" {
  interface CacheLifeProfiles {
    attendance: true;
    notifications: true;
    dashboard: true;
    directory: true;
    structure: true;
    institutional: true;
    analytics: true;
  }
}

/**
 * Shared, reusable cache tag constants across AbsentAlert domains.
 * Used with Next.js updateTag() in mutation actions and cacheTag() in query/read actions.
 */
export const CACHE_TAGS = {
  // Classes domain
  CLASSES: "classes",
  CLASS: (id: string) => `class-${id}`,

  // Teachers domain
  TEACHERS: "teachers",
  TEACHER: (id: string) => `teacher-${id}`,

  // Students domain
  STUDENTS: "students",
  STUDENT: (id: string) => `student-${id}`,
  STUDENTS_BY_CLASS: (classId: string) => `students-class-${classId}`,

  // Guardians domain
  GUARDIANS: "guardians",
  GUARDIAN: (id: string) => `guardian-${id}`,

  // Attendance domain
  ATTENDANCE: "attendance",
  ATTENDANCE_DAILY: (classId: string, date: string) => `attendance-${classId}-${date}`,
  ATTENDANCE_OVERVIEW: (classId: string) => `attendance-overview-${classId}`,

  // Exceptions domain
  EXCEPTIONS: "exceptions",
  EXCEPTION: (id: string) => `exception-${id}`,

  // Notifications domain
  NOTIFICATIONS: "notifications",
  NOTIFICATION: (id: string) => `notification-${id}`,

  // Templates domain
  TEMPLATES: "templates",
  TEMPLATE: (id: string) => `template-${id}`,

  // Settings domain
  SETTINGS: "settings",
  SMSHUB: "smshub",

  // Academic domain
  ACADEMIC: "academic",

  // Reports domain
  REPORTS: "reports",

  // Profile domain
  PROFILE: (userId: string) => `profile-${userId}`,

  // Dashboard domain
  DASHBOARD: "dashboard",
} as const;

export type CacheTagKey = keyof typeof CACHE_TAGS;

/**
 * Domain-specific cacheLife profile identifiers configured in next.config.ts.
 */
export const CACHE_PROFILES = {
  // 1 min revalidation - live student attendance
  ATTENDANCE: "attendance",
  // 1 min revalidation - notification delivery logs & SMS dispatch
  NOTIFICATIONS: "notifications",
  // 1 min revalidation - real-time operational dashboard & live balance
  DASHBOARD: "dashboard",
  // 1 hour revalidation - students and guardians directories
  DIRECTORY: "directory",
  // 2 hours revalidation - classes, teachers, and assignment structure
  STRUCTURE: "structure",
  // 1 day revalidation - academic calendar and institutional settings
  INSTITUTIONAL: "institutional",
  // 30 min revalidation - historical attendance analytics and reports
  ANALYTICS: "analytics",
} as const;

export type CacheProfileKey = keyof typeof CACHE_PROFILES;

const resolvedCacheLife =
  typeof cacheLife === "function" ? cacheLife : ((_profile: any) => {});

export { updateTag, cacheTag, resolvedCacheLife as cacheLife };

/**
 * Safely invalidates/updates cache tags, handling any environment boundaries
 * (e.g. non-action execution contexts or test runners) gracefully.
 */
export function safeUpdateTag(...tags: string[]): void {
  for (const tag of tags) {
    try {
      updateTag(tag);
    } catch {
      // Graceful fallback outside Next.js Server Action context
    }
  }
}

/**
 * Safely tags cached data with one or more cache tags, handling any environment boundaries
 * (e.g. outside a 'use cache' context or test runners) gracefully.
 */
export function safeCacheTag(...tags: string[]): void {
  try {
    cacheTag(...tags);
  } catch {
    // Graceful fallback outside Next.js cache context
  }
}
