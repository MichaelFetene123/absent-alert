import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function SmsHubSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-72" />
          </div>
          <Skeleton className="h-3.5 w-96" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* 3 Credit & Balance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance Card */}
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="pb-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-9 w-28" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-3.5 w-44" />
          </CardContent>
        </Card>

        {/* Carrier Pricing Card */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="size-4 rounded" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center pb-1 border-b border-border">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Connection Status Card */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-6 w-36 rounded-md mt-1" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      </div>

      {/* Credentials & Configuration Form Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-3 w-80 mt-1" />
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-3 w-72" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-3 w-64" />
          </div>

          <div className="pt-2">
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
