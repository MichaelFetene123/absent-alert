# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

src/
├── app/
│   ├── (auth)/login/
│   │   └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── students/page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── layout.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── actions/
│   ├── auth.actions.ts
│   ├── student.actions.ts
│   ├── attendance.actions.ts
│   └── notification.actions.ts
├── components/
│   ├── theme-provider.tsx
│   └── ui/ (badge, button, card, dialog, input, label, select, sheet, sonner, table, tabs)
├── hooks/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── guards.ts
│   ├── utils.ts
│   ├── sms/
│   │   └── smshub.ts
│   ├── services/
│   │   ├── attendance.service.ts
│   │   └── notification.service.ts
│   └── validations/
│       ├── auth.ts
│       ├── student.ts
│       └── attendance.ts
└── prisma/
    ├── contract.prisma
    ├── contract.d.ts
    ├── contract.json
    └── db.ts

