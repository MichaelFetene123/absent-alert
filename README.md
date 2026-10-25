# AbsentAlert (ትምህርት ቤት የተማሪዎች መቅረት ማሳወቂያ)

> **AbsentAlert** is a high-reliability school attendance tracking and automated SMS notification system tailored for Ethiopian schools. It empowers teachers to quickly mark daily class attendance and automatically alerts parents and guardians via SMS via SMSHub.et the moment a student is absent.

---

## 🚀 Key Features

- **Daily Attendance Marking**: Streamlined, fast attendance marking (`PRESENT`, `ABSENT`, `LEAVE`, `LATE`) designed for desktop and mobile devices.
- **Automated Absence SMS Alerts**: The moment a student is marked `ABSENT`, the system queues an SMS alert for the student's primary guardian with localized Ethiopian phone number normalization (`09...`, `07...` → `+251...`).
- **Resilient Delivery & Retry Engine**:
  - Independent database persistence: SMS failures never block attendance saves.
  - Concurrency-safe in-flight locks to prevent duplicate SMS transmissions.
  - Complete history log with `NotificationAttempt` auditing (HTTP status, provider reference, timestamps).
- **Two-Week Attendance Heatmap**: Visual grid tracking trends and chronic absenteeism across 14-day windows.
- **Class & Student Management**: Full CRUD operations for classes, student rosters, and primary/secondary guardian phone records.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system management (classes, teacher assignments, student rosters, unmasked guardian phones, retry queues).
  - **Teacher**: Restricted to assigned classes with masked phone numbers for privacy protection.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **UI Library**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **ORM & Database**: [Prisma 8 ORM](https://www.prisma.io/) with PostgreSQL (`@prisma/orm-postgres`)
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://authjs.dev/) with bcrypt password hashing
- **Form & Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)
- **SMS Gateway**: [SMSHub.et](https://smshub.et) REST API Integration
- **Testing**: [Vitest](https://vitest.dev/) with comprehensive unit and integration test coverage

---

## 📁 Project Architecture

```
absent-alert/
├── src/
│   ├── actions/                  # Next.js Server Actions with RBAC & Zod parsing
│   │   ├── attendance.actions.ts # Attendance marking & class query actions
│   │   ├── auth.actions.ts       # Authentication & login/logout actions
│   │   ├── class.actions.ts      # Class creation, update, teacher assignment
│   │   ├── notification.actions.ts # SMS retry & notification querying
│   │   └── student.actions.ts    # Student & guardian management actions
│   ├── app/                      # Next.js App Router (pages & route handlers)
│   │   ├── (auth)/login/         # Login screen
│   │   ├── (dashboard)/          # Authenticated dashboard views
│   │   │   ├── attendance/       # Daily attendance & two-week overview
│   │   │   ├── classes/          # Class & teacher assignment manager
│   │   │   ├── dashboard/        # Main overview dashboard
│   │   │   ├── notifications/    # SMS delivery logs & manual retry
│   │   │   └── students/         # Student roster & guardian manager
│   │   └── api/                  # API endpoints (Auth handler, SMS retry job)
│   ├── components/               # React components, UI primitives & dialogs
│   ├── lib/
│   │   ├── auth.ts               # NextAuth configuration
│   │   ├── db.ts                 # Prisma 8 database client singleton
│   │   ├── guards.ts             # Session, admin, and class RBAC guards
│   │   ├── services/             # Core business logic services
│   │   │   ├── attendance.service.ts
│   │   │   └── notification.service.ts
│   │   ├── sms/
│   │   │   └── smshub.ts         # SMSHub API client with timeout & retry handling
│   │   └── validations/          # Zod validation schemas
│   └── prisma/
│       ├── contract.prisma       # Prisma 8 data contract definition
│       ├── contract.json         # Compiled schema contract
│       └── contract.d.ts         # Generated TypeScript types
├── scripts/                      # DB seed script and testing utilities
├── tests/                        # Vitest test suites
│   ├── classes.test.ts
│   ├── hardening.test.ts         # Step 12 security & concurrency test suite
│   ├── notifications.test.ts
│   ├── overview.test.ts
│   └── validations.test.ts
└── prisma.config.ts              # Prisma CLI configuration
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: `v20+` (LTS recommended)
- **pnpm**: `v10+` (`npm install -g pnpm`)
- **PostgreSQL**: `15+` (Local instance, Docker, or hosted DB like Neon/Supabase)

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/absentalert"
AUTH_SECRET="your-32-byte-hex-secret"
SMSHUB_BASE_URL="https://smshub.et"
SMSHUB_API_KEY="your-smshub-api-key"
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Setup Database & Emit Data Contract
```bash
# Emit Prisma 8 contract types and JSON
pnpm contract:emit

# Seed sample classes, teachers, students, and guardians
pnpm tsx scripts/seed.ts
```

### 5. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Seed Credentials

When seeded with `scripts/seed.ts`, the following accounts are available for testing:

| Role | Email | Password | Assigned Scope |
|---|---|---|---|
| **Admin** | `admin@gmail.com` | `admin@123` | Full access across all classes & logs |
| **Teacher** | `teacher@gmail.com` | `teacher@123` | Assigned to `Class 7 B` |

---

## 🧪 Testing & Verification

Run the comprehensive test suite with Vitest:
```bash
# Run unit & integration tests
pnpm test

# Run TypeScript type check
pnpm typecheck

# Run linter
pnpm lint

# Run production build
pnpm build
```

---

## 🛡️ Security & Hardening Highlights

- **Phone Normalization**: Strictly validates and converts Ethiopian phone numbers (`09...`, `07...`, `+251...`) into canonical E.164 format. Non-Ethiopian or invalid numbers throw immediate validation errors.
- **Concurrency & Idempotency**:
  - `@@unique([attendanceId, guardianPhone, type])` guarantees no duplicate SMS entries are created.
  - Active in-flight mutex lock in `sendOne()` prevents double-dispatching even under simultaneous retry attempts.
- **Role Guards**: Server Actions check permissions via `requireAdmin()` and `requireClassAccess()`. Teachers attempting to mark attendance or view rosters outside their assigned classes are rejected.
- **Privacy Protection**: Phone numbers are masked in lists (`+251****44`) for non-admin accounts and never leaked to browser bundles or client logs.
