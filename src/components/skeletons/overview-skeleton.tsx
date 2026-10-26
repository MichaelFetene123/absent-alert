import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Navigation & Class Controls */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <Skeleton className="h-9 w-full sm:w-56" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-border space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Two-Week Grid Skeleton */}
      <div className="bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-xs p-4 space-y-4">
        {/* Header with 14 date columns */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="size-6 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        {/* 6 Student Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 14 }).map((_, j) => (
                <Skeleton key={j} className="size-6 rounded" />
              ))}
            </div>
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
