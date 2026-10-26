import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <div className="relative rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-2xl shrink-0" />

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>

              <Skeleton className="h-3.5 w-48 font-mono" />

              <div className="flex items-center gap-4 pt-1">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3.5 w-44" />
              </div>
            </div>
          </div>

          <Skeleton className="h-8.5 w-24 rounded-lg" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <Skeleton className="h-5 w-36 pb-3" />
        <Skeleton className="h-5 w-36 pb-3" />
        <Skeleton className="h-5 w-44 pb-3" />
      </div>

      {/* Personal Information Card */}
      <Card className="border-border bg-card text-card-foreground shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-3 w-80 mt-1" />
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>

          {/* Institutional Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28 uppercase" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28 uppercase" />
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-3">
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
