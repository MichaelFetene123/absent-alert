import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Class & Date Selector Controls */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        {/* Class Dropdown */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-52 rounded-lg" />
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* 4 Summary / Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-card space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </div>

      {/* Two-Week 14-Day Grid Table */}
      <div className="bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-xs p-4 space-y-4">
        {/* Header with 14 date columns */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="size-7 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-16" />
        </div>

        {/* 8 Student Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-16 font-mono" />
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 14 }).map((_, j) => (
                <Skeleton key={j} className="size-7 rounded" />
              ))}
            </div>
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
