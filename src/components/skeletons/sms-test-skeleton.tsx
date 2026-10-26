import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function SmsTestSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-3.5 w-96" />
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Test Form Column */}
        <div className="md:col-span-7 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Phone Input */}
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-6 w-36 rounded-md" />
                  <Skeleton className="h-6 w-44 rounded-md" />
                  <Skeleton className="h-6 w-32 rounded-md" />
                </div>
              </div>

              {/* Send Button */}
              <Skeleton className="h-9 w-full rounded-lg mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Live Simulator Preview Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            {/* Simulated Phone Screen */}
            <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-3 min-h-48 flex flex-col justify-end">
              <div className="p-3 rounded-2xl bg-card border border-border max-w-[85%] self-end space-y-1 shadow-xs">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-2.5 w-12 self-end mt-1" />
              </div>
            </div>

            {/* Encoding stats */}
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
