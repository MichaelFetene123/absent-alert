import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ExceptionsSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-72" />
          </div>
          <Skeleton className="h-3.5 w-96" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-3 border-border bg-card shadow-xs space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-2.5 w-28" />
          </Card>
        ))}
      </div>

      {/* Exceptions Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="p-3 border-b border-border bg-card">
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>

        {/* Table Header */}
        <div className="flex items-center justify-between py-2.5 px-4 border-b border-border bg-muted/50">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-24" />
        </div>

        {/* 6 Exception Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-0"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-20 font-mono" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
