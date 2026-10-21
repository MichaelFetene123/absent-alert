import { requireUser } from "@/lib/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default async function AttendancePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarCheck className="size-6 text-emerald-600" />
          Daily Attendance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Attendance marking · Protected by <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">requireUser()</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Access Verified</CardTitle>
          <CardDescription>
            Signed in as {user.role}: {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Attendance service, class selection, and bulk marking will be implemented in Step 7 and 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
