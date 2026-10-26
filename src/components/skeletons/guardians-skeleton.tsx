import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function GuardiansSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-3.5 w-96" />
        </div>
      </div>

      {/* 4 Carrier KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-3.5 border-border bg-card shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-2.5 w-32" />
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <Skeleton className="h-8 w-full sm:w-72 rounded-lg" />
        <Skeleton className="h-8 w-full sm:w-56 rounded-lg" />
      </div>

      {/* Guardians Table */}
      <div className="bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-xs p-4 space-y-4">
        {/* Table Header */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* 6 Guardian Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-28 font-mono" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
