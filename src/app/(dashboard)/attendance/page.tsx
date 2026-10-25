import { requireUser } from "@/lib/guards";
import { getAccessibleClasses, getClassAttendance } from "@/lib/services/attendance.service";
import { AttendanceForm, type StudentAttendanceItem } from "@/components/attendance-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Shield, GraduationCap, ShieldAlert, School } from "lucide-react";
import Link from "next/link";


interface AttendancePageProps {
  searchParams: Promise<{
    classId?: string;
    date?: string;
  }>;
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  // Today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0]!;

  // Await search params
  const resolvedParams = await searchParams;
  const selectedDate = resolvedParams.date && resolvedParams.date <= todayStr
    ? resolvedParams.date
    : todayStr;

  // 1. Fetch accessible classes for this user (Admin = all, Teacher = assigned only)
  const accessibleClasses = await getAccessibleClasses(user.id, user.role);

  // If teacher has no assigned classes
  if (accessibleClasses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="size-6 text-emerald-600" />
            Daily Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            School attendance roster & live status tracking.
          </p>
        </div>

        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <School className="size-5" />
              No Assigned Classes Found
            </CardTitle>
            <CardDescription>
              Your teacher account ({user.email}) has not been assigned to any classes yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please contact your school administrator to assign you to your designated classroom.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine requested class ID
  const requestedClassId = resolvedParams.classId;
  let activeClass = accessibleClasses[0]!;

  if (requestedClassId) {
    const matched = accessibleClasses.find((c) => c.id === requestedClassId);
    if (!matched) {
      // User is attempting to access a class they are NOT assigned to
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="size-6 text-emerald-600" />
              Daily Attendance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Class authorization security guard.
            </p>
          </div>

          <Card className="border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <ShieldAlert className="size-5" />
                Access Denied: Unauthorized Class
              </CardTitle>
              <CardDescription>
                You are not assigned to the requested classroom ({requestedClassId}).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Teachers can only view and mark attendance for classrooms they are officially assigned to teach.
              </p>
              <Link href={`/attendance?classId=${accessibleClasses[0]!.id}&date=${selectedDate}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Switch to My Assigned Class ({accessibleClasses[0]!.name})
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    activeClass = matched;
  }

  // 2. Fetch students & attendance records for this class and date
  const rosterData = await getClassAttendance({
    classId: activeClass.id,
    date: selectedDate,
  });

  const hasExistingRecords = rosterData.some((r) => r.status !== null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="size-6 text-emerald-600" />
            Daily Attendance Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mark student attendance, manage exceptions, and record daily presence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 gap-1.5 py-1 px-2.5">
              <Shield className="size-3.5 text-purple-600" />
              <span>Admin Access (All Classes)</span>
            </Badge>
          ) : (
            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1.5 py-1 px-2.5">
              <GraduationCap className="size-3.5 text-emerald-600" />
              <span>Assigned Teacher: {activeClass.name}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Interactive Attendance Form & Roster */}
      <AttendanceForm
        initialStudents={rosterData}
        classes={accessibleClasses}
        selectedClassId={activeClass.id}
        selectedDate={selectedDate}
        hasExistingRecords={hasExistingRecords}
        todayStr={todayStr}
      />
    </div>
  );
}
