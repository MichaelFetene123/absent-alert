import { requireUser } from "@/lib/guards";
import {
  getAccessibleClasses,
  getTwoWeekOverview,
} from "@/lib/services/attendance.service";
import { TwoWeekGrid } from "@/components/two-week-grid";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, School, ShieldAlert } from "lucide-react";
import Link from "next/link";

export const instant = false;

type SearchParamsPromise = Promise<{
  classId?: string;
  startDate?: string;
}>;

export default async function AttendanceOverviewPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const user = await requireUser();
  const resolvedParams = await searchParams;

  // 1. Fetch accessible classes for the current user
  const accessibleClasses = await getAccessibleClasses(user.id, user.role);

  if (accessibleClasses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="size-6 text-blue-600" />
            Two-Week Attendance Overview
          </h1>
        </div>

        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <School className="size-5" />
              No Assigned Classes Found
            </CardTitle>
            <CardDescription>
              Your account ({user.email}) does not have any assigned classes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please contact an administrator to be assigned to a class before viewing the attendance overview.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Select target class: requested or default to first accessible
  const targetClassId =
    resolvedParams.classId && accessibleClasses.some((c) => c.id === resolvedParams.classId)
      ? resolvedParams.classId
      : accessibleClasses[0]!.id;

  // 3. Fetch 14-day overview data
  const overview = await getTwoWeekOverview({
    classId: targetClassId,
    startDate: resolvedParams.startDate,
    userId: user.id,
    role: user.role,
  });

  if (!overview.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="size-6 text-blue-600" />
            Two-Week Attendance Overview
          </h1>
        </div>

        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-rose-800 dark:text-rose-400">
              <ShieldAlert className="size-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have authorization to view attendance for the requested class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Teachers can only access attendance records for their assigned classes.
            </p>
            <Link href={`/attendance/overview?classId=${accessibleClasses[0]!.id}`}>
              <Button size="sm">Go to Assigned Class: {accessibleClasses[0]!.name}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TwoWeekGrid data={overview} selectedClassId={targetClassId} />;
}
