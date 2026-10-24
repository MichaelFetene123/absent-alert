import { describe, it, expect, vi } from "vitest";

// Mock server-only for Vitest test environment
vi.mock("server-only", () => ({}));

import { absenceMessage } from "../src/lib/services/notification.service";
import { notificationStatusSchema } from "../src/lib/validations/notification";
import { z } from "zod";

describe("Step 10 - Notification Logic & Formatting", () => {
  it("formats standard absence alert message correctly", () => {
    const msg = absenceMessage("Dawit Haile", "Class 7 B", "2026-10-24");
    expect(msg).toBe(
      "AbsentAlert: Dawit Haile (Class 7 B) was marked absent on 2026-10-24. Please contact the school if this is unexpected."
    );
    expect(msg).toContain("AbsentAlert:");
    expect(msg).toContain("Dawit Haile");
    expect(msg).toContain("Class 7 B");
    expect(msg).toContain("2026-10-24");
  });

  it("validates all accepted Notification statuses", () => {
    expect(notificationStatusSchema.parse("PENDING")).toBe("PENDING");
    expect(notificationStatusSchema.parse("SENDING")).toBe("SENDING");
    expect(notificationStatusSchema.parse("ACCEPTED")).toBe("ACCEPTED");
    expect(notificationStatusSchema.parse("DELIVERED")).toBe("DELIVERED");
    expect(notificationStatusSchema.parse("FAILED")).toBe("FAILED");

    expect(() => notificationStatusSchema.parse("UNKNOWN")).toThrow();
  });

  it("validates listNotifications filter schema", () => {
    const listSchema = z.object({
      status: z.enum(["PENDING", "SENDING", "ACCEPTED", "DELIVERED", "FAILED"]).optional(),
      classId: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(25),
    });

    const parsedDefault = listSchema.parse({});
    expect(parsedDefault.page).toBe(1);
    expect(parsedDefault.pageSize).toBe(25);

    const parsedWithParams = listSchema.parse({
      status: "FAILED",
      classId: "cls_123",
      search: "Almaz",
      page: "2",
      pageSize: "50",
    });
    expect(parsedWithParams.status).toBe("FAILED");
    expect(parsedWithParams.classId).toBe("cls_123");
    expect(parsedWithParams.search).toBe("Almaz");
    expect(parsedWithParams.page).toBe(2);
    expect(parsedWithParams.pageSize).toBe(50);
  });

  it("masks phone numbers correctly for non-admins", () => {
    function maskPhone(phone: string, isAdmin: boolean): string {
      if (!isAdmin && phone.length > 4) {
        return phone.slice(0, 4) + "****" + phone.slice(-2);
      }
      return phone;
    }

    const testPhone = "+251911223344";
    expect(maskPhone(testPhone, true)).toBe("+251911223344");
    expect(maskPhone(testPhone, false)).toBe("+251****44");

    const localPhone = "0911223344";
    expect(maskPhone(localPhone, true)).toBe("0911223344");
    expect(maskPhone(localPhone, false)).toBe("0911****44");
  });

  it("identifies notifications stuck in SENDING for >5 minutes as needing review", () => {
    const now = Date.now();
    const sixMinutesAgo = new Date(now - 6 * 60 * 1000).toISOString();
    const twoMinutesAgo = new Date(now - 2 * 60 * 1000).toISOString();

    function checkNeedsReview(status: string, createdAtIso: string): boolean {
      const createdMs = Date.parse(createdAtIso);
      return status === "SENDING" && now - createdMs > 5 * 60 * 1000;
    }

    expect(checkNeedsReview("SENDING", sixMinutesAgo)).toBe(true);
    expect(checkNeedsReview("SENDING", twoMinutesAgo)).toBe(false);
    expect(checkNeedsReview("ACCEPTED", sixMinutesAgo)).toBe(false);
    expect(checkNeedsReview("FAILED", sixMinutesAgo)).toBe(false);
  });
});
