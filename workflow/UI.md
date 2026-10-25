# MASTER PROJECT PROMPT
# School Attendance Management System with Automated Parent/Guardian SMS Alerts

## 1. ROLE AND OBJECTIVE

Act as a Principal SaaS Product Designer, Senior UI/UX Architect, School Management Systems Analyst, Senior Full-Stack Engineer, and Quality Assurance Engineer.

Your task is to design and implement a professional, production-oriented School Attendance Management System that allows schools to record student attendance, identify unexplained absences, and automatically notify parents or guardians through SMS.

The system must be suitable for Ethiopian schools, with support for English and Amharic, Ethiopian mobile phone number formats, and the SMSHub messaging API.

The application must provide an excellent experience for:
- School administrators.
- Teachers.
- Class teachers and homeroom teachers.
- Attendance officers.
- Academic coordinators.
- Authorized parents and guardians.
- Finance or system administrators responsible for SMS credits and integration configuration.

The product must look like a polished, commercial SaaS platform used by real educational institutions.

Do not create a generic HR dashboard, employee attendance system, or basic student CRUD application.

Build an education-focused product in which student attendance, class sessions, parent communication, and actionable absence alerts are the central features.

### Core objective

The most important product outcome is:

**When a student misses a scheduled class or is marked absent according to school policy, the system should automatically send an appropriate SMS to the student's authorized parent or guardian, without creating duplicate or incorrect notifications.**

This must be implemented as a controlled, auditable workflow—not merely a button that sends SMS messages.

## 2. PRODUCT VISION

Build a School Attendance and Parent Notification Platform that enables schools to:

1. Register students and maintain their guardian relationships.
2. Organize students into academic years, grades, sections, and classes.
3. Create timetables and scheduled lessons.
4. Allow teachers to record attendance efficiently.
5. Identify absences, late arrivals, and incomplete attendance records.
6. Notify the correct parents or guardians automatically.
7. Manage attendance corrections and reported absences.
8. Monitor SMS delivery-submission results, provider errors, and credit consumption.
9. Generate attendance reports for school administrators and teachers.
10. Maintain a complete history of attendance changes and parent notifications.

The application should answer five critical questions immediately:

- Which students are absent today?
- Which teachers have not submitted attendance?
- Which absent students have had their parents or guardians notified?
- Which notifications failed or require attention?
- Which classes, grades, or students have recurring attendance problems?

Every major screen should help users answer one or more of these questions.

## 3. TARGET MARKET AND LOCALIZATION

Design for Ethiopian primary schools, secondary schools, preparatory schools, and private educational institutions.

The interface must support:

- English as the initial interface language.
- Amharic as an additional interface language.
- Ethiopian mobile numbers.
- Ethio Telecom and Safaricom recipients.
- Ethiopian school calendars and configurable academic years.
- School-specific attendance policies.
- Configurable school working days, class periods, breaks, and holidays.
- School-defined grade and section naming.
- Ethiopian date-calendar support where the implementation can reliably provide it.
- Localized date and time display.
- Low-bandwidth and mobile-friendly usage.

Do not assume that every Ethiopian school follows the same academic calendar, grading system, working week, or attendance policy. Make these settings configurable.

Do not hardcode a particular school's timetable, grading structure, or notification rules into the frontend.

## 4. PRODUCT DESIGN DIRECTION

Create a distinctive education SaaS design inspired by the usability and consistency of modern products such as Linear, Stripe Dashboard, and well-designed school administration platforms.

Use references for design quality and interaction patterns, not as templates to copy.

### Visual personality

The design should communicate:

- Trust.
- Accuracy.
- Safety.
- Educational professionalism.
- Operational efficiency.
- Transparency.
- Accessibility.

Use a clean, structured layout with strong typography, carefully designed tables, meaningful status indicators, and purposeful data visualizations.

Suggested color system:

- Primary: Indigo `#4F46E5`.
- Primary hover: `#4338CA`.
- App background: `#F8FAFC`.
- Surface: `#FFFFFF`.
- Primary text: `#0F172A`.
- Secondary text: `#64748B`.
- Borders: `#E2E8F0`.
- Success: accessible green.
- Warning: accessible amber.
- Error: accessible red.
- Informational: accessible blue.

Refine these tokens into a consistent, accessible design system.

Use color to communicate state, not merely to decorate cards.

### Avoid

- Generic HR dashboard layouts.
- Excessive gradients and glassmorphism.
- Oversized KPI cards that waste screen space.
- Excessive rounded containers.
- Too many unrelated colors.
- Decorative charts without useful data.
- Emoji in place of professional interface icons.
- Unnecessary 3D effects in attendance workflows.
- Animations that slow teachers down.
- Fake real-time data.
- Misleading SMS delivery statuses.

The product should feel polished, fast, and practical during a busy school day.

## 5. INFORMATION ARCHITECTURE

Create a role-aware application shell with a collapsible sidebar, top navigation, breadcrumbs, responsive content area, and consistent page headers.

### Main navigation

Organize the application into the following sections.

**Overview**
- School dashboard.
- Today's attendance.
- Attendance alerts.
- Pending actions.

**Academic Management**
- Academic years and terms.
- Grades and sections.
- Subjects.
- Class assignments.
- Timetables and class periods.
- School calendar and holidays.

**Students**
- Student directory.
- Student registration.
- Student profiles.
- Class and section assignments.
- Parent and guardian records.
- Student attendance history.

**Attendance**
- Take attendance.
- Today's attendance.
- Class attendance.
- Attendance exceptions.
- Late arrivals.
- Early departures, if applicable.
- Reported absences.
- Attendance corrections.
- Attendance history.

**Parent Notifications**
- Notification overview.
- Automatic notification rules.
- SMS templates.
- Message history.
- Failed notifications.
- SMSHub integration.
- Credit balance.
- Notification reports.

**Reports**
- Daily attendance.
- Weekly and monthly summaries.
- Student attendance reports.
- Class and grade comparisons.
- Recurring absences.
- Parent notification reports.
- SMS usage reports.

**Administration**
- Teachers and staff.
- User accounts and roles.
- School settings.
- Attendance policies.
- Notification settings.
- Audit logs.

Show only the navigation items the current user is authorized to access.

Keep teacher-facing attendance actions easy to reach. Do not force teachers to navigate through several administration pages to record a class's attendance.

## 6. ROLE-BASED EXPERIENCES

Design a different dashboard and workflow for each user role.

### 6.1 School Administrator

The administrator should have access to:

- School-wide attendance statistics.
- Total active students.
- Present, absent, late, and excused student counts.
- Attendance submission progress by class.
- Classes with missing attendance records.
- Students with unresolved absences.
- Parent notification status.
- SMS credit balance and low-credit warnings.
- Failed notification review.
- Attendance and communication reports.
- School configuration and authorized user management.

The administrator must be able to identify operational problems without opening multiple pages.

### 6.2 Teacher

The teacher's primary job is to take attendance accurately and quickly.

Provide:

- Today's assigned classes.
- Current and upcoming lessons.
- One-click access to take attendance.
- Student roster with names and identifiers.
- Attendance status controls.
- Class attendance completion status.
- A summary of students marked absent.
- Clear submission confirmation.
- Ability to correct records when authorized.
- Previous attendance history.
- Visibility into whether an absence notification has been submitted to the SMS provider.

Design the attendance-taking workflow to be usable on mobile devices and classroom computers.

Minimize unnecessary navigation and data entry.

### 6.3 Class Teacher or Homeroom Teacher

Provide:

- Overview of assigned students.
- Daily and weekly attendance summaries.
- Repeated-absence indicators.
- Guardian contact status.
- Attendance exceptions.
- Student attendance histories.
- Parent communication history where authorized.
- Follow-up notes and review tasks.

### 6.4 Attendance Officer

Provide:

- Consolidated attendance monitoring.
- Missing attendance submissions.
- Late and absent student records.
- Attendance corrections and review queues.
- Notification processing status.
- Exception resolution.
- Attendance reports.

### 6.5 SMS and System Administrator

Provide:

- SMSHub connection status.
- Current credit balance.
- Low-credit threshold.
- SMS templates and language configuration.
- Notification rules.
- Message history.
- Failed requests and request IDs.
- Webhook event history, where configured.
- Safe integration diagnostics.
- Role and permission management as authorized.

### 6.6 Parent or Guardian

A parent-facing portal may be implemented as a separate responsive experience if included in the project's scope.

Potential features:

- View linked students.
- View attendance summaries.
- Review absence notifications.
- Report or explain an absence.
- Request an attendance correction.
- Review notification history.
- Manage communication preferences within school policy.

SMS remains the primary notification channel for the initial release. Do not require every parent to install an application or create a portal account to receive absence alerts.

A parent portal must not expose another family's student records.

## 7. SCHOOL ADMINISTRATOR DASHBOARD

Design a high-quality dashboard that focuses on today's attendance and parent communication.

### Header

Display:

- School name and logo.
- Current date.
- Academic year and term.
- School or campus selector if applicable.
- Notification center.
- User profile.
- Quick actions.

### Key performance indicators

Include:

1. Total active students.
2. Present today.
3. Absent today.
4. Late arrivals.
5. Excused absences.
6. Attendance submission rate.
7. Parent notifications submitted.
8. Failed notifications requiring review.

Make the distinction between students, attendance records, and SMS messages explicit.

For example, one absent student may have multiple guardians, and one student may have several scheduled lessons. Do not treat every lesson absence as a unique absent student in school-wide totals.

Each KPI should be clickable and open a relevant filtered view.

Calculate attendance rates using eligible students and scheduled attendance obligations. Exclude holidays, non-school days, and approved absences from denominators according to configured policy.

### Dashboard panels

Include:

- Attendance by grade or section.
- Attendance trend over the selected period.
- Class attendance submission progress.
- Latest absence records.
- Notifications pending processing.
- Failed SMS requests.
- Low SMS credit warnings.
- Students with recurring unexplained absences.
- Upcoming school holidays and important dates.

Use real backend data whenever available.

If no data exists, show a clear empty state rather than invented numbers or misleading charts.

## 8. STUDENT REGISTRATION AND MANAGEMENT

Create a professional student directory.

### Student table

Recommended columns:

- Student ID.
- Student name.
- Profile image or initials.
- Grade.
- Section.
- Academic year.
- Enrollment status.
- Guardian contact status.
- Today's attendance status.
- Actions.

Provide:

- Search by name or student ID.
- Grade and section filters.
- Academic year filter.
- Enrollment status filter.
- Pagination.
- Sorting.
- Import and export where supported.
- Bulk enrollment actions with appropriate authorization.
- Responsive mobile presentation.

### Student registration form

Organize the form into clear sections.

**Personal information**
- Student ID.
- Full name.
- Date of birth, if required.
- Gender, if required by school policy.
- Address, if required.
- Enrollment date.
- Student status.

**Academic placement**
- Academic year.
- Grade.
- Section.
- Class or homeroom.
- Relevant class assignments.

**Parent and guardian information**
- Guardian name.
- Relationship to student.
- Mobile number.
- Preferred communication language.
- Primary notification contact.
- Additional authorized guardians.
- Contact verification status, where supported.
- Permission to receive school communications, according to school policy.

Avoid collecting unnecessary personal data.

### Student profile

Provide tabs for:

- Overview.
- Attendance.
- Academic placement.
- Parents and guardians.
- Notifications.
- Reported absences.
- Audit history, for authorized users.

The profile should provide a clear timeline of attendance and related communication events.

Do not expose sensitive family contact information to users who do not need it.

## 9. PARENT AND GUARDIAN MANAGEMENT

This module is central to the application's correctness.

Model students and guardians as a many-to-many relationship when the school needs to support multiple guardians per student and guardians linked to multiple students.

For each student-guardian relationship, support appropriate fields such as:

- Guardian identity.
- Relationship to student.
- Phone number.
- Preferred language.
- Primary contact status.
- Notification eligibility.
- Contact verification status.
- Active or inactive relationship status.

### Notification recipient selection

Allow the school to configure which guardians receive notifications.

Examples:

- Notify the primary guardian only.
- Notify all eligible guardians.
- Notify a configured guardian group.
- Use an approved escalation rule if the primary contact is unavailable.

These policies must be configurable and enforced on the backend.

Do not assume that the first guardian entered is the correct recipient.

Prevent duplicate SMS messages when the same phone number is linked to multiple guardians or siblings, unless separate messages are explicitly required by school policy.

Display useful contact warnings when:

- No eligible guardian is registered.
- The phone number is invalid.
- The number has not been verified when verification is required.
- The contact is inactive.
- The guardian is not authorized to receive the selected notification.

Never silently substitute an unrelated or unapproved phone number.

## 10. CLASS TIMETABLE AND ATTENDANCE OBLIGATIONS

Create a timetable system that determines when attendance should be taken.

Support:

- Academic years.
- Terms or semesters.
- School days.
- Grade and section assignments.
- Subject assignments.
- Teacher assignments.
- Class periods.
- Start and end times.
- Holidays.
- Breaks.
- Special schedules.
- Cancelled or rescheduled lessons.
- Attendance-taking windows.

Use the school's configured timezone and calendar.

Do not trigger absence alerts merely because no attendance record exists.

A missing attendance record may mean the teacher has not submitted attendance yet. This is different from a student being marked absent.

The system must distinguish:

- Attendance not yet taken.
- Attendance in progress.
- Attendance submitted.
- Student present.
- Student absent.
- Student late.
- Student excused or on approved absence.
- Student not expected to attend.
- Attendance correction pending.

For lesson-level attendance, use the configured timetable to establish which students were expected to attend.

For daily attendance, apply the school's daily attendance rules separately.

Do not assume that every school requires a separate absence SMS for every missed lesson. Make the notification trigger configurable.

## 11. TEACHER ATTENDANCE-TAKING INTERFACE

This is one of the most important screens in the application.

Optimize it for speed, accuracy, and minimal classroom disruption.

### Attendance-taking screen

The header should display:

- Class or section.
- Subject.
- Teacher.
- Academic date.
- Scheduled lesson.
- Start and end time.
- Number of enrolled students.
- Attendance submission status.

### Student roster

Display:

- Student identifier.
- Student name.
- Optional profile image.
- Current attendance status.
- Relevant note or exception indicator.
- Accessible attendance controls.

Provide simple status controls:

- Present.
- Absent.
- Late.
- Excused, if authorized and supported.

Use clear visual differentiation and text labels. Never rely on color alone.

### Fast attendance workflow

Implement the following interaction:

1. Teacher opens an assigned class.
2. The system loads the expected student roster.
3. Teacher marks students present, absent, late, or excused.
4. The interface shows live counts of each status.
5. The teacher reviews the absence list.
6. The system highlights students without eligible guardian contacts.
7. Teacher submits attendance.
8. The backend validates the submission and applies the school's attendance rules.
9. Eligible absence notifications enter the notification workflow.
10. The teacher receives a clear submission result.

Provide useful shortcuts such as "Mark all present" followed by exceptions, if the school enables this workflow.

Require review of unmarked students before final submission unless the school explicitly supports partial attendance submissions.

Protect against accidental duplicate submission and conflicting updates.

### Important UX requirements

- Autosave drafts when technically supported.
- Clearly distinguish draft from submitted attendance.
- Warn before leaving with unsaved changes.
- Handle intermittent connectivity.
- Avoid silently overwriting another user's changes.
- Display server validation errors clearly.
- Provide a safe correction workflow after submission.

Do not claim that an attendance record has been saved unless the backend confirms it.

## 12. ABSENCE DETECTION AND AUTOMATED NOTIFICATION ENGINE

Implement a well-defined notification workflow.

### Trigger configuration

Allow administrators to choose when an absence alert should be generated.

Possible triggers include:

- Student marked absent in a submitted lesson.
- Student marked absent during daily attendance.
- Student still absent after a configured attendance deadline.
- Student absent from a designated critical class.
- Student late beyond a configurable threshold.

Do not enable every trigger by default. Configure the initial school policy explicitly.

### Absence evaluation

Before creating an alert, the backend must verify:

1. The school and academic year are active.
2. The student is actively enrolled.
3. The student was expected to attend the relevant lesson or school day.
4. The applicable class session exists.
5. Attendance was submitted or a valid absence event was created.
6. The student is not excluded by an approved absence, holiday, cancellation, or applicable policy.
7. The absence meets the configured notification conditions.
8. An eligible guardian exists.
9. The event has not already generated an equivalent notification.

Do not infer an absence simply because an attendance record is missing.

### Notification workflow

Use a reliable backend workflow such as:

`Attendance Submitted → Absence Evaluated → Notification Eligible → Notification Queued → SMSHub Request → Provider Result Recorded`

Possible terminal outcomes include:

- Sent to provider.
- Failed.
- Suppressed by policy.
- Cancelled before sending.
- Awaiting review.
- Delivery unknown.

Use only statuses that accurately reflect the application's actual state.

### Example scenario

A teacher submits attendance for Grade 8, Section A.

Three students are marked absent.

The system checks each student's attendance record, approved absence information, and guardian contacts.

- Student A has an eligible primary guardian. The notification is queued.
- Student B has approved leave. The absence notification is suppressed.
- Student C has no valid guardian number. The system creates a contact exception for authorized staff.

The system sends only the appropriate notification and records every decision.

### Duplicate prevention

Create a reliable idempotency strategy based on the attendance event, school policy, notification type, recipient, and relevant class or school date.

Prevent duplicate alerts caused by:

- Repeated teacher submissions.
- Browser refreshes.
- API timeouts.
- Worker retries.
- Webhook replays.
- Repeated edits to the same attendance record.

If an attendance correction changes a student's status from absent to present before the notification is sent, cancel the pending notification where safe.

If the message has already been accepted by the provider, do not pretend it can be recalled. Record the correction and provide an authorized follow-up workflow if the school requires one.

## 13. SMSHUB API INTEGRATION

Official documentation:

https://smshub.et/docs

Use the documented integration contract below as the basis for the UI and backend implementation. Recheck current provider documentation and account-specific behavior before production release.

### Endpoints

Live SMS:

`POST https://smshub.et/api/sms`

Zero-cost test mode:

`POST https://smshub.et/api/test`

Balance:

`GET https://smshub.et/api/balance`

Authentication:

`Authorization: Bearer <API_KEY>`

The frontend must never call these endpoints directly using a secret API key.

Implement SMSHub requests through a secured backend service.

### SMS request

Documented JSON fields:

- `msisdn`: recipient mobile number.
- `text`: final message body.
- `track_links`: optional boolean, default false.

Do not send a custom `from` or sender ID field. SMSHub automatically appends the account's configured signature.

### SMSHub settings screen

Create a dedicated settings page with the following sections:

**Connection**
- Integration status.
- Last successful balance check.
- Connection test.
- Configuration guidance.
- Safe error details.

**API configuration**
- Secure server-side API key configuration.
- Masked key status.
- Key rotation guidance.
- Connection validation.
- Access controls.

Never return the complete secret key to the browser after it has been stored.

**Credits**
- Remaining credits.
- Low-credit threshold.
- Ethio Telecom cost per SMS.
- Safaricom cost per SMS.
- Recent usage.
- Estimated capacity for pending notifications.

**Notification configuration**
- Active absence rules.
- Recipient selection policy.
- Language and template selection.
- Test mode.
- Live-send permissions.
- Quiet hours, if configured.

**History**
- Recent requests.
- Provider message IDs.
- Request IDs.
- Provider results.
- Failure reasons.
- Credit consumption.

Only show a connected status after a real successful server-side check.

### Phone number validation

Accept the documented Ethiopian mobile formats:

- `09xxxxxxxx` for Ethio Telecom.
- `07xxxxxxxx` for Safaricom.
- `2519...`
- `2517...`
- `+2519...`
- `+2517...`

Allow common formatting punctuation to be normalized safely.

Use the provider's validation response and the application's phone validation rules to confirm eligibility.

Do not assume that a syntactically valid number is active, belongs to the intended guardian, or can receive a message.

## 14. ENGLISH AND AMHARIC SMS TEMPLATES

Design a dedicated template management interface.

Initial templates should include:

- Student absence alert.
- Student late-arrival alert, if enabled.
- Attendance correction notification, if enabled.
- Absence follow-up message, if supported by school policy.

Provide:
- Template name.
- Event trigger.
- Language.
- Message body.
- Supported template variables.
- Live preview.
- Character counter.
- Encoding indicator.
- Estimated segment count.
- Estimated credit cost.
- Active or inactive status.
- Test action.
- Template version or update history.

Use a configurable school name and only supported student and attendance variables.

### Example English message

`Dear Parent/Guardian, your child {student_name} was marked absent from {class_name} on {date}. Please contact the school if this is unexpected.`

### Example Amharic message

`ውድ ወላጅ/አሳዳጊ፣ {student_name} በ{date} በ{class_name} ክፍል አልተገኘም። ይህ ያልተጠበቀ ከሆነ እባክዎ ትምህርት ቤቱን ያነጋግሩ።`

Treat these as example copy. Validate natural language, names, date formatting, and the final message with the school before activation.

Do not expose unnecessary student information in SMS messages.

Avoid including sensitive disciplinary information or detailed personal records.

### Signature and character counting

The SMSHub account automatically appends the configured account signature.

The signature consumes characters within the message segment limit.

Documented single-segment limits:

- GSM-7: 160 characters.
- Unicode, including Amharic and Ge'ez: 70 characters.

Any Amharic character switches the entire message to Unicode mode according to the supplied integration notes.

The template editor must distinguish:

- Authored message body.
- Automatically appended signature.
- Estimated final character count.
- Encoding.
- Estimated number of segments.
- Estimated credit consumption.

Do not hardcode the signature length. Use the configured signature when available and treat the provider's test response as the authoritative integration validation.

Warn users when a message may span multiple segments.

Clearly label cost and segment counts as estimates until validated by the provider.

## 15. SMS TEST MODE

Create a safe test-message workflow.

1. User selects a template or enters a message.
2. User enters a test recipient number.
3. The interface validates the number.
4. The final message preview shows the expected provider signature.
5. The UI displays encoding, character count, segment estimate, and expected credits.
6. The backend submits the request to `POST /api/test`.
7. The result is displayed with technical details appropriate to the user's permissions.

A successful test should communicate that:

- Validation passed.
- No SMS was sent.
- No credits were used.
- The provider was not contacted for a live delivery.

Use the returned test data, including `encoding`, `characters`, `character_limit`, `credits_needed`, and `credits_remaining`, when those fields are present.

Never label a successful test as a sent or delivered SMS.

## 16. LIVE SMS SENDING AND ERROR HANDLING

Live messages must be sent only by the authorized backend notification service.

Before activation, provide administrators with a clear summary of the notification rule, recipient policy, template, and estimated costs.

For manual bulk sends, require explicit confirmation and show the selected recipients.

### Success tracking

Record the actual provider response, including available fields such as:

- `data.message_id`.
- `data.message_status`.
- `data.credits_used`.
- `data.credits_remaining`.
- `request_id`.

Display these values in the notification detail view where appropriate.

### Accurate status terminology

Use these distinctions:

- Pending: the application has not yet processed the notification.
- Queued: the application has scheduled it for processing.
- Processing: a request is in progress.
- Sent to provider: the provider accepted the request.
- Failed: a request failed according to the actual result.
- Suppressed: a notification rule prevented sending.
- Delivery unknown: handset delivery cannot be confirmed.

Do not display "Delivered" unless a genuine delivery confirmation mechanism exists.

The documented Ethio Telecom and Safaricom integration does not currently provide handset delivery receipts, and `delivery_report` may be null.

### Error codes

Handle:

- `400`: invalid or malformed request.
- `401`: authentication failure.
- `402`: insufficient credits or payment-related failure.
- `403`: permission failure.
- `422`: validation failure.
- `429`: rate limit.
- `500`: provider server error.
- `502`: upstream or carrier-related failure.
- `503`: service unavailable.

Retry only the documented retryable errors: `429`, `500`, `502`, and `503`.

Use bounded server-side retries with backoff, request tracking, and duplicate-send safeguards.

Do not automatically retry client errors.

A timeout after a live request can create uncertainty about whether the provider accepted the message. Do not blindly send it again. Reconcile the result where possible and otherwise mark the outcome as uncertain for controlled review.

### Credit accounting

Documented costs:

- Ethio Telecom: 1 credit per SMS.
- Safaricom: 2 credits per SMS.

Check the current balance and estimate the cost before large batches.

Use the actual provider response to reconcile credits after sending.

Do not assume the balance remains unchanged between checking and sending.

If credits are insufficient, pause the affected notification workflow, show a clear warning, and provide an appropriate administrative action.

Do not silently discard notifications because the credit balance is low.

## 17. MESSAGE HISTORY AND NOTIFICATION MONITORING

Create a professional notification monitoring workspace.

### Message history table

Include:

- Timestamp.
- Student.
- Grade and section.
- Attendance event.
- Guardian or masked phone number.
- Message language.
- Notification template.
- Provider submission status.
- SMS encoding and segment estimate.
- Credits used, when confirmed.
- Provider message ID.
- Request ID.
- Failure category.
- Actions.

Provide filters for:

- Date range.
- Grade.
- Section.
- Student.
- Guardian.
- Message status.
- Template.
- Language.
- Network.
- Failure category.

### Message detail panel

Display:

- Related attendance event.
- Notification rule.
- Recipient and authorization context.
- Final message text.
- Provider response.
- Provider message ID.
- Request ID.
- Retry history.
- Credit accounting.
- Audit trail.

Mask phone numbers in list views when appropriate, and enforce permission checks for revealing full contact details.

### Failure management

Provide a dedicated failure queue with:

- Invalid phone number.
- Missing guardian.
- Insufficient credits.
- Authentication failure.
- Provider rate limit.
- Temporary provider outage.
- Validation failure.
- Unknown request outcome.

Each failure must include a useful next action.

Examples:

- Update the guardian contact.
- Configure the integration.
- Review the credit balance.
- Wait for the retry schedule.
- Investigate the request ID.
- Resolve an uncertain send outcome before any resend.

Do not provide a universal "Retry all" action without safeguards.

## 18. WEBHOOKS AND INTEGRATION DIAGNOSTICS

SMSHub supports dashboard-configured webhooks with event types such as:

- `message.sent`.
- `message.failed`.
- `credits.low`.

The supplied integration notes describe HMAC-SHA256 verification using `X-SMSHub-Signature`.

Implement signature verification on the backend.

The UI may show:

- Event type.
- Received timestamp.
- Associated request or message.
- Processing outcome.
- Failure details.
- Retry information, if available.

Verify webhook authenticity, handle duplicate events idempotently, and never trust an incoming event without signature verification.

A `message.sent` event does not prove that the recipient's handset received the message.

Do not design a fake delivery-tracking interface when the underlying provider does not supply delivery receipts.

## 19. ATTENDANCE REPORTS AND ANALYTICS

Create an educational analytics workspace.

### Reports

- Daily school attendance.
- Class attendance.
- Grade and section summaries.
- Student attendance history.
- Weekly and monthly trends.
- Late arrivals.
- Excused and unexplained absences.
- Recurring absences.
- Teacher attendance submission rates.
- Parent notification success and failure summaries.
- SMS usage and credits.
- Guardian contact completeness.

### Filters

Provide:

- Academic year.
- Term.
- Date range.
- Grade.
- Section.
- Subject or lesson, where relevant.
- Teacher.
- Attendance status.
- Notification status.

### Visualizations

Use meaningful charts for:

- Attendance rate over time.
- Attendance by grade.
- Absence trends.
- Repeated absences.
- Notification request outcomes.
- SMS credit consumption.

Define the denominator and business rules behind every percentage.

Distinguish student-level absence counts from lesson-level absence records.

Support authorized exports in appropriate formats.

Do not include confidential student details in reports intended for general school-wide access.

## 20. SCHOOL CALENDAR AND ATTENDANCE POLICIES

Create configurable school settings for:

- Academic years and terms.
- School days.
- Holidays and closures.
- Timetable and lesson periods.
- Attendance submission deadlines.
- Late-arrival thresholds.
- Approved absence categories.
- Notification trigger timing.
- Parent recipient selection.
- Quiet hours.
- Duplicate-notification rules.
- Correction and approval workflows.
- Message templates and language defaults.

For every rule, display:

- Rule name.
- Description.
- Applicable grades or classes.
- Trigger conditions.
- Active state.
- Last updated time.
- Authorized editor.

Changes to critical policies should require confirmation and be recorded in the audit log.

Do not send alerts during holidays or for cancelled classes unless a specifically configured policy requires it.

## 21. SEARCH, INTERACTIONS, AND USER FEEDBACK

Apply consistent interaction patterns throughout the application.

Include:

- Global search where appropriate.
- Page-level search.
- Filters and sorting.
- Pagination.
- Clear selection counts for bulk actions.
- Confirmation dialogs for consequential actions.
- Toast notifications.
- Inline validation.
- Loading skeletons.
- Empty states with useful next steps.
- Recoverable error states.
- Retry actions where safe.
- Unsaved-change warnings.
- Keyboard navigation.
- Visible focus indicators.

Use full pages for complex workflows, side panels for quick detail inspection, and dialogs for short decisions.

Avoid opening a modal for every action.

Every visible button must have a meaningful implemented action or be clearly identified as unavailable.

## 22. DESIGN SYSTEM AND COMPONENT LIBRARY

Create a reusable component library before duplicating page patterns.

### Layout components

- AppShell.
- Sidebar.
- Topbar.
- PageHeader.
- Breadcrumbs.
- ResponsiveNavigation.

### Student and academic components

- StudentAvatar.
- StudentTable.
- GuardianContactCard.
- GradeSelector.
- SectionSelector.
- ClassSchedule.
- LessonHeader.

### Attendance components

- AttendanceStatusButton.
- AttendanceRoster.
- AttendanceSummary.
- AttendanceStatusBadge.
- AttendanceTimeline.
- AttendanceExceptionCard.
- SubmissionProgress.
- CorrectionReviewPanel.

### SMS components

- SmsCreditBalance.
- SmsConnectionStatus.
- SmsTemplateEditor.
- SmsPreview.
- SmsCharacterCounter.
- SmsEncodingIndicator.
- SmsCostEstimate.
- NotificationStatusBadge.
- MessageHistoryTable.
- FailedNotificationQueue.
- RequestDiagnosticPanel.

### General components

- DataTable.
- SearchInput.
- DatePicker.
- Select.
- MultiSelect.
- Dialog.
- Drawer.
- Toast.
- EmptyState.
- Skeleton.
- ErrorState.
- PermissionDeniedState.

Ensure all components use shared tokens and support their necessary loading, disabled, error, and responsive states.

## 23. RESPONSIVE DESIGN

The application must work well on:

- 360px mobile screens.
- 390px mobile screens.
- 768px tablets.
- 1024px laptop screens.
- 1440px desktop screens.

### Teacher mobile experience

Prioritize:

- Today's classes.
- Start attendance.
- Quick student status selection.
- Attendance summary.
- Review absent students.
- Submit attendance.
- Submission confirmation.

Avoid making teachers navigate horizontally through a large desktop table.

### Administrator mobile experience

Prioritize:

- Today's absence summary.
- Attendance completion.
- Failed notification alerts.
- SMS balance warnings.
- Student search.
- Quick inspection of attendance events.

Use mobile cards or compact tables according to the information density.

Ensure that dialogs, dropdowns, date pickers, and navigation remain usable on small screens.

## 24. ACCESSIBILITY AND LOCALIZATION

Target WCAG 2.2 AA where practical.

Implement:

- Semantic HTML.
- Keyboard navigation.
- Screen-reader-friendly status messages.
- Accessible form labels.
- Clear validation messages.
- Adequate color contrast.
- Visible focus indicators.
- Accessible charts and tables.
- Reduced-motion support.
- Appropriate touch targets.

Extract all user-facing strings into localization files.

Suggested structure:

`locales/en/common.json`

`locales/en/dashboard.json`

`locales/en/attendance.json`

`locales/en/students.json`

`locales/en/guardians.json`

`locales/en/notifications.json`

`locales/en/reports.json`

`locales/am/common.json`

`locales/am/dashboard.json`

`locales/am/attendance.json`

`locales/am/students.json`

`locales/am/guardians.json`

`locales/am/notifications.json`

`locales/am/reports.json`

Use stable translation keys and natural, context-appropriate translations.

Keep UI language separate from SMS message language. For example, an English-speaking administrator may manage a school that sends Amharic SMS messages.

Use consistent timezone handling across attendance, schedules, reports, and notification processing.

## 25. SECURITY, STUDENT PRIVACY, AND AUDITING

Treat student and family information as sensitive data.

Implement:

- Server-side role and permission checks.
- School-level data isolation.
- Protection against cross-school data access.
- Secure authentication and session handling.
- Server-side input validation.
- Secure storage of SMSHub credentials.
- Appropriate rate limits.
- Restricted bulk messaging.
- Audit trails for attendance corrections.
- Audit trails for guardian changes.
- Audit trails for policy changes.
- Audit trails for manual SMS actions.
- Privacy-conscious logging.
- Masked phone numbers where appropriate.
- Controlled access to student reports and exports.

A teacher should normally access only assigned classes and authorized student records.

A guardian should only access students linked to their verified or authorized relationship.

A school administrator should not automatically have access to other schools' records unless explicitly authorized by the platform's tenancy model.

Do not include sensitive student information in public URLs, analytics events, browser logs, or unnecessary SMS content.

## 26. TECHNICAL IMPLEMENTATION STRATEGY

First inspect the existing repository and preserve its working architecture.

Identify:

- Frontend framework.
- Backend framework.
- Database.
- Authentication.
- User roles and permissions.
- Existing student and guardian models.
- Timetable structure.
- Attendance API.
- SMSHub integration.
- Existing design system.
- Current test coverage.

Do not replace working functionality without a clear technical reason.

If the project is new, use the following as a recommended architecture:

- Frontend: Next.js or an existing compatible React framework.
- Language: TypeScript with strict checking.
- UI: Tailwind CSS and a consistent accessible component library.
- Backend: NestJS or the project's existing backend framework.
- Database: PostgreSQL.
- Data access: the existing ORM or a well-maintained typed ORM.
- Background jobs: a reliable job queue when required.
- Charts: a maintained React charting library.
- Forms: schema-based validation.
- SMS provider: server-side SMSHub integration.
- Testing: unit, integration, and end-to-end tests where appropriate.

Do not introduce every suggested dependency automatically. Inspect the project first and select only what is needed.

### Separate responsibilities

Keep these concerns separate:

- UI components.
- Student and guardian domain models.
- Academic scheduling.
- Attendance calculation.
- Attendance event processing.
- Notification rules.
- SMS templates.
- SMSHub API client.
- Notification queue and retry logic.
- Reporting and analytics.
- Authentication and authorization.
- Localization.

Never put the SMSHub API key in frontend code, client-side environment variables, browser storage, or client-visible API responses.

## 27. REQUIRED DOMAIN MODEL

Inspect existing schemas before changing the database.

Where needed, design entities equivalent to:

- School.
- AcademicYear.
- Term.
- Grade.
- Section.
- Subject.
- Student.
- Guardian.
- StudentGuardian.
- Teacher.
- ClassAssignment.
- Timetable.
- LessonSession.
- AttendanceRecord.
- AttendanceCorrection.
- AbsenceReport.
- NotificationRule.
- SmsTemplate.
- NotificationEvent.
- SmsMessageAttempt.
- SmsProviderResponse.
- SmsCreditSnapshot.
- AuditLog.
- User.
- Role.
- Permission.

Use appropriate relationships, unique constraints, indexes, and tenant boundaries.

An attendance record should identify the student, relevant attendance obligation, date or session, status, recorder, and submission metadata.

A notification event should reference the absence or attendance event that caused it.

A message attempt should reference the recipient, template version or rendered content, provider result, request ID, message ID when available, and credit accounting.

Use database transactions or equivalent consistency mechanisms when changing attendance and creating notification events.

Where possible, use an outbox or another reliable event-delivery pattern so that an attendance submission cannot silently lose its associated notification.

Do not store API secrets in ordinary attendance or message records.

## 28. IMPLEMENTATION PHASES

### Phase 1: Repository inspection and requirements

- Inspect existing source code.
- Identify existing routes and data models.
- Inspect authentication and role handling.
- Verify available backend endpoints.
- Document missing features.
- Confirm attendance policy assumptions.
- Create a prioritized implementation plan.

### Phase 2: Design system and application shell

- Define tokens and typography.
- Implement navigation.
- Create reusable UI components.
- Build responsive layouts.
- Add accessible interaction states.
- Establish localization structure.

### Phase 3: Academic and student management

- Academic years and terms.
- Grades and sections.
- Student directory and profiles.
- Guardian relationships.
- Teacher assignments.
- Timetable and school calendar.

### Phase 4: Attendance workflow

- Today's classes.
- Student roster.
- Attendance status controls.
- Draft and submission states.
- Attendance validation.
- Attendance history.
- Corrections and review.
- Absence eligibility evaluation.

### Phase 5: SMSHub integration

- Secure API configuration.
- Balance monitoring.
- Test mode.
- Message templates.
- English and Amharic preview.
- Character and segment estimates.
- Automated absence rules.
- Guardian selection.
- Background processing.
- Duplicate prevention.
- Error handling and retries.
- Message history.
- Webhook verification.

### Phase 6: Reports and administration

- School dashboard.
- Attendance reports.
- Absence trends.
- Notification reports.
- SMS usage analytics.
- Audit logs.
- Role and permission settings.

### Phase 7: Quality assurance

- Run type checking and linting.
- Run available automated tests.
- Build the application.
- Test teacher attendance workflows.
- Test student and guardian permissions.
- Test notification deduplication.
- Test Amharic message handling.
- Test SMSHub test mode.
- Test low-credit conditions.
- Test provider failures and timeouts.
- Test mobile, tablet, and desktop layouts.
- Verify school-level data isolation.
- Verify that no UI claims unsupported delivery confirmation.

## 29. ACCEPTANCE CRITERIA

The project is complete only when the implemented scope satisfies the following conditions.

### Attendance

- Teachers can view assigned classes.
- Teachers can record and submit attendance.
- The system distinguishes absent students from missing attendance submissions.
- Approved absences and school holidays are handled according to policy.
- Attendance changes are auditable.
- Duplicate attendance submissions do not generate duplicate alerts.

### Guardians

- Students can be linked to the correct guardians.
- Recipient selection follows configured policy.
- Invalid or missing contact information is identified.
- Unauthorized users cannot access unrelated family records.

### SMS automation

- Eligible absences can generate notification events.
- SMSHub test mode does not send real SMS messages.
- Live sending occurs only through the authorized backend.
- Amharic and English templates are supported.
- Message previews account for the automatic provider signature.
- Credit usage is based on actual provider results where available.
- Failures have meaningful statuses and corrective actions.
- Retry behavior is bounded and safe.
- Provider submission is not misrepresented as handset delivery.

### User experience

- Navigation is consistent.
- Forms and tables are accessible.
- Teacher attendance-taking is efficient on mobile.
- Administrators can find failed notifications quickly.
- Loading, empty, success, and error states are implemented.
- All major actions have real behavior.
- Localization resources are used instead of hardcoded interface text.

### Production readiness

- Secrets are not exposed to the browser.
- Permissions are enforced on the backend.
- School data is appropriately isolated.
- Critical workflows have automated or documented tests.
- Build and validation results are reported honestly.
- Remaining limitations are documented.

## 30. FINAL INSTRUCTIONS TO THE AI AGENT

Do not stop after producing a mockup or a static dashboard.

Inspect the project, design the experience, implement the agreed scope, connect the actual APIs, validate the business logic, and test the critical workflows.

Build the application as one coherent educational SaaS product.

Prioritize the teacher's attendance-taking experience and the reliability of automatic parent/guardian absence notifications above decorative features.

Use realistic demo data only when necessary, clearly label it, and never confuse it with live school data.

Do not invent provider capabilities, school policies, attendance records, or SMS delivery results.

Before finishing, provide a report of implemented pages, working workflows, integrations, test results, known limitations, and the remaining work required for production deployment.