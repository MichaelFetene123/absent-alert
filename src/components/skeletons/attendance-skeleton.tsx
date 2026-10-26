import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-6 w-36 rounded-md" />
      </div>

      {/* Class & Date Controls Card */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <Skeleton className="h-9 w-full sm:w-56 rounded-lg" />
          <Skeleton className="h-9 w-full sm:w-44 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* 4 Attendance Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-10 flex-1 max-w-md rounded-xl" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Student Attendance Roster Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="flex items-center justify-between py-2.5 px-4 border-b border-border bg-muted/50">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-32" />
        </div>

        {/* 6 Student Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-0"
          >
            <Skeleton className="h-4 w-20 font-mono" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            {/* P - A - L - T Segmented Buttons */}
            <div className="inline-flex p-1 bg-muted rounded-lg gap-1 border border-border">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-14 rounded-md" />
              <Skeleton className="h-7 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/95 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
    </div>
  );
}
