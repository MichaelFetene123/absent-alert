import { describe, it, expect, vi } from "vitest";
import {
  CACHE_TAGS,
  CACHE_PROFILES,
  safeUpdateTag,
  safeCacheTag,
} from "../src/components/cacheTag";

describe("CacheTag Constants and Helpers", () => {
  it("defines standard domain cache tags", () => {
    expect(CACHE_TAGS.CLASSES).toBe("classes");
    expect(CACHE_TAGS.TEACHERS).toBe("teachers");
    expect(CACHE_TAGS.STUDENTS).toBe("students");
    expect(CACHE_TAGS.GUARDIANS).toBe("guardians");
    expect(CACHE_TAGS.ATTENDANCE).toBe("attendance");
    expect(CACHE_TAGS.EXCEPTIONS).toBe("exceptions");
    expect(CACHE_TAGS.NOTIFICATIONS).toBe("notifications");
    expect(CACHE_TAGS.TEMPLATES).toBe("templates");
    expect(CACHE_TAGS.POLICIES).toBe("policies");
    expect(CACHE_TAGS.SETTINGS).toBe("settings");
    expect(CACHE_TAGS.SMSHUB).toBe("smshub");
    expect(CACHE_TAGS.ACADEMIC).toBe("academic");
    expect(CACHE_TAGS.REPORTS).toBe("reports");
    expect(CACHE_TAGS.DASHBOARD).toBe("dashboard");
  });

  it("generates entity-specific and relational cache tags accurately", () => {
    expect(CACHE_TAGS.CLASS("cls-123")).toBe("class-cls-123");
    expect(CACHE_TAGS.TEACHER("tch-456")).toBe("teacher-tch-456");
    expect(CACHE_TAGS.STUDENT("std-789")).toBe("student-std-789");
    expect(CACHE_TAGS.STUDENTS_BY_CLASS("cls-123")).toBe("students-class-cls-123");
    expect(CACHE_TAGS.GUARDIAN("grd-111")).toBe("guardian-grd-111");
    expect(CACHE_TAGS.ATTENDANCE_DAILY("cls-123", "2026-10-25")).toBe("attendance-cls-123-2026-10-25");
    expect(CACHE_TAGS.ATTENDANCE_OVERVIEW("cls-123")).toBe("attendance-overview-cls-123");
    expect(CACHE_TAGS.EXCEPTION("exc-222")).toBe("exception-exc-222");
    expect(CACHE_TAGS.NOTIFICATION("notif-999")).toBe("notification-notif-999");
    expect(CACHE_TAGS.TEMPLATE("tpl-333")).toBe("template-tpl-333");
    expect(CACHE_TAGS.POLICY("pol-444")).toBe("policy-pol-444");
    expect(CACHE_TAGS.PROFILE("usr-555")).toBe("profile-usr-555");
  });

  it("safeUpdateTag executes without throwing outside of Server Action context", () => {
    expect(() => {
      safeUpdateTag(CACHE_TAGS.CLASSES, CACHE_TAGS.STUDENTS, CACHE_TAGS.DASHBOARD);
    }).not.toThrow();
  });

  it("defines standard domain cacheLife profiles matching next.config.ts", () => {
    expect(CACHE_PROFILES.ATTENDANCE).toBe("attendance");
    expect(CACHE_PROFILES.NOTIFICATIONS).toBe("notifications");
    expect(CACHE_PROFILES.DASHBOARD).toBe("dashboard");
    expect(CACHE_PROFILES.DIRECTORY).toBe("directory");
    expect(CACHE_PROFILES.STRUCTURE).toBe("structure");
    expect(CACHE_PROFILES.INSTITUTIONAL).toBe("institutional");
    expect(CACHE_PROFILES.ANALYTICS).toBe("analytics");
  });
});
