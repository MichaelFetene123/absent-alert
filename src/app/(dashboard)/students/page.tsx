import { requireUser } from "@/lib/guards";
import { listStudents, listClasses } from "@/actions/student.actions";
import { StudentsManager } from "@/components/students-manager";
import { Users, Shield, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  // Both Admin and Teachers can access students page per FR-1 and Step 6.2
  // Admin has full CRUD rights; Teacher has read-only access with masked guardian phone numbers.
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [students, classes] = await Promise.all([
    listStudents({ showInactive: true }),
    listClasses(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="size-6 text-blue-600" />
            Student Management
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 gap-1.5 py-1 px-2.5">
              <Shield className="size-3.5 text-purple-600" />
              <span>Full Admin Access</span>
            </Badge>
          ) : (
            <Badge className="bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1.5 py-1 px-2.5">
              <GraduationCap className="size-3.5 text-blue-600" />
              <span>Teacher Read-Only View</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Main Interactive Student Manager */}
      <StudentsManager
        initialStudents={students}
        classes={classes}
        isAdmin={isAdmin}
      />
    </div>
  );
}
