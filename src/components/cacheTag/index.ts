import { updateTag, cacheTag } from "next/cache";

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

  // Policies domain
  POLICIES: "policies",
  POLICY: (id: string) => `policy-${id}`,

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
 * Re-export native Next.js caching primitives for convenience
 */
export { updateTag, cacheTag };

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
