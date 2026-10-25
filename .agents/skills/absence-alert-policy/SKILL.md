---
name: absence-alert-policy
description: >-
  Configures, validates, versions, and simulates school-specific Absence Alert Policies
  for multi-tenant educational attendance systems. Covers the 8-step policy configuration
  wizard, deterministic backend evaluation engine, post-submission correction windows,
  holiday/leave suppression safeguards, Ethiopian mobile phone carrier pricing, and
  simulation testing before live SMS activation. Use whenever managing absence notification
  rules, testing alert eligibility, or auditing school attendance policies.
---

# School Absence Alert Policy Engine & Configuration

## Overview
The **Absence Alert Policy Engine** is the single source of truth for absence notification eligibility in the school attendance platform. Each school maintains independently versioned, multi-tenant policies that dictate exactly when and how parents/guardians are notified of student absences.

The system enforces strict safeguards: unsubmitted attendance registers never generate alerts, approved leave and school holidays are automatically suppressed, post-submission correction windows allow teachers to correct mistakes before SMS dispatch, and idempotency keys prevent duplicate notifications.

---

## Policy Lifecycle & Statuses

Each policy transitions through an auditable, immutable lifecycle:
- **`ACTIVE`**: Exactly one policy per school governs live evaluation and SMS dispatch.
- **`DRAFT`**: Work-in-progress configuration; safe to edit and simulate without affecting live operations.
- **`SCHEDULED`**: Approved policy configured to automatically activate on a future date (e.g., beginning of Term II).
- **`ARCHIVED`**: Historical policy retained for compliance and audit trail; can be duplicated into a new draft.

---

## The 8-Step Policy Configuration Wizard

When creating or revising a policy, follow the guided 8-step structure:

### Step 1: General Settings
- **Policy Name** (English & Amharic - አማርኛ)
- **Description & Operational Rationale**
- **Academic Period** (e.g., `2017 E.C. - Term I`)
- **School Tenant ID** (strict multi-tenant boundary)

### Step 2: Attendance Scope & Eligible States
- **Scope**: `DAILY` (homeroom morning register), `LESSON` (period-by-period), or `BOTH`.
- **Leave Suppression**: Suppress alerts when student has approved medical/family leave (`status: LEAVE`).
- **Holiday Suppression**: Suppress alerts on national and school calendar holidays.

### Step 3: Trigger Mechanism
- **`DELAYED`**: Waits a configurable window (e.g., 10 minutes) after teacher submission before evaluating eligibility. This gives teachers time to correct accidental marks.
- **`IMMEDIATE`**: Evaluates immediately upon register submission.
- **`SCHEDULED_TIME`**: Sweeps unexplained daily absences at a fixed local time (e.g., `09:00` East Africa Time).
- **`CONSECUTIVE_LESSONS`**: Triggers only when a student misses $\ge N$ consecutive periods.

### Step 4: Guardian Recipient Strategy
- **`PRIMARY_ONLY`**: Notify verified primary guardian.
- **`ALL_GUARDIANS`**: Broadcast to all registered family contacts.
- **`PRIMARY_WITH_FALLBACK`**: Fallback to secondary guardian if primary number is missing or invalid.
- **`STAFF_REVIEW_REQUIRED`**: Hold in exception queue for administrative sign-off.

### Step 5: Frequency & Deduplication
- **Max Alerts**: Cap initial absence alerts to 1 per student per school day.
- **Cooldown Window**: 24-hour deduplication window.
- **Late Arrivals**: Optional separate alert for students arriving $\ge 15$ minutes late.
- **Attendance Corrections**: Optional follow-up notification if student marked Absent is later corrected to Present.

### Step 6: Message Language & Templates
- **Language Strategy**: `GUARDIAN_PREFERRED` (delivers in Amharic or English based on family preference) or `SCHOOL_DEFAULT`.
- **Encoding & Segments**:
  - Amharic / Ge'ez (Unicode): 70 characters per segment.
  - English (GSM-7): 160 characters per segment.
- **Account Signature**: Automatically accounts for the SMSHub account signature (e.g., `[St. Joseph School]`).

### Step 7: Bounded Retries & Error Handling
- **Transient Errors**: Retry up to 3 times with exponential backoff for HTTP `429`, `500`, `502`, `503`.
- **Permanent Errors**: Non-retryable errors (`400`, `401`, `402`, `422`) immediately route to the School Exception Queue.
- **Low Balance**: Pause queue and trigger administrative dashboard banner when SMS balance drops below 50 credits.
- **Uncertain Provider Timeouts**: Never blind-resend; flag for controlled investigation.

### Step 8: Auditable Review & Activation
- Generates a human-readable summary in English and Amharic.
- Enforces validation checklist before promoting draft to active live policy.

---

## Deterministic Evaluation Checklist

Every attendance event is evaluated against 8 deterministic checks:

| # | Check Rule | Success Condition | Non-Pass Outcome |
| :--- | :--- | :--- | :--- |
| **1** | **Tenant Isolation** | `event.schoolId === policy.schoolId` | `SUPPRESSED` (Authorization mismatch) |
| **2** | **Register Submission** | Teacher finalized and submitted register | `PENDING` (Unsubmitted register) |
| **3** | **Holiday Check** | Date is an official working school day | `SUPPRESSED` (School holiday) |
| **4** | **Leave Suppression** | Absence is unexplained (no approved leave) | `SUPPRESSED` (Approved leave) |
| **5** | **Absence Status** | Student marked `ABSENT` on roster | `SUPPRESSED` (Not absent) |
| **6** | **Correction Window** | Elapsed time $\ge$ `triggerDelayMinutes` | `PENDING` (Awaiting correction window) |
| **7** | **Recipient Verification** | Valid Ethiopian number (`09...` or `07...`) | `REQUIRES_REVIEW` (Exception queue) |
| **8** | **Deduplication Key** | No prior alert sent today | `SUPPRESSED` (Duplicate alert) |

---

## Ethiopian Carrier Pricing Engine

When an event is determined to be `ELIGIBLE`, the recipient's phone number is normalized and carrier-detected:
- **Ethio Telecom** (`09xxxxxxxx`, `+2519...`, `2519...`): **1 credit** per SMS segment.
- **Safaricom Ethiopia** (`07xxxxxxxx`, `+2517...`, `2517...`): **2 credits** per SMS segment.

---

## Policy Simulation Workbench

Before activating any policy, test it using the built-in simulator:
```typescript
import { evaluatePolicy } from "@/lib/services/policy-engine.service";

const result = evaluatePolicy(
  {
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
  },
  activePolicy
);

console.log(result.decision); // "ELIGIBLE"
console.log(result.estimatedCredits); // 1 credit (Ethio Telecom)
```

---

## Common Mistakes to Avoid

1. **Treating Unsubmitted Registers as Absences**: Never generate absence alerts merely because an attendance register has not been taken. An unsubmitted register is `PENDING`, not an absence.
2. **Falsely Claiming "Delivered"**: Ethio Telecom and Safaricom do not provide handset delivery receipts (`delivery_report: null`). Statuses must accurately read **"Sent to Provider"** or **"Accepted by Provider"**.
3. **Hardcoding Timetables or Rules in Frontend**: Always evaluate policies through the backend policy engine. The frontend only displays and configures; the backend enforces.
4. **Ignoring Amharic Character Counting**: Amharic Ge'ez script automatically shifts the SMS encoding to Unicode, dropping the segment limit from 160 characters to 70 characters. Always calculate segments and credits accordingly.
