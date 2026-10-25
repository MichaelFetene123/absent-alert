import { requireUser } from "@/lib/guards";
import {
  listTeachersWithDetails,
  listAvailableClassesForTeachers,
} from "@/actions/teacher.actions";
import { TeachersManager } from "@/components/teachers-manager";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Shield } from "lucide-react";


export default async function TeachersPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [teachers, classes] = await Promise.all([
    listTeachersWithDetails(),
    listAvailableClassesForTeachers(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="size-6 text-blue-600" />
            Teacher Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage faculty accounts, assign classroom instructors, and monitor attendance responsibilities.
          </p>
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
              <span>Faculty Directory (Read-Only)</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Main Interactive Teachers Manager */}
      <TeachersManager
        initialTeachers={teachers}
        availableClasses={classes}
        isAdmin={isAdmin}
      />
    </div>
  );
}
