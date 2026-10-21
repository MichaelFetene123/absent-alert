# AbsentAlert – Product, Design & Architecture

*Version 0.1 · 9-day MVP · Next.js full-stack with Server Actions*

## 1. Overview

AbsentAlert is a school attendance tool. A teacher marks students present or absent for a date, and the parent of every absent student automatically receives an SMS. Every attendance change and every SMS attempt is recorded so the school can audit what happened and retry failures.

**Goals**

- Let a teacher mark a whole class's attendance in under a minute.
- Notify parents of an absence by SMS, once per student per date.
- Give staff a trustworthy history of what was sent, to whom, and whether it worked.
- Be small enough to finish in 9 days by one developer.

**Non-goals (MVP)**

- Timetables, lesson plans, gradebook, messaging, library (visible in the reference UI but out of scope).
- Parent portal or mobile app.
- Leave approval workflows, reports beyond simple percentages.
- Multi-school tenancy.

## 2. Users and roles

| Role | Can do |
|---|---|
| Admin | Manage students, classes, teachers, parent contacts; view all SMS history; retry failed SMS |
| Teacher | View assigned classes; mark attendance; view SMS history for assigned classes |

Every Server Action checks the session and the role/class assignment itself. Hiding a button in the UI is never treated as authorization.

## 3. MVP features

1. **Student management** – register students, assign them to a class, store one or more parent phone numbers.
2. **Attendance** – mark Present, Absent, Leave, or Late for a class on a specific date; bulk-mark all as Present, then flip exceptions.
3. **SMS alerts** – when a student is saved as Absent, queue and send an SMS to the parent(s).
4. **SMS history** – list of every notification with recipient, timestamp, status, and the provider's API result; failed items can be retried.

### Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | Admin can create, edit, deactivate students with admission number, name, class, guardian name and phone |
| FR-2 | Phone numbers are validated and stored in E.164 format (e.g. +2519XXXXXXXX) |
| FR-3 | Teacher can open a class + date and see all active students with their current status |
| FR-4 | Saving attendance writes records first, then triggers SMS for newly absent students only |
| FR-5 | Re-saving the same absence does not send a second SMS |
| FR-6 | Changing Absent → Present after an SMS was sent does not unsend it; it is shown in history |
| FR-7 | Each SMS attempt stores status, provider message id, raw provider response, and error |
| FR-8 | Failed SMS can be retried manually (and later by a scheduled job) |
| FR-9 | Dashboard shows today's present/absent counts and recent SMS failures |

### Non-functional requirements

- Attendance save must succeed even if SMSHub is down.
- SMSHub credentials never reach the browser.
- All inputs validated with Zod on the server.
- Pages usable on a phone (teachers will use one).

## 4. UX and UI design

The reference screenshot (a Class 7 B attendance grid) is a good model. AbsentAlert keeps its core ideas and drops the surrounding modules.

### 4.1 Screens

| Screen | Purpose |
|---|---|
| Login | Email + password sign-in |
| Dashboard | Today's totals, classes not yet marked, recent failed SMS |
| Students | Searchable table, add/edit drawer, filter by class |
| Attendance (daily) | Mark one class for one date – the main working screen |
| Attendance (overview) | Two-week grid per class, like the reference |
| Notifications | SMS history table with filters and retry |

### 4.2 Attendance – daily marking screen

- Top bar: **class selector**, **date picker** (defaults to today), summary chips (Present / Absent / Leave).
- Action row: **Mark all present**, **Save attendance**.
- Student list: admission number, name, and a segmented control **P · A · L**. Rows with A are tinted red.
- Sticky footer on mobile: running totals and Save button.
- After Save: toast reports "32 saved, 3 SMS queued", and a link to SMS history.

### 4.3 Attendance – two-week overview (from the reference)

- Columns: Admission No, Student, Absences, Leave, then one column per day with weekday initial and date.
- Cells: green **P**, red **A**, blue **H** (holiday/weekend), yellow **L**, grey dash for not marked.
- Summary rows above the students: Total Present, Total Absent, Total Leave, Percentage.
- Clicking a cell opens the daily screen for that date; this view is read-only in the MVP.
- Wide table scrolls horizontally inside its own container on small screens.

### 4.4 SMS history screen

- Columns: time, student, class, parent phone (masked, e.g. +251•••••678), message type, status badge, attempts, provider reference.
- Filters: date range, class, status.
- Row actions: view provider response, **Retry** (only for FAILED).

### 4.5 Visual language

- Tailwind + shadcn/ui; one primary colour (blue for navigation, orange for the primary action as in the reference).
- Status colours are fixed and always paired with a letter or icon, never colour alone.
- Left sidebar with four entries: Dashboard, Students, Attendance, Notifications.

## 5. Architecture

### 5.1 Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router + TypeScript |
| Backend | Server Actions and server-only modules |
| Database | PostgreSQL |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Client data | TanStack Query only where interaction benefits |
| SMS | SMSHub API, server-side only |
| Auth | Auth.js (credentials provider) or another established solution |

### 5.2 Layers

```
Browser (React Server + Client Components)
   │  forms / button clicks
   ▼
Server Actions  (actions/*.ts)
   │  1. authenticate  2. authorize  3. Zod validate
   ▼
Domain services (lib/…)         ──►  SMS service (lib/sms/smshub.ts) ──► SMSHub API
   │
   ▼
Prisma ──► PostgreSQL
```

- **Server Actions** are thin: authenticate, authorize, validate, call a service, return a typed result.
- **Services** hold business logic (e.g. "which students are newly absent").
- **`lib/sms/smshub.ts`** is the only file that knows SMSHub's wire format. Swapping providers touches one file.
- Mark server-only modules with `import "server-only"` so they can't be bundled into the client.

### 5.3 Project structure

```
src/
├── app/
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── dashboard/
│       ├── students/
│       ├── attendance/
│       └── notifications/
├── actions/
│   ├── student.actions.ts
│   ├── attendance.actions.ts
│   └── notification.actions.ts
├── components/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── sms/smshub.ts
│   ├── services/ (attendance, notification)
│   └── validations/
prisma/
└── schema.prisma
```

## 6. Data model

### 6.1 Entities

- **User** – staff account with role.
- **Class** – e.g. "Class 7 B".
- **TeacherClass** – which teachers may mark which classes.
- **Student** – admission number, name, class, active flag.
- **Guardian** – name and phone, linked to a student.
- **AttendanceRecord** – one row per student per date.
- **Notification** – one row per intended SMS (the unit of idempotency).
- **NotificationAttempt** – one row per call to SMSHub.

### 6.2 Prisma schema (draft)

```prisma
enum Role { ADMIN TEACHER }
enum AttendanceStatus { PRESENT ABSENT LEAVE LATE }
enum NotificationStatus { PENDING SENDING ACCEPTED DELIVERED FAILED }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         Role
  classes      TeacherClass[]
  marked       AttendanceRecord[]
}

model Class {
  id       String @id @default(cuid())
  name     String @unique
  students Student[]
  teachers TeacherClass[]
}

model TeacherClass {
  userId  String
  classId String
  user    User  @relation(fields: [userId], references: [id])
  class   Class @relation(fields: [classId], references: [id])
  @@id([userId, classId])
}

model Student {
  id          String  @id @default(cuid())
  admissionNo String  @unique
  fullName    String
  classId     String
  active      Boolean @default(true)
  class       Class   @relation(fields: [classId], references: [id])
  guardians   Guardian[]
  attendance  AttendanceRecord[]
}

model Guardian {
  id        String  @id @default(cuid())
  studentId String
  name      String
  phone     String  // E.164
  isPrimary Boolean @default(true)
  student   Student @relation(fields: [studentId], references: [id])
}

model AttendanceRecord {
  id         String   @id @default(cuid())
  studentId  String
  date       DateTime @db.Date
  status     AttendanceStatus
  markedById String
  updatedAt  DateTime @updatedAt
  student    Student  @relation(fields: [studentId], references: [id])
  markedBy   User     @relation(fields: [markedById], references: [id])
  notifications Notification[]
  @@unique([studentId, date])
}

model Notification {
  id            String   @id @default(cuid())
  attendanceId  String
  guardianPhone String
  type          String   @default("ABSENCE")
  body          String
  status        NotificationStatus @default(PENDING)
  providerRef   String?
  createdAt     DateTime @default(now())
  attendance    AttendanceRecord @relation(fields: [attendanceId], references: [id])
  attempts      NotificationAttempt[]
  // one absence SMS per attendance record per phone
  @@unique([attendanceId, guardianPhone, type])
}

model NotificationAttempt {
  id             String   @id @default(cuid())
  notificationId String
  attemptedAt    DateTime @default(now())
  httpStatus     Int?
  success        Boolean
  rawResponse    Json?
  error          String?
  notification   Notification @relation(fields: [notificationId], references: [id])
}
```

The unique constraint on `Notification(attendanceId, guardianPhone, type)` is what prevents duplicate absence SMS, even under double-clicks or concurrent saves.

## 7. Core flows

### 7.1 Mark attendance and notify

1. Teacher submits class + date + list of `{studentId, status}`.
2. `markAttendance` action: authenticate → check teacher is assigned to the class → Zod validate (date not in the future, all students belong to the class).
3. In one transaction, upsert `AttendanceRecord` rows.
4. For every record whose status is ABSENT, insert a `Notification` with `ON CONFLICT DO NOTHING`. Only rows actually inserted need sending.
5. The attendance result is returned to the teacher; SMS dispatch happens after the transaction commits.
6. For each new notification: set status SENDING, call SMSHub, store a `NotificationAttempt`, then set ACCEPTED or FAILED.

The attendance change is committed before any SMS attempt, and an SMS failure never rolls back attendance.

### 7.2 Notification status lifecycle

| Status | Meaning |
|---|---|
| PENDING | Row created, not yet sent |
| SENDING | Claimed by a worker or request (prevents double send) |
| ACCEPTED | SMSHub API accepted the request – **not** proof of delivery |
| DELIVERED | Only set if SMSHub provides delivery reports/webhooks and one arrives |
| FAILED | API error, timeout, or rejection; eligible for retry |

The UI must say "Accepted by provider" for ACCEPTED, never "Delivered".

### 7.3 Retry

- Manual: admin presses Retry on a FAILED row; the action atomically moves FAILED → SENDING (`updateMany` where status = FAILED) so two clicks cannot both send.
- Later: a scheduled route handler retries FAILED rows with a capped attempt count and backoff.
- A row stuck in SENDING for more than a few minutes is treated as unknown and shown for manual review, since the request may have reached the provider.

### 7.4 Attendance corrections

- Absent → Present: record updated, no new SMS, existing notification stays in history.
- Present → Absent later the same day: new notification is created and sent.
- Absent → Present → Absent again: unique constraint blocks a second SMS.

## 8. Server Actions

| Action | File | Input (Zod) | Guard |
|---|---|---|---|
| createStudent / updateStudent / deactivateStudent | student.actions.ts | name, admissionNo, classId, guardian{name, phone} | Admin |
| getClassAttendance | attendance.actions.ts | classId, date | Teacher of class or Admin |
| markAttendance | attendance.actions.ts | classId, date, entries[] | Teacher of class or Admin |
| listNotifications | notification.actions.ts | filters, pagination | Teacher (own classes) or Admin |
| retryNotification | notification.actions.ts | notificationId | Admin |

All actions return `{ ok: true, data } | { ok: false, error }` so the UI handles failures uniformly.

## 9. SMSHub integration

> **Status: unverified.** Endpoint, authentication method, request body and response format must be confirmed from SMSHub's documentation with one real test SMS on Day 1. Nothing below is assumed to be final.

**Design that is independent of the API details**

- A single interface: `sendSms({ to, message }) → { accepted: boolean, providerRef?: string, raw: unknown, error?: string }`.
- Credentials and base URL come from environment variables read only in server code.
- Requests have a timeout (e.g. 10 s). Network errors and non-2xx responses become FAILED attempts with the raw body stored.
- Never log full phone numbers or API keys.

**Day 1 verification checklist**

- [ ] Base URL and send-message endpoint
- [ ] Authentication (header name, token vs. key/secret)
- [ ] Request body fields (recipient format, sender ID, message text)
- [ ] Success and error response shapes, provider message id field
- [ ] Sender ID rules for Ethiopian numbers, message length / encoding (Amharic needs Unicode, which shortens messages)
- [ ] Delivery report or webhook support
- [ ] Rate limits and cost per SMS
- [ ] One successful test SMS to a real phone

**Message template (draft)**

> "AbsentAlert: {studentName} (Class {className}) was marked absent on {date}. Please contact the school if this is unexpected."

Keep it short to stay within a single SMS segment.

## 10. Security

- Treat every Server Action as a public endpoint: session + role + class-ownership check inside each one.
- Zod validation on all inputs, including IDs and dates.
- Passwords hashed (argon2 or bcrypt) via the auth library; no custom crypto.
- Secrets (`SMSHUB_*`, `DATABASE_URL`, `AUTH_SECRET`) only in server env, never prefixed `NEXT_PUBLIC_`.
- Rate-limit login and retry actions.
- Mask parent phone numbers in lists; show full numbers only to Admin.
- Student and parent data is personal data of minors: collect only what is needed and restrict access by class.

## 11. Testing

- Unit: phone normalization, Zod schemas, "newly absent" calculation.
- Integration (test DB): double submit does not create two notifications; SMS failure leaves attendance saved; teacher cannot mark another class.
- SMS client tested against a mocked HTTP server, plus one manual live test.
- Manual UAT with a real class list before launch.

## 12. Nine-day plan

| Day | Focus | Done when |
|---|---|---|
| 1 | **SMSHub verification** + project setup | One real test SMS sent; client wrapper written; repo, DB, Prisma, Tailwind/shadcn ready |
| 2 | Auth and data model | Migrations applied, seed data, login works, role guards in place |
| 3 | Student management | CRUD with guardian phone validation |
| 4 | Daily attendance screen | Mark and save a class; upsert works |
| 5 | Notification creation and sending | Absence creates one notification and sends; failures stored |
| 6 | SMS history and retry | Filterable table, retry action, provider response viewer |
| 7 | Dashboard and two-week overview | Totals, percentages, grid like the reference |
| 8 | Testing, hardening, mobile polish | Integration tests green; permissions reviewed |
| 9 | Deployment and UAT | Production env, backups, real-class trial, handover notes |

If the schedule slips, cut the two-week overview first, then the dashboard; the four core features are the priority.

## 13. Deployment and operations

- Host the Next.js app on a Node-capable platform (Vercel, or a VPS with Docker) with managed PostgreSQL.
- Environment variables: `DATABASE_URL`, `AUTH_SECRET`, `SMSHUB_BASE_URL`, `SMSHUB_API_KEY` (final names depend on the provider).
- Daily database backups; test a restore once.
- Log SMS failures with notification id (no phone numbers); alert if failure rate rises.
- Serverless note: a request that returns can stop background work, so SMS sending should be awaited inside the action, or driven by a retry job reading PENDING/FAILED rows, rather than fire-and-forget.

## 14. Risks and open questions

| Risk / question | Mitigation |
|---|---|
| SMSHub API differs from assumptions | Day 1 verification before building further |
| No delivery receipts available | Show "Accepted", not "Delivered"; add webhook later if supported |
| Wrong or outdated parent numbers | Validate format; allow Admin to flag bad numbers |
| Teacher marks wrong student by mistake | Correction flow; SMS cannot be recalled, so confirm on save when count of absences is large |
| SMS cost grows | Track count per day; set a daily cap |
| Parents with several children / numbers | Schema supports several guardians; MVP sends to primary only |

**Open questions**

1. Languages for the SMS (English, Amharic, both)?
2. Does the school want absence SMS sent immediately on save, or after a cut-off time each morning?
3. Is "Late" needed in MVP, or only Present / Absent / Leave?
4. Who creates teacher accounts, and are teachers tied to one class or several?
