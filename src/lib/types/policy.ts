export type PolicyStatus = "ACTIVE" | "DRAFT" | "SCHEDULED" | "ARCHIVED";

export type AttendanceScope = "DAILY" | "LESSON" | "BOTH";

export type TriggerType =
  | "IMMEDIATE"
  | "DELAYED"
  | "SCHEDULED_TIME"
  | "CONSECUTIVE_LESSONS"
  | "MANUAL_REVIEW";

export type RecipientStrategy =
  | "PRIMARY_ONLY"
  | "ALL_GUARDIANS"
  | "PRIMARY_WITH_FALLBACK"
  | "STAFF_REVIEW_REQUIRED";

export type FailureAction =
  | "RETRY_EXPONENTIAL"
  | "MOVE_TO_EXCEPTION_QUEUE"
  | "PAUSE_WORKFLOW";

export interface AbsenceAlertPolicy {
  id: string;
  schoolId: string;
  name: string;
  nameAm: string;
  description: string;
  version: string;
  status: PolicyStatus;
  scope: AttendanceScope;
  triggerType: TriggerType;
  triggerDelayMinutes: number; // e.g. 10 min window for corrections
  scheduledTime: string; // e.g. "09:00"
  consecutiveLessonsThreshold: number; // e.g. 2
  recipientStrategy: RecipientStrategy;
  defaultLanguage: "am" | "en";
  languageStrategy: "GUARDIAN_PREFERRED" | "SCHOOL_DEFAULT";
  templateId: string;
  suppressApprovedLeave: boolean;
  suppressHolidays: boolean;
  suppressUnsubmitted: boolean;
  maxAlertsPerStudentPerDay: number;
  cooldownHours: number;
  notifyLateArrival: boolean;
  lateArrivalThresholdMinutes: number;
  notifyCorrections: boolean;
  maxRetries: number;
  pauseOnLowCredit: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  isLiveEnabled: boolean;
  internalNotes?: string;
}

export type SimulationDecision =
  | "ELIGIBLE"
  | "SUPPRESSED"
  | "PENDING"
  | "REQUIRES_REVIEW";

export interface SimulationRuleCheck {
  ruleName: string;
  ruleNameAm: string;
  passed: boolean;
  details: string;
  detailsAm: string;
}

export interface PolicySimulationInput {
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: "PRESENT" | "ABSENT" | "LEAVE" | "LATE";
  isRegisterSubmitted: boolean;
  minutesSinceSubmission: number;
  hasApprovedLeave: boolean;
  isHoliday: boolean;
  guardianName: string;
  guardianPhone: string;
  isPhoneVerified: boolean;
  priorAlertSentToday: boolean;
  preferredLanguage?: "am" | "en";
}

export interface PolicySimulationResult {
  decision: SimulationDecision;
  reason: string;
  reasonAm: string;
  checks: SimulationRuleCheck[];
  recipient: {
    name: string;
    phone: string;
    carrier: "Ethio Telecom" | "Safaricom" | "Unknown";
    language: "am" | "en";
  } | null;
  renderedMessage: string | null;
  estimatedSegments: number;
  estimatedCredits: number;
  idempotencyKey: string;
}
