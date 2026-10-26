import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-44" />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8.5 w-36 rounded-lg" />
          <Skeleton className="h-8.5 w-32 rounded-lg" />
          <Skeleton className="h-8.5 w-24 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl border border-border bg-card shadow-xs">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="size-4 rounded" />
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Immediate School Operations Intelligence Card */}
      <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border bg-muted/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-3 w-80" />
            </div>

            {/* 5 Question Selector Tabs */}
            <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-md" />
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center justify-between py-2.5 px-4 border-b border-border bg-muted/40">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-36" />
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-0"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
