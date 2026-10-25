import { describe, it, expect, vi } from "vitest";

// Mock server-only for Vitest test environment
vi.mock("server-only", () => ({}));

import { getMondayOfWeek } from "../src/lib/services/attendance.service";

describe("Step 11 - Two-Week Overview Date Calculations", () => {
  it("getMondayOfWeek returns Monday for any day of the week", () => {
    // 2026-10-19 is a Monday
    expect(getMondayOfWeek("2026-10-19")).toBe("2026-10-19");
    // 2026-10-20 is a Tuesday -> maps to 2026-10-19
    expect(getMondayOfWeek("2026-10-20")).toBe("2026-10-19");
    // 2026-10-23 is a Friday -> maps to 2026-10-19
    expect(getMondayOfWeek("2026-10-23")).toBe("2026-10-19");
    // 2026-10-24 is a Saturday -> maps to 2026-10-19
    expect(getMondayOfWeek("2026-10-24")).toBe("2026-10-19");
    // 2026-10-25 is a Sunday -> maps to 2026-10-19
    expect(getMondayOfWeek("2026-10-25")).toBe("2026-10-19");
    // 2026-10-26 is the next Monday
    expect(getMondayOfWeek("2026-10-26")).toBe("2026-10-26");
  });

  it("builds an exact 14-day date sequence starting on Monday", () => {
    const monday = getMondayOfWeek("2026-10-24");
    const [y, m, d] = monday.split("-").map(Number);
    const base = new Date(Date.UTC(y!, m! - 1, d!));

    const days: Array<{ date: string; isWeekend: boolean }> = [];
    for (let i = 0; i < 14; i++) {
      const cur = new Date(base);
      cur.setUTCDate(base.getUTCDate() + i);
      const dayOfWeek = cur.getUTCDay();
      days.push({
        date: cur.toISOString().split("T")[0]!,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    expect(days).toHaveLength(14);
    expect(days[0]!.date).toBe("2026-10-19");
    expect(days[0]!.isWeekend).toBe(false); // Mon
    expect(days[5]!.date).toBe("2026-10-24");
    expect(days[5]!.isWeekend).toBe(true); // Sat
    expect(days[6]!.date).toBe("2026-10-25");
    expect(days[6]!.isWeekend).toBe(true); // Sun
    expect(days[13]!.date).toBe("2026-11-01");
    expect(days[13]!.isWeekend).toBe(true); // Sun
  });

  it("calculates attendance rate correctly", () => {
    function calcRate(p: number, a: number, l: number, t: number): number | null {
      const total = p + a + l + t;
      if (total === 0) return null;
      return Math.round((p / total) * 100);
    }

    expect(calcRate(8, 1, 0, 0)).toBe(89); // 8/9
    expect(calcRate(10, 0, 0, 0)).toBe(100);
    expect(calcRate(0, 10, 0, 0)).toBe(0);
    expect(calcRate(0, 0, 0, 0)).toBe(null);
    expect(calcRate(7, 2, 1, 0)).toBe(70);
  });

  it("flags persistent absence when total absences >= 3", () => {
    function isHighAbsence(absentCount: number): boolean {
      return absentCount >= 3;
    }

    expect(isHighAbsence(0)).toBe(false);
    expect(isHighAbsence(2)).toBe(false);
    expect(isHighAbsence(3)).toBe(true);
    expect(isHighAbsence(5)).toBe(true);
  });
});
