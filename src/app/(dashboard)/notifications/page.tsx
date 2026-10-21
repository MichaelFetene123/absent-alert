import { requireUser } from "@/lib/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export default async function NotificationsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <History className="size-6 text-purple-600" />
          SMS Notification Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          SMSHub status & retry · Protected by <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">requireUser()</code>
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
            SMS notification history, attempt logs, and retry actions will be implemented in Step 9 and 10.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
