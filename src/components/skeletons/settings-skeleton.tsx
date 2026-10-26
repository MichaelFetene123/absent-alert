import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-80" />
        </div>
        <Skeleton className="h-3.5 w-96" />
      </div>

      {/* Settings Form Cards */}
      <div className="space-y-6">
        {/* Institutional Identity Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Timing & Thresholds Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-60" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-3 w-64" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}
