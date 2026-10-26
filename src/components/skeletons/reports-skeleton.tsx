import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function ReportsSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-3.5 w-96" />
        </div>

        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl w-full sm:w-fit">
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-7 w-32 rounded-lg" />
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-7 w-36 rounded-lg" />
      </div>

      {/* Main Chart Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Chart area matching h-64 */}
          <div className="h-64 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-4 bg-muted/20 rounded-lg">
            {[45, 65, 50, 80, 60, 75, 70].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton className={`w-full rounded-t`} style={{ height: `${height}%` }} />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-3.5 border-border bg-card shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2.5 w-32" />
          </Card>
        ))}
      </div>
    </div>
  );
}
