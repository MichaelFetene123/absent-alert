import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function PoliciesSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-80" />
          </div>
          <Skeleton className="h-3.5 w-96" />
        </div>

        <Skeleton className="h-8.5 w-44 rounded-lg" />
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-3.5 border-border bg-card shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2.5 w-28" />
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <Skeleton className="h-5 w-40 pb-3" />
        <Skeleton className="h-5 w-44 pb-3" />
        <Skeleton className="h-5 w-48 pb-3" />
      </div>

      {/* Active Policy Card */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
            <Skeleton className="h-3.5 w-80" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>

        {/* 8-Rule Grid */}
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-3.5 rounded border border-border bg-muted/30 space-y-1.5">
                <Skeleton className="h-3 w-28 uppercase" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            ))}
          </div>

          {/* Audit Trail & Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
