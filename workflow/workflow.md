# Advanced Development Prompt: School-Specific Absence Alert Policy & Configuration System

## 1. Role and Objective

Act as a **Senior SaaS Product Architect, UX/UI Designer, Full-Stack Engineer, Backend Systems Engineer, and Quality Assurance Engineer**.

Design and implement a production-ready, multi-tenant school attendance management system with a configurable **Absence Alert Policy Engine** that automatically notifies parents or guardians when a student is recorded as absent.

The system must allow every school to configure its own absence notification policies according to its internal attendance rules, academic schedule, communication preferences, and operational requirements.

This is not merely a settings page with a few switches. Build a complete policy-driven functionality with:

- A professional school administration interface.
- School-specific policy configuration.
- A deterministic backend policy evaluation engine.
- Reliable asynchronous SMS delivery.
- Guardian and student contact management.
- Notification monitoring and exception handling.
- Audit history, policy versioning, permissions, and testing tools.
- Multi-tenant security and production-grade error handling.

**Primary principle:** One school's configuration must never affect another school's policies, students, guardians, or notifications.

## 2. Product Context

The product is a multi-tenant School Attendance Management SaaS.

Each school has its own administrators, teachers, students, guardians, classes, academic calendar, attendance records, and notification policies.

When a teacher records attendance, the system must determine whether an absence alert is eligible under that particular school's active policy.

Example:

- School A wants to notify guardians immediately after the daily attendance register is submitted.
- School B wants to wait until 9:00 AM and only notify guardians about unexplained absences.
- School C wants alerts after the first lesson, but only when a student misses two consecutive lessons.
- School D wants an administrator to review certain absence cases before sending notifications.

All these schools must use the same underlying product while applying different configurations.

Do not hardcode any of these policies into the frontend, controller, or SMS integration.

## 3. Core Feature: School-Specific Policy Configuration

Create a dedicated administration section:

**Attendance Management → Settings → Absence Alert Policies**

Each school should have an independently configurable policy.

### 3.1 Policy Dashboard

Build a dashboard displaying:

- Active absence alert policy.
- Policy status: Draft, Active, Scheduled, or Archived.
- Notification scope: Daily, Per Lesson, or Both.
- Current trigger method.
- Notification recipient strategy.
- Default notification language.
- Whether automatic SMS notifications are enabled.
- Pending notifications.
- Successfully accepted SMS requests.
- Failed and suppressed notifications.
- Last policy update and the user who updated it.

Provide actions for:

- Create policy.
- Edit draft.
- View active policy.
- Duplicate policy.
- Test policy.
- Activate policy.
- Schedule policy activation.
- View policy history.
- Archive an unused policy.
- Restore an eligible archived policy as a new draft.

Show clear confirmation before activation if the policy will affect live notifications.

Do not allow editing an active policy to silently change the configuration used by already queued notifications.

### 3.2 Policy Information

Every policy must include:

- Policy name.
- Description.
- School or tenant ID.
- Academic year or applicable academic period, if supported.
- Policy version.
- Created by.
- Last updated by.
- Creation and modification timestamps.
- Activation timestamp.
- Effective start and end dates, where applicable.
- Current status.
- Optional internal notes.

Policy IDs and tenant ownership must be assigned and validated by the backend.

### 3.3 Attendance Monitoring Scope

Allow schools to choose:

**Option A — Daily Attendance**

Evaluate whether a student is absent for the school day.

**Option B — Lesson-Level Attendance**

Evaluate attendance for individual lessons, periods, or sessions.

**Option C — Both**

Apply independently configured rules to daily and lesson-level attendance.

The system must understand the school's academic calendar, school days, holidays, closures, class timetables, and attendance register submission state.

Never generate absence alerts for cancelled sessions, non-school days, or attendance registers that have not been submitted.

Do not assume every school follows the same school-day schedule.

### 3.4 Trigger Configuration

Provide a configurable trigger strategy.

Supported trigger options:

1. Immediately after a valid attendance register is submitted.
2. After a configurable delay following submission.
3. At a specified school-local time.
4. After a configurable register submission deadline.
5. After a configurable correction or verification window.
6. After an authorized staff member approves an absence.
7. After a specified number of consecutive missed lessons.
8. After a configured absence threshold is reached.
9. Manually after authorized staff review.

The school must be able to select a supported trigger and configure its associated parameters.

Examples:

- Send immediately after register submission.
- Wait 10 minutes for attendance corrections.
- Evaluate unexplained daily absences at 9:00 AM.
- Notify after two consecutive missed lessons.
- Require administrative review before sending.

Treat these as configurable examples, not universal defaults.

If a school chooses a scheduled trigger, define what happens when the register is submitted after the scheduled time.

Allow the school to configure a fallback behavior, such as immediate evaluation after late submission or placing the case in an exception queue.

Use the school's configured timezone for schedules. Handle daylight-saving changes if applicable to the configured timezone.

### 3.5 Absence Eligibility Rules

The backend must distinguish between the following attendance states:

- Present.
- Absent.
- Late.
- Excused absence.
- Approved leave.
- Unexcused absence.
- Pending verification.
- Corrected attendance.
- Not yet recorded.

Define policy rules for each applicable state.

Examples:

- A confirmed unexplained absence can qualify for a notification.
- An approved leave must not trigger an ordinary unexplained-absence alert.
- A late arrival can use a separate notification rule.
- An unsubmitted register must not be interpreted as a completed absence record.
- An attendance record corrected to Present before dispatch must cancel its pending absence alert.
- A correction made after an SMS has been accepted must preserve the original audit history and can trigger a separate correction notification if the school enables that feature.

Support configurable conditions, including:

- Student enrollment and active status.
- Whether the student is expected to attend.
- Whether the register is submitted.
- Whether the absence is excused.
- Whether a previous alert was sent for the same event.
- Whether the guardian is authorized to receive notifications.
- Whether the absence meets the school's threshold.
- Whether the case requires human review.

Avoid building an unrestricted user-defined rule language for the first release. Implement a validated set of supported policy conditions that can be extended later.

## 4. Guardian and Recipient Configuration

Allow each school to choose a recipient strategy.

Supported options:

1. Send to the primary authorized guardian.
2. Send to all authorized guardians.
3. Send to the primary guardian, then use an approved fallback if the primary contact is invalid or unavailable under the configured rules.
4. Require staff review when no valid recipient is available.

Provide a guardian management interface with:

- Guardian name.
- Relationship to student.
- Verified phone number.
- Preferred language.
- Primary contact designation.
- Notification consent or communication authorization status, as applicable.
- Active or inactive status.
- Notification eligibility.
- Contact verification date, if supported.

The system must not send sensitive student information to arbitrary phone numbers or unauthorized contacts.

Define exactly what a fallback means. A fallback triggered by a permanent invalid-number error is different from a fallback triggered by an uncertain provider timeout. Do not automatically send to another guardian while the original request might already have been accepted unless the duplicate and disclosure risks have been addressed.

Support per-school contact verification and guardian authorization workflows.

## 5. Notification Frequency and Duplicate Prevention

Each school must be able to configure how frequently absence alerts are sent.

Supported strategies:

- One alert per student per school day.
- One alert per student per lesson.
- One alert per distinct absence event.
- Escalation after a configurable period.
- Additional alerts only when a defined attendance state changes.
- Manual follow-up only.

Provide configurable cooldown periods and maximum notification counts where appropriate.

For the MVP, recommend one initial absence alert per student per school day, with optional separate late-arrival or correction alerts.

Prevent duplicate alerts caused by:

- Repeated attendance submissions.
- Multiple teachers submitting the same register.
- Job retries.
- Duplicate queue messages.
- Browser resubmission.
- Provider timeout or uncertain outcomes.
- Concurrent policy evaluations.

Implement backend idempotency using a stable notification event key derived from the tenant, student, attendance event, notification type, and relevant policy scope.

A database uniqueness constraint must enforce the relevant deduplication rule. Do not rely only on frontend validation.

## 6. Language, Templates, and SMS Content

Allow schools to configure:

- Default language.
- Guardian-specific preferred language.
- English templates.
- Amharic templates.
- Other supported languages as the platform expands.
- Different templates for daily absence, lesson absence, lateness, corrections, and follow-up notifications.

All templates must be stored as configurable content rather than hardcoded into application components.

Support approved variables such as:

- `{student_name}`
- `{date}`
- `{lesson_name}`
- `{school_name}`
- `{school_phone}`
- `{absence_type}`

Validate templates before activation:

- Reject unsupported variables.
- Escape or safely interpolate variable values.
- Require mandatory information where applicable.
- Enforce configurable length limits.
- Preview the final rendered message.
- Show estimated encoding, segments, and SMS credit usage.
- Require appropriate review for translated templates.

Use supportive, neutral, non-accusatory language.

Example English template:

“Dear Parent/Guardian, {student_name} was marked absent from {school_name} today ({date}). If unexpected, contact {school_phone}.”

Example Amharic template:

“ውድ ወላጅ/አሳዳጊ፣ {student_name} ዛሬ ({date}) ትምህርት ቤት አልተገኘም ተብሎ ተመዝግቧል። ይህ ያልተጠበቀ ከሆነ {school_name} በ{school_phone} ያነጋግሩ።”

Have Amharic content reviewed by a fluent speaker before production use.

SMSHub appends the account's configured signature. Include that signature in segment estimation.

SMS segment limits:

- GSM-7 messages: typically 160 characters for one segment.
- Unicode messages, including Amharic and Ge'ez: typically 70 characters for one segment.
- Concatenated messages have lower per-segment capacities.

Use the provider's actual validation response where available. Do not assume the entire message fits into one segment.

Provide a live preview showing the final rendered message and estimated SMS segments before the school activates a template.

## 7. SMSHub Integration

Integrate the absence alert system with SMSHub through a secure backend service.

Official documentation: https://smshub.et/docs

Use the documented endpoints:

- Live SMS: `POST https://smshub.et/api/sms`
- Test SMS validation: `POST https://smshub.et/api/test`
- Account balance: `GET https://smshub.et/api/balance`

Authentication:

`Authorization: Bearer <SMSHUB_API_KEY>`

Example request body:

```json
{
  "msisdn": "0912345678",
  "text": "Dear Parent/Guardian, your child was marked absent today."
}
```

Do not send an unsupported custom sender field. SMSHub appends the account signature.

The API key must remain in backend environment variables or an appropriate secret manager. Never expose it in frontend code, browser storage, API responses, logs, or client-side bundles.

### 7.1 Provider Response Handling

Record relevant provider information:

- Provider message ID.
- Provider request ID.
- Provider message status.
- Credits used.
- Credits remaining, where returned.
- HTTP status.
- Sanitized error category.
- Request timestamp.
- Response timestamp.
- Retry count.

Do not assume that provider acceptance proves the message reached the guardian's handset. SMSHub currently reports `delivery_report` as null when handset delivery receipts are unavailable.

Show the correct status to school administrators, such as:

- Queued.
- Processing.
- Accepted by provider.
- Failed.
- Delivery unconfirmed.
- Suppressed by policy.
- Cancelled before dispatch.
- Awaiting manual review.

Never label a message “Delivered” without an authoritative delivery receipt.

### 7.2 Retry Policy

Implement bounded retries with exponential backoff and jitter.

Retry only documented transient errors, including HTTP 429, 500, 502, and 503, subject to the provider's error semantics.

Treat HTTP 400, 401, 402, 403, and 422 as non-retryable without an appropriate configuration or data correction.

Respect rate-limit information when available.

Handle timeouts carefully. A timeout can mean the provider accepted the request but the response was lost. Do not blindly resend an uncertain request. Use provider reconciliation or another documented mechanism if available; otherwise, flag the request for controlled investigation.

A low balance or insufficient credits must trigger a visible operational warning and an administrator notification. Do not discard pending alerts silently.

### 7.3 Provider Testing

Provide a “Test SMS Configuration” function that:

1. Verifies that the backend can access the configured provider.
2. Checks configuration and available balance where supported.
3. Uses the SMSHub test endpoint for message validation.
4. Displays the validation result, encoding, estimated segments, and credit requirements when returned.
5. Clearly distinguishes a validation test from an actual SMS send.

The test endpoint must not be represented as proof that a handset received an SMS.

If the school requests a real test SMS, require an explicit user action, validate the destination, and clearly disclose that a live message and provider charges may result.

## 8. Policy Configuration User Experience

Build a professional, responsive, enterprise-quality administration interface.

Use a guided multi-step policy editor with the following sections:

### Step 1: General Settings

- Policy name.
- Description.
- Academic period.
- Applicable school or academic unit.
- Policy activation status.

### Step 2: Attendance Scope

- Daily attendance.
- Lesson attendance.
- Both.
- Eligible attendance states.

### Step 3: Trigger Rules

- Register submission behavior.
- Trigger timing.
- Correction window.
- Schedule and timezone.
- Absence threshold.
- Human review requirement.

### Step 4: Recipients

- Primary guardian.
- All authorized guardians.
- Configured fallback strategy.
- Invalid or missing contact behavior.

### Step 5: Frequency and Escalation

- Duplicate prevention scope.
- Cooldown.
- Maximum notification count.
- Follow-up timing.
- Optional late-arrival and correction alerts.

### Step 6: Message and Language

- Default language.
- Language-selection strategy.
- Template selection.
- Template editor.
- Message preview.
- SMS segment estimation.

### Step 7: Failure Handling

- Retry settings within approved system limits.
- Insufficient balance behavior.
- Invalid phone handling.
- Provider outage behavior.
- Timeout and uncertain-result handling.
- Staff escalation rules.

### Step 8: Review and Activation

Display a human-readable summary of every configured rule.

Example:

“When a teacher submits a daily attendance register, the system will wait 10 minutes, exclude approved leave and corrected attendance, and notify the primary authorized guardian of each eligible unexplained absence. Notifications will use the guardian's preferred language. Each student will receive no more than one initial daily absence alert. Failed notifications will appear in the school's exception queue.”

Provide these actions:

- Save Draft.
- Validate Policy.
- Preview Outcomes.
- Test Configuration.
- Activate Policy.
- Cancel.

Require explicit confirmation before activation.

### UX Requirements

- Use clear field labels and concise help text.
- Show conditional fields only when relevant.
- Validate dependencies between settings.
- Explain invalid combinations rather than silently changing settings.
- Provide loading, success, error, and empty states.
- Support keyboard navigation and accessible form controls.
- Use responsive layouts for desktop, tablet, and mobile.
- Display unsaved changes.
- Warn when navigating away from a modified draft.
- Avoid excessive confirmation dialogs for ordinary edits.
- Provide sensible, editable initial defaults.
- Never enable live notifications simply because a user saved a draft.

## 9. Policy Validation and Simulation

Before activation, provide a policy simulation tool.

Allow authorized administrators to select a date, class, attendance register, or representative test case.

The simulator should explain why a notification would be sent or suppressed.

Example outcomes:

**Eligible**

- Attendance register submitted.
- Student expected to attend.
- Absence is unexplained.
- Correction window expired.
- Authorized guardian has a valid contact.
- No duplicate alert exists.

Result: Eligible for notification.

**Suppressed**

- Student has approved leave.

Result: No absence alert under the active policy.

**Pending**

- Attendance register has not been submitted.

Result: No notification yet.

**Requires review**

- Guardian phone number is missing or invalid.

Result: Add or verify a contact before sending.

The simulator must use the same policy evaluation service as production.

It must not send real SMS messages. Clearly separate simulated results from actual provider activity.

Where feasible, support previewing how a proposed policy differs from the active policy.

## 10. Runtime Workflow

Implement the following backend-controlled workflow.

1. A teacher records attendance.
2. The attendance register is validated and submitted.
3. The system creates or identifies the relevant attendance event.
4. The backend loads the applicable active policy for that school.
5. The policy engine evaluates the attendance event.
6. The system checks approved leave, calendar rules, expected attendance, correction windows, and previous notifications.
7. The event becomes eligible, suppressed, pending, or requires review.
8. Eligible events are stored in a durable notification queue.
9. The system resolves authorized recipients and language preferences.
10. The message template is rendered and validated.
11. The notification worker submits the request to SMSHub.
12. The provider response is recorded.
13. Retryable errors follow bounded retry rules.
14. Permanent failures appear in the exception queue.
15. Administrators can inspect notification history and resolve actionable errors.
16. Policy changes, attendance corrections, and manual interventions are recorded in the audit trail.

Use a transactional outbox or an equivalent reliable mechanism to prevent attendance transactions and notification queue creation from becoming inconsistent.

If a notification is still pending when attendance changes, reevaluate eligibility before dispatch.

Define how policy changes affect queued events. The default should be to retain the policy version associated with the event and apply an explicitly defined re-evaluation rule rather than silently using whichever policy is currently active.

## 11. Multi-Tenant Architecture and School Isolation

Treat every school as a separate tenant.

Enforce tenant isolation in:

- Database queries.
- API authorization.
- Policy CRUD operations.
- Attendance event processing.
- Queue payloads.
- Guardian resolution.
- Notification history.
- Reporting.
- Template management.
- Policy simulation.
- Audit logs.

Do not trust a tenant ID supplied by the browser without authorization checks.

Resolve the authorized tenant from the authenticated user's membership and permissions, then validate access to the requested resource.

A school administrator must never be able to view, modify, simulate, or activate another school's policy.

If the platform supports organization-level administrators, define their scope explicitly and audit their actions.

## 12. Suggested Data Model

Design and implement a normalized database model appropriate for the existing project.

Include entities equivalent to:

- `School` or `Tenant`
- `SchoolMembership`
- `AttendancePolicy`
- `AttendancePolicyVersion`
- `AttendancePolicyRule`
- `NotificationTemplate`
- `Guardian`
- `StudentGuardian`
- `AttendanceRegister`
- `AttendanceRecord`
- `AbsenceEvent`
- `NotificationEvent`
- `NotificationRecipient`
- `NotificationAttempt`
- `NotificationAuditLog`
- `NotificationOutbox`
- `ProviderConfiguration`
- `PolicySimulation`

These names are conceptual and should be adapted to the existing naming conventions.

### Data Model Requirements

- Use stable primary keys.
- Add tenant ownership where appropriate.
- Add foreign keys and appropriate indexes.
- Enforce uniqueness constraints for deduplication.
- Use transactions for related attendance and notification operations.
- Store timestamps consistently and render them in the school's timezone.
- Record the policy version used to evaluate each notification.
- Preserve an immutable audit history of important changes.
- Protect phone numbers and other sensitive data.
- Avoid storing API secrets in ordinary school configuration records.
- Define retention and deletion rules for attendance and notification data.

For policy versions, prefer immutable published versions. Editing a published policy should create a new draft version, followed by validation and activation.

Define behavior for scheduled policy versions, overlapping effective periods, and conflicting active policies. Reject ambiguous configurations.

## 13. API Design

Create authenticated, tenant-authorized APIs following the existing project's conventions.

Provide endpoints equivalent to:

- `GET /api/schools/:schoolId/attendance-policies`
- `POST /api/schools/:schoolId/attendance-policies`
- `GET /api/schools/:schoolId/attendance-policies/:policyId`
- `PATCH /api/schools/:schoolId/attendance-policies/:policyId`
- `POST /api/schools/:schoolId/attendance-policies/:policyId/validate`
- `POST /api/schools/:schoolId/attendance-policies/:policyId/simulate`
- `POST /api/schools/:schoolId/attendance-policies/:policyId/activate`
- `POST /api/schools/:schoolId/attendance-policies/:policyId/schedule`
- `GET /api/schools/:schoolId/attendance-policies/:policyId/versions`
- `GET /api/schools/:schoolId/notification-events`
- `GET /api/schools/:schoolId/notification-events/:eventId`
- `POST /api/schools/:schoolId/notification-events/:eventId/retry`
- `POST /api/schools/:schoolId/notification-events/:eventId/resolve`

Adapt the exact paths to the existing API conventions.

Do not expose an endpoint that lets a browser call SMSHub with the school's API key.

For every endpoint:

- Validate request schemas.
- Authenticate the user.
- Authorize the tenant and required permission.
- Validate resource ownership.
- Return consistent error structures.
- Prevent unauthorized activation or manual resend.
- Add rate limiting where appropriate.
- Document the API with OpenAPI/Swagger if the project supports it.

Manual retries must respect idempotency and uncertain provider outcomes. They must not bypass policy or security checks.

## 14. Roles and Permissions

Implement granular role-based access control.

Example permissions:

| Role | Capabilities |
|---|---|
| Platform Superadmin | Platform-wide administration under audited authorization |
| School Owner | Manage school policies, authorized settings, and operational access |
| School Administrator | Create, validate, activate, and review policies within granted permissions |
| Attendance Officer | View attendance and permitted notification records |
| Teacher | Record and correct attendance within assigned classes |
| HR or Academic Supervisor | Review attendance exceptions if configured |
| Read-only Auditor | Inspect authorized history without changing configuration |

Adapt roles to the actual school domain.

Separate permissions for:

- Viewing policy.
- Editing a draft.
- Activating a policy.
- Managing templates.
- Configuring SMS provider credentials.
- Viewing guardian contact information.
- Retrying failed notifications.
- Reviewing audit logs.

Do not assume every school uses identical job titles. Provide a secure way to map permissions to school roles.

## 15. Operational Monitoring Dashboard

Create a dedicated notification monitoring page showing:

- Total eligible absence events.
- Notifications queued.
- Notifications being processed.
- Provider-accepted messages.
- Failed attempts.
- Uncertain outcomes.
- Suppressed events.
- Events awaiting review.
- Retry queue size.
- Current provider balance, if available.
- Recent provider errors.
- Last successful provider request.

Provide filters for:

- Date range.
- Class.
- Student.
- Notification type.
- Policy version.
- Status.
- Recipient.
- Error category.

Show a detailed event timeline:

- Attendance submitted.
- Policy evaluated.
- Eligibility decision made.
- Notification queued.
- Provider request attempted.
- Provider response received.
- Retry scheduled or exception raised.
- Manual resolution completed.

Avoid exposing full student or guardian data in aggregate dashboards unless the user is authorized to access it.

## 16. Security, Privacy, and Audit Requirements

Implement:

- Server-side tenant authorization.
- Role-based access control.
- Secure API-key storage.
- Input validation and output encoding.
- Rate limiting.
- Audit logging.
- Protection against duplicate requests.
- Restricted access to guardian phone numbers.
- Redaction of secrets and sensitive content from logs.
- Configurable data-retention rules.
- Secure webhook verification if SMSHub webhooks are used.
- HMAC-SHA256 verification using the provider's documented `X-SMSHub-Signature` procedure.
- Replay protection and idempotent webhook processing.
- Monitoring for repeated failures and suspicious manual resend activity.

Verify webhook signatures using the exact payload and canonicalization rules specified in the provider documentation. Do not invent a signing format.

Use the minimum student information required in an SMS. Avoid unnecessarily disclosing sensitive details about a student's circumstances.

Establish school-approved procedures for safeguarding incidents, emergencies, and sensitive attendance cases. Ordinary absence alerts must not replace emergency or safeguarding protocols.

Review applicable Ethiopian privacy, education, telecommunications, and school requirements before production deployment. Do not present foreign school attendance guidance as Ethiopian law.

## 17. Testing Requirements

Create unit, integration, authorization, and end-to-end tests.

### Policy Engine Tests

- Immediate notification after valid submission.
- Delayed notification.
- Scheduled evaluation.
- Unsubmitted register suppression.
- Approved leave suppression.
- Late arrival rules.
- Lesson threshold evaluation.
- Correction before dispatch.
- Correction after provider acceptance.
- Missing guardian phone.
- Multiple authorized guardians.
- Guardian language selection.
- Cooldown and duplicate prevention.
- Policy version change.
- Scheduled policy activation.
- Conflicting policy rejection.
- School holiday and closure handling.

### SMS Integration Tests

- Valid provider response.
- Invalid API key.
- Insufficient credits.
- Invalid recipient.
- Rate limit.
- Temporary provider failure.
- Provider timeout.
- Malformed response.
- Duplicate queue delivery.
- Uncertain provider acceptance.
- Webhook signature validation.
- Provider outage recovery.

### Multi-Tenant Security Tests

- School A cannot read School B's policy.
- School A cannot modify School B's policy.
- School A cannot activate School B's policy.
- School A cannot inspect School B's notification events.
- Unauthorized users cannot access guardian details.
- Teachers cannot activate policies without permission.
- Manual retries cannot bypass authorization or deduplication.

Use mocked provider responses in automated tests. Never send live SMS messages from the ordinary test suite.

## 18. Implementation Strategy

Implement this in controlled phases.

**Phase 1 — Foundation**

- Inspect the existing project and architecture.
- Identify attendance, school, student, guardian, authentication, and permission models.
- Confirm existing framework, database, queue technology, and coding conventions.
- Document gaps before making changes.

**Phase 2 — Policy Management**

- Implement policy schema and versioning.
- Build the policy dashboard and guided editor.
- Add validation, authorization, and activation workflows.
- Add school isolation tests.

**Phase 3 — Policy Evaluation**

- Implement the shared backend policy engine.
- Integrate it with attendance register submission.
- Implement suppression, correction handling, thresholds, and deduplication.
- Add simulation using the same engine.

**Phase 4 — Reliable Notification Processing**

- Implement the durable queue or transactional outbox.
- Add the SMSHub adapter.
- Add template rendering and encoding estimation.
- Implement bounded retries and uncertain-result handling.
- Record provider responses and audit events.

**Phase 5 — Monitoring and Administration**

- Build notification history.
- Add operational dashboards and exception handling.
- Add manual resolution and controlled retry actions.
- Add provider balance and configuration checks.

**Phase 6 — Verification and Release**

- Run automated tests.
- Verify tenant isolation and permissions.
- Test SMSHub using its non-sending test endpoint.
- Conduct an explicitly authorized live test if required.
- Validate migration safety and deployment configuration.
- Provide setup documentation and operational runbooks.

Do not rewrite unrelated modules unnecessarily. Reuse the project's established architecture and conventions.

## 19. Definition of Done

The implementation is complete only when:

1. Every school can create and manage its own absence alert policies.
2. Policies can be validated, simulated, versioned, and activated safely.
3. The backend evaluates events using the correct school's active policy.
4. Attendance corrections and approved leave are handled correctly.
5. Notification recipients are authorized and deduplicated.
6. SMSHub requests are sent only through the backend.
7. Provider errors and uncertain outcomes are handled safely.
8. Notification status accurately distinguishes provider acceptance from confirmed delivery.
9. Administrators can inspect event histories and resolve exceptions.
10. Role-based access control and tenant isolation are tested.
11. Policy changes do not silently rewrite historical decisions.
12. The UI is responsive, accessible, and suitable for school administrators.
13. Automated tests cover policy evaluation, integration failures, and security.
14. Documentation explains configuration, activation, deployment, troubleshooting, and operational responsibilities.

## 20. Required Deliverables

Before implementation, produce:

1. Existing architecture assessment.
2. Functional requirements and acceptance criteria.
3. Policy lifecycle and attendance-to-notification workflow diagrams.
4. Database schema and migration plan.
5. API specification.
6. UI/UX page structure and component plan.
7. Permission matrix.
8. Error-handling and retry strategy.
9. Testing strategy.
10. Phased implementation checklist.

Then implement the functionality, including frontend, backend, database migrations, tests, and documentation.

At the end, report:

- Files created and modified.
- Database changes.
- API endpoints implemented.
- Policy rules supported.
- Security controls implemented.
- Tests executed and their results.
- Required environment variables.
- Any incomplete functionality or unresolved assumptions.

**Final engineering requirement:** The policy engine must be the single source of truth for absence notification eligibility. The frontend configures and explains the policy; the backend validates, versions, evaluates, and enforces it. SMSHub is responsible for accepting SMS requests, while the school system remains responsible for policy correctness, duplicate prevention, auditability, and operational visibility.
