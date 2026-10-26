import { requireUser } from "@/lib/guards";
import { getAccessibleClasses, getClassAttendance } from "@/lib/services/attendance.service";
import { AttendanceForm, type StudentAttendanceItem } from "@/components/attendance-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Shield, GraduationCap, ShieldAlert, School } from "lucide-react";
import Link from "next/link";

export const instant = false;

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
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="size-5 text-muted-foreground" />
            Daily Attendance
          </h1>
        </div>

        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <School className="size-5 text-muted-foreground" />
              No Assigned Classes Found
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your teacher account ({user.email}) has not been assigned to any classes yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarCheck className="size-6 text-primary" />
              Daily Attendance
            </h1>
          </div>

          <Card className="border-destructive/30 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-5" />
                Access Denied: Unauthorized Class
              </CardTitle>
              <CardDescription className="text-destructive/80">
                You are not assigned to the requested classroom ({requestedClassId}).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Teachers can only view and mark attendance for classrooms they are officially assigned to teach.
              </p>
              <Link href={`/attendance?classId=${accessibleClasses[0]!.id}&date=${selectedDate}`}>
                <Button size="sm">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Daily Attendance
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge variant="outline" className="text-xs font-medium gap-1.5 py-1 px-2.5">
              <Shield className="size-3 text-muted-foreground" />
              <span>Admin (All Classes)</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-medium gap-1.5 py-1 px-2.5">
              <GraduationCap className="size-3 text-muted-foreground" />
              <span>Teacher: {activeClass.name}</span>
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
