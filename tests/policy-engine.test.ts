import { describe, it, expect } from "vitest";
import {
  DEFAULT_ACTIVE_POLICY,
  evaluatePolicy,
  renderHumanSummary,
} from "../src/lib/services/policy-engine.service";
import type { PolicySimulationInput, AbsenceAlertPolicy } from "../src/lib/types/policy";

describe("School Absence Alert Policy Engine", () => {
  const baseInput: PolicySimulationInput = {
    schoolId: "school-eth-01",
    studentId: "std-101",
    studentName: "Abebe Bikila",
    className: "Grade 8 B",
    date: "2024-10-25",
    status: "ABSENT",
    isRegisterSubmitted: true,
    minutesSinceSubmission: 15,
    hasApprovedLeave: false,
    isHoliday: false,
    guardianName: "Bikila Wolde",
    guardianPhone: "0911223344",
    isPhoneVerified: true,
    priorAlertSentToday: false,
    preferredLanguage: "am",
  };

  it("1. should mark standard unexplained absence as ELIGIBLE post-correction window", () => {
    const result = evaluatePolicy(baseInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("ELIGIBLE");
    expect(result.recipient).not.toBeNull();
    expect(result.recipient?.carrier).toBe("Ethio Telecom");
    expect(result.recipient?.language).toBe("am");
    expect(result.estimatedCredits).toBeGreaterThan(0);
    expect(result.idempotencyKey).toContain("school-eth-01:std-101:2024-10-25:ABSENCE");
  });

  it("2. should enforce multi-tenant isolation by suppressing events from another school", () => {
    const foreignInput: PolicySimulationInput = {
      ...baseInput,
      schoolId: "foreign-school-99",
    };
    const result = evaluatePolicy(foreignInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("SUPPRESSED");
    expect(result.reason).toContain("Tenant authorization mismatch");
  });

  it("3. should mark unsubmitted teacher register as PENDING", () => {
    const unsubmittedInput: PolicySimulationInput = {
      ...baseInput,
      isRegisterSubmitted: false,
      minutesSinceSubmission: 0,
    };
    const result = evaluatePolicy(unsubmittedInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("PENDING");
    expect(result.reason).toContain("has not been submitted yet");
  });

  it("4. should suppress alerts on official school holidays and closures", () => {
    const holidayInput: PolicySimulationInput = {
      ...baseInput,
      isHoliday: true,
    };
    const result = evaluatePolicy(holidayInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("SUPPRESSED");
    expect(result.reason).toContain("school holiday");
  });

  it("5. should suppress alerts when student has approved medical/family leave", () => {
    const leaveInput: PolicySimulationInput = {
      ...baseInput,
      status: "LEAVE",
      hasApprovedLeave: true,
    };
    const result = evaluatePolicy(leaveInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("SUPPRESSED");
    expect(result.reason).toContain("approved leave");
  });

  it("6. should suppress alerts when student is present", () => {
    const presentInput: PolicySimulationInput = {
      ...baseInput,
      status: "PRESENT",
    };
    const result = evaluatePolicy(presentInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("SUPPRESSED");
    expect(result.reason).toContain("PRESENT");
  });

  it("7. should mark event PENDING if within active 10-minute correction window", () => {
    const windowInput: PolicySimulationInput = {
      ...baseInput,
      minutesSinceSubmission: 4, // delay is 10 minutes
    };
    const result = evaluatePolicy(windowInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("PENDING");
    expect(result.reason).toContain("waiting for 10-minute teacher correction window");
  });

  it("8. should flag REQUIRES_REVIEW when guardian phone is missing or invalid", () => {
    const invalidPhoneInput: PolicySimulationInput = {
      ...baseInput,
      guardianPhone: "011-555555", // invalid landline, not mobile
    };
    const result = evaluatePolicy(invalidPhoneInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("REQUIRES_REVIEW");
    expect(result.reason).toContain("missing, invalid, or unsupported");
  });

  it("9. should correctly price Safaricom numbers at 2 credits", () => {
    const safaricomInput: PolicySimulationInput = {
      ...baseInput,
      guardianPhone: "0711223344", // Safaricom Ethiopia
      preferredLanguage: "en",
    };
    const result = evaluatePolicy(safaricomInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("ELIGIBLE");
    expect(result.recipient?.carrier).toBe("Safaricom");
    // 1 segment * 2 credits = 2 credits
    expect(result.estimatedCredits).toBe(2);
  });

  it("10. should suppress duplicate alerts when a prior alert was sent today", () => {
    const duplicateInput: PolicySimulationInput = {
      ...baseInput,
      priorAlertSentToday: true,
    };
    const result = evaluatePolicy(duplicateInput, DEFAULT_ACTIVE_POLICY);
    expect(result.decision).toBe("SUPPRESSED");
    expect(result.reason).toContain("Duplicate alert suppressed");
  });

  it("11. should render human-readable auditable summaries in English and Amharic", () => {
    const summaryEn = renderHumanSummary(DEFAULT_ACTIVE_POLICY, "en");
    expect(summaryEn).toContain("wait 10 minutes post-submission for corrections");
    expect(summaryEn).toContain("exclude approved leave and scheduled school holidays");

    const summaryAm = renderHumanSummary(DEFAULT_ACTIVE_POLICY, "am");
    expect(summaryAm).toContain("10 ደቂቃዎች የእርማት ጊዜ");
    expect(summaryAm).toContain("የት/ቤት በዓላትን በማግለል");
  });
});
