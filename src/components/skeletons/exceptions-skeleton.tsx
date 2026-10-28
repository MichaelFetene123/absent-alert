import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function ExceptionsSkeleton() {
  return (
    <div className="space-y-6">
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

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl border border-border bg-card shadow-xs">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="size-4 rounded" />
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exceptions Table Card */}
      <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table Search & Toolbar */}
        <div className="p-3.5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-8.5 w-72 rounded-lg" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Table Header */}
        <div className="flex items-center justify-between py-2.5 px-4 border-b border-border bg-muted/40">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>

        {/* 6 Exception Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-0"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </Card>
    </div>
  );
}
