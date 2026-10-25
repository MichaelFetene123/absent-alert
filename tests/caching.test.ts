import { describe, it, expect, vi } from "vitest";
import {
  CACHE_TAGS,
  safeUpdateTag,
  safeCacheTag,
} from "../src/components/cacheTag";

describe("CacheTag Constants and Helpers", () => {
  it("defines standard domain cache tags", () => {
    expect(CACHE_TAGS.CLASSES).toBe("classes");
    expect(CACHE_TAGS.TEACHERS).toBe("teachers");
    expect(CACHE_TAGS.STUDENTS).toBe("students");
    expect(CACHE_TAGS.ATTENDANCE).toBe("attendance");
    expect(CACHE_TAGS.NOTIFICATIONS).toBe("notifications");
    expect(CACHE_TAGS.DASHBOARD).toBe("dashboard");
  });

  it("generates entity-specific and relational cache tags accurately", () => {
    expect(CACHE_TAGS.CLASS("cls-123")).toBe("class-cls-123");
    expect(CACHE_TAGS.TEACHER("tch-456")).toBe("teacher-tch-456");
    expect(CACHE_TAGS.STUDENT("std-789")).toBe("student-std-789");
    expect(CACHE_TAGS.STUDENTS_BY_CLASS("cls-123")).toBe("students-class-cls-123");
    expect(CACHE_TAGS.ATTENDANCE_DAILY("cls-123", "2026-10-25")).toBe("attendance-cls-123-2026-10-25");
    expect(CACHE_TAGS.ATTENDANCE_OVERVIEW("cls-123")).toBe("attendance-overview-cls-123");
    expect(CACHE_TAGS.NOTIFICATION("notif-999")).toBe("notification-notif-999");
  });

  it("safeUpdateTag executes without throwing outside of Server Action context", () => {
    expect(() => {
      safeUpdateTag(CACHE_TAGS.CLASSES, CACHE_TAGS.STUDENTS, CACHE_TAGS.DASHBOARD);
    }).not.toThrow();
  });

  it("safeCacheTag executes without throwing outside of use cache context", () => {
    expect(() => {
      safeCacheTag(CACHE_TAGS.CLASSES, CACHE_TAGS.TEACHERS);
    }).not.toThrow();
  });
});
