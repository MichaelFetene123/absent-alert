import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      {/* Class & Date Controls Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <Skeleton className="h-9 w-full sm:w-56" />
            <Skeleton className="h-9 w-full sm:w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Attendance Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs p-4 space-y-4">
        {/* Table Header */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* 6 Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0"
          >
            <Skeleton className="h-5 w-20 rounded" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
