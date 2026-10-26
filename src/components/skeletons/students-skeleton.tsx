import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function StudentsSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-xl border border-border bg-card shadow-xs">
            <CardContent className="p-4 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-2.5 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action / Search Bar */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Skeleton className="h-8 w-full sm:w-64 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Students Table */}
      <div className="bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-xs p-4 space-y-4">
        {/* Table Header */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* 6 Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
          >
            <Skeleton className="h-4 w-20 font-mono" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20 font-mono" />
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
