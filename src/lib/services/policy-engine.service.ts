import { detectCarrier } from "@/lib/carrier";
import type {
  AbsenceAlertPolicy,
  PolicySimulationInput,
  PolicySimulationResult,
  SimulationRuleCheck,
  SimulationDecision,
} from "@/lib/types/policy";

export const DEFAULT_ACTIVE_POLICY: AbsenceAlertPolicy = {
  id: "policy-active-1",
  schoolId: "school-eth-01",
  name: "Standard Daily Absence Alert Policy",
  nameAm: "መደበኛ የዕለት መቅረት ማሳወቂያ ፖሊሲ",
  description:
    "Evaluates daily attendance 10 minutes post-submission, excludes approved leave and holidays, and notifies verified primary guardians.",
  version: "v1.2.0",
  status: "ACTIVE",
  scope: "DAILY",
  triggerType: "DELAYED",
  triggerDelayMinutes: 10,
  scheduledTime: "09:00",
  consecutiveLessonsThreshold: 2,
  recipientStrategy: "PRIMARY_ONLY",
  defaultLanguage: "am",
  languageStrategy: "GUARDIAN_PREFERRED",
  templateId: "tpl-absence-standard",
  suppressApprovedLeave: true,
  suppressHolidays: true,
  suppressUnsubmitted: true,
  maxAlertsPerStudentPerDay: 1,
  cooldownHours: 24,
  notifyLateArrival: true,
  lateArrivalThresholdMinutes: 15,
  notifyCorrections: true,
  maxRetries: 3,
  pauseOnLowCredit: true,
  effectiveFrom: "2024-09-01",
  effectiveTo: null,
  createdAt: "2024-09-01T08:00:00Z",
  updatedAt: "2024-10-20T14:30:00Z",
  updatedBy: "Admin Feleke",
  isLiveEnabled: true,
  internalNotes: "Audited for 2017 E.C. Ethiopian academic year.",
};

export const SAMPLE_POLICIES: AbsenceAlertPolicy[] = [
  DEFAULT_ACTIVE_POLICY,
  {
    id: "policy-draft-2",
    schoolId: "school-eth-01",
    name: "Preparatory Strict Lesson-Level Policy",
    nameAm: "የመሰናዶ ጥብቅ የክፍለ-ጊዜ ፖሊሲ",
    description:
      "Triggers notifications after two consecutive missed lessons for Grade 11-12 students.",
    version: "v2.0.0-draft",
    status: "DRAFT",
    scope: "LESSON",
    triggerType: "CONSECUTIVE_LESSONS",
    triggerDelayMinutes: 5,
    scheduledTime: "08:30",
    consecutiveLessonsThreshold: 2,
    recipientStrategy: "ALL_GUARDIANS",
    defaultLanguage: "en",
    languageStrategy: "GUARDIAN_PREFERRED",
    templateId: "tpl-absence-lesson",
    suppressApprovedLeave: true,
    suppressHolidays: true,
    suppressUnsubmitted: true,
    maxAlertsPerStudentPerDay: 2,
    cooldownHours: 12,
    notifyLateArrival: false,
    lateArrivalThresholdMinutes: 10,
    notifyCorrections: true,
    maxRetries: 3,
    pauseOnLowCredit: true,
    effectiveFrom: "2024-11-01",
    effectiveTo: null,
    createdAt: "2024-10-22T09:15:00Z",
    updatedAt: "2024-10-24T11:00:00Z",
    updatedBy: "Supervisor Abebe",
    isLiveEnabled: false,
    internalNotes: "Pending Board approval for Term II rollout.",
  },
  {
    id: "policy-sched-3",
    schoolId: "school-eth-01",
    name: "Fixed 09:00 AM Morning Sweep Policy",
    nameAm: "የጠዋት 3:00 ሰዓት ቋሚ ማጣሪያ ፖሊሲ",
    description:
      "Sweeps all unexplained absences daily at 9:00 AM after morning homeroom period.",
    version: "v1.3.0",
    status: "SCHEDULED",
    scope: "DAILY",
    triggerType: "SCHEDULED_TIME",
    triggerDelayMinutes: 0,
    scheduledTime: "09:00",
    consecutiveLessonsThreshold: 1,
    recipientStrategy: "PRIMARY_WITH_FALLBACK",
    defaultLanguage: "am",
    languageStrategy: "GUARDIAN_PREFERRED",
    templateId: "tpl-absence-standard",
    suppressApprovedLeave: true,
    suppressHolidays: true,
    suppressUnsubmitted: true,
    maxAlertsPerStudentPerDay: 1,
    cooldownHours: 24,
    notifyLateArrival: true,
    lateArrivalThresholdMinutes: 20,
    notifyCorrections: true,
    maxRetries: 3,
    pauseOnLowCredit: true,
    effectiveFrom: "2024-11-01",
    effectiveTo: "2025-06-30",
    createdAt: "2024-10-20T10:00:00Z",
    updatedAt: "2024-10-23T16:45:00Z",
    updatedBy: "Admin Feleke",
    isLiveEnabled: false,
    internalNotes: "Scheduled for next academic month.",
  },
  {
    id: "policy-arch-4",
    schoolId: "school-eth-01",
    name: "Immediate Raw Broadcast Policy (Legacy)",
    nameAm: "የቀድሞ አስቸኳይ ስርጭት ፖሊሲ",
    description:
      "Legacy 2016 E.C. policy that notified immediately without 10-minute correction window.",
    version: "v1.0.0",
    status: "ARCHIVED",
    scope: "DAILY",
    triggerType: "IMMEDIATE",
    triggerDelayMinutes: 0,
    scheduledTime: "08:00",
    consecutiveLessonsThreshold: 1,
    recipientStrategy: "PRIMARY_ONLY",
    defaultLanguage: "am",
    languageStrategy: "SCHOOL_DEFAULT",
    templateId: "tpl-absence-legacy",
    suppressApprovedLeave: true,
    suppressHolidays: false,
    suppressUnsubmitted: false,
    maxAlertsPerStudentPerDay: 1,
    cooldownHours: 24,
    notifyLateArrival: false,
    lateArrivalThresholdMinutes: 15,
    notifyCorrections: false,
    maxRetries: 1,
    pauseOnLowCredit: false,
    effectiveFrom: "2023-09-01",
    effectiveTo: "2024-06-30",
    createdAt: "2023-08-25T12:00:00Z",
    updatedAt: "2024-07-01T00:00:00Z",
    updatedBy: "Former Admin",
    isLiveEnabled: false,
    internalNotes: "Archived: replaced due to false alarms on school holidays.",
  },
];

/**
 * Deterministic Absence Alert Policy Evaluation Engine
 * Evaluates student attendance events against school-specific policy rules.
 */
export function evaluatePolicy(
  input: PolicySimulationInput,
  policy: AbsenceAlertPolicy
): PolicySimulationResult {
  const checks: SimulationRuleCheck[] = [];
  let decision: SimulationDecision = "ELIGIBLE";
  let reason = "All policy criteria met. Case is eligible for parent notification.";
  let reasonAm = "ሁሉም የፖሊሲ መስፈርቶች ተሟልተዋል። ጉዳዩ ለወላጅ ማሳወቂያ ብቁ ነው።";

  // Check 1: Multi-tenant School Match
  const tenantMatch = input.schoolId === policy.schoolId;
  checks.push({
    ruleName: "School / Tenant Isolation",
    ruleNameAm: "የትምህርት ቤት የተናጠል መለያ",
    passed: tenantMatch,
    details: tenantMatch
      ? `Tenant matched: ${policy.schoolId}`
      : `Tenant mismatch: expected ${policy.schoolId}, received ${input.schoolId}`,
    detailsAm: tenantMatch
      ? `የትምህርት ቤት መለያ ተረጋግጧል: ${policy.schoolId}`
      : `የትምህርት ቤት መለያ አልተዛመደም: ${policy.schoolId}`,
  });
  if (!tenantMatch) {
    decision = "SUPPRESSED";
    reason = "Tenant authorization mismatch: event belongs to different school.";
    reasonAm = "የትምህርት ቤት መለያ ባለመዛመዱ ምክንያት ውድቅ ተደርጓል።";
  }

  // Check 2: Register Submission
  if (decision === "ELIGIBLE" && policy.suppressUnsubmitted) {
    checks.push({
      ruleName: "Teacher Register Submission",
      ruleNameAm: "የመምህሩ የአቴንዳንስ ምዝገባ ሁኔታ",
      passed: input.isRegisterSubmitted,
      details: input.isRegisterSubmitted
        ? "Class attendance register has been finalized and submitted by the teacher."
        : "Register has not been submitted yet. Unsubmitted register cannot generate absence alerts.",
      detailsAm: input.isRegisterSubmitted
        ? "የክፍሉ አቴንዳንስ በመምህሩ ተሞልቶ ተረጋግጧል።"
        : "የክፍሉ አቴንዳንስ ገና አልተላከም። ያልተላከ አቴንዳንስ ማሳወቂያ አያመነጭም።",
    });
    if (!input.isRegisterSubmitted) {
      decision = "PENDING";
      reason = "Attendance register has not been submitted yet.";
      reasonAm = "የክፍሉ አቴንዳንስ በመምህሩ እስኪላክ ድረስ ማሳወቂያው በመጠባበቅ ላይ ነው።";
    }
  }

  // Check 3: School Calendar & Holiday Suppression
  if (decision === "ELIGIBLE" && policy.suppressHolidays) {
    const isHolidayCheckPassed = !input.isHoliday;
    checks.push({
      ruleName: "School Calendar & Holiday Check",
      ruleNameAm: "የትምህርት ቤት ካላንደርና በዓላት ማጣሪያ",
      passed: isHolidayCheckPassed,
      details: isHolidayCheckPassed
        ? "Official school working day. Not a scheduled holiday or school closure."
        : "Date is marked as a national/school holiday. Absence alerts are suppressed.",
      detailsAm: isHolidayCheckPassed
        ? "መደበኛ የትምህርት ቀን። የበዓል ቀን አይደለም።"
        : "ቀኑ በዓል ወይም ት/ቤት ዝግ ስለሆነ ማሳወቂያ ታግዷል።",
    });
    if (input.isHoliday) {
      decision = "SUPPRESSED";
      reason = "Absence notification suppressed: date is a school holiday.";
      reasonAm = "ቀኑ የትምህርት ቤት በዓል ስለሆነ ማሳወቂያው ታግዷል።";
    }
  }

  // Check 4: Approved Leave Suppression
  if (decision === "ELIGIBLE" && policy.suppressApprovedLeave) {
    const isLeaveCheckPassed = !input.hasApprovedLeave && input.status !== "LEAVE";
    checks.push({
      ruleName: "Approved Leave Suppression",
      ruleNameAm: "የተፈቀደ ፈቃድ ማጣሪያ",
      passed: isLeaveCheckPassed,
      details: isLeaveCheckPassed
        ? "Absence is unexplained. No approved medical or family leave recorded."
        : "Student has approved administrative/medical leave. Alert suppressed.",
      detailsAm: isLeaveCheckPassed
        ? "ያልተገለጸ መቅረት ነው። የተመዘገበ የሕመም ወይም የቤተሰብ ፈቃድ የለም።"
        : "ተማሪው ሕጋዊ ፈቃድ ስላለው ማሳወቂያው ታግዷል።",
    });
    if (input.hasApprovedLeave || input.status === "LEAVE") {
      decision = "SUPPRESSED";
      reason = "Notification suppressed: student is on approved leave.";
      reasonAm = "ተማሪው የተፈቀደ ፈቃድ ስላለው ማሳወቂያው ታግዷል።";
    }
  }

  // Check 5: Student Expected Attendance & Absence Status
  if (decision === "ELIGIBLE") {
    const isAbsent = input.status === "ABSENT";
    checks.push({
      ruleName: "Absence Status Verification",
      ruleNameAm: "የመቅረት ሁኔታ ማረጋገጫ",
      passed: isAbsent,
      details: isAbsent
        ? "Student is marked ABSENT on submitted attendance roster."
        : `Student status is ${input.status}. Normal absence alert not triggered.`,
      detailsAm: isAbsent
        ? "ተማሪው በመዝገቡ ላይ 'ቀሪ' (ABSENT) ተብሎ ተመዝግቧል።"
        : `የተማሪው ሁኔታ ${input.status} ነው። መደበኛ የመቅረት ማሳወቂያ አያስፈልግም።`,
    });
    if (!isAbsent) {
      decision = "SUPPRESSED";
      reason = `Student is recorded as ${input.status}, not absent.`;
      reasonAm = `ተማሪው ${input.status} ስለሆነ የመቅረት ማሳወቂያ አያስፈልግም።`;
    }
  }

  // Check 6: Trigger Timing & Correction Window
  if (decision === "ELIGIBLE" && policy.triggerType === "DELAYED") {
    const delayExpired = input.minutesSinceSubmission >= policy.triggerDelayMinutes;
    checks.push({
      ruleName: `Post-Submission Correction Window (${policy.triggerDelayMinutes}m)`,
      ruleNameAm: `የእርማት መስኮት ጊዜ (${policy.triggerDelayMinutes} ደቂቃ)`,
      passed: delayExpired,
      details: delayExpired
        ? `Correction window of ${policy.triggerDelayMinutes}m elapsed (${input.minutesSinceSubmission}m since submission).`
        : `Within ${policy.triggerDelayMinutes}m post-submission window (${input.minutesSinceSubmission}m elapsed). Awaiting corrections.`,
      detailsAm: delayExpired
        ? `የ${policy.triggerDelayMinutes} ደቂቃ የእርማት ጊዜ አልቋል (${input.minutesSinceSubmission} ደቂቃ አልፏል)።`
        : `በእርማት መስኮት ውስጥ ነው (${input.minutesSinceSubmission} ደቂቃ አልፏል)። አስተማሪው እንዲያርም ይጠበቃል።`,
    });
    if (!delayExpired) {
      decision = "PENDING";
      reason = `Notification pending: waiting for ${policy.triggerDelayMinutes}-minute teacher correction window to expire.`;
      reasonAm = `ማሳወቂያ በመጠባበቅ ላይ: የመምህሩ የ${policy.triggerDelayMinutes} ደቂቃ የእርማት መስኮት እስኪያበቃ ድረስ ይጠበቃል።`;
    }
  }

  // Check 7: Recipient & Phone Number Verification
  let recipientInfo = null;
  if (decision === "ELIGIBLE" || decision === "PENDING") {
    const carrierData = detectCarrier(input.guardianPhone);
    const hasValidPhone =
      input.guardianPhone.trim().length >= 9 && carrierData.carrier !== "Unknown";
    const verificationPassed = hasValidPhone && (input.isPhoneVerified || !policy.isLiveEnabled);

    checks.push({
      ruleName: "Authorized Guardian Contact Verification",
      ruleNameAm: "የተፈቀደ አሳዳጊ ስልክ ቁጥር ማረጋገጫ",
      passed: hasValidPhone,
      details: hasValidPhone
        ? `Valid Ethiopian recipient: ${input.guardianName} (${carrierData.carrier}, ${carrierData.creditCost} credit(s)).`
        : `Invalid or missing phone number for ${input.guardianName}. Routed to exception queue.`,
      detailsAm: hasValidPhone
        ? `ትክክለኛ የኢትዮጵያ ስልክ: ${input.guardianName} (${carrierData.carrier}, ${carrierData.creditCost} ክሬዲት)`
        : `የ${input.guardianName} ስልክ ቁጥር የተሳሳተ ወይም ያልተሟላ ነው። ወደ ልዩነቶች መዝገብ ተልኳል።`,
    });

    if (!hasValidPhone) {
      decision = "REQUIRES_REVIEW";
      reason = "Action required: Guardian phone number is missing, invalid, or unsupported by Ethiopian carriers.";
      reasonAm = "ክለሳ ያስፈልጋል: የአሳዳጊው ስልክ ቁጥር አልተሟላም ወይም በኢትዮ ቴሌኮም/ሳፋሪኮም አይደገፍም።";
    } else {
      const selectedLang =
        policy.languageStrategy === "GUARDIAN_PREFERRED" && input.preferredLanguage
          ? input.preferredLanguage
          : policy.defaultLanguage;

      recipientInfo = {
        name: input.guardianName,
        phone: input.guardianPhone,
        carrier: carrierData.carrier,
        language: selectedLang,
      };
    }
  }

  // Check 8: Idempotency & Duplicate Prevention
  if (decision === "ELIGIBLE") {
    const noPriorAlert = !input.priorAlertSentToday;
    checks.push({
      ruleName: `Daily Deduplication Safeguard (Max ${policy.maxAlertsPerStudentPerDay}/day)`,
      ruleNameAm: `የዕለት ድግግሞሽ መከላከያ (በቀን ${policy.maxAlertsPerStudentPerDay} ጊዜ)`,
      passed: noPriorAlert,
      details: noPriorAlert
        ? "No prior notification sent to this guardian for this student on this date."
        : "An absence alert was already accepted today. Duplicate alert suppressed by policy.",
      detailsAm: noPriorAlert
        ? "ለዚህ ተማሪ ዛሬ የተላከ ቀዳሚ ማሳወቂያ የለም።"
        : "ለዚህ ተማሪ ዛሬ ማሳወቂያ አስቀድሞ ተልኳል። ድጋሚ እንዳይላክ በፖሊሲው ታግዷል።",
    });
    if (!noPriorAlert) {
      decision = "SUPPRESSED";
      reason = "Duplicate alert suppressed: Guardian already received an absence alert for this student today.";
      reasonAm = "ተደጋጋሚ መልእክት እንዳይላክ ታግዷል: አሳዳጊው ለዚህ ተማሪ ዛሬ ማሳወቂያ አስቀድሞ ደርሶታል።";
    }
  }

  // Render message preview and calculate segments
  let renderedMessage: string | null = null;
  let estimatedSegments = 0;
  let estimatedCredits = 0;
  const idempotencyKey = `${policy.schoolId}:${input.studentId}:${input.date}:ABSENCE:${policy.version}`;

  if (recipientInfo) {
    if (recipientInfo.language === "am") {
      renderedMessage = `ውድ ወላጅ/አሳዳጊ፣ ${input.studentName} ዛሬ (${input.date}) በ${input.className} ክፍል አልተገኘም። ይህ ያልተጠበቀ ከሆነ እባክዎ ትምህርት ቤቱን ያነጋግሩ። [St. Joseph School]`;
      // Unicode Ge'ez segment limit: 70 chars
      estimatedSegments = Math.ceil(renderedMessage.length / 70);
    } else {
      renderedMessage = `Dear Parent/Guardian, ${input.studentName} was marked absent from ${input.className} today (${input.date}). Please contact the school if unexpected. [St. Joseph School]`;
      // GSM-7 segment limit: 160 chars
      estimatedSegments = Math.ceil(renderedMessage.length / 160);
    }
    const carrierCost = recipientInfo.carrier === "Safaricom" ? 2 : 1;
    estimatedCredits = estimatedSegments * carrierCost;
  }

  return {
    decision,
    reason,
    reasonAm,
    checks,
    recipient: recipientInfo,
    renderedMessage,
    estimatedSegments,
    estimatedCredits,
    idempotencyKey,
  };
}

/**
 * Generates an auditable, plain-language summary of an 8-step policy.
 */
export function renderHumanSummary(
  policy: AbsenceAlertPolicy,
  locale: "en" | "am" = "en"
): string {
  const langLabel =
    policy.languageStrategy === "GUARDIAN_PREFERRED"
      ? locale === "am"
        ? "የአሳዳጊው ተመራጭ ቋንቋ (አማርኛ/እንግሊዝኛ)"
        : "guardian's preferred language (Amharic/English)"
      : policy.defaultLanguage === "am"
      ? "አማርኛ"
      : "English";

  const triggerDesc =
    policy.triggerType === "DELAYED"
      ? locale === "am"
        ? `መምህሩ አቴንዳንስ ከላከ ከ${policy.triggerDelayMinutes} ደቂቃዎች የእርማት ጊዜ በኋላ`
        : `wait ${policy.triggerDelayMinutes} minutes post-submission for corrections`
      : policy.triggerType === "SCHEDULED_TIME"
      ? locale === "am"
        ? `በየቀኑ በቋሚነት በ${policy.scheduledTime} ሰዓት`
        : `sweep unexplained absences at ${policy.scheduledTime} daily`
      : locale === "am"
      ? "መምህሩ አቴንዳንስ ልክ እንዳስገባ ወዲያውኑ"
      : "immediately upon attendance register submission";

  if (locale === "am") {
    return `ይህ ፖሊሲ (${policy.nameAm || policy.name}) ${triggerDesc} ይተገበራል። የተፈቀደ የሕመም/ቤተሰብ ፈቃድ እና የት/ቤት በዓላትን በማግለል ለእያንዳንዱ ያልተገለጸ መቅረት ለዋናው አሳዳጊ በ${langLabel} መልእክት ይልካል። እያንዳንዱ ተማሪ በቀን ቢበዛ ${policy.maxAlertsPerStudentPerDay} የመጀመሪያ ማስጠንቀቂያ ይደርሰዋል። ስልክ ቁጥር የሌላቸው ወይም የተሳሳቱ ጉዳዮች ወደ ልዩነቶች መዝገብ ይላካሉ።`;
  }

  return `When a teacher submits an attendance register, the system will ${triggerDesc}, exclude approved leave and scheduled school holidays, and notify verified primary guardians of eligible unexplained absences in the ${langLabel}. Each student receives a maximum of ${policy.maxAlertsPerStudentPerDay} alert(s) per day. Missing or invalid contacts are routed to the school's exception queue.`;
}
