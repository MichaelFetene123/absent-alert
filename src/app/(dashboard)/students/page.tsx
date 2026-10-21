import { requireAdmin } from "@/lib/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Shield } from "lucide-react";

export default async function StudentsPage() {
  // Only Admin can manage students per FR-1 and Section 2 of Design Doc
  const admin = await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="size-6 text-blue-600" />
          Student Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Admin portal · Protected by <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">requireAdmin()</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-purple-600" />
            Admin Role Guard Active
          </CardTitle>
          <CardDescription>
            Verified administrator: {admin.email} ({admin.id})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Student CRUD actions and tables will be implemented in Step 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
