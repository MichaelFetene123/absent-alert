import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function StudentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Skeleton className="h-9 w-full sm:w-64" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs p-4 space-y-4">
        {/* Table Header */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
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
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="size-8 rounded" />
              <Skeleton className="size-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
