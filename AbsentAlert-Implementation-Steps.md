# AbsentAlert – Step-by-Step Implementation Guide

*Companion to the Design Doc. Follow the steps in order; each one ends with a "Done when" check so you never build on something broken.*

| Step | What you build | Plan day |
|---|---|---|
| 0 | Prerequisites | Day 1 |
| 1 | Create the project and install the stack | Day 1 |
| 2 | Verify SMSHub with one real SMS | Day 1 |
| 3 | Database and Prisma schema | Day 2 |
| 4 | Authentication and role guards | Day 2 |
| 5 | Validation schemas (Zod) | Day 3 |
| 6 | Student management (actions + UI) | Day 3 |
| 7 | Attendance service and `markAttendance` action | Day 4 |
| 8 | Daily attendance screen | Day 4 |
| 9 | Notification service (create, send, record) | Day 5 |
| 10 | SMS history screen and retry | Day 6 |
| 11 | Dashboard and two-week overview | Day 7 |
| 12 | Tests and hardening | Day 8 |
| 13 | Deploy and UAT | Day 9 |

---

## Step 0 – Prerequisites

Install: Node.js 20+ (LTS), Git, PostgreSQL 15+ (local, Docker, or a free hosted DB such as Neon/Supabase), VS Code.

Recommended VS Code extensions: Prisma, Tailwind CSS IntelliSense, ESLint, Prettier.

Also collect from SMSHub: account, API key/credentials, documentation link, and one phone number you can test with.

**Done when:** `node -v`, `git --version` and a `psql` connection (or hosted DB URL) all work.

---

## Step 1 – Create the project and install the stack

```bash
npx create-next-app@latest absentalert --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd absentalert

# core libraries
npm i prisma @prisma/client zod react-hook-form @hookform/resolvers @tanstack/react-query
npm i next-auth@beta bcryptjs server-only
npm i -D @types/bcryptjs tsx vitest

# UI
npx shadcn@latest init
npx shadcn@latest add button input label table badge select dialog sheet toast form card tabs
```

Create the folders from the architecture:

```bash
mkdir -p src/actions src/components src/lib/sms src/lib/services src/lib/validations
mkdir -p "src/app/(auth)/login" "src/app/(dashboard)/dashboard" "src/app/(dashboard)/students" "src/app/(dashboard)/attendance" "src/app/(dashboard)/notifications"
```

Create `.env` (never commit it) and `.env.example` (commit this one):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/absentalert"
AUTH_SECRET="generate-with: npx auth secret"
SMSHUB_BASE_URL=""
SMSHUB_API_KEY=""
SMSHUB_SENDER_ID=""
```

Make sure `.gitignore` contains `.env`.

**Done when:** `npm run dev` shows the default page at http://localhost:3000.

---

## Step 2 – Verify SMSHub with one real SMS (do this before anything else)

The endpoint, auth header, body and response format are **not assumed**. Read the SMSHub docs (and the notes from your earlier ChatGPT chat), then test outside the app first.

### 2.1 Test with a throwaway script

Create `scripts/sms-test.ts`. Fill in the real values from the docs; the shape below is a placeholder.

```ts
// scripts/sms-test.ts  –  run: npx tsx --env-file=.env scripts/sms-test.ts
const res = await fetch(`${process.env.SMSHUB_BASE_URL}/<SEND-ENDPOINT-FROM-DOCS>`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Authorization header name/format from the docs, e.g.:
    // Authorization: `Bearer ${process.env.SMSHUB_API_KEY}`,
  },
  body: JSON.stringify({
    // field names from the docs
    to: "+251XXXXXXXXX",
    message: "AbsentAlert test message",
    from: process.env.SMSHUB_SENDER_ID,
  }),
});
console.log("HTTP", res.status);
console.log(await res.text());
```

### 2.2 Write down what you learned

Fill in this table and keep it in `docs/smshub-notes.md`:

| Question | Answer |
|---|---|
| Endpoint URL | |
| Auth header | |
| Phone number format required | |
| Request fields | |
| Success response (copy a real one) | |
| Error response (copy a real one) | |
| Provider message id field | |
| Delivery report / webhook? | |
| Unicode (Amharic) supported? Max length | |

### 2.3 Wrap it in the real client

Once the test works, create `src/lib/sms/smshub.ts`. Only this file knows the provider's format.

```ts
import "server-only";

export type SendSmsResult = {
  accepted: boolean;
  providerRef?: string;
  httpStatus?: number;
  raw: unknown;
  error?: string;
};

export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${process.env.SMSHUB_BASE_URL}/<SEND-ENDPOINT>`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // auth header from your notes
      },
      body: JSON.stringify({ to, message, from: process.env.SMSHUB_SENDER_ID }),
      signal: controller.signal,
    });

    const text = await res.text();
    let raw: unknown = text;
    try { raw = JSON.parse(text); } catch {}

    // TODO: replace with the provider's real success rule
    const accepted = res.ok;
    // TODO: read the real id field from the response
    const providerRef = undefined as string | undefined;

    return { accepted, providerRef, httpStatus: res.status, raw, error: accepted ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { accepted: false, raw: null, error: e instanceof Error ? e.message : "Unknown error" };
  } finally {
    clearTimeout(timer);
  }
}
```

**Done when:** a real phone received the test SMS, `docs/smshub-notes.md` is filled in, and `sendSms()` returns `accepted: true` for it.

---

## Step 3 – Database and Prisma schema

```bash
npx prisma init
```

Paste the schema from section 6.2 of the Design Doc into `prisma/schema.prisma`. Add the generator and datasource at the top:

```prisma
generator client { provider = "prisma-client-js" }
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run the migration:

```bash
npx prisma migrate dev --name init
```

Create `src/lib/db.ts` (one Prisma instance, safe for hot reload):

```ts
import "server-only";
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
```

Create a seed script `prisma/seed.ts` that adds: one admin, one teacher, one class ("Class 7 B"), the teacher↔class link, and 5 students each with a guardian phone (use your own number for at least one). Register it in `package.json`:

```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

```bash
npx prisma db seed
npx prisma studio   # look at the tables
```

**Done when:** Prisma Studio shows your seeded users, class and students.

---

## Step 4 – Authentication and role guards

### 4.1 Auth.js with credentials

`src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return ok ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) { if (user) { token.id = user.id; token.role = (user as any).role; } return token; },
    session({ session, token }) { (session.user as any).id = token.id; (session.user as any).role = token.role; return session; },
  },
});
```

Add `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### 4.2 Guard helpers (used inside every Server Action)

`src/lib/guards.ts`:

```ts
import "server-only";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type SessionUser = { id: string; role: "ADMIN" | "TEACHER" };

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const u = session?.user as any;
  if (!u?.id) throw new Error("UNAUTHENTICATED");
  return { id: u.id, role: u.role };
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new Error("FORBIDDEN");
  return u;
}

export async function requireClassAccess(classId: string) {
  const u = await requireUser();
  if (u.role === "ADMIN") return u;
  const link = await db.teacherClass.findUnique({ where: { userId_classId: { userId: u.id, classId } } });
  if (!link) throw new Error("FORBIDDEN");
  return u;
}
```

### 4.3 Route protection and login page

- Add `src/middleware.ts` that redirects unauthenticated visitors from `/dashboard`, `/students`, `/attendance`, `/notifications` to `/login`.
- Build a simple login form in `(auth)/login/page.tsx` that calls a `signIn` server action.
- Add the dashboard layout `(dashboard)/layout.tsx` with the sidebar: Dashboard, Students, Attendance, Notifications, and a sign-out button.

Remember: middleware is only a convenience. The real protection is `requireUser / requireAdmin / requireClassAccess` inside each action.

**Done when:** you can log in as admin and as teacher, and an anonymous visit to `/students` sends you to `/login`.

---

## Step 5 – Validation schemas (Zod)

`src/lib/validations/common.ts`:

```ts
import { z } from "zod";

// Normalise Ethiopian numbers to E.164, adapt if you serve other countries
export function normalizePhone(input: string): string {
  const d = input.replace(/[\s()-]/g, "");
  if (/^\+251[79]\d{8}$/.test(d)) return d;
  if (/^251[79]\d{8}$/.test(d)) return `+${d}`;
  if (/^0[79]\d{8}$/.test(d)) return `+251${d.slice(1)}`;
  throw new Error("Invalid phone number");
}

export const phoneSchema = z.string().trim().transform((v, ctx) => {
  try { return normalizePhone(v); }
  catch { ctx.addIssue({ code: "custom", message: "Enter a valid phone number" }); return z.NEVER; }
});

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
```

`src/lib/validations/student.ts`:

```ts
import { z } from "zod";
import { phoneSchema } from "./common";

export const studentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(30),
  fullName: z.string().trim().min(2).max(100),
  classId: z.string().min(1),
  guardianName: z.string().trim().min(2).max(100),
  guardianPhone: phoneSchema,
});
export type StudentInput = z.input<typeof studentSchema>;
```

`src/lib/validations/attendance.ts`:

```ts
import { z } from "zod";
import { dateSchema } from "./common";

export const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: dateSchema,
  entries: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]),
  })).min(1).max(200),
});
```

**Done when:** a quick unit test shows `0911223344`, `+251911223344` and `251911223344` all normalise to `+251911223344`, and junk input fails.

---

## Step 6 – Student management

### 6.1 Actions (`src/actions/student.actions.ts`)

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { studentSchema } from "@/lib/validations/student";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

export async function createStudent(input: unknown): Promise<Result> {
  try {
    await requireAdmin();
    const v = studentSchema.parse(input);
    await db.student.create({
      data: {
        admissionNo: v.admissionNo,
        fullName: v.fullName,
        classId: v.classId,
        guardians: { create: { name: v.guardianName, phone: v.guardianPhone, isPrimary: true } },
      },
    });
    revalidatePath("/students");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
```

Add `updateStudent` (same pattern, update student and its primary guardian) and `deactivateStudent` (`active: false`; never delete, so history stays intact).

### 6.2 UI

- `students/page.tsx` (Server Component): query students with class and primary guardian, render a shadcn `Table` with search by name/admission number and a class filter.
- `components/student-form.tsx` (Client Component): React Hook Form + `zodResolver(studentSchema)`, shown in a `Sheet`; on submit call the action and show a toast on `error`.
- Show the phone masked for non-admins.

**Done when:** an admin can add, edit and deactivate a student; invalid phone numbers are rejected; a teacher cannot call these actions.

---

## Step 7 – Attendance service and `markAttendance` action

### 7.1 Service (`src/lib/services/attendance.service.ts`)

Responsibility: save attendance in a transaction and report which students are **newly absent**.

```ts
import "server-only";
import { db } from "@/lib/db";

type Entry = { studentId: string; status: "PRESENT" | "ABSENT" | "LEAVE" | "LATE" };

export async function saveAttendance(params: { classId: string; date: string; markedById: string; entries: Entry[] }) {
  const date = new Date(`${params.date}T00:00:00.000Z`);

  // every submitted student must belong to this class and be active
  const valid = await db.student.findMany({
    where: { classId: params.classId, active: true, id: { in: params.entries.map(e => e.studentId) } },
    select: { id: true },
  });
  const validIds = new Set(valid.map(s => s.id));
  if (validIds.size !== params.entries.length) throw new Error("Some students do not belong to this class");

  return db.$transaction(async (tx) => {
    const records = [];
    for (const e of params.entries) {
      const rec = await tx.attendanceRecord.upsert({
        where: { studentId_date: { studentId: e.studentId, date } },
        create: { studentId: e.studentId, date, status: e.status, markedById: params.markedById },
        update: { status: e.status, markedById: params.markedById },
      });
      records.push(rec);
    }
    return records;
  });
}
```

### 7.2 Action (`src/actions/attendance.actions.ts`)

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireClassAccess } from "@/lib/guards";
import { markAttendanceSchema } from "@/lib/validations/attendance";
import { saveAttendance } from "@/lib/services/attendance.service";
import { queueAbsenceNotifications, dispatchNotifications } from "@/lib/services/notification.service"; // Step 9

export async function markAttendance(input: unknown) {
  try {
    const v = markAttendanceSchema.parse(input);
    const user = await requireClassAccess(v.classId);

    if (new Date(`${v.date}T00:00:00Z`) > new Date()) throw new Error("Cannot mark a future date");

    // 1. attendance is committed first
    const records = await saveAttendance({ ...v, markedById: user.id });

    // 2. then SMS: create notification rows (idempotent), then send
    const created = await queueAbsenceNotifications(records.filter(r => r.status === "ABSENT"), v.date);
    const sent = await dispatchNotifications(created);

    revalidatePath("/attendance");
    revalidatePath("/notifications");
    return { ok: true as const, data: { saved: records.length, smsQueued: created.length, smsFailed: sent.failed } };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}
```

Also add `getClassAttendance(classId, date)`: guard with `requireClassAccess`, return active students and any existing records for that date.

**Done when:** calling `markAttendance` twice with the same data leaves one record per student (no duplicates). SMS parts can be stubbed until Step 9.

---

## Step 8 – Daily attendance screen

Files:

- `attendance/page.tsx` – Server Component: reads `?classId=&date=` from search params (date defaults to today), loads the classes the user may access, loads students + existing status through the service.
- `components/attendance-form.tsx` – Client Component holding state `{ [studentId]: status }`.

UI behaviour to implement:

1. Class select and date input at the top; changing either reloads the page with new search params.
2. Each row: admission no, name, and a three-button segmented control **P · A · L** (use green / red / yellow, with the letter always visible).
3. Buttons: **Mark all present** (sets every row to PRESENT) and **Save attendance**.
4. Summary chips (Present / Absent / Leave) update live.
5. On Save: call `markAttendance`, disable the button while pending, show a toast such as "32 saved, 3 SMS queued" or the error.
6. If the user is about to save with an unusually large number of absences (say over 30% of the class), ask for a confirmation first, because SMS cannot be recalled.
7. Mobile: make the Save bar sticky at the bottom.

**Done when:** a teacher can mark Class 7 B for today, reload the page and see the same statuses, and cannot open a class they are not assigned to.

---

## Step 9 – Notification service (create, send, record)

`src/lib/services/notification.service.ts`

### 9.1 Message builder

```ts
export function absenceMessage(studentName: string, className: string, date: string) {
  return `AbsentAlert: ${studentName} (${className}) was marked absent on ${date}. Please contact the school if this is unexpected.`;
}
```

### 9.2 Create notification rows idempotently

For each ABSENT attendance record, load the student's primary guardian and class, then insert a `Notification` row. Rely on the unique constraint so that repeated saves do not duplicate:

```ts
import "server-only";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms/smshub";

export async function queueAbsenceNotifications(absentRecords: { id: string; studentId: string }[], date: string) {
  const createdIds: string[] = [];

  for (const rec of absentRecords) {
    const student = await db.student.findUnique({
      where: { id: rec.studentId },
      include: { class: true, guardians: { where: { isPrimary: true }, take: 1 } },
    });
    const guardian = student?.guardians[0];
    if (!student || !guardian) continue;

    try {
      const n = await db.notification.create({
        data: {
          attendanceId: rec.id,
          guardianPhone: guardian.phone,
          type: "ABSENCE",
          body: absenceMessage(student.fullName, student.class.name, date),
        },
      });
      createdIds.push(n.id);
    } catch (e: any) {
      if (e.code === "P2002") continue; // unique violation = already notified, skip silently
      throw e;
    }
  }
  return createdIds;
}
```

### 9.3 Send, record every attempt, never over-claim

```ts
async function sendOne(notificationId: string) {
  // claim the row so two requests cannot both send it
  const claimed = await db.notification.updateMany({
    where: { id: notificationId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "SENDING" },
  });
  if (claimed.count === 0) return { ok: false, skipped: true };

  const n = await db.notification.findUniqueOrThrow({ where: { id: notificationId } });
  const result = await sendSms(n.guardianPhone, n.body);

  await db.notificationAttempt.create({
    data: {
      notificationId,
      httpStatus: result.httpStatus,
      success: result.accepted,
      rawResponse: result.raw as any,
      error: result.error,
    },
  });

  await db.notification.update({
    where: { id: notificationId },
    data: { status: result.accepted ? "ACCEPTED" : "FAILED", providerRef: result.providerRef },
  });

  return { ok: result.accepted };
}

export async function dispatchNotifications(ids: string[]) {
  let failed = 0;
  for (const id of ids) {
    const r = await sendOne(id);
    if (!r.ok && !r.skipped) failed++;
  }
  return { failed };
}
```

Rules to keep:

- Attendance is already saved before this runs; a failure here never undoes it.
- `ACCEPTED` means "the provider accepted the request", never "delivered". Only set `DELIVERED` if you implement a delivery-report webhook later.
- Do not fire-and-forget on serverless hosting; await the sends inside the action (as above), or use the retry job in Step 10.

**Done when:** marking a student absent sends one SMS to your test phone, a repeat save sends none, and a deliberately wrong API key produces a `FAILED` notification with an attempt row holding the raw response, while attendance is still saved.

---

## Step 10 – SMS history screen and retry

### 10.1 Actions (`src/actions/notification.actions.ts`)

```ts
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import { dispatchNotifications } from "@/lib/services/notification.service";

export async function listNotifications(input: unknown) {
  const user = await requireUser();
  const f = z.object({
    status: z.enum(["PENDING","SENDING","ACCEPTED","DELIVERED","FAILED"]).optional(),
    classId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
  }).parse(input);

  const classFilter = user.role === "ADMIN"
    ? (f.classId ? { classId: f.classId } : {})
    : { class: { teachers: { some: { userId: user.id } } } };

  return db.notification.findMany({
    where: { status: f.status, attendance: { student: classFilter } },
    include: { attendance: { include: { student: { include: { class: true } } } }, attempts: true },
    orderBy: { createdAt: "desc" },
    skip: (f.page - 1) * 25,
    take: 25,
  });
}

export async function retryNotification(notificationId: string) {
  await requireAdmin();
  z.string().min(1).parse(notificationId);
  const r = await dispatchNotifications([notificationId]); // sendOne atomically claims FAILED rows only
  revalidatePath("/notifications");
  return { ok: r.failed === 0 };
}
```

### 10.2 UI (`notifications/page.tsx`)

- Table columns: time, student, class, masked phone, status badge, attempts count, provider reference.
- Badge labels: PENDING "Queued", SENDING "Sending", ACCEPTED **"Accepted by provider"**, DELIVERED "Delivered", FAILED "Failed".
- Filters: status, class, date range.
- Row actions: a dialog that shows each attempt's time, HTTP status and raw response; a **Retry** button only on FAILED rows (admin only).
- Treat rows stuck in SENDING for more than ~5 minutes as "needs review", since the request may have reached the provider.

### 10.3 Optional retry job

Add a protected route handler `app/api/jobs/retry-sms/route.ts` that checks a secret header, picks FAILED rows with fewer than 3 attempts, and calls `dispatchNotifications`. Trigger it from your host's cron (for example every 15 minutes).

**Done when:** you can break the API key, mark a student absent, see FAILED in history with the raw response, fix the key, press Retry, and see ACCEPTED, with two attempts recorded.

---

## Step 11 – Dashboard and two-week overview

### 11.1 Dashboard (`dashboard/page.tsx`)

Server Component with these queries for today:

- Counts of PRESENT / ABSENT / LEAVE (`groupBy status`).
- Classes the user can access that have no attendance saved today.
- The 10 most recent FAILED notifications with a link to `/notifications?status=FAILED`.

### 11.2 Two-week grid (`attendance/overview/page.tsx`)

Reproduces the reference screenshot:

1. Pick a class and a start date (Monday of the week); build an array of 14 days.
2. Load all `AttendanceRecord`s for that class between the first and last day, and build a map `studentId → date → status`.
3. Render columns: Admission No, Student, Abs, Lve, then the 14 days.
4. Cell rules: `PRESENT` → green **P**, `ABSENT` → red **A**, `LEAVE` → yellow **L**, weekend/holiday → blue **H**, no record → grey dash.
5. Summary rows above the students: Total Present, Total Absent, Total Leave, and Percentage = present ÷ (present + absent + leave), skipping days with no data.
6. Make each cell a link to `/attendance?classId=…&date=…`.
7. Wrap the table in a container with `overflow-x-auto`.

**Done when:** the overview for Class 7 B matches the numbers you see in the daily screens.

---

## Step 12 – Tests and hardening

### 12.1 Tests (Vitest)

Add to `package.json`: `"test": "vitest run"`. Use a separate test database (`DATABASE_URL` pointing to `absentalert_test`) and reset it between tests.

| Test | Expect |
|---|---|
| `normalizePhone` variants | All map to E.164; junk throws |
| Save the same absent attendance twice | One `Notification` row only |
| `sendSms` mocked to fail | Attendance saved, notification FAILED, attempt row exists |
| Teacher calls `markAttendance` for another class | Rejected |
| Anonymous or teacher calls `createStudent` | Rejected |
| Absent → Present → Absent | No second SMS |
| Two simultaneous retries of one FAILED row | Only one SMS sent |

Mock the SMS client with `vi.mock("@/lib/sms/smshub")` so tests never send real messages.

### 12.2 Hardening checklist

- [ ] Every Server Action starts with a guard and a `parse()` call
- [ ] No secret has a `NEXT_PUBLIC_` prefix
- [ ] `server-only` is imported in `db.ts`, `smshub.ts`, services and guards
- [ ] Phone numbers masked in lists for non-admins; never written to logs
- [ ] Login and retry are rate-limited
- [ ] Errors shown to users are friendly; details go to server logs
- [ ] Mobile layout checked on a real phone
- [ ] `npm run build` and `npm run lint` pass

**Done when:** tests are green and the checklist is fully ticked.

---

## Step 13 – Deploy and UAT

1. Create the production database and set env vars on the host: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (the public URL), `SMSHUB_BASE_URL`, `SMSHUB_API_KEY`, `SMSHUB_SENDER_ID`.
2. Deploy migrations: `npx prisma migrate deploy` (never `migrate dev` in production). Add `prisma generate` to the build step.
3. Create the real admin account with a strong password; remove or change seed users.
4. Turn on automatic daily database backups and test one restore.
5. User acceptance test with one real class: import the real student list and parent numbers, mark a full day, confirm every parent number received the right message, and check the history screen.
6. Agree with the school on the answers to the open questions (SMS language, timing, "Late" status, teacher account ownership).
7. Write a one-page handover: how to add a student, how to mark attendance, what to do when an SMS shows Failed, and who to contact.

**Done when:** a real teacher marked a real class, parents received accurate SMS, and failures are visible and retryable.

---

## Quick reference – order of files you will create

```
1.  scripts/sms-test.ts
2.  src/lib/sms/smshub.ts
3.  prisma/schema.prisma  →  prisma/seed.ts  →  src/lib/db.ts
4.  src/lib/auth.ts  →  src/lib/guards.ts  →  src/middleware.ts  →  login page + dashboard layout
5.  src/lib/validations/{common,student,attendance}.ts
6.  src/actions/student.actions.ts  →  students/page.tsx + student-form
7.  src/lib/services/attendance.service.ts  →  src/actions/attendance.actions.ts
8.  attendance/page.tsx + attendance-form
9.  src/lib/services/notification.service.ts
10. src/actions/notification.actions.ts  →  notifications/page.tsx
11. dashboard/page.tsx  →  attendance/overview/page.tsx
12. tests/*.test.ts
```

Note: code samples are a starting point written against Prisma, Next.js App Router and Auth.js v5 conventions; library versions change, so if an import or option name differs, check the current docs for that package. The SMSHub parts are placeholders until you complete Step 2.




Ready for your confirmation to proceed to Step 12: Tests and Hardening!